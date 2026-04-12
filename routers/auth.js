var express = require('express');
var router = express.Router();
var TaiKhoan = require('../models/taikhoan');
var bcrypt = require('bcryptjs');

// Trang Đăng nhập
router.get('/dangnhap', (req, res) => {
	res.render('dangnhap', { title: 'Đăng nhập hệ thống' });
});

// Xử lý Đăng nhập
router.post('/dangnhap', async (req, res) => {
	var { TenDangNhap, MatKhau } = req.body;
	var user = await TaiKhoan.findOne({ TenDangNhap: TenDangNhap });
	
	if (user && bcrypt.compareSync(MatKhau, user.MatKhau)) {
		// Tạo session lưu thông tin người dùng
		req.session.MaNguoiDung = user._id;
		req.session.HoVaTen = user.HoVaTen;
		req.session.QuyenHan = user.QuyenHan;
		
		req.session.success = 'Đăng nhập thành công!';
		res.redirect('/');
	} else {
		req.session.error = 'Sai tên đăng nhập hoặc mật khẩu!';
		res.redirect('/dangnhap');
	}
});

/// TRANG DANG KY (HIEN THI GIAO DIEN)
router.get('/dangky', (req, res) => {
    res.render('dangky', { title: 'Đăng ký tài khoản' });
});

// XU LY DANG KY (NHAN DU LIEU TU FORM)
router.post('/dangky', async (req, res) => {
    try {
        var { HoVaTen, TenDangNhap, MatKhau } = req.body;
        
        // Kiem tra ten dang nhap da ton tai chua
        var existingUser = await TaiKhoan.findOne({ TenDangNhap: TenDangNhap });
        if (existingUser) {
            req.session.error = 'Tên đăng nhập này đã có người sử dụng!';
            // PHAI CO /auth/ O TRUOC
            return res.redirect('/dangky'); 
        }

        var newUser = new TaiKhoan({
            HoVaTen: HoVaTen,
            TenDangNhap: TenDangNhap,
            MatKhau: bcrypt.hashSync(MatKhau, 10), // Ma hoa mat khau
            QuyenHan: 'user'
        });

        await newUser.save();
        req.session.success = 'Đăng ký thành công, mời bạn đăng nhập!';
        
        // PHAI CO /auth/ O TRUOC
        res.redirect('/auth/dangnhap'); 

    } catch (err) {
        console.log('Loi dang ky: ' + err);
        res.redirect('/dangky');
    }
});

// Đăng xuất
router.get('/dangxuat', (req, res) => {
	req.session.destroy();
	res.redirect('/');
});
// Lệnh Đăng xuất
router.get('/dangxuat', (req, res) => {
    // Xóa toàn bộ session (phiên làm việc)
    req.session.destroy((err) => {
        if (err) {
            console.log('Lỗi khi đăng xuất: ' + err);
        }
        // Sau khi xóa xong thì đá về trang chủ
        res.redirect('/'); 
    });
});
const passport = require('passport');

// Lệnh 1: Khi người dùng bấm nút "Đăng nhập bằng Google", đẩy họ sang trang của Google
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Lệnh 2: Sau khi họ đăng nhập bên Google xong, Google sẽ ném họ về lại đây
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/dangnhap' }),
  function(req, res) {
    // Nếu thành công, lấy tên của họ gán vào session của hệ thống mình
    req.session.MaNguoiDung = req.user.id; // Lấy ID của Google làm mã tạm
    req.session.HoVaTen = req.user.displayName; // Lấy tên thật của họ trên Gmail
    
    // Xong xuôi thì về trang chủ
    res.redirect('/');
  }
);
module.exports = router;