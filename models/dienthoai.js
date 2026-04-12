var mongoose = require('mongoose');

var dienThoaiSchema = new mongoose.Schema({
    HangSanXuat: { type: mongoose.Schema.Types.ObjectId, ref: 'HangSanXuat' },
    TaiKhoan: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan' }, // Người nhập hàng
    TenDT: { type: String, required: true },
    MoTa: { type: String, required: true },
    GiaNhap: { type: Number, required: true },
    
    
    HinhAnh: { type: String }, 
   CacPhienBan: [{
    DungLuong: String,
    MauSac: String,
    PhanTramLoi: Number,   // VD: 15 (nghĩa là lời 15%)
    PhanTramGiamGia: Number, // VD: 5 (nghĩa là giảm 5%)
    SoLuongTon: Number
}]
   
});

module.exports = mongoose.model('DienThoai', dienThoaiSchema);