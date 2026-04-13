const express = require('express');
const router = express.Router();
const DienThoai = require('../models/dienthoai');

// --- HÀM TÍNH GIÁ ĐỘNG (Để không bị lỗi undefined) ---
function tinhGiaBan(sp) {
    if (sp.CacPhienBan && sp.CacPhienBan.length > 0) {
        let pb = sp.CacPhienBan[0]; // Lấy phiên bản đầu tiên làm chuẩn
        let giaNiemYet = (sp.GiaNhap || 0) * (1 + (pb.PhanTramLoi || 0) / 100);
        let giaSauGiam = giaNiemYet * (1 - (pb.PhanTramGiamGia || 0) / 100);
        return Math.round(giaSauGiam / 10) * 10;
    }
    return 0;
}

// 1. Trang hiển thị Giỏ hàng
router.get('/', (req, res) => {
    let gioHang = req.session.cart || [];
    
    // Tính toán lại ThanhTien cho từng món và TongTien của cả giỏ
    let tongTien = 0;
    gioHang.forEach(item => {
        item.ThanhTien = (item.Gia || 0) * (item.SoLuong || 1);
        tongTien += item.ThanhTien;
    });

    res.render('giohang', {
        session: req.session,
        gioHang: gioHang,
        tongTien: tongTien
    });
});

// 2. Thêm vào giỏ hàng (POST)
router.post('/them', async (req, res) => {
    try {
        const { idSanPham, soLuong, mauSac } = req.body;
        if (!req.session.cart) req.session.cart = [];
        let gioHang = req.session.cart;

        let index = gioHang.findIndex(p => p.Id === idSanPham);

        if (index !== -1) {
            gioHang[index].SoLuong += parseInt(soLuong || 1);
        } else {
            const sp = await DienThoai.findById(idSanPham);
            if (!sp) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });

            const giaThucTe = tinhGiaBan(sp); // Gọi hàm tính giá ở trên

            gioHang.push({
                Id: sp._id.toString(),
                TenDT: sp.TenDT,
                HinhAnh: sp.HinhAnh,
                Gia: giaThucTe, 
                SoLuong: parseInt(soLuong) || 1,
                MauSac: mauSac || 'Mặc định',
                ThanhTien: giaThucTe * (parseInt(soLuong) || 1)
            });
        }
        res.json({ success: true, message: 'Đã thêm vào giỏ hàng', tongSoSP: gioHang.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// 3. Tăng số lượng (+1)
router.get('/tang/:id', (req, res) => {
    let gioHang = req.session.cart || [];
    let item = gioHang.find(p => p.Id === req.params.id);
    if (item) item.SoLuong++;
    res.redirect('/giohang');
});

// 4. Giảm số lượng (-1)
router.get('/giam/:id', (req, res) => {
    let gioHang = req.session.cart || [];
    let item = gioHang.find(p => p.Id === req.params.id);
    if (item && item.SoLuong > 1) {
        item.SoLuong--;
    } else {
        // Nếu số lượng là 1 mà bấm giảm thì xóa luôn
        req.session.cart = gioHang.filter(p => p.Id !== req.params.id);
    }
    res.redirect('/giohang');
});

// 5. Xóa sản phẩm
router.get('/xoa/:id', (req, res) => {
    let gioHang = req.session.cart || [];
    req.session.cart = gioHang.filter(p => p.Id !== req.params.id);
    res.redirect('/giohang');
});

module.exports = router;