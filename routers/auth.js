var express = require('express');
var router = express.Router();
var TaiKhoan = require('../models/taikhoan');
var bcrypt = require('bcryptjs');
const passport = require('passport'); 

// ==========================================
// 1. ĐĂNG NHẬP
// ==========================================
router.get('/dangnhap', (req, res) => {
    res.render('dangnhap', { title: 'Đăng nhập hệ thống' });
});

router.post('/dangnhap', async (req, res) => {
    var { TenDangNhap, MatKhau } = req.body;
    var user = await TaiKhoan.findOne({ TenDangNhap: TenDangNhap });
    
    if (user && bcrypt.compareSync(MatKhau, user.MatKhau)) {
        req.session.MaNguoiDung = user._id;
        req.session.HoVaTen = user.HoVaTen;
        req.session.QuyenHan = user.QuyenHan;
        req.session.success = 'Đăng nhập thành công!';
        res.redirect('/');
    } else {
        req.session.error = 'Sai tên đăng nhập hoặc mật khẩu!';
        res.redirect('/auth/dangnhap');
    }
});

// ==========================================
// 2. ĐĂNG KÝ
// ==========================================
router.get('/dangky', (req, res) => {
    res.render('dangky', { title: 'Đăng ký tài khoản' });
});

router.post('/dangky', async (req, res) => {
    try {
        // 🔥 Đã lấy đủ 5 thông tin, bao gồm cả Email và Xác nhận mật khẩu
        var { HoVaTen, Email, TenDangNhap, MatKhau, XacNhanMatKhau } = req.body;
        
        // 1. Kiểm tra 2 mật khẩu có khớp nhau không
        if (MatKhau !== XacNhanMatKhau) {
            req.session.error = 'Mật khẩu xác nhận không khớp!';
            return res.redirect('/auth/dangky');
        }

        // 2. Kiểm tra tên đăng nhập đã tồn tại chưa
        var existingUser = await TaiKhoan.findOne({ TenDangNhap: TenDangNhap });
        if (existingUser) {
            req.session.error = 'Tên đăng nhập này đã có người sử dụng!';
            return res.redirect('/auth/dangky');
        }

        // 3. Tạo tài khoản mới
        var newUser = new TaiKhoan({
            HoVaTen: HoVaTen,
            Email: Email,
            TenDangNhap: TenDangNhap,
            MatKhau: bcrypt.hashSync(MatKhau, 10),
            QuyenHan: 'user' 
        });

        await newUser.save();
        req.session.success = 'Đăng ký thành công, mời bạn đăng nhập!';
        res.redirect('/auth/dangnhap'); 

    } catch (err) {
        console.log('Lỗi đăng ký: ' + err);
        req.session.error = 'Có lỗi xảy ra, vui lòng thử lại sau!';
        res.redirect('/auth/dangky');
    }
});

// ==========================================
// 3. ĐĂNG XUẤT
// ==========================================
router.get('/dangxuat', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.log('Lỗi khi đăng xuất: ' + err);
        res.redirect('/'); 
    });
});

// ==========================================
// 4. ĐĂNG NHẬP GOOGLE
// ==========================================
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/dangnhap' }),
  function(req, res) {
    req.session.MaNguoiDung = req.user._id; 
    req.session.HoVaTen = req.user.HoVaTen; 
    req.session.QuyenHan = req.user.QuyenHan;
    res.redirect('/');
  }
);

module.exports = router;