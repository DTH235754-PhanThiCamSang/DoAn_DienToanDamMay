
// 1. XỬ LÝ BIẾN THỂ & TÍNH GIÁ 

function lamTronChuc(num) {
    return Math.round(num / 10) * 10;
}

// Hàm cập nhật giao diện khi chọn màu/dung lượng
function updateProductUI() {
    const dataTag = document.getElementById('data-phienban');
    if (!dataTag) return;
    
    const cacPhienBan = JSON.parse(dataTag.textContent);
    const selectedDungLuong = document.querySelector('#dungLuongGroup .btn-primary')?.getAttribute('data-value').trim();
    const selectedMauSac = document.querySelector('#mauSacGroup .border-primary')?.getAttribute('data-value').trim();

    const phienBan = cacPhienBan.find(pb =>
        pb.DungLuong.trim() === selectedDungLuong && pb.MauSac.trim() === selectedMauSac
    );

    const priceElement = document.getElementById('hienThiGia');
    const btnMua = document.getElementById('btnMuaNgay');
    const btnThem = document.getElementById('btnThemVaoGio');

    if (phienBan) {
        // Cập nhật giá bán từ database (Không tính lại từ giá nhập để tránh sai số)
        priceElement.innerText = Number(phienBan.GiaBan).toLocaleString('vi-VN') + ' VNĐ';
        priceElement.className = "text-danger fw-bold my-3 fs-3";

        let tonKho = parseInt(phienBan.SoLuongTon) || 0;
        if (tonKho > 0) {
            btnMua.disabled = false; btnMua.innerText = "MUA NGAY";
            btnThem.disabled = false; btnThem.innerHTML = '<i class="bi bi-cart-plus"></i> THÊM VÀO GIỎ';
        } else {
            priceElement.innerText = 'Tạm hết hàng';
            btnMua.disabled = true; btnMua.innerText = "HẾT HÀNG";
            btnThem.disabled = true; btnThem.innerText = "HẾT HÀNG";
        }
    }
}

// Gán sự kiện chọn màu/dung lượng
document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const type = this.getAttribute('data-type');
        if (type === 'dungluong') {
            document.querySelectorAll('#dungLuongGroup .variant-btn').forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
            this.classList.replace('btn-outline-primary', 'btn-primary');
        } else {
            document.querySelectorAll('#mauSacGroup .variant-btn').forEach(b => b.classList.remove('border-primary', 'border-2', 'fw-bold', 'text-primary'));
            this.classList.add('border-primary', 'border-2', 'fw-bold', 'text-primary');
        }
        updateProductUI();
    });
});


// 2. XỬ LÝ GIỎ HÀNG 


// Hàm thêm vào giỏ
async function themVaoGioHang(laMuaNgay = false) {
    const btn = document.getElementById('btnThemVaoGio');
    const idDT = btn.dataset.id;
    const dungLuong = document.querySelector('#dungLuongGroup .btn-primary')?.getAttribute('data-value').trim();
    const mauSac = document.querySelector('#mauSacGroup .border-primary')?.getAttribute('data-value').trim();
    const tenDT = document.getElementById('productTitle').innerText.split('(')[0].trim();
    const hinhAnh = document.getElementById('anhChinh').src;

    // Tìm giá của phiên bản đang chọn
    const dataTag = document.getElementById('data-phienban');
    const cacPhienBan = JSON.parse(dataTag.textContent);
    const phienBan = cacPhienBan.find(pb => pb.DungLuong === dungLuong && pb.MauSac === mauSac);

    try {
        const response = await fetch('/giohang/them', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                idDT, TenDT: tenDT, DungLuong: dungLuong, MauSac: mauSac, 
                GiaBan: phienBan.GiaBan, HinhAnh: hinhAnh 
            })
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('cart-badge').innerText = data.tongSoLuong;
            if (laMuaNgay) window.location.href = '/giohang';
            else alert("Đã thêm vào giỏ hàng thành công!");
        }
    } catch (e) { alert("Lỗi kết nối giỏ hàng!"); }
}

// Hàm Cập nhật số lượng (Tăng/Giảm)
function updateQty(idDT, dl, ms, action) {
    fetch('/giohang/update-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idDT, dungluong: dl, mausac: ms, action })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) location.reload(); // Load lại để cập nhật tổng tiền chính xác
    });
}

// Hàm Xóa sản phẩm
function removeItem(idDT, dl, ms) {
    if(confirm('Sáng muốn xóa sản phẩm này khỏi giỏ?')) {
        fetch('/giohang/remove-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idDT, dungluong: dl, mausac: ms })
        })
        .then(res => res.json())
        .then(data => { if (data.success) location.reload(); });
    }
}


// 3. TÍNH TOÁN CHECKBOX & TỔNG TIỀN

function tinhToanTongTien() {
    let tong = 0;
    document.querySelectorAll('.chk-sanpham:checked').forEach(chk => {
        const gia = parseInt(chk.dataset.gia) || 0;
        const soLuong = parseInt(chk.dataset.soluong) || 0;
        tong += gia * soLuong;
    });
    
    const elTong = document.getElementById('tong-tien-hien-thi');
    if (elTong) elTong.innerText = tong.toLocaleString('vi-VN') + 'đ';
}

// Gán sự kiện checkbox
document.querySelectorAll('.chk-sanpham').forEach(chk => {
    chk.addEventListener('change', tinhToanTongTien);
});

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', () => {
    updateProductUI();
    tinhToanTongTien();
});


const nutThanhToan = document.querySelector('a[href="/thanhtoan"]');
if (nutThanhToan) {
    nutThanhToan.addEventListener('click', function(e) {
        e.preventDefault();
        const cacSanPhamDuocChon = document.querySelectorAll('.chk-sanpham:checked');
        if (cacSanPhamDuocChon.length === 0) return alert("Vui lòng chọn hàng!");

        let params = Array.from(cacSanPhamDuocChon).map(chk => {
            const row = chk.closest('.card-body');
            const btnXoa = chk.closest('.card').querySelector('button[onclick*="removeItem"]');
            const match = btnXoa.getAttribute('onclick').match(/'([^']+)'/g);
            
            // encodeURIComponent 
            const id = encodeURIComponent(match[0].replace(/'/g, ""));
            const dl = encodeURIComponent(match[1].replace(/'/g, ""));
            const ms = encodeURIComponent(match[2].replace(/'/g, ""));
            
            return `id=${id}&dl=${dl}&ms=${ms}`;
        }).join('&');

        window.location.href = `/thanhtoan?${params}`;
    });
}