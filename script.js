// ===== TIMELINE SCRUBBER DATA =====
var tlData = [
  {
    date: "04/2021 — 12/2024",
    role: "Nhân Viên Kinh Doanh",
    company: "Công Ty TNHH Kinh Doanh Siêu Việt",
    bullets: [
      "Chủ động tìm kiếm, mở rộng tệp khách hàng tiềm năng qua các nền tảng mạng xã hội, e-mail,…",
      "Tư vấn bán hàng, giải đáp các thắc mắc và khiếu nại của khách hàng về sản phẩm/dịch vụ qua Zalo, Facebook, Hotline",
      "Cập nhật thông tin sản phẩm và quản lý đơn hàng trên website cùng các sàn thương mại điện tử (Shopee, Lazada)",
      "Lập báo cáo định kỳ theo tháng về doanh số bán hàng và tình hình kinh doanh",
      "Soạn thảo hợp đồng và làm báo giá cho thuê máy photocopy theo mẫu có sẵn",
      "Thiết kế hình ảnh, tem dán mừng các dịp lễ/tết và chương trình ưu đãi theo mẫu trên Canva"
    ]
  },
  {
    date: "03/2025 — 07/2025",
    role: "Nhân Viên Bán Hàng — Trực Page",
    company: "Hộ Kinh Doanh 79 Store",
    bullets: [
      "Trực page, tư vấn bán hàng, giải đáp thắc mắc và khiếu nại của khách hàng qua Facebook, Zalo",
      "Theo dõi, nhắc nhở và thu hồi công nợ đối với khách hàng mua trả góp",
      "Chăm sóc khách hàng sau bán hàng nhằm duy trì mối quan hệ và tăng tỷ lệ khách hàng quay lại"
    ]
  },
  {
    date: "08/2025 — 09/2025",
    role: "Nhân Viên Kinh Doanh (Thử Việc)",
    company: "Công ty TNHH Mr.Rin Group",
    bullets: [
      "Chăm sóc, chào hàng qua tin nhắn tệp khách hàng tiềm năng theo data công ty bàn giao",
      "Chủ động học hỏi, nắm bắt đặc tính kỹ thuật sản phẩm và nhận biết chính xác mã hàng"
    ]
  },
  {
    date: "09/2025 — 11/2025",
    role: "Nhân Viên Kinh Doanh (Thử Việc)",
    company: "Công ty TNHH TM Điện Thái Dương — Thadeco",
    bullets: [
      "Tìm kiếm và khai thác danh sách khách hàng doanh nghiệp qua Trang Vàng, Google Maps",
      "Tư vấn giải pháp sản phẩm và gửi báo giá chi tiết cho khách hàng qua Zalo"
    ]
  }
];

var tlTickLabels = ["04/2021", "03/2025", "08/2025", "09/2025"];

function tlRender(i) {
  var d = tlData[i];
  var panel = document.getElementById('tl-panel');
  if (!panel || !d) return;

  panel.style.opacity = '0';

  setTimeout(function () {
    var dateEl = document.getElementById('tl-date');
    var roleEl = document.getElementById('tl-role');
    var compEl = document.getElementById('tl-company');
    var ul = document.getElementById('tl-bullets');

    if (dateEl) dateEl.textContent = d.date;
    if (roleEl) roleEl.textContent = d.role;
    if (compEl) compEl.textContent = d.company;

    if (ul) {
      ul.innerHTML = '';
      d.bullets.forEach(function (b) {
        var li = document.createElement('li');
        li.textContent = b;
        ul.appendChild(li);
      });
    }

    panel.style.opacity = '1';
  }, 120);
}

function tlRenderTicks() {
  var wrap = document.getElementById('tl-ticks');
  if (!wrap) return;
  wrap.innerHTML = '';
  var count = tlTickLabels.length;
  var slider = document.getElementById('tl-slider');

  tlTickLabels.forEach(function (label, idx) {
    var span = document.createElement('span');
    span.textContent = label;
    span.style.left = (idx / (count - 1)) * 100 + '%';
    span.style.cursor = 'pointer';
    span.setAttribute('title', 'Xem giai đoạn ' + label);
    span.addEventListener('click', function() {
      if (slider) {
        slider.value = idx;
      }
      tlRender(idx);
    });
    wrap.appendChild(span);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var slider = document.getElementById('tl-slider');
  if (slider) {
    slider.setAttribute('max', (tlData.length - 1).toString());
    slider.value = 0;

    slider.addEventListener('input', function () {
      tlRender(parseInt(this.value, 10));
    });
  }

  tlRenderTicks();
  tlRender(0);
});
