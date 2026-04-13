var express = require('express');
var app = express();
var mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');


var path = require('path');

// 1. Khai báo các Router
var indexRouter = require('./routers/index');
var authRouter = require('./routers/auth');
var taikhoanRouter = require('./routers/taikhoan');
var hangsanxuatRouter = require('./routers/hangsanxuat'); // Router mới
var dienthoaiRouter = require('./routers/dienthoai');     // Router mới
var phieunhapRouter = require('./routers/phieunhap');

// 2. Kết nối cơ sở dữ liệu MongoDB Atlas
const uri = process.env.MONGODB_URI || 'mongodb://admin:admin123@ac-aon9t0v-shard-00-01.jxjblx7.mongodb.net:27017/CH_DienThoai?ssl=true&authSource=admin';
//var uri = 'mongodb://admin:admin123@ac-aon9t0v-shard-00-01.jxjblx7.mongodb.net:27017/CH_DienThoai?ssl=true&authSource=admin';
mongoose.connect(uri)
	.then(() => console.log('Kết nối MongoDB thành công!'))
	.catch(err => console.log('Lỗi kết nối MongoDB: ' + err));

// 3. Cấu hình View Engine và Thư mục Static
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 4. Cấu hình Middleware xử lý dữ liệu form và JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// 5. Cấu hình Session (Phiên làm việc)
// 5. Cấu hình Session (Lưu vào MongoDB để không bị văng)
app.use(session({
	name: 'SPhoneStore',
	secret: 'bi-mat-session',
	resave: false,
	saveUninitialized: false,
	store: MongoStore.create({
		mongoUrl: uri, // Tận dụng luôn cái link Mongoose ở trên Sáng đã viết
		collectionName: 'sessions' 
	}),
	cookie: {
		maxAge: 30 * 24 * 60 * 60 * 1000
	}
}));
   
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// 1. Khởi tạo Passport
app.use(passport.initialize());
app.use(passport.session());

// Khai báo để Passport không bị lỗi (bắt buộc)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// 2. Cài đặt chìa khóa Google
passport.use(new GoogleStrategy({
    clientID: '386062152822-496al4d9lg3kics0mka00u3lns0tpvqh.apps.googleusercontent.com', 
    clientSecret: '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',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8080/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // Chỗ này là lúc Google trả thông tin về thành công
    return done(null, profile);
  }
));
// 6. Middleware để chuyển dữ liệu Session và Thông báo sang View
app.use((req, res, next) => {
	// Giúp tất cả các file .ejs đều truy cập được biến 'session'
	res.locals.session = req.session;
	
	// Lấy thông báo lỗi hoặc thành công từ session (nếu có) rồi xóa ngay
	res.locals.errorMessage = req.session.error;
	res.locals.successMessage = req.session.success;
	
	delete req.session.error;
	delete req.session.success;
	
	next();
});

// 7. Đăng ký các đường dẫn (Routes)
app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/taikhoan', taikhoanRouter);
app.use('/hangsanxuat', hangsanxuatRouter);
app.use('/dienthoai', dienthoaiRouter);
app.use('/phieunhap', phieunhapRouter);

// 8. Bắt lỗi 404 (Khi người dùng gõ sai đường link)
app.use(function(req, res, next) {
    const err = new Error('Trang bạn tìm kiếm không tồn tại!');
    err.status = 404;
    next(err); // Chuyển lỗi này xuống cho hàm xử lý lỗi bên dưới
});
// 8. Xử lý lỗi 404 (Không tìm thấy trang)
// index.js - Đoạn xử lý lỗi cuối file
app.use(function(err, req, res, next) {
    // Đặt thông báo lỗi
    res.locals.message = err.message;
    
    // TRUYỀN BIẾN ERROR SANG EJS (Cực kỳ quan trọng)
    // Trong môi trường phát triển, chúng ta truyền toàn bộ err
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Thiết lập mã trạng thái lỗi (ví dụ 404 hoặc 500)
    res.status(err.status || 500);
    
    // Hiển thị trang error.ejs
    res.render('error');
});

// 9. Khởi động Server
var port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log('Server đang chạy tại: http://localhost:' + port);
});

