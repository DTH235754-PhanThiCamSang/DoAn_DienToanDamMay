const express = require('express');
const router = express.Router();
const DonHang = require('../models/donhang');
const SanPham = require('../models/dienthoai');

// Hàm bổ trợ tính giá động (để không viết code cứng)
function tinhGiaPhienBan(sp) {
    if (sp.CacPhienBan && sp.CacPhienBan.length > 0) {
        let pb = sp.CacPhienBan[0];
        let giaNiemYet = sp.GiaNhap * (1 + (pb.PhanTramLoi || 0) / 100);
        let giaSauGiam = giaNiemYet * (1 - (pb.PhanTramGiamGia || 0) / 100);
        return Math.round(giaSauGiam / 10) * 10;
    }
    return 0;
}

// 1. Route hiển thị trang thanh toán
router.get('/', (req, res) => {
    const danhSachMua = req.session.danhSachMua || [];
    const tongTien = danhSachMua.reduce((sum, item) => sum + item.ThanhTien, 0);
    
    res.render('thanhtoan', {
        title: 'Thanh toán đơn hàng',
        danhSachMua: danhSachMua,
        tongTien: tongTien,
        session: req.session
    });
});

// // 2. Route Mua Ngay (Cộng dồn sản phẩm)
// router.get('/muangay/:id', async (req, res) => {
//     try {
//         const idSanPham = req.params.id;
//         const sp = await SanPham.findById(idSanPham);
//         if (!sp) return res.status(404).send('Sản phẩm không tồn tại!');

//         const giaBan = tinhGiaPhienBan(sp);
//         let danhSachMua = req.session.danhSachMua || [];

//         // Kiểm tra xem sản phẩm đã có trong danh sách chưa
//         const index = danhSachMua.findIndex(item => item.Id == idSanPham);

//         if (index !== -1) {
//             // Nếu có rồi thì tăng số lượng
//             danhSachMua[index].SoLuong += 1;
//             danhSachMua[index].ThanhTien = danhSachMua[index].SoLuong * danhSachMua[index].Gia;
//         } else {
//             // Nếu chưa có thì thêm mới vào mảng
//             danhSachMua.push({
//                 Id: sp._id,
//                 TenDT: sp.TenDT,
//                 HinhAnh: sp.HinhAnh,
//                 Gia: giaBan,
//                 SoLuong: 1,
//                 ThanhTien: giaBan
//             });
//         }

//         req.session.danhSachMua = danhSachMua;
//         res.redirect('/thanhtoan'); // Chuyển hướng về trang thanh toán chung

//     } catch (error) {
//         res.status(500).send("Lỗi server!");
//     }
// });
router.get('/muangay/:id', async (req, res) => {
    try {
        const idSanPham = req.params.id;
        const sp = await SanPham.findById(idSanPham);
        if (!sp) return res.status(404).send('Sản phẩm không tồn tại!');

        const giaBan = tinhGiaPhienBan(sp);

        // KHÔNG DÙNG: let danhSachMua = req.session.danhSachMua || []; 
        // MÀ HÃY TẠO MỚI HOÀN TOÀN ĐỂ XÓA SẠCH ĐỒ CŨ:
        const danhSachMua = [{
            Id: sp._id,
            TenDT: sp.TenDT,
            HinhAnh: sp.HinhAnh,
            Gia: giaBan,
            SoLuong: 1,
            ThanhTien: giaBan
        }];

        // Ghi đè lại session (Xóa sạch những gì đã bấm trước đó)
        req.session.danhSachMua = danhSachMua;
        req.session.tongTien = giaBan;

        res.redirect('/thanhtoan'); 

    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi server!");
    }
});
// 3. Route Mua Ngay bên trong trang chi tiết (Cộng dồn + Theo màu/dung lượng)
// routers/thanhtoan.js

router.get('/muangay-chitiet/:id', async (req, res) => {
    try {
        const idSanPham = req.params.id;
        const { mauSac, dungLuong } = req.query; 

        const sp = await SanPham.findById(idSanPham);
        if (!sp) return res.status(404).send('Sản phẩm không tồn tại!');

        // 1. Tìm đúng phiên bản để lấy giá
        const phienBan = sp.CacPhienBan.find(p => p.MauSac === mauSac && p.DungLuong === dungLuong);
        const giaBan = phienBan ? phienBan.GiaBan : sp.GiaBan;

        // 2. BỎ CỘNG DỒN: Thay vì lấy danh sách cũ, ta tạo mới 100%
        // Mỗi lần bấm Mua Ngay, túi hàng cũ sẽ bị đổ đi, chỉ chứa món mới này
        const danhSachMua = [{
            Id: sp._id,
            TenDT: sp.TenDT,
            HinhAnh: sp.HinhAnh,
            Gia: giaBan,
            SoLuong: 1, // Luôn luôn là 1
            ThanhTien: giaBan,
            MauSac: mauSac,
            DungLuong: dungLuong
        }];

        // 3. Cập nhật lại Session (Lúc này túi chỉ có 1 món)
        req.session.danhSachMua = danhSachMua;
        req.session.tongTien = giaBan;

        // 4. Chuyển hướng về trang thanh toán
        res.redirect('/thanhtoan'); 

    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi server!");
    }
 });
