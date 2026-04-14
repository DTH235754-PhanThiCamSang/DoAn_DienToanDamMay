const express = require('express');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// ==========================================
// 1. KHAI BÁO CÁC ROUTER
// ==========================================
const TaiKhoan = require('./models/taikhoan');
const indexRouter = require('./routers/index');
const authRouter = require('./routers/auth');
const taikhoanRouter = require('./routers/taikhoan');
const hangsanxuatRouter = require('./routers/hangsanxuat'); 
const dienthoaiRouter = require('./routers/dienthoai');     
const phieunhapRouter = require('./routers/phieunhap');
const giohangRouter = require('./routers/giohang');       
const thanhtoanRouter = require('./routers/thanhtoan');
const donHangRouter = require('./routers/donhang');

// ==========================================
// 2. KẾT NỐI DATABASE MONGODB
// ==========================================
const uri = process.env.MONGODB_URI || 'mongodb://admin:admin123@ac-aon9t0v-shard-00-01.jxjblx7.mongodb.net:27017/CH_DienThoai?ssl=true&authSource=admin';
mongoose.connect(uri)
    .then(() => console.log('Kết nối MongoDB thành công!'))
    .catch(err => console.log('Lỗi kết nối MongoDB: ' + err));

// ==========================================
// 3. CẤU HÌNH VIEW ENGINE & BỘ ĐỌC DỮ LIỆU
// ==========================================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 4. CẤU HÌNH SESSION (CHỈ DÙNG 1 CÁI LƯU VÀO MONGODB)
// ==========================================
app.use(session({
    name: 'SPhoneStore',
    secret: 'bi-mat-session',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: uri, 
        collectionName: 'sessions' 
    }),
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // Session sống 30 ngày
    }
}));

// ==========================================
// 5. CẤU HÌNH PASSPORT (ĐĂNG NHẬP GOOGLE)
// ==========================================
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: '386062152822-496al4d9lg3kics0mka00u3lns0tpvqh.apps.googleusercontent.com', 
    clientSecret: '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',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8080/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
        let user = await TaiKhoan.findOne({ TenDangNhap: profile.id });

        if (!user) {
            user = new TaiKhoan({
                HoVaTen: profile.displayName,
                TenDangNhap: profile.emails[0].value, 
                MatKhau: profile.id, 
                Email: profile.emails[0].value,
                QuyenHan: 'user'
            });
            await user.save();
            console.log("Đã lưu tài khoản Google mới vào CSDL!");
        }

        return done(null, user);
        
    } catch (err) {
        return done(err, null);
    }
  }
));

// ==========================================
// 6. TRUYỀN BIẾN TOÀN CỤC SANG VIEW (EJS)
// ==========================================
app.use((req, res, next) => {
    res.locals.session = req.session;
    
    //
    // Nếu có đăng nhập thì lấy quyền của người đó, nếu khách vãng lai thì gán là 'khach'
    res.locals.QuyenHan = (req.session && req.session.QuyenHan) ? req.session.QuyenHan : 'khach';
    
    res.locals.errorMessage = req.session.error;
    res.locals.successMessage = req.session.success;
    
    delete req.session.error;
    delete req.session.success;
    
    next();
});

// ==========================================
// 7. ĐĂNG KÝ CÁC ĐƯỜNG DẪN (ROUTES)
// ==========================================
app.use('/', indexRouter);
app.use('/auth', authRouter); 
app.use('/taikhoan', taikhoanRouter);
app.use('/hangsanxuat', hangsanxuatRouter);
app.use('/dienthoai', dienthoaiRouter);
app.use('/phieunhap', phieunhapRouter);
app.use('/giohang', giohangRouter);
app.use('/thanhtoan', thanhtoanRouter);
app.use('/donhang', donHangRouter);

// ==========================================
// 8. XỬ LÝ LỖI 404 VÀ LỖI HỆ THỐNG
// ==========================================
app.use(function(req, res, next) {
    const err = new Error('Trang bạn tìm kiếm không tồn tại!');
    err.status = 404;
    next(err); 
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

// ==========================================
// 9. KHỞI ĐỘNG SERVER
// ==========================================
var port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
});