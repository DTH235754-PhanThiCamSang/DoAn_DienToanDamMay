const mongoose = require('mongoose');

const dienThoaiSchema = new mongoose.Schema({
    TenDT: String,
    HangSanXuat: { type: mongoose.Schema.Types.ObjectId, ref: 'HangSanXuat' },
    MoTa: String,
    HinhAnh: String,
    
    // Giá đại diện để hiển thị ngoài trang chủ (Backend tự động tính và điền)
    GiaNhap: { type: Number, default: 0 }, 
    GiaBan: { type: Number, default: 0 },  

    CacPhienBan: [{
        DungLuong: String,
        MauSac: String,
        SoLuongTon: { type: Number, default: 0 },
        HinhAnhPhienBan: String,
        PhanTramLoi: { type: Number, default: 10 },
        PhanTramGiamGia: { type: Number, default: 0 },
        GiaNhap: { type: Number, default: 0 },
        GiaBan: { type: Number, default: 0 }
    }]
});

module.exports = mongoose.model('DienThoai', dienThoaiSchema);