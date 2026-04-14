const express = require('express');
const router = express.Router();
const DonHang = require('../models/donhang');
const SanPham = require('../models/dienthoai'); // Import thêm Model điện thoại để chọn máy khi bán

// 1. TRANG DANH SÁCH ĐƠN HÀNG (Sáng đã có)
router.get('/', async (req, res) => {
    try {
        const danhSachDonHang = await DonHang.find().sort({ NgayDat: -1 });
        res.render('donhang', {
            title: 'Quản lý Đơn hàng',
            donHangs: danhSachDonHang,
            active: 'donhang'
        });
    } catch (error) {
        res.status(500).send("Lỗi: " + error.message);
    }
});

// 2. 🔥 BỔ SUNG: HIỂN THỊ FORM TẠO HÓA ĐƠN MỚI
router.get('/tao-moi', async (req, res) => {
    try {
        // Lấy danh sách điện thoại để Admin chọn khi tạo hóa đơn
        const tatCaSanPham = await SanPham.find();
        res.render('donhang_moi', {
            title: 'Tạo hóa đơn mới',
            danhSachSP: tatCaSanPham,
            active: 'donhang'
        });
    } catch (error) {
        res.status(500).send("Lỗi load trang tạo mới");
    }
});

// 3. 🔥 BỔ SUNG: XỬ LÝ LƯU HÓA ĐƠN MỚI VÀ TRỪ KHO
router.post('/tao-moi', async (req, res) => {
    try {
        const { HoVaTen, SoDienThoai, DiaChi, idDT, DungLuong, MauSac, SoLuong, GiaBan } = req.body;

        // Tìm thông tin máy để lấy tên và hình ảnh (nếu cần)
        const sp = await SanPham.findById(idDT);

        // 1. Tạo đơn hàng mới
        const donHangMoi = new DonHang({
            HoVaTen,
            SoDienThoai,
            DiaChi,
            PhuongThucTT: 'TaiCuaHang',
            TongTien: parseInt(GiaBan) * parseInt(SoLuong),
            ChiTietDonHang: [{
                TenDT: sp.TenDT,
                DungLuong: DungLuong,
                MauSac: MauSac,
                SoLuong: parseInt(SoLuong),
                GiaBan: parseInt(GiaBan)
            }]
        });
        await donHangMoi.save();

        // 2. Cập nhật trừ số lượng tồn kho
        await SanPham.updateOne(
            { _id: idDT, "CacPhienBan.DungLuong": DungLuong, "CacPhienBan.MauSac": MauSac },
            { $inc: { "CacPhienBan.$.SoLuongTon": -parseInt(SoLuong) } }
        );

        res.redirect('/donhang'); // Xong thì quay về danh sách
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi khi lưu hóa đơn mới!");
    }
});
// ==========================================
// 1. TRANG SỬA ĐƠN HÀNG (Hiển thị form)
// ==========================================
router.get('/sua/:id', async (req, res, next) => {
    try {
        const dh = await DonHang.findById(req.params.id);
        res.render('donhang_sua', { 
            title: 'Chỉnh sửa đơn hàng', 
            dh: dh 
        });
    } catch (error) {
        next(error);
    }
});

// ==========================================
// 2. XỬ LÝ CẬP NHẬT THÔNG TIN ĐƠN HÀNG
// ==========================================
router.post('/sua/:id', async (req, res, next) => {
    try {
        const { HoVaTen, SoDienThoai, DiaChi } = req.body;
        await DonHang.findByIdAndUpdate(req.params.id, {
            HoVaTen, SoDienThoai, DiaChi
        });
        req.session.success = "Đã cập nhật thông tin đơn hàng!";
        res.redirect('/donhang');
    } catch (error) {
        next(error);
    }
});

// ==========================================
// 3. XỬ LÝ XÓA ĐƠN HÀNG
// ==========================================
router.get('/xoa/:id', async (req, res, next) => {
    try {
        await DonHang.findByIdAndDelete(req.params.id);
        req.session.success = "Đã xóa đơn hàng thành công!";
        res.redirect('/donhang');
    } catch (error) {
        next(error);
    }
});
// 4. CẬP NHẬT TRẠNG THÁI (Sáng đã có)
router.post('/capnhat/:id', async (req, res) => {
    try {
        await DonHang.findByIdAndUpdate(req.params.id, { TrangThai: req.body.TrangThai });
        res.redirect('/donhang');
    } catch (error) {
        res.send("Lỗi cập nhật!");
    }
});

module.exports = router;