/* ============================================================
   LightRays — Vanilla JS WebGL Implementation
   Ported from React Bits LightRays component
   ============================================================ */
(function () {
    "use strict";

    function hexToRgb(hex) {
        var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
    }

    function getAnchorAndDir(origin, w, h) {
        var outside = 0.2;
        switch (origin) {
            case 'top-left':      return { anchor: [0, -outside * h], dir: [0, 1] };
            case 'top-right':     return { anchor: [w, -outside * h], dir: [0, 1] };
            case 'left':          return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
            case 'right':         return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
            case 'bottom-left':   return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
            case 'bottom-center': return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
            case 'bottom-right':  return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
            default:              return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
        }
    }

    var VERT = [
        'attribute vec2 position;',
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = position * 0.5 + 0.5;',
        '  gl_Position = vec4(position, 0.0, 1.0);',
        '}'
    ].join('\n');

    var FRAG = [
        'precision highp float;',
        '',
        'uniform float iTime;',
        'uniform vec2  iResolution;',
        'uniform vec2  rayPos;',
        'uniform vec2  rayDir;',
        'uniform vec3  raysColor;',
        'uniform float raysSpeed;',
        'uniform float lightSpread;',
        'uniform float rayLength;',
        'uniform float pulsating;',
        'uniform float fadeDistance;',
        'uniform float saturation;',
        'uniform vec2  mousePos;',
        'uniform float mouseInfluence;',
        'uniform float noiseAmount;',
        'uniform float distortion;',
        '',
        'varying vec2 vUv;',
        '',
        'float noise(vec2 st) {',
        '  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);',
        '}',
        '',
        'float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,',
        '                  float seedA, float seedB, float speed) {',
        '  vec2 sourceToCoord = coord - raySource;',
        '  vec2 dirNorm = normalize(sourceToCoord);',
        '  float cosAngle = dot(dirNorm, rayRefDirection);',
        '',
        '  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;',
        '',
        '  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));',
        '',
        '  float distance = length(sourceToCoord);',
        '  float maxDistance = iResolution.x * rayLength;',
        '  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);',
        '',
        '  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);',
        '  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;',
        '',
        '  float baseStrength = clamp(',
        '    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +',
        '    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),',
        '    0.0, 1.0',
        '  );',
        '',
        '  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;',
        '}',
        '',
        'void main() {',
        '  vec2 fragCoord = vUv * iResolution;',
        '  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);',
        '',
        '  vec2 finalRayDir = rayDir;',
        '  if (mouseInfluence > 0.0) {',
        '    vec2 mouseScreenPos = mousePos * iResolution.xy;',
        '    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);',
        '    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));',
        '  }',
        '',
        '  vec4 rays1 = vec4(1.0) *',
        '               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,',
        '                           1.5 * raysSpeed);',
        '  vec4 rays2 = vec4(1.0) *',
        '               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,',
        '                           1.1 * raysSpeed);',
        '',
        '  vec4 fragColor = rays1 * 0.5 + rays2 * 0.4;',
        '',
        '  if (noiseAmount > 0.0) {',
        '    float n = noise(coord * 0.01 + iTime * 0.1);',
        '    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);',
        '  }',
        '',
        '  float brightness = 1.0 - (coord.y / iResolution.y);',
        '  fragColor.x *= 0.1 + brightness * 0.8;',
        '  fragColor.y *= 0.3 + brightness * 0.6;',
        '  fragColor.z *= 0.5 + brightness * 0.5;',
        '',
        '  if (saturation != 1.0) {',
        '    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));',
        '    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);',
        '  }',
        '',
        '  fragColor.rgb *= raysColor;',
        '  gl_FragColor = fragColor;',
        '}'
    ].join('\n');

    function createShader(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl, vertSrc, fragSrc) {
        var vs = createShader(gl, gl.VERTEX_SHADER, vertSrc);
        var fs = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
        if (!vs || !fs) return null;

        var prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.warn('Program link error:', gl.getProgramInfoLog(prog));
            gl.deleteProgram(prog);
            return null;
        }
        return prog;
    }

    /**
     * Initialize LightRays effect on a container element.
     * @param {string} containerId - ID of the container element
     * @param {Object} opts - Configuration options
     */
    window.initLightRays = function (containerId, opts) {
        var container = document.getElementById(containerId);
        if (!container) return null;

        var cfg = Object.assign({
            raysOrigin: 'top-center',
            raysColor: '#00d4ff',
            raysSpeed: 1,
            lightSpread: 0.5,
            rayLength: 2,
            pulsating: false,
            fadeDistance: 1.0,
            saturation: 1.0,
            followMouse: true,
            mouseInfluence: 0.1,
            noiseAmount: 0.0,
            distortion: 0.0
        }, opts || {});

        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;z-index:1;';
        container.style.position = 'relative';
        container.insertBefore(canvas, container.firstChild);

        var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
        if (!gl) {
            console.warn('LightRays: WebGL not supported');
            return null;
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        var program = createProgram(gl, VERT, FRAG);
        if (!program) return null;

        gl.useProgram(program);

        // Fullscreen triangle (covers viewport with a single triangle)
        var posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

        var posAttr = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

        // Uniform locations
        var u = {};
        var uNames = ['iTime', 'iResolution', 'rayPos', 'rayDir', 'raysColor', 'raysSpeed',
            'lightSpread', 'rayLength', 'pulsating', 'fadeDistance', 'saturation',
            'mousePos', 'mouseInfluence', 'noiseAmount', 'distortion'];
        uNames.forEach(function (n) { u[n] = gl.getUniformLocation(program, n); });

        var mouse = { x: 0.5, y: 0.5 };
        var smoothMouse = { x: 0.5, y: 0.5 };
        var animId = null;
        var destroyed = false;

        function resize() {
            if (destroyed) return;
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var w = container.clientWidth;
            var h = container.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        function render(t) {
            if (destroyed) return;
            var time = t * 0.001;
            var w = canvas.width;
            var h = canvas.height;

            var placement = getAnchorAndDir(cfg.raysOrigin, w, h);

            // Smooth mouse
            if (cfg.followMouse && cfg.mouseInfluence > 0) {
                var s = 0.92;
                smoothMouse.x = smoothMouse.x * s + mouse.x * (1 - s);
                smoothMouse.y = smoothMouse.y * s + mouse.y * (1 - s);
            }

            gl.useProgram(program);
            gl.uniform1f(u.iTime, time);
            gl.uniform2f(u.iResolution, w, h);
            gl.uniform2f(u.rayPos, placement.anchor[0], placement.anchor[1]);
            gl.uniform2f(u.rayDir, placement.dir[0], placement.dir[1]);
            gl.uniform3f(u.raysColor, hexToRgb(cfg.raysColor)[0], hexToRgb(cfg.raysColor)[1], hexToRgb(cfg.raysColor)[2]);
            gl.uniform1f(u.raysSpeed, cfg.raysSpeed);
            gl.uniform1f(u.lightSpread, cfg.lightSpread);
            gl.uniform1f(u.rayLength, cfg.rayLength);
            gl.uniform1f(u.pulsating, cfg.pulsating ? 1.0 : 0.0);
            gl.uniform1f(u.fadeDistance, cfg.fadeDistance);
            gl.uniform1f(u.saturation, cfg.saturation);
            gl.uniform2f(u.mousePos, smoothMouse.x, smoothMouse.y);
            gl.uniform1f(u.mouseInfluence, cfg.mouseInfluence);
            gl.uniform1f(u.noiseAmount, cfg.noiseAmount);
            gl.uniform1f(u.distortion, cfg.distortion);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
            animId = requestAnimationFrame(render);
        }

        function onMouseMove(e) {
            var rect = container.getBoundingClientRect();
            mouse.x = (e.clientX - rect.left) / rect.width;
            mouse.y = (e.clientY - rect.top) / rect.height;
        }

        // Init
        resize();
        window.addEventListener('resize', resize);
        if (cfg.followMouse) {
            window.addEventListener('mousemove', onMouseMove);
        }

        // Use IntersectionObserver to only render when visible
        var isVisible = false;
        if ('IntersectionObserver' in window) {
            var obs = new IntersectionObserver(function (entries) {
                isVisible = entries[0].isIntersecting;
                if (isVisible && !animId && !destroyed) {
                    animId = requestAnimationFrame(render);
                } else if (!isVisible && animId) {
                    cancelAnimationFrame(animId);
                    animId = null;
                }
            }, { threshold: 0.05 });
            obs.observe(container);
        } else {
            isVisible = true;
            animId = requestAnimationFrame(render);
        }

        // Return destroy function
        return {
            destroy: function () {
                destroyed = true;
                if (animId) cancelAnimationFrame(animId);
                window.removeEventListener('resize', resize);
                window.removeEventListener('mousemove', onMouseMove);
                if (obs) obs.disconnect();
                try {
                    var ext = gl.getExtension('WEBGL_lose_context');
                    if (ext) ext.loseContext();
                } catch (e) { }
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
        };
    };
})();
