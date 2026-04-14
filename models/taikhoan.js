var mongoose = require('mongoose');

var taiKhoanSchema = new mongoose.Schema({
	HoVaTen: { type: String, required: true },
	TenDangNhap: { type: String, unique: true, required: true },
	MatKhau: { type: String, required: true },
	Email: { type: String, required: true },
	QuyenHan: { type: String, enum: ['user', 'admin', 'thukho', 'banhang'], default: 'user' }
});

module.exports = mongoose.model('TaiKhoan', taiKhoanSchema);