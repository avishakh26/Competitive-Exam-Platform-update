/* ============================================================
   Particle Canvas for Auth Pages
   ============================================================ */
(function(){
    "use strict";

    window.initParticles = function(canvasId, opts){
        var canvas = document.getElementById(canvasId);
        if(!canvas) return;
        var ctx = canvas.getContext('2d');
        var particles = [];
        var mouse = {x:null, y:null};
        var cfg = Object.assign({
            count: 80,
            color: '0,212,255',
            lineColor: '0,212,255',
            maxDist: 120,
            speed: 0.4,
            radius: 2
        }, opts || {});

        function resize(){
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        canvas.addEventListener('mousemove', function(e){
            var r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
        });
        canvas.addEventListener('mouseleave', function(){
            mouse.x = null; mouse.y = null;
        });

        for(var i=0; i<cfg.count; i++){
            particles.push({
                x: Math.random()*canvas.width,
                y: Math.random()*canvas.height,
                vx: (Math.random()-0.5)*cfg.speed,
                vy: (Math.random()-0.5)*cfg.speed,
                r: Math.random()*cfg.radius + 0.5
            });
        }

        function draw(){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            for(var i=0;i<particles.length;i++){
                var p = particles[i];
                p.x += p.vx; p.y += p.vy;
                if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if(p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
                ctx.fillStyle = 'rgba('+cfg.color+',0.6)';
                ctx.fill();

                // Connect nearby particles
                for(var j=i+1;j<particles.length;j++){
                    var p2 = particles[j];
                    var dx = p.x-p2.x, dy = p.y-p2.y;
                    var dist = Math.sqrt(dx*dx+dy*dy);
                    if(dist < cfg.maxDist){
                        ctx.beginPath();
                        ctx.moveTo(p.x,p.y);
                        ctx.lineTo(p2.x,p2.y);
                        ctx.strokeStyle = 'rgba('+cfg.lineColor+','+(1-dist/cfg.maxDist)*0.15+')';
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }

                // Mouse interaction
                if(mouse.x !== null){
                    var mdx = p.x-mouse.x, mdy = p.y-mouse.y;
                    var mdist = Math.sqrt(mdx*mdx+mdy*mdy);
                    if(mdist < 150){
                        ctx.beginPath();
                        ctx.moveTo(p.x,p.y);
                        ctx.lineTo(mouse.x,mouse.y);
                        ctx.strokeStyle = 'rgba('+cfg.lineColor+','+(1-mdist/150)*0.3+')';
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(draw);
        }
        draw();
    };
})();
