
var express = require('express');
var router = express.Router();
var PhieuNhap = require('../models/phieunhap');
var DienThoai = require('../models/dienthoai');

// 1. Hiển thị form lập phiếu
router.get('/them', async (req, res) => {
    var dienthoai = await DienThoai.find();
    res.render('phieunhap_them', { title: 'Nhập hàng', dienthoai: dienthoai });
});

// 2. Xử lý lưu phiếu và CẬP NHẬT GIÁ
router.post('/them', async (req, res) => {
    try {
        const { MaDienThoai, SoLuongNhap, GiaNhapVao } = req.body;
        const tongTien = parseInt(SoLuongNhap) * parseInt(GiaNhapVao);
        // A. Lưu vào lịch sử phiếu nhập
       const phieuMoi = new PhieuNhap({
            MaDienThoai: MaDienThoai,
            NhaCungCap: NhaCungCap,
            SoLuongNhap: parseInt(SoLuongNhap),
            GiaNhapVao: parseInt(GiaNhapVao),
            TongTien: tongTien, // BỔ SUNG DÒNG NÀY VÀO ĐỂ LƯU VÀO DB
            NgayNhap: new Date()
        });
        await phieuMoi.save();

        // B. CẬP NHẬT NGƯỢC LẠI BẢNG ĐIỆN THOẠI
        // Tìm cái điện thoại đó và cập nhật: Giá nhập mới + Cộng dồn số lượng tồn
        await DienThoai.findByIdAndUpdate(MaDienThoai, {
            $set: { GiaNhap: GiaNhapVao }, 
            $inc: { SoLuongTon: SoLuongNhap } 
        });

        res.redirect('/dienthoai'); // Xong rồi thì về xem thành quả
    } catch (error) {
        res.send("Lỗi nhập kho Sáng ơi: " + error.message);
    }
});

// ĐOẠN NÀY LÀ BẮT BUỘC PHẢI CÓ ĐỂ XỬ LÝ LỖI CANNOT GET
router.get('/', async (req, res) => {
    try {
        var dsPhieuNhap = await PhieuNhap.find(); 
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