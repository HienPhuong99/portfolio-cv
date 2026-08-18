/**
 * STYLE 4 — MODERN DARK DEVELOPER PORTFOLIO & CV JAVASCRIPT
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

  // 2. Copy Contact Button
  var copyButtons = document.querySelectorAll('[data-copy]');
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
      showToast('Không thể sao chép tự động');
    }
    document.body.removeChild(tempInput);
  }

  // 3. Print / PDF Button
  var printBtn = document.getElementById('btnPrintCV');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  // 4. Sticky Header Blur on Scroll
  var navbar = document.getElementById('mainNav');
  window.addEventListener('scroll', function () {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // 5. Active Nav Link on Scroll
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-link-item');

  function highlightNavOnScroll() {
    var scrollPos = window.scrollY + 140;
    sections.forEach(function (section) {
      var id = section.getAttribute('id');
      var top = section.offsetTop;
      var height = section.offsetHeight;

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active-nav');
          } else {
            link.classList.remove('active-nav');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNavOnScroll, { passive: true });

  // 6. Mobile Menu Toggle
  var mobileMenuBtn = document.getElementById('mobileMenuBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function () {
      var isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu on clicking any link
    var mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

});
