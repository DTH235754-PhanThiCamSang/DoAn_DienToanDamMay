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
// ==========================================
// MỞ TRANG THÊM TÀI KHOẢN MỚI
// ==========================================
router.get('/them', (req, res) => {
    res.render('taikhoan_them', { title: 'Thêm tài khoản mới' });
});

// ==========================================
// XỬ LÝ LƯU TÀI KHOẢN MỚI VÀO DATABASE
// ==========================================
router.post('/them', async (req, res, next) => {
    try {
        const { TenDangNhap, MatKhau, HoVaTen, Email, QuyenHan } = req.body;

        // 1. Kiểm tra xem Tên đăng nhập này có ai xài chưa
        const checkTaiKhoan = await TaiKhoan.findOne({ TenDangNhap: TenDangNhap });
        if (checkTaiKhoan) {
            req.session.error = "Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác!";
            return res.redirect('/taikhoan/them'); // Bị trùng thì đuổi về trang thêm
        }

        // 2. Gom dữ liệu lại thành 1 tài khoản mới
        const taiKhoanMoi = new TaiKhoan({
            TenDangNhap: TenDangNhap,
            MatKhau: MatKhau, 
            HoVaTen: HoVaTen,
            Email: Email,
            QuyenHan: QuyenHan
        });

        // 3. Lưu cái rụp vào CSDL
        await taiKhoanMoi.save();
        
        // 4. Báo thành công và quay về danh sách
        req.session.success = "Đã thêm tài khoản mới thành công!";
        res.redirect('/taikhoan');

    } catch (error) {
        next(error);
    }
});
// ==========================================
// MỞ TRANG SỬA TÀI KHOẢN
// ==========================================
router.get('/sua/:id', async (req, res, next) => {
    try {
        // Tìm tài khoản theo ID gửi trên thanh địa chỉ
        const thongTinTaiKhoan = await TaiKhoan.findById(req.params.id);
        
        if (!thongTinTaiKhoan) {
            return res.status(404).send("Không tìm thấy tài khoản này!");
        }

        // Gọi giao diện và truyền dữ liệu sang
        res.render('taikhoan_sua', { 
            title: 'Sửa thông tin tài khoản',
            taikhoan: thongTinTaiKhoan 
        });
    } catch (error) {
        next(error);
    }
});

// ==========================================
// XỬ LÝ LƯU DỮ LIỆU KHI BẤM NÚT LƯU
// ==========================================
router.post('/sua/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const { HoVaTen, Email, QuyenHan } = req.body;

        // Cập nhật thông tin vào Database (Thường thì tên đăng nhập không cho sửa)
        await TaiKhoan.findByIdAndUpdate(id, {
            HoVaTen: HoVaTen,
            Email: Email,
            QuyenHan: QuyenHan
        });

        // Sửa xong quay về trang danh sách tài khoản
        res.redirect('/taikhoan'); 
    } catch (error) {
        next(error);
    }
});
module.exports = router;