const mongoose = require('mongoose');

const donHangSchema = new mongoose.Schema({
    KhachHang: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan' }, // Có thể null nếu khách vãng lai
    TenNguoiNhan: String,
    SoDienThoai: String,
    DiaChiGiao: String,
    ChiTiet: [{
        SanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'DienThoai' },
        SoLuong: Number,
        GiaLucMua: Number // Phải lưu giá lúc mua, lỡ sau này điện thoại tăng/giảm giá
    }],
    TongTien: Number,
    PhuongThucThanhToan: String, // 'COD' hoặc 'VietQR'
    TrangThai: { 
        type: String, 
        default: 'Chờ xác nhận' // Các trạng thái: Chờ xác nhận, Đang giao, Hoàn thành, Đã hủy
    },
    NgayDat: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DonHang', donHangSchema);