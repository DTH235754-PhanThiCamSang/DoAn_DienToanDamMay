
const multer = require('multer');
const path = require('path');
// module.exports = router;
var express = require('express');
var router = express.Router();
var DienThoai = require('../models/dienthoai');
var HangSanXuat = require('../models/hangsanxuat');
var PhieuNhap = require('../models/phieunhap');

// 1. Xử lý hiển thị danh sách điện thoại (Trang chính)
router.get('/', async (req, res) => {
    try {
        var dienthoai = await DienThoai.find().populate('HangSanXuat');
        res.render('dienthoai', {
            title: 'Quản lý điện thoại',
            dienthoai: dienthoai,
            active: 'sanpham'
        });
    } catch (error) {
        res.send("Lỗi lấy danh sách: " + error.message);
    }
});

// 2. Lệnh HIỂN THỊ cái form 
router.get('/them', async (req, res) => {
    try {
        const hang = await HangSanXuat.find();

        // Lấy danh sách từ bảng PHIẾU NHẬP để hiện tên lên Combobox
        const dsDaNhap = await PhieuNhap.find();

        res.render('dienthoai_them', {
            title: 'Thêm điện thoại',
            hang: hang,
            dienthoai: dsDaNhap // Truyền danh sách phiếu nhập ra giao diện
        });
    } catch (error) {
        res.send("Lỗi không mở được form: " + error.message);
    }
});
// Cấu hình nơi lưu và tên file ảnh
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/') 
    },
    filename: function (req, file, cb) {
        // Đổi tên file thành thời gian hiện tại để không bị trùng tên
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
// 3. Xử lý LƯU dữ liệu khi bấm nút "Lưu sản phẩm"
router.post('/them', async (req, res) => {
    try {
        const { TenDienThoai, MaHang, GiaBan, GiaNhap, MoTa, HinhAnh } = req.body;

        const moi = new DienThoai({
            TenDT: TenDienThoai,
            HangSanXuat: MaHang,
            GiaBan: GiaBan,
            GiaNhap: GiaNhap,
            MoTa: MoTa,
            HinhAnh: HinhAnh
        });

        await moi.save();
        res.redirect('/dienthoai');
    } catch (error) {
        res.status(500).send("Không lưu được Sáng ơi: " + error.message);
    }
});

// 1. Hiển thị trang Sửa

// ==========================================
// TRANG SỬA ĐIỆN THOẠI
// ==========================================
router.get('/sua/:id', async (req, res, next) => {
    try {
        const thongTinDienThoai = await DienThoai.findById(req.params.id);
        const danhSachHang = await HangSanXuat.find();

        //gỌI  DANH SÁCH PHIẾU NHẬP Ở ĐÂY
        const danhSachPhieuNhap = await PhieuNhap.find().sort({ NgayNhap: -1 }); // Sắp xếp phiếu mới nhất lên đầu

        res.render('dienthoai_sua', {
            dt: thongTinDienThoai,
            hang: danhSachHang,
            phieunhap: danhSachPhieuNhap // 🔥 TRUYỀN QUA GIAO DIỆN
        });
    } catch (error) {
        next(error);
    }
});  

// 2. Xử lý cập nhật dữ liệu (Khi bấm nút Lưu trên form sửa)
// ==========================================
// 3. SỬA ĐIỆN THOẠI (BẢN MỚI: CÓ PHIÊN BẢN + ẢNH + PHIẾU NHẬP)
// ==========================================
router.get('/sua/:id', async (req, res, next) => {
    try {
        const thongTinDienThoai = await DienThoai.findById(req.params.id);
        const danhSachHang = await HangSanXuat.find();

        // Gọi danh sách Phiếu Nhập
        const danhSachPhieuNhap = await PhieuNhap.find().sort({ NgayNhap: -1 });

        res.render('dienthoai_sua', {
            dt: thongTinDienThoai,
            hang: danhSachHang,
            phieunhap: danhSachPhieuNhap
        });
    } catch (error) {
        next(error);
    }
});

router.post('/sua/:id', upload.single('HinhAnh'), async (req, res) => {
    try {
        const id = req.params.id;
        const { TenDT, HangSanXuat, MoTa, HinhAnhCu, PhanTramLoi_Chung, PhanTramGiam_Chung } = req.body;

        let duongDanAnhThucTe = HinhAnhCu;
        if (req.file) {
            duongDanAnhThucTe = '/uploads/' + req.file.filename;
        }

        // 3. Gom mảng các phiên bản (Bổ sung thêm req.body.Tên_Biến để chống lỗi Node.js gọt dấu ngoặc)
        const dl = req.body.PB_DungLuong || req.body['PB_DungLuong[]'] || [];
        const ms = req.body.PB_MauSac || req.body['PB_MauSac[]'] || [];
        const gn = req.body.PB_GiaNhap || req.body['PB_GiaNhap[]'] || [];
        const sl = req.body.PB_SoLuong || req.body['PB_SoLuong[]'] || []; 
        const ha = req.body.PB_HinhAnh || req.body['PB_HinhAnh[]'] || [];

        let danhSachPhienBan = [];
        const arrDL = Array.isArray(dl) ? dl : [dl];
        const arrMS = Array.isArray(ms) ? ms : [ms];
        const arrGN = Array.isArray(gn) ? gn : [gn];
        const arrSL = Array.isArray(sl) ? sl : [sl];
        const arrHA = Array.isArray(ha) ? ha : [ha];

        for (let i = 0; i < arrDL.length; i++) {
            // Chỉ lưu khi thực sự có chữ dung lượng (chống lưu dòng trống)
            if (arrDL[i] && arrDL[i].trim() !== '') { 
                let giaNhapPB = Number(arrGN[i]);
                let giaNiemYet = Math.round((giaNhapPB * (1 + Number(PhanTramLoi_Chung || 10) / 100)) / 10) * 10;
                let giaBanPB = Math.round((giaNiemYet * (1 - Number(PhanTramGiam_Chung || 0) / 100)) / 10) * 10;

                danhSachPhienBan.push({
                    DungLuong: arrDL[i],
                    MauSac: arrMS[i],
                    SoLuongTon: Number(arrSL[i]), 
                    HinhAnhPhienBan: arrHA[i],
                    GiaNhap: giaNhapPB,
                    GiaBan: giaBanPB, 
                    PhanTramLoi: Number(PhanTramLoi_Chung || 10),
                    PhanTramGiamGia: Number(PhanTramGiam_Chung || 0)
                });
            }
        }

        await DienThoai.findByIdAndUpdate(id, {
            TenDT: TenDT,
            HangSanXuat: HangSanXuat,
            MoTa: MoTa,
            HinhAnh: duongDanAnhThucTe,
            GiaNhap: danhSachPhienBan.length > 0 ? danhSachPhienBan[0].GiaNhap : 0,
            GiaBan: danhSachPhienBan.length > 0 ? danhSachPhienBan[0].GiaBan : 0,
            CacPhienBan: danhSachPhienBan
        });

        res.redirect('/dienthoai');
    } catch (error) {
        res.send("Lỗi cập nhật rồi: " + error.message);
    }
});

// Đường dẫn: /dienthoai/chitiet/:id
router.get('/chitiet/:id', async (req, res) => {
    try {
        // 1. Lấy ID từ thanh địa chỉ
        const id = req.params.id;

        // 2. Tìm điện thoại theo ID và dùng populate để lấy luôn thông tin Hãng sản xuất
        const dt = await DienThoai.findById(id).populate('HangSanXuat');

        // 3. Trả về trang giao diện chi tiết
        res.render('dienthoai_chitiet', {
            title: 'Chi tiết sản phẩm',
            dienthoai: dt
        });
    } catch (error) {
        res.status(500).send("Không tìm thấy sản phẩm: " + error.message);
    }
});
router.get('/xoa/:id', async (req, res) => {
    try {
        // Tìm và xóa điện thoại theo ID được truyền trên URL
        await DienThoai.findByIdAndDelete(req.params.id);

        // Xóa xong thì tự động quay về trang danh sách
        res.redirect('/dienthoai');
    } catch (error) {
        console.log("Lỗi khi xóa:", error);
        res.status(500).send("Có lỗi xảy ra khi xóa sản phẩm!");
    }
});
module.exports = router;