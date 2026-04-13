console.log("🚀 File script.js đã được tải thành công!");

// Lấy dữ liệu từ thẻ script trung gian (Phải khớp với tên biến Sáng đặt trong EJS)
const giaNhap = typeof SP_GIA_NHAP !== 'undefined' ? SP_GIA_NHAP : 0;
const tenGoc = typeof SP_TEN_GOC !== 'undefined' ? SP_TEN_GOC : "";

// ==========================================
// 1. XỬ LÝ GẬP/MỞ MÔ TẢ
// ==========================================
const btnToggle = document.getElementById('btnToggleDesc');
if (btnToggle) {
    btnToggle.addEventListener('click', function () {
        const desc = document.getElementById('descriptionContent');
        if (desc.classList.contains('description-collapsed')) {
            desc.classList.replace('description-collapsed', 'description-expanded');
            this.innerText = 'Thu gọn ▲';
        } else {
            desc.classList.replace('description-expanded', 'description-collapsed');
            this.innerText = 'Xem thêm ▼';
        }
    });
}

// ==========================================
// 2. XỬ LÝ BIẾN THỂ & TÍNH GIÁ
// ==========================================
const dataTag = document.getElementById('data-phienban');
const cacPhienBan = dataTag ? JSON.parse(dataTag.textContent) : [];

let selectedDungLuong = "";
let selectedMauSac = "";
let idPhienBanHienTai = "";

function lamTronChuc(num) {
    return Math.round(num / 10) * 10;
}

if (cacPhienBan.length > 0) {
    // Lấy giá trị mặc định từ các nút đang active
    const activeDL = document.querySelector('#dungLuongGroup .variant-btn.btn-primary');
    const activeMS = document.querySelector('#mauSacGroup .variant-btn.border-primary');
    
    if(activeDL) selectedDungLuong = activeDL.getAttribute('data-value').trim();
    if(activeMS) selectedMauSac = activeMS.getAttribute('data-value').trim();

    function updateUI() {
        const phienBan = cacPhienBan.find(pb =>
            pb.DungLuong.trim() === selectedDungLuong && pb.MauSac.trim() === selectedMauSac
        );

        const titleElement = document.getElementById('productTitle');
        const priceElement = document.getElementById('hienThiGia');
        const giaGocArea = document.getElementById('giaGocArea');
        const btnMua = document.getElementById('btnMuaNgay');
        const btnThem = document.getElementById('btnThemVaoGio');

        if (phienBan) {
            // Đổi tên và tính giá 
            titleElement.innerText = `${tenGoc} ${selectedDungLuong} - ${selectedMauSac}`;
            
            let phanTramLoi = phienBan.PhanTramLoi || 0;
            let giaNiemYet = lamTronChuc(giaNhap * (1 + phanTramLoi / 100));
            let phanTramGiam = phienBan.PhanTramGiamGia || 0;
            let giaCuoi = lamTronChuc(giaNiemYet * (1 - phanTramGiam / 100));

            priceElement.innerText = giaCuoi.toLocaleString('vi-VN') + ' VNĐ';
            priceElement.className = "text-danger fw-bold my-3";

            // KIỂM TRA SỐ LƯỢNG TỒN ĐỂ BẬT/TẮT NÚT
            
            let tonKho = phienBan.SoLuongTon || phienBan.SoLuong || 0;

            if (tonKho > 0) {
                // CÒN HÀNG: 
                btnMua.disabled = false; 
                btnMua.innerText = "MUA NGAY";
                btnThem.disabled = false;
                btnThem.innerHTML = '<i class="bi bi-cart-plus"></i> THÊM VÀO GIỎ HÀNG';
                idPhienBanHienTai = phienBan._id;
            } else {
                // NẾU HẾT HÀNG (Số lượng <= 0): Đổi chữ, tắt nút
                priceElement.innerText = 'Tạm hết hàng';
                priceElement.className = "text-muted my-3";
                
                btnMua.disabled = true; 
                btnMua.innerText = "HẾT HÀNG";
                
                btnThem.disabled = true;
                btnThem.innerText = "HẾT HÀNG";
                
                idPhienBanHienTai = "";
            }
        } else {
            // Trường hợp không tìm thấy phiên bản khớp
            titleElement.innerText = tenGoc;
            priceElement.innerText = 'Liên Hệ Đặt Hàng: 1900 1246';
            btnMua.disabled = true;
            btnThem.disabled = true;
            idPhienBanHienTai = "";
        }
    }

    document.querySelectorAll('.variant-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.getAttribute('data-type');
            if (type === 'dungluong') {
                document.querySelectorAll('#dungLuongGroup .variant-btn').forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
                this.classList.replace('btn-outline-primary', 'btn-primary');
                selectedDungLuong = this.getAttribute('data-value').trim();
            } else {
                document.querySelectorAll('#mauSacGroup .variant-btn').forEach(b => b.classList.remove('border-primary', 'border-2', 'fw-bold', 'text-primary'));
                this.classList.add('border-primary', 'border-2', 'fw-bold', 'text-primary');
                selectedMauSac = this.getAttribute('data-value').trim();
            }
            updateUI();
        });
    });
    updateUI();
}
// Hàm tính lại tổng tiền dựa trên các sản phẩm được tích chọn
function tinhLaiTongTien() {
    let tong = 0;
    // Tìm tất cả các ô checkbox đang ĐƯỢC TÍCH
    const checkboxes = document.querySelectorAll('.chk-sanpham:checked');
    
    checkboxes.forEach(chk => {
        const gia = parseInt(chk.dataset.gia) || 0;
        const soLuong = parseInt(chk.dataset.soluong) || 0;
        tong += gia * soLuong;
    });

    // Cập nhật con số hiển thị lên giao diện (Sáng nhớ kiểm tra ID của thẻ hiện tiền nhé)
    const elementTongTien = document.getElementById('tong-tien-hien-thi');
    const elementTamTinh = document.getElementById('tam-tinh-hien-thi');
    
    if (elementTongTien) elementTongTien.innerText = tong.toLocaleString('vi-VN') + 'đ';
    if (elementTamTinh) elementTamTinh.innerText = tong.toLocaleString('vi-VN') + 'đ';
}

