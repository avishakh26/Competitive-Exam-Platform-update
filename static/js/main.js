// DSA Competitive Arena — main.js (Animated Edition)

document.addEventListener('DOMContentLoaded', function () {

    // ========================
    // Target Cursor
    // ========================
    if (typeof window.initTargetCursor === 'function') {
        window.initTargetCursor({
            targetSelector: 'a, button, input, label, select, textarea, [role="button"], .nav-link, .btn, .problem-card, .podium-card, .stat-card, .submission-card, .cursor-target',
            spinDuration: 2,
            hideDefaultCursor: true,
            hoverDuration: 0.2,
            parallaxOn: true
        });
    }

    // ========================
    // Scroll Reveal — Intersection Observer
    // ========================
    var revealEls = document.querySelectorAll('.reveal-on-scroll');
    if (revealEls.length > 0 && 'IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(function (el) { observer.observe(el); });
    }

    // ========================
    // Animated Counters
    // ========================
    var counters = document.querySelectorAll('[data-count-to]');
    counters.forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count-to'), 10);
        if (isNaN(target)) return;
        var duration = 1200;
        var start = 0;
        var startTime = null;

        function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var current = Math.floor(easeOut(progress) * target);
            el.textContent = current;
            if (progress < 1) requestAnimationFrame(animate);
            else el.textContent = target;
        }

        // Use intersection observer to trigger on visibility
        if ('IntersectionObserver' in window) {
            var counterObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        requestAnimationFrame(animate);
                        counterObs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });
            counterObs.observe(el);
        } else {
            requestAnimationFrame(animate);
        }
    });

    // ========================
    // Button Ripple Effect
    // ========================
    document.querySelectorAll('.btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            var rect = btn.getBoundingClientRect();
            var ripple = document.createElement('span');
            ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,0.25);transform:scale(0);animation:rippleAnim 0.5s ease-out forwards;pointer-events:none;';
            var size = Math.max(rect.width, rect.height) * 2;
            ripple.style.width = size + 'px';
            ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            btn.appendChild(ripple);
            setTimeout(function () { ripple.remove(); }, 550);
        });
    });

    // Add ripple keyframes
    if (!document.getElementById('ripple-style')) {
        var style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = '@keyframes rippleAnim{to{transform:scale(1);opacity:0;}}';
        document.head.appendChild(style);
    }

    // ========================
    // Auto-dismiss flash alerts after 5 seconds
    // ========================
    var alerts = document.querySelectorAll('.alert.alert-dismissible');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            var bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            bsAlert.close();
        }, 5000);
    });

    // ========================
    // Submit button loading state
    // ========================
    document.querySelectorAll('form').forEach(function (form) {
        form.addEventListener('submit', function () {
            var btn = form.querySelector('button[type="submit"]');
            if (btn && !btn.dataset.noLoading) {
                var originalHTML = btn.innerHTML;
                setTimeout(function() {
                    btn.disabled = true;
                    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Processing...';
                }, 10);
                setTimeout(function () {
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                }, 10000);
            }
        });
    });

    // ========================
    // File input label update
    // ========================
    var fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(function (input) {
        input.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                var fileName = this.files[0].name;
                var size = (this.files[0].size / 1024).toFixed(1);
                var hint = this.nextElementSibling;
                if (hint && hint.classList.contains('form-text')) {
                    hint.textContent = '\uD83D\uDCCE ' + fileName + ' (' + size + ' KB)';
                    hint.style.color = '#4ade80';
                }
            }
        });
    });

    // ========================
    // Navbar active link
    // ========================
    var currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(function (link) {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // ========================
    // Card Tilt on Mouse Move
    // ========================
    document.querySelectorAll('.problem-card, .stat-card, .podium-card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;
            var rotateX = (y - centerY) / centerY * -3;
            var rotateY = (x - centerX) / centerX * 3;
            card.style.transform = 'perspective(600px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-2px)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
        });
    });

    // ========================
    // Init Particles on Auth pages
    // ========================
    if (typeof window.initParticles === 'function') {
        var particleCanvas = document.getElementById('particleBg');
        if (particleCanvas) {
            window.initParticles('particleBg');
        }
    }

});