// // 3. Tăng số lượng (+1)
// router.get('/tang/:id', (req, res) => {
//     let danhSachMua = req.session.danhSachMua || [];
//     const index = danhSachMua.findIndex(item => item.Id == req.params.id);
//     if (index !== -1) {
//         danhSachMua[index].SoLuong += 1;
//         danhSachMua[index].ThanhTien = danhSachMua[index].SoLuong * danhSachMua[index].Gia;
//     }
//     res.redirect('/thanhtoan');
// });

// // 4. Giảm số lượng (-1)
// router.get('/giam/:id', (req, res) => {
//     let danhSachMua = req.session.danhSachMua || [];
//     const index = danhSachMua.findIndex(item => item.Id == req.params.id);
//     if (index !== -1) {
//         danhSachMua[index].SoLuong -= 1;
//         if (danhSachMua[index].SoLuong <= 0) {
//             danhSachMua.splice(index, 1); // Xóa luôn nếu số lượng về 0
//         } else {
//             danhSachMua[index].ThanhTien = danhSachMua[index].SoLuong * danhSachMua[index].Gia;
//         }
//     }
//     res.redirect('/thanhtoan');
// });

// // 5. Xóa sản phẩm khỏi danh sách
// router.get('/xoa/:id', (req, res) => {
//     let danhSachMua = req.session.danhSachMua || [];
//     req.session.danhSachMua = danhSachMua.filter(item => item.Id != req.params.id);
//     res.redirect('/thanhtoan');
// });
// // Hàm thay đổi số lượng dùng chung
// function doiSoLuong(id, delta) {
//     // Tự động nhận diện prefix dựa trên đường dẫn hiện tại
//     const prefix = window.location.pathname.includes('thanhtoan') ? '/thanhtoan' : '/giohang';
    
//     if (delta > 0) {
//         window.location.href = `${prefix}/tang/${id}`;
//     } else {
//         window.location.href = `${prefix}/giam/${id}`;
//     }
// }
// 3. Tăng số lượng (+1)
router.get('/tang/:id', (req, res) => {
    let danhSachMua = req.session.danhSachMua || [];
    const index = danhSachMua.findIndex(item => item.Id == req.params.id);
    
    if (index !== -1) {
        danhSachMua[index].SoLuong += 1;
        danhSachMua[index].ThanhTien = danhSachMua[index].SoLuong * danhSachMua[index].Gia;
    }

    // 🔥 Cần 2 dòng này để lưu và tính lại tiền
    req.session.danhSachMua = danhSachMua;
    req.session.tongTien = danhSachMua.reduce((total, item) => total + item.ThanhTien, 0);

    res.redirect('/thanhtoan');
});

// 4. Giảm số lượng (-1)
router.get('/giam/:id', (req, res) => {
    let danhSachMua = req.session.danhSachMua || [];
    const index = danhSachMua.findIndex(item => item.Id == req.params.id);
    
    if (index !== -1) {
        if (danhSachMua[index].SoLuong > 1) {
            danhSachMua[index].SoLuong -= 1;
            danhSachMua[index].ThanhTien = danhSachMua[index].SoLuong * danhSachMua[index].Gia;
        } else {
            // Nếu bằng 1 mà bấm giảm nữa thì xóa luôn
            danhSachMua.splice(index, 1);
        }
    }

    // 🔥 Sáng đang thiếu dòng lưu này ở trong hình nè!
    req.session.danhSachMua = danhSachMua;
    req.session.tongTien = danhSachMua.reduce((total, item) => total + item.ThanhTien, 0);

    res.redirect('/thanhtoan');
});

// 5. Xóa sản phẩm
router.get('/xoa/:id', (req, res) => {
    let danhSachMua = req.session.danhSachMua || [];
    
    // Lọc bỏ sản phẩm bị xóa
    danhSachMua = danhSachMua.filter(item => item.Id != req.params.id);
    
    req.session.danhSachMua = danhSachMua;
    req.session.tongTien = danhSachMua.reduce((total, item) => total + item.ThanhTien, 0);
    
    // Nếu xóa hết sạch đồ thì cho về trang chủ luôn
    if (danhSachMua.length === 0) return res.redirect('/');
    
    res.redirect('/thanhtoan');
});
// Hàm xóa sản phẩm dùng chung
function xoaSP(id) {
    if (confirm('Sáng có chắc muốn bỏ sản phẩm này không?')) {
        const prefix = window.location.pathname.includes('thanhtoan') ? '/thanhtoan' : '/giohang';
        window.location.href = `${prefix}/xoa/${id}`;
    }
}
module.exports = router;