// Gán sự kiện Click cho tất cả các checkbox
document.querySelectorAll('.chk-sanpham').forEach(chk => {
    chk.addEventListener('change', tinhLaiTongTien);
});
// ==========================================
// 3. XỬ LÝ GIỎ HÀNG & MUA NGAY
// ==========================================
// public/script.js

async function themVaoGioHang() {
    // 1. Lấy ID sản phẩm
    const idSanPham = document.getElementById('btnThemVaoGio').dataset.id;
    
    // 2. Lấy Dung lượng và Màu sắc đang được chọn (active)
    const dungLuong = document.querySelector('#dungLuongGroup .btn-primary')?.innerText.trim();
    const mauSac = document.querySelector('#mauSacGroup .border-primary')?.innerText.trim();
    
    // 3. Kiểm tra xem có đang bị báo "Tạm hết hàng" không
    const textGia = document.getElementById('hienThiGia').innerText;
    if (textGia.includes("Tạm hết hàng")) {
        alert("Sản phẩm phiên bản này hiện đang hết hàng, vui lòng chọn mẫu khác!");
        return;
    }

    try {
        const response = await fetch('/giohang/them', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                idSanPham: idSanPham, 
                soLuong: 1, 
                mauSac: mauSac, 
                dungLuong: dungLuong 
            })
        });

        const data = await response.json();

        if (data.success) {
            alert( data.message + " Thành Công.");
            // Cập nhật số trên icon giỏ hàng nếu cần
            if(document.getElementById('cart-count')) {
                document.getElementById('cart-count').innerText = data.tongSoSP;
            }
            location.reload(); // Load lại để cập nhật màu sắc/giá mới nhất
        } else {
            alert("Lỗi: " + data.message);
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Có lỗi kết nối, vui lòng thử lại sau!");
    }
}

// Đừng quên gán sự kiện cho nút bấm
document.getElementById('btnThemVaoGio').addEventListener('click', themVaoGioHang);
// ==========================================
// 4. CÁC HÀM TẠI TRANG GIỎ HÀNG / THANH TOÁN
// ==========================================

// Thay đổi số lượng (Dùng cho cả Giỏ hàng và Thanh toán)
function doiSoLuong(id, delta) {
    // Sáng nên dùng link trực tiếp để khớp với Router đã viết
    const prefix = window.location.pathname.includes('thanhtoan') ? '/thanhtoan' : '/giohang';
    if (delta > 0) window.location.href = `${prefix}/tang/${id}`;
    else window.location.href = `${prefix}/giam/${id}`;
}

