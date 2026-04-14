const express = require('express');
const router = express.Router();
const DonHang = require('../models/donhang');
const SanPham = require('../models/dienthoai');

// 1. HIỂN THỊ TRANG THANH TOÁN
router.get('/', (req, res) => {
    let gioHang = req.session.gioHang || [];

    // Lấy danh sách cần mua từ URL 
    let ids = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) : [];
    let dls = req.query.dl ? (Array.isArray(req.query.dl) ? req.query.dl : [req.query.dl]) : [];
    let mss = req.query.ms ? (Array.isArray(req.query.ms) ? req.query.ms : [req.query.ms]) : [];

    let danhSachThanhToan = [];

    if (ids.length > 0) {
        // Lọc từ giỏ hàng ra những món được chọn
        danhSachThanhToan = gioHang.filter(item =>
            ids.some((id, i) => id === item.idDT && dls[i] === item.DungLuong && mss[i] === item.MauSac)
        );
    } else {
        // Nếu không có query (có thể đi từ nút Mua Ngay trực tiếp)
        danhSachThanhToan = req.session.danhSachMua || [];
    }

    let tongTien = danhSachThanhToan.reduce((sum, item) => sum + (item.GiaBan * item.SoLuong), 0);

    res.render('thanhtoan', {
        title: 'Thanh toán đơn hàng',
        danhSachMua: danhSachThanhToan,
        tongTien: tongTien,
        session: req.session
    });
});

// XỬ LÝ LƯU ĐƠN: TRỪ KHO & XÓA GIỎ HÀNG CÓ CHỌN LỌC
router.post('/xuly', async (req, res) => {
    try {
        const { HoVaTen, SoDienThoai, DiaChi, PhuongThucTT, buy_ids, buy_dls, buy_mss } = req.body;
        let gioHang = req.session.gioHang || [];

        // Chuyển dữ liệu mua sang dạng mảng
        let ids = Array.isArray(buy_ids) ? buy_ids : [buy_ids];
        let dls = Array.isArray(buy_dls) ? buy_dls : [buy_dls];
        let mss = Array.isArray(buy_mss) ? buy_mss : [buy_mss];

        // Lọc lấy danh sách những món THỰC SỰ thanh toán
        let hangDaMua = gioHang.filter(item =>
            ids.some((id, i) => id === item.idDT && dls[i] === item.DungLuong && mss[i] === item.MauSac)
        );

        // Nếu giỏ hàng trống (có thể khách dùng 'Mua Ngay' trực tiếp)
        if (hangDaMua.length === 0 && req.session.danhSachMua) {
            hangDaMua = req.session.danhSachMua;
        }

        if (hangDaMua.length === 0) return res.status(400).send("Không có sản phẩm để thanh toán!");

        // CẬP NHẬT DATABASE (Trừ SoLuongTon)
        for (let item of hangDaMua) {
            await SanPham.updateOne(
                {
                    _id: item.idDT || item.Id, // Check cả 2 cách đặt tên ID
                    "CacPhienBan.DungLuong": item.DungLuong,
                    "CacPhienBan.MauSac": item.MauSac
                },
                {
                    $inc: { "CacPhienBan.$.SoLuongTon": -item.SoLuong }
                }
            );
        }
        // Tính tổng tiền dựa trên danh sách hàng đã mua
        let tongTienThucTe = hangDaMua.reduce((sum, item) => sum + (item.GiaBan * item.SoLuong), 0);

        // LƯU ĐƠN HÀNG VÀO DATABASE
        const donHangMoi = new DonHang({
            TenNguoiNhan: HoVaTen,
            SoDienThoai: SoDienThoai,
            DiaChiGiao: DiaChi,
            ChiTietDonHang: hangDaMua,
            TongTien: tongTienThucTe,
            PhuongThucThanhToan: PhuongThucTT,
            TrangThai: 'ChoXacNhan'
        });
        await donHangMoi.save();


        // XÓA CÓ CHỌN LỌC TRONG GIỎ HÀNG
        // Chỉ xóa những món vừa mua xong
        req.session.gioHang = gioHang.filter(item =>
            !ids.some((id, i) => id === item.idDT && dls[i] === item.DungLuong && mss[i] === item.MauSac)
        );

        // Xóa luôn túi tạm "Mua Ngay" nếu có
        req.session.danhSachMua = null;

        res.send(`
            <div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: sans-serif; text-align: center;">
                <h1 style="color: #0d6efd;">SPhone đã nhận đơn hàng! Cảm ơn quý khách!</h1>
                <p>Đơn hàng của bạn đang được xử lý nhanh nhất có thể.</p>
                <a href="/" style="margin-top: 20px; text-decoration: none; padding: 12px 25px; background: #0d6efd; color: white; border-radius: 8px; font-weight: bold;">
                    Quay lại trang chủ
                </a>
            </div>
        `);
    } catch (e) {
        console.error("Lỗi:", e);
        res.status(500).send("Lỗi xử lý: " + e.message);
    }
});

// 3. MUA NGAY TỪ TRANG CHI TIẾT
router.get('/muangay-chitiet/:id', async (req, res) => {
    try {
        const idSanPham = req.params.id;
        const { mauSac, dungLuong } = req.query;

        const sp = await SanPham.findById(idSanPham);
        if (!sp) return res.status(404).send('Sản phẩm không tồn tại!');

        const phienBan = sp.CacPhienBan.find(p => p.MauSac === mauSac && p.DungLuong === dungLuong);
        const giaBan = phienBan ? phienBan.GiaBan : sp.GiaBan;

        // Lưu vào túi tạm 'danhSachMua' để sang trang thanh toán luôn
        req.session.danhSachMua = [{
            idDT: sp._id.toString(),
            TenDT: sp.TenDT,
            HinhAnh: sp.HinhAnh,
            GiaBan: giaBan,
            SoLuong: 1,
            MauSac: mauSac,
            DungLuong: dungLuong
        }];

        res.redirect('/thanhtoan');
    } catch (error) {
        res.status(500).send("Lỗi server!");
    }
});

module.exports = router;