const express = require('express');
const fs = require('fs');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const DienThoai = require('../models/dienthoai');
const HangSanXuat = require('../models/hangsanxuat');
const PhieuNhap = require('../models/phieunhap');

// Tạo thư mục uploads nếu chưa có
const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer lưu ảnh
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/') 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 1. TRANG DANH SÁCH SẢN PHẨM
router.get('/', async (req, res) => {
    try {
        const dienthoai = await DienThoai.find().populate('HangSanXuat');
        res.render('dienthoai', {
            title: 'Quản lý điện thoại',
            dienthoai: dienthoai,
            active: 'sanpham'
        });
    } catch (error) {
        res.send("Lỗi lấy danh sách: " + error.message);
    }
});

// 2. HIỂN THỊ FORM THÊM MỚI (Hợp nhất dữ liệu)
router.get('/them', async (req, res) => {
    try {
        const hang = await HangSanXuat.find();
        // Lấy danh sách tên máy từ phiếu nhập (không trùng lặp)
        const dsDaNhap = await PhieuNhap.distinct("TenDienThoai"); 

        res.render('dienthoai_them', {
            title: 'Thêm điện thoại mới',
            hang: hang,
            dsMayTrongKho: dsDaNhap // 🔥 Đặt tên đúng để khớp với EJS
        });
    } catch (error) {
        res.send("Lỗi không mở được form: " + error.message);
    }
});

// 3. XỬ LÝ LƯU SẢN PHẨM MỚI
router.post('/them', upload.single('HinhAnh'), async (req, res) => {
    try {
        const { 
            TenDT, HangSanXuat, PhanTramLoi, PhanTramGiamGia, MoTa,
            DungLuong, MauSac, SoLuongTon, GiaNhap 
        } = req.body;

        const HinhAnhChinh = req.file ? '/uploads/' + req.file.filename : '';

        // Chuyển dữ liệu về mảng để xử lý nhiều phiên bản
        const dls = Array.isArray(DungLuong) ? DungLuong : [DungLuong];
        const mss = Array.isArray(MauSac) ? MauSac : [MauSac];
        const sls = Array.isArray(SoLuongTon) ? SoLuongTon : [SoLuongTon];
        const gns = Array.isArray(GiaNhap) ? GiaNhap : [GiaNhap];

        let danhSachPhienBan = [];
        let ptLoi = parseFloat(PhanTramLoi || 0);
        let ptGiam = parseFloat(PhanTramGiamGia || 0);

        for (let i = 0; i < dls.length; i++) {
            if (dls[i] && mss[i]) { 
                let giaN = parseInt(gns[i] || 0);
                let giaNiemYet = giaN * (1 + (ptLoi / 100));
                let giaB = giaNiemYet * (1 - (ptGiam / 100));
                giaB = Math.round(giaB / 10) * 10; 

                danhSachPhienBan.push({
                    DungLuong: dls[i],
                    MauSac: mss[i],
                    SoLuongTon: parseInt(sls[i] || 0),
                    HinhAnh: HinhAnhChinh, 
                    GiaNhap: giaN,
                    GiaBan: giaB,
                    PhanTramLoi: ptLoi,
                    PhanTramGiamGia: ptGiam
                });
            }
        }

        let giaBanChinh = danhSachPhienBan.length > 0 ? danhSachPhienBan[0].GiaBan : 0;
        let giaNhapChinh = danhSachPhienBan.length > 0 ? danhSachPhienBan[0].GiaNhap : 0;

        const spMoi = new DienThoai({
            TenDT,
            HangSanXuat,
            HinhAnh: HinhAnhChinh,
            MoTa,
            GiaBan: giaBanChinh,   
            GiaNhap: giaNhapChinh, 
            CacPhienBan: danhSachPhienBan
        });

        await spMoi.save();
        res.redirect('/dienthoai');
    } catch (error) {
        res.status(500).send("Lỗi thêm sản phẩm: " + error.message);
    }
});

// 4. HIỂN THỊ FORM SỬA
router.get('/sua/:id', async (req, res, next) => {
    try {
        const thongTinDienThoai = await DienThoai.findById(req.params.id);
        const danhSachHang = await HangSanXuat.find();
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

// 5. XỬ LÝ CẬP NHẬT (SỬA)
router.post('/sua/:id', upload.single('HinhAnh'), async (req, res) => {
    try {
        const id = req.params.id;
        const { TenDT, HangSanXuat, MoTa, HinhAnhCu, PhanTramLoi_Chung, PhanTramGiam_Chung } = req.body;

        let duongDanAnhThucTe = req.file ? '/uploads/' + req.file.filename : HinhAnhCu;

        const dl = req.body.PB_DungLuong || req.body['PB_DungLuong[]'] || [];
        const ms = req.body.PB_MauSac || req.body['PB_MauSac[]'] || [];
        const gn = req.body.PB_GiaNhap || req.body['PB_GiaNhap[]'] || [];
        const sl = req.body.PB_SoLuong || req.body['PB_SoLuong[]'] || []; 

        let danhSachPhienBan = [];
        const arrDL = Array.isArray(dl) ? dl : [dl];
        const arrMS = Array.isArray(ms) ? ms : [ms];
        const arrGN = Array.isArray(gn) ? gn : [gn];
        const arrSL = Array.isArray(sl) ? sl : [sl];

        for (let i = 0; i < arrDL.length; i++) {
            if (arrDL[i] && arrDL[i].trim() !== '') { 
                let giaNhapPB = Number(arrGN[i]);
                let giaNiemYet = Math.round((giaNhapPB * (1 + Number(PhanTramLoi_Chung || 10) / 100)) / 10) * 10;
                let giaBanPB = Math.round((giaNiemYet * (1 - Number(PhanTramGiam_Chung || 0) / 100)) / 10) * 10;

                danhSachPhienBan.push({
                    DungLuong: arrDL[i],
                    MauSac: arrMS[i],
                    SoLuongTon: Number(arrSL[i]), 
                    GiaNhap: giaNhapPB,
                    GiaBan: giaBanPB, 
                    PhanTramLoi: Number(PhanTramLoi_Chung || 10),
                    PhanTramGiamGia: Number(PhanTramGiam_Chung || 0)
                });
            }
        }

        await DienThoai.findByIdAndUpdate(id, {
            TenDT,
            HangSanXuat,
            MoTa,
            HinhAnh: duongDanAnhThucTe,
            GiaNhap: danhSachPhienBan.length > 0 ? danhSachPhienBan[0].GiaNhap : 0,
            GiaBan: danhSachPhienBan.length > 0 ? danhSachPhienBan[0].GiaBan : 0,
            CacPhienBan: danhSachPhienBan
        });

        res.redirect('/dienthoai');
    } catch (error) {
        res.send("Lỗi cập nhật: " + error.message);
    }
});

// 6. CHI TIẾT VÀ 7. XÓA (Giữ nguyên logic của Sáng)
router.get('/chitiet/:id', async (req, res) => {
    try {
        const dt = await DienThoai.findById(req.params.id).populate('HangSanXuat');
        res.render('dienthoai_chitiet', { title: 'Chi tiết sản phẩm', dienthoai: dt });
    } catch (error) { res.status(500).send("Lỗi: " + error.message); }
});

router.get('/xoa/:id', async (req, res) => {
    try {
        await DienThoai.findByIdAndDelete(req.params.id);
        res.redirect('/dienthoai');
    } catch (error) { res.status(500).send("Lỗi khi xóa!"); }
});

module.exports = router;