const express = require('express');
const router = express.Router();

// Trang hiển thị Giỏ hàng
router.get('/', (req, res) => {
   
    let gioHang = req.session.gioHang || [];
    
    let tongTien = 0;
    gioHang.forEach(item => {
        item.ThanhTien = (item.GiaBan || 0) * (item.SoLuong || 1);
        tongTien += item.ThanhTien;
    });

    res.render('giohang', {
        session: req.session,
        gioHang: gioHang,
        tongTien: tongTien
    });
});

//  Thêm vào giỏ hàng (Khớp với dữ liệu từ trang Chi Tiết gửi về)
router.post('/them', (req, res) => {
    try {
        const { idDT, TenDT, DungLuong, MauSac, GiaBan, HinhAnh } = req.body;
        
        if (!req.session.gioHang) req.session.gioHang = [];
        let gioHang = req.session.gioHang;

        // Tìm xem đã có món hàng này (cùng ID, cùng Dung Lượng, cùng Màu) chưa
        let index = gioHang.findIndex(p => 
            p.idDT === idDT && 
            p.DungLuong === DungLuong && 
            p.MauSac === MauSac
        );

        if (index !== -1) {
            // Nếu có rồi thì tăng số lượng
            gioHang[index].SoLuong += 1;
        } else {
            // Nếu chưa có thì thêm mới
            gioHang.push({
                idDT: idDT,
                TenDT: TenDT,
                DungLuong: DungLuong,
                MauSac: MauSac,
                GiaBan: parseInt(GiaBan),
                HinhAnh: HinhAnh,
                SoLuong: 1
            });
        }

        // Tính tổng số lượng để cập nhật Badge trên Navbar
        let tongSoLuong = gioHang.reduce((sum, item) => sum + item.SoLuong, 0);

        res.json({ 
            success: true, 
            message: 'Đã thêm vào giỏ hàng', 
            tongSoLuong: tongSoLuong 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

//  Tăng số lượng (+1) - Cần check cả ID và Màu/Dung lượng
router.get('/tang/:idDT/:dungluong/:mausac', (req, res) => {
    let gioHang = req.session.gioHang || [];
    let item = gioHang.find(p => 
        p.idDT === req.params.idDT && 
        p.DungLuong === req.params.dungluong && 
        p.MauSac === req.params.mausac
    );
    if (item) item.SoLuong++;
    res.redirect('/giohang');
});

//  Giảm số lượng (-1)
router.get('/giam/:idDT/:dungluong/:mausac', (req, res) => {
    let gioHang = req.session.gioHang || [];
    let index = gioHang.findIndex(p => 
        p.idDT === req.params.idDT && 
        p.DungLuong === req.params.dungluong && 
        p.MauSac === req.params.mausac
    );

    if (index !== -1) {
        if (gioHang[index].SoLuong > 1) {
            gioHang[index].SoLuong--;
        } else {
            gioHang.splice(index, 1);
        }
    }
    res.redirect('/giohang');
});

//  Xóa sản phẩm
router.get('/xoa/:idDT/:dungluong/:mausac', (req, res) => {
    let gioHang = req.session.gioHang || [];
    req.session.gioHang = gioHang.filter(p => 
        !(p.idDT === req.params.idDT && p.DungLuong === req.params.dungluong && p.MauSac === req.params.mausac)
    );
    res.redirect('/giohang');
});
//  API Tăng số lượng (+1) - Trả về JSON
router.post('/update-quantity', (req, res) => {
    let { idDT, dungluong, mausac, action } = req.body;
    let gioHang = req.session.gioHang || [];
    let item = gioHang.find(p => p.idDT === idDT && p.DungLuong === dungluong && p.MauSac === mausac);

    if (item) {
        if (action === 'tang') item.SoLuong++;
        else if (action === 'giam' && item.SoLuong > 1) item.SoLuong--;
        
        let tongSoLuong = gioHang.reduce((sum, i) => sum + i.SoLuong, 0);
        let tongTien = gioHang.reduce((sum, i) => sum + (i.GiaBan * i.SoLuong), 0);
        
        return res.json({ success: true, newQty: item.SoLuong, newThanhTien: item.GiaBan * item.SoLuong, tongSoLuong, tongTien });
    }
    res.json({ success: false });
});

// 4. API Xóa sản phẩm - Trả về JSON
router.post('/remove-item', (req, res) => {
    let { idDT, dungluong, mausac } = req.body;
    let gioHang = req.session.gioHang || [];
    
    req.session.gioHang = gioHang.filter(p => 
        !(p.idDT === idDT && p.DungLuong === dungluong && p.MauSac === mausac)
    );

    let tongTien = req.session.gioHang.reduce((sum, i) => sum + (i.GiaBan * i.SoLuong), 0);
    let tongSoLuong = req.session.gioHang.reduce((sum, i) => sum + i.SoLuong, 0);
    
    res.json({ success: true, tongTien, tongSoLuong });
});
module.exports = router;