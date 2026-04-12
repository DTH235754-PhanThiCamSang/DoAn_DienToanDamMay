var mongoose = require('mongoose');

var phieuNhapSchema = new mongoose.Schema({
    MaDienThoai: { type: mongoose.Schema.Types.ObjectId, ref: 'DienThoai' },
    TenDienThoai: { type: String },
    NgayNhap: { type: Date, default: Date.now },
    SoLuongNhap: { type: Number, required: true },
    GiaNhapVao: { type: Number, required: true }, 
    NguoiNhap: { type: String, default: 'Admin' }
});

module.exports = mongoose.model('PhieuNhap', phieuNhapSchema);