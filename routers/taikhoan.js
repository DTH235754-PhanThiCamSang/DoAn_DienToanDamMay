const express = require('express'); // 1. Bắt buộc phải mở dòng này ra
const router = express.Router();
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../models/taikhoan'); // 2. Chỉ giữ lại 1 dòng này thôi

// Xử lý POST từ form đăng nhập
router.post('/dangnhap', async (req, res) => {
    try {
        const { TenDangNhap, MatKhau } = req.body;

        const user = await TaiKhoan.findOne({ TenDangNhap: TenDangNhap });
        if (!user) {
            return res.send("Tài khoản không tồn tại!"); 
        }

        const isMatch = await bcrypt.compare(MatKhau, user.MatKhau);
        if (!isMatch) {
            return res.send("Mật khẩu không chính xác!");
        }

        // 3. ĐỒNG BỘ TÊN BIẾN VỚI HÀM ISADMIN:
        req.session.MaNguoiDung = user._id;     // Đổi từ userId thành MaNguoiDung
        req.session.hoTen = user.HoTen; 
        req.session.QuyenHan = user.QuyenHan;   // Phải lưu thêm Quyền hạn để lát nữa kiểm tra
        
        res.redirect('/dienthoai'); 

    } catch (error) {
        console.error(error);
        res.send("Đã xảy ra lỗi: " + error.message);
    }
});

// Middleware kiểm tra quyền Admin
var isAdmin = (req, res, next) => {
    // Bây giờ thì biến ở đây đã khớp với biến lúc đăng nhập rồi nè
    if (req.session.MaNguoiDung && req.session.QuyenHan === 'admin') {
        next();
    } else {
        // Tạm thời mình cho chuyển thẳng về trang đăng nhập nếu không có quyền nhé
        res.redirect('/dangnhap');
    }
};

// Hiển thị danh sách tài khoản
router.get('/', isAdmin, async (req, res) => {
    var taikhoan = await TaiKhoan.find();
    res.render('taikhoan', { title: 'Quản lý tài khoản', taikhoan: taikhoan });
});

// Xóa tài khoản
router.get('/xoa/:id', isAdmin, async (req, res) => {
    await TaiKhoan.findByIdAndDelete(req.params.id);
    res.redirect('/taikhoan');
});
// Bắt sự kiện lấy trang danh sách
router.get('/', async (req, res, next) => {
    try {
        // 1. Lấy toàn bộ tài khoản từ Database
        const danhSachTaiKhoan = await TaiKhoan.find();
        
        // 2. Truyền sang file taikhoan.ejs (bằng cái tên biến là 'taikhoan')
        res.render('taikhoan', { taikhoan: danhSachTaiKhoan }); 
    } catch (error) {
        next(error);
    }
});
module.exports = router;