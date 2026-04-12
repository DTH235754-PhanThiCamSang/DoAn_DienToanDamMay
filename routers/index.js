var express = require('express');
var router = express.Router();
// Nhớ import model Điện thoại vào nhé
var DienThoai = require('../models/dienthoai'); 

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    // Lấy danh sách điện thoại từ MongoDB (ví dụ lấy 8 cái mới nhất)
   var dienthoai = await DienThoai.find().populate('HangSanXuat');
    
    // Truyền biến 'dienthoai' ra ngoài trang index
    res.render('index', { title: 'SPhone Store - Trang chủ', dienthoai: dienthoai });
  } catch (error) {
    console.log(error);
    res.render('error', {
        message: error.message,
        error: error
      });
  }
});
// 1. API Gợi ý tìm kiếm (Dành cho khung xổ xuống)
router.get('/api/timkiem', async (req, res) => {
    try {
        const tuKhoa = req.query.q || '';
        // Tìm tên điện thoại chứa từ khóa (không phân biệt hoa thường - chữ 'i')
        // Dùng .limit(5) để khung xổ xuống chỉ hiện tối đa 5 cái cho đẹp
        const ketQua = await DienThoai.find({ TenDT: { $regex: tuKhoa, $options: 'i' } }).limit(5);
        res.json(ketQua);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// 2. Trang Kết quả tìm kiếm (Khi bấm icon Kính lúp hoặc Enter)
router.get('/timkiem', async (req, res) => {
    try {
        const tuKhoa = req.query.q || '';
        // Lấy TẤT CẢ sản phẩm khớp từ khóa
        const danhSachDienThoai = await DienThoai.find({ TenDT: { $regex: tuKhoa, $options: 'i' } });
        
        // Mình tái sử dụng luôn file index.ejs trang chủ để hiển thị dạng lưới cho nhanh!
        res.render('index', { 
            title: `Kết quả tìm kiếm: ${tuKhoa}`,
            dienthoai: danhSachDienThoai
        });
    } catch (error) {
        console.log(error);
        res.render('error', { message: 'Lỗi tìm kiếm!' });
    }
});
module.exports = router;