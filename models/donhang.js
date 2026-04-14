const mongoose = require('mongoose');

const donHangSchema = new mongoose.Schema({
    TenNguoiNhan: String, // Khớp với EJS
    SoDienThoai: String,
    DiaChiGiao: String,
    // Đổi tên từ ChiTiet thành ChiTietDonHang để khớp với EJS
    ChiTietDonHang: [{
        TenDT: String,
        SoLuong: Number,
        MauSac: String,
        DungLuong: String,
        GiaBan: Number
    }],
    TongTien: Number,
    PhuongThucThanhToan: String,
    TrangThai: {
        type: String,
        default: 'ChoXacNhan' // Nên dùng viết liền không dấu để code xử lý dễ hơn
    },
    NgayDat: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DonHang', donHangSchema);