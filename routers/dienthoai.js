

// module.exports = router;
var express = require('express');
var router = express.Router();
var DienThoai = require('../models/dienthoai');
var HangSanXuat = require('../models/hangsanxuat');
var PhieuNhap = require('../models/phieunhap');

// 1. Xử lý hiển thị danh sách điện thoại (Trang chính)
router.get('/', async (req, res) => {
    try {
        var dienthoai = await DienThoai.find().populate('HangSanXuat');
        res.render('dienthoai', { 
            title: 'Quản lý điện thoại', 
            dienthoai: dienthoai ,
            active: 'sanpham'
        });
    } catch (error) {
        res.send("Lỗi lấy danh sách: " + error.message);
    }
});

// 2. Lệnh này để HIỂN THỊ cái form (Chỉ giữ 1 cái duy nhất này thôi Sáng nhé!)
router.get('/them', async (req, res) => {
    try {
        const hang = await HangSanXuat.find();
        
        // Lấy danh sách từ bảng PHIẾU NHẬP để hiện tên lên Combobox
        const dsDaNhap = await PhieuNhap.find(); 
        
        res.render('dienthoai_them', { 
            title: 'Thêm điện thoại', 
            hang: hang,
            dienthoai: dsDaNhap // Truyền danh sách phiếu nhập ra giao diện
        });
    } catch (error) {
        res.send("Lỗi không mở được form: " + error.message);
    }
});

// 3. Xử lý LƯU dữ liệu khi bấm nút "Lưu sản phẩm"
router.post('/them', async (req, res) => {
    try {
        const { TenDienThoai, MaHang, GiaBan, GiaNhap, MoTa, HinhAnh } = req.body;

        const moi = new DienThoai({
            TenDT: TenDienThoai,
            HangSanXuat: MaHang,
            GiaBan: GiaBan,
            GiaNhap: GiaNhap, 
            MoTa: MoTa,      
            HinhAnh: HinhAnh
        });

        await moi.save();
        res.redirect('/dienthoai'); 
    } catch (error) {
        res.status(500).send("Không lưu được Sáng ơi: " + error.message);
    }
});

// 1. Hiển thị trang Sửa

router.get('/sua/:id', async (req, res, next) => {
    try {
        // 1. Tìm điện thoại theo ID
        const thongTinDienThoai = await DienThoai.findById(req.params.id);
        
        // 2. Lấy danh sách hãng sản xuất để đổ vào thẻ <select>
        const danhSachHang = await HangSanXuat.find();

        // 3. CHÚ Ý CHỖ NÀY: Truyền dữ liệu sang giao diện
        res.render('dienthoai_sua', { 
            dt: thongTinDienThoai,  // <-- Bắt buộc phải là chữ "dt:" để giao diện nhận được
            hang: danhSachHang      // <-- Bắt buộc phải truyền cả danh sách "hang" sang
        });
    } catch (error) {
        next(error);
    }
});
// 2. Xử lý cập nhật dữ liệu (Khi bấm nút Lưu trên form sửa)
router.post('/sua/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Lấy dữ liệu mới từ các ô nhập liệu và cập nhật vào DB
        await DienThoai.findByIdAndUpdate(id, {
            TenDT: req.body.TenDT,
            HangSanXuat: req.body.MaHang,
            GiaBan: req.body.GiaBan,
            GiaNhap: req.body.GiaNhap,
            MoTa: req.body.MoTa,
            HinhAnh: req.body.HinhAnh
        });
        
        res.redirect('/dienthoai'); 
    } catch (error) {
        res.send("Lỗi cập nhật rồi: " + error.message);
    }
});

// Đường dẫn: /dienthoai/chitiet/:id
router.get('/chitiet/:id', async (req, res) => {
    try {
        // 1. Lấy ID từ thanh địa chỉ
        const id = req.params.id;

        // 2. Tìm điện thoại theo ID và dùng populate để lấy luôn thông tin Hãng sản xuất
        const dt = await DienThoai.findById(id).populate('HangSanXuat');

        // 3. Trả về trang giao diện chi tiết
        res.render('dienthoai_chitiet', { 
            title: 'Chi tiết sản phẩm', 
            dienthoai: dt 
        });
    } catch (error) {
        res.status(500).send("Không tìm thấy sản phẩm: " + error.message);
    }
});
router.get('/xoa/:id', async (req, res) => {
    try {
        // Tìm và xóa điện thoại theo ID được truyền trên URL
        await DienThoai.findByIdAndDelete(req.params.id);
        
        // Xóa xong thì tự động quay về trang danh sách
        res.redirect('/dienthoai'); 
    } catch (error) {
        console.log("Lỗi khi xóa:", error);
        res.status(500).send("Có lỗi xảy ra khi xóa sản phẩm!");
    }
});
module.exports = router;