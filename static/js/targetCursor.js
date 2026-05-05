(function () {
    function detectMobile() {
        var hasWindow = typeof window !== 'undefined';
        if (!hasWindow) return false;

        var hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        var isSmallScreen = window.innerWidth <= 768;
        var userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
        var mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        var isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());

        return (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
    }

    function initTargetCursor(config) {
        var opts = Object.assign(
            {
                targetSelector: '.cursor-target',
                spinDuration: 2,
                hideDefaultCursor: true,
                hoverDuration: 0.2,
                parallaxOn: true
            },
            config || {}
        );

        if (!window.gsap || detectMobile()) {
            return null;
        }

        if (typeof window.__targetCursorCleanup === 'function') {
            window.__targetCursorCleanup();
        }

        var constants = {
            borderWidth: 3,
            cornerSize: 12
        };

        var cursor = document.createElement('div');
        cursor.className = 'target-cursor-wrapper';
        cursor.innerHTML =
            '<div class="target-cursor-dot"></div>' +
            '<div class="target-cursor-corner corner-tl"></div>' +
            '<div class="target-cursor-corner corner-tr"></div>' +
            '<div class="target-cursor-corner corner-br"></div>' +
            '<div class="target-cursor-corner corner-bl"></div>';

        document.body.appendChild(cursor);

        var dot = cursor.querySelector('.target-cursor-dot');
        var corners = cursor.querySelectorAll('.target-cursor-corner');

        var spinTl = null;
        var activeTarget = null;
        var currentLeaveHandler = null;
        var resumeTimeout = null;
        var targetCornerPositions = null;
        var activeStrength = { current: 0 };

        var originalCursor = document.body.style.cursor;
        if (opts.hideDefaultCursor) {
            document.body.style.cursor = 'none';
        }

        gsap.set(cursor, {
            xPercent: -50,
            yPercent: -50,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });

        function createSpinTimeline() {
            if (spinTl) {
                spinTl.kill();
            }
            spinTl = gsap.timeline({ repeat: -1 }).to(cursor, {
                rotation: '+=360',
                duration: opts.spinDuration,
                ease: 'none'
            });
        }

        createSpinTimeline();

        function cleanupTarget(target) {
            if (currentLeaveHandler) {
                target.removeEventListener('mouseleave', currentLeaveHandler);
            }
            currentLeaveHandler = null;
        }

        function moveCursor(x, y) {
            gsap.to(cursor, {
                x: x,
                y: y,
                duration: 0.1,
                ease: 'power3.out'
            });
        }

        function tickerFn() {
            if (!targetCornerPositions) return;
            if (!cursor || !corners || activeStrength.current === 0) return;

            var cursorX = gsap.getProperty(cursor, 'x');
            var cursorY = gsap.getProperty(cursor, 'y');

            Array.prototype.forEach.call(corners, function (corner, i) {
                var currentX = gsap.getProperty(corner, 'x');
                var currentY = gsap.getProperty(corner, 'y');

                var targetX = targetCornerPositions[i].x - cursorX;
                var targetY = targetCornerPositions[i].y - cursorY;

                var finalX = currentX + (targetX - currentX) * activeStrength.current;
                var finalY = currentY + (targetY - currentY) * activeStrength.current;

                var duration = activeStrength.current >= 0.99 ? (opts.parallaxOn ? 0.2 : 0) : 0.05;

                gsap.to(corner, {
                    x: finalX,
                    y: finalY,
                    duration: duration,
                    ease: duration === 0 ? 'none' : 'power1.out',
                    overwrite: 'auto'
                });
            });
        }

        function moveHandler(e) {
            moveCursor(e.clientX, e.clientY);
        }

        function scrollHandler() {
            if (!activeTarget) return;

            var mouseX = gsap.getProperty(cursor, 'x');
            var mouseY = gsap.getProperty(cursor, 'y');
            var elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
            var isStillOverTarget =
                elementUnderMouse &&
                (elementUnderMouse === activeTarget || elementUnderMouse.closest(opts.targetSelector) === activeTarget);

            if (!isStillOverTarget && currentLeaveHandler) {
                currentLeaveHandler();
            }
        }

        function mouseDownHandler() {
            gsap.to(dot, { scale: 0.7, duration: 0.3 });
            gsap.to(cursor, { scale: 0.9, duration: 0.2 });
        }

        function mouseUpHandler() {
            gsap.to(dot, { scale: 1, duration: 0.3 });
            gsap.to(cursor, { scale: 1, duration: 0.2 });
        }

        function enterHandler(e) {
            var directTarget = e.target;
            var allTargets = [];
            var current = directTarget;

            while (current && current !== document.body) {
                if (current.matches && current.matches(opts.targetSelector)) {
                    allTargets.push(current);
                }
                current = current.parentElement;
            }

            var target = allTargets[0] || null;
            if (!target) return;
            if (activeTarget === target) return;

            if (activeTarget) {
                cleanupTarget(activeTarget);
            }

            if (resumeTimeout) {
                clearTimeout(resumeTimeout);
                resumeTimeout = null;
            }

            activeTarget = target;
            Array.prototype.forEach.call(corners, function (corner) {
                gsap.killTweensOf(corner);
            });

            gsap.killTweensOf(cursor, 'rotation');
            if (spinTl) {
                spinTl.pause();
            }
            gsap.set(cursor, { rotation: 0 });

            var rect = target.getBoundingClientRect();
            var borderWidth = constants.borderWidth;
            var cornerSize = constants.cornerSize;
            var cursorX = gsap.getProperty(cursor, 'x');
            var cursorY = gsap.getProperty(cursor, 'y');

            targetCornerPositions = [
                { x: rect.left - borderWidth, y: rect.top - borderWidth },
                { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
                { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
                { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
            ];

            gsap.ticker.add(tickerFn);
            gsap.to(activeStrength, {
                current: 1,
                duration: opts.hoverDuration,
                ease: 'power2.out'
            });

            Array.prototype.forEach.call(corners, function (corner, i) {
                gsap.to(corner, {
                    x: targetCornerPositions[i].x - cursorX,
                    y: targetCornerPositions[i].y - cursorY,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });

            function leaveHandler() {
                gsap.ticker.remove(tickerFn);
                targetCornerPositions = null;
                gsap.set(activeStrength, { current: 0, overwrite: true });
                activeTarget = null;

                Array.prototype.forEach.call(corners, function (corner) {
                    gsap.killTweensOf(corner);
                });

                var positions = [
                    { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
                    { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
                    { x: cornerSize * 0.5, y: cornerSize * 0.5 },
                    { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
                ];

                var tl = gsap.timeline();
                Array.prototype.forEach.call(corners, function (corner, index) {
                    tl.to(
                        corner,
                        {
                            x: positions[index].x,
                            y: positions[index].y,
                            duration: 0.3,
                            ease: 'power3.out'
                        },
                        0
                    );
                });

                resumeTimeout = setTimeout(function () {
                    if (!activeTarget && spinTl) {
                        var currentRotation = gsap.getProperty(cursor, 'rotation');
                        var normalizedRotation = currentRotation % 360;

                        if (spinTl) {
                            spinTl.kill();
                        }

                        spinTl = gsap.timeline({ repeat: -1 }).to(cursor, {
                            rotation: '+=360',
                            duration: opts.spinDuration,
                            ease: 'none'
                        });

                        gsap.to(cursor, {
                            rotation: normalizedRotation + 360,
                            duration: opts.spinDuration * (1 - normalizedRotation / 360),
                            ease: 'none',
                            onComplete: function () {
                                if (spinTl) {
                                    spinTl.restart();
                                }
                            }
                        });
                    }
                    resumeTimeout = null;
                }, 50);

                cleanupTarget(target);
            }

            currentLeaveHandler = leaveHandler;
            target.addEventListener('mouseleave', leaveHandler);
        }

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseover', enterHandler, { passive: true });
        window.addEventListener('scroll', scrollHandler, { passive: true });
        window.addEventListener('mousedown', mouseDownHandler);
        window.addEventListener('mouseup', mouseUpHandler);

        function cleanup() {
            gsap.ticker.remove(tickerFn);

            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseover', enterHandler);
            window.removeEventListener('scroll', scrollHandler);
            window.removeEventListener('mousedown', mouseDownHandler);
            window.removeEventListener('mouseup', mouseUpHandler);

            if (activeTarget) {
                cleanupTarget(activeTarget);
            }

            if (spinTl) {
                spinTl.kill();
            }

            if (resumeTimeout) {
                clearTimeout(resumeTimeout);
                resumeTimeout = null;
            }

            document.body.style.cursor = originalCursor;
            cursor.remove();
        }

        window.__targetCursorCleanup = cleanup;
        return cleanup;
    }

    window.initTargetCursor = initTargetCursor;
})();
