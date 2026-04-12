var mongoose = require('mongoose');

var hangSanXuatSchema = new mongoose.Schema({
    TenHang: { type: String, unique: true, required: true }
});

module.exports = mongoose.model('HangSanXuat', hangSanXuatSchema);