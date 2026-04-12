var express = require('express');
var router = express.Router();
var HangSanXuat = require('../models/hangsanxuat');

// 1. Danh sách Hãng sản xuất
router.get('/', async (req, res) => {
    var hang = await HangSanXuat.find();
    res.render('hangsanxuat', { title: 'Danh sách hãng',
                                 hang: hang ,
                                 active: 'hangsanxuat'});
});

// 2. Trang Thêm hãng
router.get('/them', (req, res) => {
    res.render('hangsanxuat_them', { title: 'Thêm hãng mới' });
});

// 3. Xử lý Thêm hãng
router.post('/them', async (req, res) => {
    var newHang = new HangSanXuat({ TenHang: req.body.TenHang });
    await newHang.save();
    res.redirect('/hangsanxuat');
});

// 4. Trang Sửa hãng
router.get('/sua/:id', async (req, res) => {
    var hang = await HangSanXuat.findById(req.id); // Hoặc req.params.id tùy code của bạn
    // Sửa lại cho chắc:
    var hang = await HangSanXuat.findById(req.params.id);
    res.render('hangsanxuat_sua', { title: 'Sửa hãng', hang: hang });
});

// 5. Xử lý Cập nhật hãng
router.post('/sua/:id', async (req, res) => {
    await HangSanXuat.findByIdAndUpdate(req.params.id, { TenHang: req.body.TenHang });
    res.redirect('/hangsanxuat');
});

// 6. Xử lý Xóa hãng
router.get('/xoa/:id', async (req, res) => {
    await HangSanXuat.findByIdAndDelete(req.params.id);
    res.redirect('/hangsanxuat');
});

module.exports = router;