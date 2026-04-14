var mongoose = require('mongoose');
const phieuNhapSchema = new mongoose.Schema({
    MaPhieuNhap: { type: String, required: true },

    MaDienThoai: { type: mongoose.Schema.Types.ObjectId, ref: 'DienThoai' },
    TenDienThoai: { type: String },
    NgayNhap: { type: Date, default: Date.now },
    SoLuongNhap: { type: Number, required: true },
    GiaNhapVao: { type: Number, required: true }, 
    NguoiNhap: { type: String, default: 'Admin' }
});

module.exports = mongoose.model('PhieuNhap', phieuNhapSchema);