// Xóa sản phẩm
function xoaSP(id) {
    if (confirm('Bạn muốn xóa sản phẩm này?')) {
        const prefix = window.location.pathname.includes('thanhtoan') ? '/thanhtoan' : '/giohang';
        window.location.href = `${prefix}/xoa/${id}`;
    }
}

// Tính lại tiền khi tích chọn Checkbox (Trang giỏ hàng)
const checkBoxes = document.querySelectorAll('.chk-sanpham');
const hienThiTong = document.getElementById('tong-tien-hien-thi');

if (checkBoxes.length > 0 && hienThiTong) {
    checkBoxes.forEach(chk => {
        chk.addEventListener('change', () => {
            let tong = 0;
            document.querySelectorAll('.chk-sanpham:checked').forEach(c => {
                tong += parseInt(c.dataset.gia) * parseInt(c.dataset.soluong);
            });
            hienThiTong.innerText = tong.toLocaleString('vi-VN') + 'đ';
        });
    });
}
// 1. Hàm tính toán và cập nhật tiền khi tích chọn
function capNhatTongTien() {
    let tong = 0;
    // Tìm tất cả các ô checkbox đang ĐƯỢC TÍCH (checked)
    const cacSanPhamDuocChon = document.querySelectorAll('.chk-sanpham:checked');

    cacSanPhamDuocChon.forEach(checkbox => {
        // Lấy giá và số lượng từ thuộc tính data- đã đặt ở EJS
        const gia = parseInt(checkbox.dataset.gia) || 0;
        const soLuong = parseInt(checkbox.dataset.soluong) || 0;
        tong += gia * soLuong;
    });

    // Định dạng lại tiền kiểu 1.000.000đ
    const chuoiTien = tong.toLocaleString('vi-VN') + 'đ';

    // Đẩy con số mới lên màn hình
    const elTamTinh = document.getElementById('tam-tinh-hien-thi');
    const elTongTien = document.getElementById('tong-tien-hien-thi');

    if (elTamTinh) elTamTinh.innerText = chuoiTien;
    if (elTongTien) elTongTien.innerText = chuoiTien;
}

// 2. Lắng nghe sự kiện click vào các ô Checkbox
document.querySelectorAll('.chk-sanpham').forEach(item => {
    item.addEventListener('change', capNhatTongTien);
});

// 3. Xử lý nút "TIẾN HÀNH THANH TOÁN"
// Chặn không cho đi tiếp nếu không chọn cái máy nào
const nutThanhToan = document.querySelector('a[href="/thanhtoan"]');
if (nutThanhToan) {
    nutThanhToan.addEventListener('click', function(e) {
        const soLuongChon = document.querySelectorAll('.chk-sanpham:checked').length;
        if (soLuongChon === 0) {
            e.preventDefault(); // Phanh trình duyệt lại, không cho nhảy sang trang thanhtoan
            alert("Sáng ơi, vui lòng tích chọn ít nhất 1 sản phẩm để thanh toán nhé!");
        }
    });
}
// Xử lý nút MUA NGAY(trong chi)
const btnMuaNgay = document.getElementById('btnMuaNgay');
if (btnMuaNgay) {
    btnMuaNgay.addEventListener('click', function() {
        const idSanPham = this.dataset.id;
        
        // 1. Kiểm tra xem có đang bị "Tạm hết hàng" không
        const textGia = document.getElementById('hienThiGia').innerText;
        if (textGia.includes("Tạm hết hàng")) {
            alert("❌ Sáng ơi, mẫu này hiện đang hết hàng rồi, chọn mẫu khác nhé!");
            return;
        }

        // 2. Lấy màu sắc và dung lượng khách đang chọn
        const dungLuong = document.querySelector('#dungLuongGroup .btn-primary')?.innerText.trim();
        const mauSac = document.querySelector('#mauSacGroup .border-primary')?.innerText.trim();

        // 3. Chuyển hướng đến trang thanh toán kèm thông tin màu/dung lượng (Dùng Query String)
        window.location.href = `/thanhtoan/muangay/${idSanPham}?mauSac=${mauSac}&dungLuong=${dungLuong}`;
    });
}