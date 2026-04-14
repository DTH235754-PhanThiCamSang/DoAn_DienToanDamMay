var express = require('express');
var router = express.Router();
var PhieuNhap = require('../models/phieunhap');
var DienThoai = require('../models/dienthoai');

// ==========================================
// 1. MỞ TRANG THÊM PHIẾU NHẬP 
// ==========================================
router.get('/them', async (req, res, next) => {
    try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yy = String(today.getFullYear()).slice(-2);
        const dateString = `${dd}${mm}${yy}`; 

        // Đếm theo MaPhieuNhap để tạo số thứ tự
        const count = await PhieuNhap.countDocuments({
            MaPhieuNhap: new RegExp(`^PN${dateString}`) 
        });

        const stt = String(count + 1).padStart(2, '0');
        const maPhieuTuDong = `PN${dateString}-${stt}`; 

        // Lấy danh sách ĐT để làm menu thả xuống
        const danhSachDienThoai = await DienThoai.find();

        res.render('phieunhap_them', { 
            title: 'Lập phiếu nhập mới',
            maPhieuTuDong: maPhieuTuDong,
            dienthoai: danhSachDienThoai
        });
    } catch (error) {
        next(error);
    }
});

// ==========================================
// 2. XỬ LÝ LƯU PHIẾU VÀO DATABASE KHI BẤM NÚT LƯU
// ==========================================
router.post('/them', async (req, res, next) => {
    try {
        const { MaPhieuNhap, MaDienThoai, TenDienThoai, SoLuongNhap, GiaNhapVao, NguoiNhap } = req.body;

        const phieuMoi = new PhieuNhap({
            MaPhieuNhap: MaPhieuNhap, 
            MaDienThoai: MaDienThoai, 
            TenDienThoai: TenDienThoai,
            SoLuongNhap: Number(SoLuongNhap),
            GiaNhapVao: Number(GiaNhapVao),
            NguoiNhap: NguoiNhap
        });

        await phieuMoi.save();
        res.redirect('/phieunhap');
    } catch (error) {
        next(error);
    }
});

// ==========================================
// 3. DANH SÁCH PHIẾU NHẬP
// ==========================================
router.get('/', async (req, res) => {
    try {
        var dsPhieuNhap = await PhieuNhap.find().sort({ NgayNhap: -1 }); // Sắp xếp phiếu mới nhất lên đầu
        res.render('phieunhap', { 
            title: 'Danh sách Phiếu nhập', 
            phieunhap: dsPhieuNhap, 
            active: 'phieunhap' 
        });
    } catch (error) {
        res.send("Lỗi tải danh sách: " + error.message);
    }
});

module.exports = router;