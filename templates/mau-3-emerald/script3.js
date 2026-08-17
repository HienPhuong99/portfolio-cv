/**
 * STYLE 3 — EMERALD EXECUTIVE BENTO JAVASCRIPT
 * Hiền Phương — Nhân Viên Kinh Doanh Portfolio & CV
 */

document.addEventListener('DOMContentLoaded', function () {
  
  // 1. Toast Notification Helper
  var toastEl = document.getElementById('toastNotify');
  var toastMsgEl = document.getElementById('toastMsg');
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    if (toastMsgEl) toastMsgEl.textContent = message;
    
    toastEl.classList.add('show');
    
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2800);
  }

  // 2. Copy Contact Pills
  var copyButtons = document.querySelectorAll('.copy-pill');
  copyButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var textToCopy = this.getAttribute('data-copy');
      if (!textToCopy) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(function () {
          showToast('Đã sao chép: ' + textToCopy);
        }).catch(function () {
          fallbackCopyText(textToCopy);
        });
      } else {
        fallbackCopyText(textToCopy);
      }
    });
  });

  function fallbackCopyText(text) {
    var tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast('Đã sao chép: ' + text);
    } catch (err) {
      showToast('Không thể tự động sao chép');
    }
    document.body.removeChild(tempInput);
  }

  // 3. Experience Filter Tabs
  var tabButtons = document.querySelectorAll('.tab-btn');
  var expCards = document.querySelectorAll('.exp-item-card');

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filterValue = this.getAttribute('data-filter');

      // Update active tab button
      tabButtons.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      // Filter cards
      expCards.forEach(function (card) {
        var category = card.getAttribute('data-category') || '';
        if (filterValue === 'all' || category.indexOf(filterValue) !== -1) {
          card.classList.remove('is-hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(8px)';
          setTimeout(function () {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  });

  // 4. Print / PDF Button
  var printBtn = document.getElementById('btnPrintCV');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  // 5. Sticky Navigation Scroll Indicator
  var topNav = document.getElementById('topNav');
  window.addEventListener('scroll', function () {
    if (!topNav) return;
    if (window.scrollY > 40) {
      topNav.classList.add('is-scrolled');
    } else {
      topNav.classList.remove('is-scrolled');
    }
  }, { passive: true });

  // 6. Active Nav Link on Scroll
  var sections = document.querySelectorAll('section[id], article[id]');
  var navLinks = document.querySelectorAll('.nav-links .nav-item');

  function highlightNavOnScroll() {
    var scrollPos = window.scrollY + 120;
    sections.forEach(function (section) {
      var id = section.getAttribute('id');
      var top = section.offsetTop;
      var height = section.offsetHeight;

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNavOnScroll, { passive: true });

});
