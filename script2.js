// ===== TIMELINE SCRUBBER DATA (STYLE 2) =====
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

// ===== AUTO-PLAY CONFIGURATION & STATE =====
var AUTO_PLAY_INTERVAL = 7500; // 7.5 giây chuyển mốc tiếp theo
var RESUME_DELAY = 10000;      // 10 giây chờ sau khi ngừng tương tác để tự chạy lại

var currentTlIndex = 0;
var isAutoPlayEnabled = true;  // Trạng thái bật/tắt thủ công qua nút Play/Pause
var isInteracting = false;      // Đang hover hoặc đang kéo slider
var autoPlayTimer = null;
var resumeTimer = null;

function tlRender(i) {
  var d = tlData[i];
  var panel = document.getElementById('tl-panel');
  if (!panel || !d) return;

  panel.style.opacity = '0';
  panel.style.transform = 'translateY(4px)';

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
    panel.style.transform = 'translateY(0)';
  }, 120);
}

function updateActiveTick(activeIdx) {
  var ticks = document.querySelectorAll('#tl-ticks span');
  ticks.forEach(function (tick, idx) {
    if (idx === activeIdx) {
      tick.classList.add('active');
    } else {
      tick.classList.remove('active');
    }
  });
}

function setTimelineIndex(idx) {
  currentTlIndex = idx;
  var slider = document.getElementById('tl-slider');
  if (slider && parseInt(slider.value, 10) !== idx) {
    slider.value = idx;
  }
  tlRender(idx);
  updateActiveTick(idx);
}

function updatePlayButtonUI() {
  var btn = document.getElementById('tl-play-btn');
  if (!btn) return;

  if (isAutoPlayEnabled) {
    btn.textContent = '⏸';
    btn.classList.remove('is-paused');
    btn.setAttribute('aria-label', 'Tạm dừng tự động chạy timeline');
    btn.setAttribute('title', 'Tạm dừng tự động chạy (Auto-play: BẬT)');
  } else {
    btn.textContent = '▶';
    btn.classList.add('is-paused');
    btn.setAttribute('aria-label', 'Bật tự động chạy timeline');
    btn.setAttribute('title', 'Bật tự động chạy timeline (Auto-play: TẮT)');
  }
}

function clearAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
}

function clearResume() {
  if (resumeTimer) {
    clearTimeout(resumeTimer);
    resumeTimer = null;
  }
}

function startAutoPlay() {
  clearAutoPlay();
  if (!isAutoPlayEnabled || isInteracting) return;

  autoPlayTimer = setInterval(function () {
    var nextIndex = (currentTlIndex + 1) % tlData.length;
    setTimelineIndex(nextIndex);
  }, AUTO_PLAY_INTERVAL);
}

function pauseAutoPlay(scheduleResume) {
  clearAutoPlay();
  clearResume();

  if (scheduleResume && isAutoPlayEnabled) {
    resumeTimer = setTimeout(function () {
      if (isAutoPlayEnabled && !isInteracting) {
        startAutoPlay();
      }
    }, RESUME_DELAY);
  }
}

function toggleAutoPlayManual() {
  isAutoPlayEnabled = !isAutoPlayEnabled;
  updatePlayButtonUI();

  if (isAutoPlayEnabled) {
    isInteracting = false;
    clearResume();
    startAutoPlay();
  } else {
    clearResume();
    clearAutoPlay();
  }
}

function tlRenderTicks() {
  var wrap = document.getElementById('tl-ticks');
  if (!wrap) return;
  wrap.innerHTML = '';
  var count = tlTickLabels.length;

  tlTickLabels.forEach(function (label, idx) {
    var span = document.createElement('span');
    span.textContent = label;
    span.style.left = (idx / (count - 1)) * 100 + '%';
    span.style.cursor = 'pointer';
    span.setAttribute('title', 'Xem giai đoạn ' + label);
    if (idx === currentTlIndex) span.classList.add('active');

    span.addEventListener('click', function () {
      setTimelineIndex(idx);
      pauseAutoPlay(true);
    });

    wrap.appendChild(span);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var slider = document.getElementById('tl-slider');
  var panel = document.getElementById('tl-panel');
  var playBtn = document.getElementById('tl-play-btn');
  var controlsRow = document.querySelector('.tl-controls-row');

  if (slider) {
    slider.setAttribute('max', (tlData.length - 1).toString());
    slider.value = 0;

    // User kéo hoặc thay đổi slider
    slider.addEventListener('input', function () {
      var val = parseInt(this.value, 10);
      currentTlIndex = val;
      tlRender(val);
      updateActiveTick(val);
    });

    slider.addEventListener('mousedown', function () {
      isInteracting = true;
      pauseAutoPlay(false);
    });

    slider.addEventListener('touchstart', function () {
      isInteracting = true;
      pauseAutoPlay(false);
    }, { passive: true });

    slider.addEventListener('mouseenter', function () {
      isInteracting = true;
      pauseAutoPlay(false);
    });

    slider.addEventListener('mouseleave', function () {
      isInteracting = false;
      pauseAutoPlay(true);
    });
  }

  // Tương tác trên khu vực panel
  if (panel) {
    panel.addEventListener('mouseenter', function () {
      isInteracting = true;
      pauseAutoPlay(false);
    });

    panel.addEventListener('mouseleave', function () {
      isInteracting = false;
      pauseAutoPlay(true);
    });
  }

  // Tương tác trên khu vực controls row (slider + ticks)
  if (controlsRow) {
    controlsRow.addEventListener('mouseenter', function () {
      isInteracting = true;
      pauseAutoPlay(false);
    });

    controlsRow.addEventListener('mouseleave', function () {
      isInteracting = false;
      pauseAutoPlay(true);
    });
  }

  // Bắt sự kiện thả chuột / kết thúc chạm trên toàn trang khi đang kéo slider
  window.addEventListener('mouseup', function () {
    if (isInteracting) {
      isInteracting = false;
      pauseAutoPlay(true);
    }
  });

  window.addEventListener('touchend', function () {
    if (isInteracting) {
      isInteracting = false;
      pauseAutoPlay(true);
    }
  });

  // Nút Play / Pause thủ công
  if (playBtn) {
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleAutoPlayManual();
    });
    updatePlayButtonUI();
  }

  tlRenderTicks();
  setTimelineIndex(0);

  // Bắt đầu chu trình tự động chạy
  startAutoPlay();
});

