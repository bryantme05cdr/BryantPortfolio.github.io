// Menu mobile
const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
});


// Form kontak
const form = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

form.addEventListener("submit", function(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    formMessage.textContent = "Terima kasih, " + name + "! Pesan kamu berhasil dikirim.";
    form.reset();
});


// Nature Dino Run Minigame Logic (Forest Edition)
(() => {
    const W = 800, H = 300, GROUND = 250;
    const DINO_X = 70, SIZE = 66;
    const GRAV = 0.65, JUMP_V = 12.8, MAX_SPEED = 14;

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const gameOverlay = document.getElementById("gameOverlay");
    const startBtn = document.getElementById("startBtn");
    const scoreVal = document.getElementById("scoreVal");
    const highScoreVal = document.getElementById("highScoreVal");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* ---------- Helper ---------- */
    const rnd = (a, b) => a + Math.random() * (b - a);

    function mulberry32(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function makeLayer(draw) {
        const c = document.createElement("canvas");
        c.width = W * dpr;
        c.height = H * dpr;
        const g = c.getContext("2d");
        g.scale(dpr, dpr);
        draw(g);
        return c;
    }

    function rr(g, x, y, w, h, r) {
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
    }

    /* ---------- Dinosaurus (pixel art T-Rex hijau) ---------- */
    const PAL = { G: "#43a047", D: "#2e7d32", L: "#c5e1a5", W: "#ffffff", K: "#1b1b1b" };

    const BODY = [
        "............GGGGGGGGG.",
        "............GGGGGGGGGG",
        "............GGGWKGGGGG",
        "............GGGGGGGGGG",
        "............GGGGGGGGGG",
        "............GGGGKKKKKK",
        "............GGGWGWGWG.",
        "...........GGGGGGG....",
        "..........GGGGGGGG.GGG",
        ".......DDGGGGGGGGGG.G.",
        "......DGGGGGGGGGGGLL..",
        ".....DGGGGGGGGGGGLLL..",
        "...GGGGGGGGGGGGGLLL...",
        "..GGGGGGGGGGGGGLLL....",
        ".GGGGGGGGGGGGGLLL.....",
        "GGGGGGGGGGGGGLL.......",
        ".GGGGGGGGGGGGG........"
    ];
    const LEGS_A = [
        ".......GGG..GGG.......",
        ".......GGG...GG.......",
        ".......GGG....GG......",
        ".......GGGG...........",
        ".......GGGGG........."
    ];
    const LEGS_B = [
        ".......GGG..GGG.......",
        "........GG..GGG.......",
        ".........GG.GGG.......",
        "............GGG.......",
        "............GGGG......"
    ];

    function buildSprite(legs) {
        const S = 3;
        const rows = BODY.concat(legs);
        const c = document.createElement("canvas");
        c.width = 22 * S;
        c.height = rows.length * S;
        const g = c.getContext("2d");
        rows.forEach((row, y) => {
            [...row].forEach((ch, x) => {
                if (PAL[ch]) {
                    g.fillStyle = PAL[ch];
                    g.fillRect(x * S, y * S, S, S);
                }
            });
        });
        return c;
    }
    const SPR = [buildSprite(LEGS_A), buildSprite(LEGS_B)];

    /* ---------- Background hutan ---------- */
    const sky = makeLayer(g => {
        const gr = g.createLinearGradient(0, 0, 0, GROUND);
        gr.addColorStop(0, "#9bd4e8");
        gr.addColorStop(0.55, "#cdeac0");
        gr.addColorStop(1, "#f3f0b6");
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);

        const sg = g.createRadialGradient(620, 70, 5, 620, 70, 150);
        sg.addColorStop(0, "rgba(255,252,200,.95)");
        sg.addColorStop(0.3, "rgba(255,244,170,.45)");
        sg.addColorStop(1, "rgba(255,244,170,0)");
        g.fillStyle = sg;
        g.fillRect(0, 0, W, H);
    });

    function pine(g, x, base, h, w, color, trunk) {
        g.fillStyle = trunk;
        g.fillRect(x - w * 0.06, base - h * 0.18, w * 0.12, h * 0.18);
        g.fillStyle = color;
        const tiers = 4;
        for (let i = 0; i < tiers; i++) {
            const y0 = base - h + i * h * 0.2;
            const y1 = y0 + h * 0.38;
            const hw = w * 0.5 * (0.45 + 0.55 * (i + 1) / tiers);
            g.beginPath();
            g.moveTo(x, y0);
            g.lineTo(x - hw, y1);
            g.lineTo(x + hw, y1);
            g.closePath();
            g.fill();
        }
    }

    function pineLayer(seed, count, hMin, hVar, wMin, wVar, color, trunk) {
        const r = mulberry32(seed);
        const list = Array.from({ length: count }, (_, i) => ({
            x: i * (W / count) + r() * 20,
            h: hMin + r() * hVar,
            w: wMin + r() * wVar
        }));
        return makeLayer(g => {
            list.forEach(t => [-W, 0, W].forEach(o =>
                pine(g, t.x + o, GROUND, t.h, t.w, color, trunk)));
        });
    }

    // Hutan jauh (berkabut)
    const far = (() => {
        const base = pineLayer(11, 14, 110, 70, 50, 30, "rgba(110,170,150,.8)", "rgba(90,140,120,.8)");
        return makeLayer(g => {
            g.drawImage(base, 0, 0, W, H);
            const m = g.createLinearGradient(0, GROUND - 130, 0, GROUND);
            m.addColorStop(0, "rgba(235,248,235,0)");
            m.addColorStop(1, "rgba(235,248,235,.6)");
            g.fillStyle = m;
            g.fillRect(0, GROUND - 130, W, 130);
        });
    })();

    // Hutan tengah (pohon pinus lebih gelap)
    const mid = pineLayer(23, 9, 130, 70, 70, 30, "#2e7d52", "#4b3621");

    // Pohon besar di depan
    const near = makeLayer(g => {
        const r = mulberry32(77);
        const trees = [90, 300, 520, 730].map(bx => ({
            x: bx + (r() * 40 - 20),
            tw: 26 + r() * 12,
            lines: [0, 1, 2, 3, 4].map(() => r() * 4 - 2),
            blobs: Array.from({ length: 9 }, () => [r() * 2 - 1, r() * 2 - 1, 0.45 + r() * 0.35])
        }));
        const leaf = ["#1b5e35", "#23703f", "#2e8049"];

        trees.forEach(t => [-W, 0, W].forEach(o => {
            const X = t.x + o, tw = t.tw;
            // batang
            const tg = g.createLinearGradient(X - tw / 2, 0, X + tw / 2, 0);
            tg.addColorStop(0, "#3b2a1a");
            tg.addColorStop(0.5, "#6b4a2b");
            tg.addColorStop(1, "#3b2a1a");
            g.fillStyle = tg;
            g.fillRect(X - tw / 2, 0, tw, GROUND + 4);
            // tekstur kulit kayu
            g.strokeStyle = "rgba(30,20,10,.45)";
            g.lineWidth = 2;
            t.lines.forEach((j, k) => {
                const lx = X - tw / 2 + 4 + k * (tw - 8) / 4;
                g.beginPath();
                g.moveTo(lx, 0);
                g.lineTo(lx + j, GROUND);
                g.stroke();
            });
            // akar
            g.fillStyle = "#3b2a1a";
            g.beginPath();
            g.moveTo(X - tw / 2 - 12, GROUND + 4);
            g.lineTo(X - tw / 2 + 2, GROUND - 18);
            g.lineTo(X - tw / 2 + 6, GROUND + 4);
            g.moveTo(X + tw / 2 + 12, GROUND + 4);
            g.lineTo(X + tw / 2 - 2, GROUND - 18);
            g.lineTo(X + tw / 2 - 6, GROUND + 4);
            g.fill();
            // lumut
            g.fillStyle = "rgba(76,175,80,.55)";
            g.beginPath();
            g.ellipse(X - tw / 4, GROUND - 30, tw / 3, 18, 0, 0, Math.PI * 2);
            g.fill();
            // kanopi
            t.blobs.forEach((b, i) => {
                g.fillStyle = leaf[i % 3];
                g.beginPath();
                g.arc(X + b[0] * 45, 8 + b[1] * 22, 45 * b[2], 0, Math.PI * 2);
                g.fill();
            });
        }));

        // bayangan kanopi di bagian atas
        const sh = g.createLinearGradient(0, 0, 0, 90);
        sh.addColorStop(0, "rgba(8,40,22,.55)");
        sh.addColorStop(1, "rgba(8,40,22,0)");
        g.fillStyle = sh;
        g.fillRect(0, 0, W, 90);
    });

    // Sinar matahari menembus pohon
    const rays = makeLayer(g => {
        const gr = g.createLinearGradient(0, 0, 0, GROUND);
        gr.addColorStop(0, "rgba(255,250,200,.28)");
        gr.addColorStop(1, "rgba(255,250,200,0)");
        g.fillStyle = gr;
        for (let i = 0; i < 5; i++) {
            const x0 = 420 + i * 75;
            g.beginPath();
            g.moveTo(x0, 0);
            g.lineTo(x0 + 36, 0);
            g.lineTo(x0 - 120, GROUND);
            g.lineTo(x0 - 190, GROUND);
            g.closePath();
            g.fill();
        }
    });

    // Tanah + rumput + bunga
    const ground = makeLayer(g => {
        const r = mulberry32(5);
        const dg = g.createLinearGradient(0, GROUND, 0, H);
        dg.addColorStop(0, "#6b4a2b");
        dg.addColorStop(1, "#3d2915");
        g.fillStyle = dg;
        g.fillRect(0, GROUND, W, H - GROUND);

        for (let i = 0; i < 40; i++) {
            g.fillStyle = r() < 0.5 ? "rgba(150,120,90,.5)" : "rgba(40,25,12,.5)";
            g.beginPath();
            g.ellipse(r() * W, GROUND + 14 + r() * (H - GROUND - 18), 2 + r() * 4, 1.5 + r() * 2, 0, 0, Math.PI * 2);
            g.fill();
        }

        g.fillStyle = "#3f9b46";
        g.fillRect(0, GROUND - 2, W, 10);
        g.fillStyle = "#2d7a38";
        g.fillRect(0, GROUND + 6, W, 4);

        for (let x = 0; x < W; x += 5) {
            const bh = 4 + r() * 9;
            g.strokeStyle = r() < 0.5 ? "#58b85a" : "#3f9b46";
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(x, GROUND + 2);
            g.lineTo(x + (r() * 4 - 2), GROUND - bh);
            g.stroke();
        }

        const flowers = ["#ffeb3b", "#f48fb1", "#ffffff"];
        for (let i = 0; i < 9; i++) {
            const x = r() * W;
            g.strokeStyle = "#2d7a38";
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(x, GROUND + 2);
            g.lineTo(x, GROUND - 12);
            g.stroke();
            g.fillStyle = flowers[i % 3];
            g.beginPath();
            g.arc(x, GROUND - 13, 3, 0, Math.PI * 2);
            g.fill();
        }
    });

    /* ---------- Rintangan ---------- */
    function drawLog(g, x, y, w, h) {
        const top = y - h;
        const gr = g.createLinearGradient(0, top, 0, y);
        gr.addColorStop(0, "#9a6b3f");
        gr.addColorStop(0.55, "#6b4526");
        gr.addColorStop(1, "#442a14");
        g.fillStyle = gr;
        rr(g, x + 4, top, w - 4, h, h * 0.3);
        g.fill();
        g.strokeStyle = "rgba(30,18,8,.5)";
        g.lineWidth = 1.5;
        for (let i = 1; i < 4; i++) {
            const ly = top + h * i / 4;
            g.beginPath();
            g.moveTo(x + 12, ly);
            g.lineTo(x + w - 6, ly);
            g.stroke();
        }
        g.fillStyle = "#e0bd8a";
        g.beginPath();
        g.ellipse(x + 8, top + h / 2, 8, h / 2, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#a47843";
        g.beginPath();
        g.ellipse(x + 8, top + h / 2, 5, h / 2 - 4, 0, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.ellipse(x + 8, top + h / 2, 2, h / 2 - 9, 0, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = "#4caf50";
        g.beginPath();
        g.ellipse(x + w * 0.62, top + 1, w * 0.2, 4, 0, 0, Math.PI * 2);
        g.fill();
    }

    function drawRock(g, x, y, w, h) {
        const pts = [[0, 0], [0.04, 0.45], [0.25, 0.85], [0.55, 1], [0.85, 0.65], [1, 0.2], [0.98, 0]];
        const path = p => {
            g.beginPath();
            p.forEach(([px, py], i) => {
                const X = x + px * w, Y = y - py * h;
                i ? g.lineTo(X, Y) : g.moveTo(X, Y);
            });
            g.closePath();
        };
        const gr = g.createLinearGradient(0, y - h, 0, y);
        gr.addColorStop(0, "#a3a9b1");
        gr.addColorStop(1, "#5a6068");
        g.fillStyle = gr;
        path(pts);
        g.fill();
        g.fillStyle = "rgba(255,255,255,.25)";
        path([[0.25, 0.85], [0.55, 1], [0.7, 0.8], [0.4, 0.6]]);
        g.fill();
        g.fillStyle = "#4caf50";
        g.beginPath();
        g.ellipse(x + w * 0.5, y - h + 3, w * 0.22, 4, 0, 0, Math.PI * 2);
        g.fill();
    }

    function drawStump(g, x, y, w, h) {
        const topY = y - h + 8;
        const gr = g.createLinearGradient(x, 0, x + w, 0);
        gr.addColorStop(0, "#4a2f18");
        gr.addColorStop(0.5, "#7a5230");
        gr.addColorStop(1, "#4a2f18");
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 5, topY);
        g.lineTo(x + w - 5, topY);
        g.lineTo(x + w, y);
        g.closePath();
        g.fill();
        g.strokeStyle = "rgba(30,18,8,.5)";
        g.lineWidth = 1.5;
        for (let i = 1; i < 4; i++) {
            const lx = x + w * i / 4;
            g.beginPath();
            g.moveTo(lx, topY + 4);
            g.lineTo(lx + (i - 2) * 2, y);
            g.stroke();
        }
        g.fillStyle = "#e0bd8a";
        g.beginPath();
        g.ellipse(x + w / 2, topY, (w - 8) / 2, 7, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#a47843";
        g.beginPath();
        g.ellipse(x + w / 2, topY, (w - 8) / 4, 3.5, 0, 0, Math.PI * 2);
        g.stroke();
    }

    function drawBush(g, x, y, w, h) {
        const blobs = [[0.25, 0.35, 0.35], [0.5, 0.55, 0.45], [0.75, 0.35, 0.35]];
        blobs.forEach(([bx, by, br]) => {
            g.fillStyle = "#2e7d32";
            g.beginPath();
            g.arc(x + bx * w, y - by * h, br * h, 0, Math.PI * 2);
            g.fill();
        });
        blobs.forEach(([bx, by, br]) => {
            g.fillStyle = "#43a047";
            g.beginPath();
            g.arc(x + bx * w - 3, y - by * h - 3, br * h * 0.55, 0, Math.PI * 2);
            g.fill();
        });
        g.fillStyle = "#e53935";
        [[0.3, 0.3], [0.55, 0.65], [0.78, 0.3]].forEach(([bx, by]) => {
            g.beginPath();
            g.arc(x + bx * w, y - by * h, 2.5, 0, Math.PI * 2);
            g.fill();
        });
    }

    const TYPES = [
        { w: 56, h: 30, draw: drawLog },
        { w: 42, h: 34, draw: drawRock },
        { w: 34, h: 48, draw: drawStump },
        { w: 46, h: 38, draw: drawBush }
    ];
    const SMALL_TYPES = [TYPES[0], TYPES[1], TYPES[3]];

    /* ---------- State game ---------- */
    let state = "ready"; // ready | playing | over
    let speed, score, yOff, vy, obstacles, distSince, nextGap, legT, last, overAt = 0, inView = false;
    const off = { far: 0, mid: 0, near: 0, ground: 0 };

    let highScore = 0;
    try { highScore = parseInt(localStorage.getItem("forestDinoHi")) || 0; } catch (e) {}
    highScoreVal.textContent = highScore;

    function reset() {
        speed = 6;
        score = 0;
        yOff = 0;
        vy = 0;
        obstacles = [];
        distSince = 0;
        nextGap = 300;
        legT = 0;
        scoreVal.textContent = 0;
    }

    function spawn() {
        if (speed > 7.5 && Math.random() < 0.25) {
            const a = SMALL_TYPES[Math.floor(Math.random() * SMALL_TYPES.length)];
            const b = SMALL_TYPES[Math.floor(Math.random() * SMALL_TYPES.length)];
            const x = W + 20;
            obstacles.push({ x, type: a });
            obstacles.push({ x: x + a.w + rnd(10, 22), type: b });
        } else {
            obstacles.push({ x: W + 20, type: TYPES[Math.floor(Math.random() * TYPES.length)] });
        }
    }

    function hit() {
        const dx = DINO_X + 20, dw = 44;
        const dTop = GROUND - SIZE - yOff + 4, dh = SIZE - 8;
        return obstacles.some(o => {
            const ox = o.x + 5, ow = o.type.w - 10;
            const oy = GROUND - o.type.h + 4, oh = o.type.h - 4;
            return dx < ox + ow && dx + dw > ox && dTop < oy + oh && dTop + dh > oy;
        });
    }

    function update(dt) {
        speed = Math.min(MAX_SPEED, speed + 0.0018 * dt);
        score += speed * dt * 0.08;

        const s = Math.floor(score);
        if (String(s) !== scoreVal.textContent) scoreVal.textContent = s;
        if (s > highScore) {
            highScore = s;
            highScoreVal.textContent = s;
        }

        if (yOff > 0 || vy > 0) {
            yOff += vy * dt;
            vy -= GRAV * dt;
            if (yOff <= 0) { yOff = 0; vy = 0; }
        }

        off.far += speed * 0.12 * dt;
        off.mid += speed * 0.3 * dt;
        off.near += speed * 0.65 * dt;
        off.ground += speed * dt;
        legT += dt * (speed / 6);

        obstacles.forEach(o => o.x -= speed * dt);
        obstacles = obstacles.filter(o => o.x + o.type.w > -10);

        distSince += speed * dt;
        if (distSince >= nextGap) {
            spawn();
            distSince = 0;
            nextGap = speed * 34 + 90 + Math.random() * speed * 28;
        }

        if (hit()) gameOver();
    }

    /* ---------- Render ---------- */
    function scroll(layer, o) {
        const x = -Math.round(o % W);
        ctx.drawImage(layer, x, 0, W, H);
        ctx.drawImage(layer, x + W, 0, W, H);
    }

    function render() {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(sky, 0, 0, W, H);
        scroll(far, off.far);
        scroll(mid, off.mid);
        scroll(near, off.near);
        ctx.drawImage(rays, 0, 0, W, H);
        scroll(ground, off.ground);

        // bayangan dino
        const k = 1 - Math.min(yOff, 140) / 280;
        ctx.fillStyle = "rgba(0,0,0,.28)";
        ctx.beginPath();
        ctx.ellipse(DINO_X + 40, GROUND + 4, 28 * k, 5 * k, 0, 0, Math.PI * 2);
        ctx.fill();

        obstacles.forEach(o => o.type.draw(ctx, o.x, GROUND + 3, o.type.w, o.type.h));

        ctx.imageSmoothingEnabled = false;
        const f = yOff > 0 ? 0 : Math.floor(legT / 5) % 2;
        ctx.drawImage(SPR[f], DINO_X, Math.round(GROUND - SIZE - yOff));
    }

    /* ---------- Loop & kontrol ---------- */
    function frame(t) {
        if (state !== "playing") return;
        const dt = Math.min((t - last) / 16.667, 3);
        last = t;
        update(dt);
        render();
        if (state === "playing") requestAnimationFrame(frame);
    }

    function startGame() {
        if (state === "playing") return;
        reset();
        state = "playing";
        gameOverlay.style.display = "none";
        last = performance.now();
        requestAnimationFrame(frame);
    }

    function gameOver() {
        state = "over";
        overAt = performance.now();
        try { localStorage.setItem("forestDinoHi", highScore); } catch (e) {}
        gameOverlay.style.display = "flex";
        gameOverlay.querySelector("h3").textContent = "Game Over!";
        gameOverlay.querySelector("p").innerHTML =
            `Skor akhir kamu: <strong>${Math.floor(score)}</strong><br>Tekan tombol di bawah untuk main lagi.`;
        startBtn.textContent = "Main Lagi";
    }

    function jump() {
        if (state === "ready") { startGame(); return; }
        if (state === "over") {
            if (performance.now() - overAt > 500) startGame();
            return;
        }
        if (yOff === 0) vy = JUMP_V;
    }

    startBtn.addEventListener("click", startGame);

    canvas.addEventListener("pointerdown", e => {
        e.preventDefault();
        jump();
    });

    // Hanya aktif saat game terlihat di layar, supaya Spasi tidak mengganggu scroll / mengetik di form
    new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
    }, { threshold: 0.3 }).observe(document.getElementById("minigame"));

    document.addEventListener("keydown", e => {
        if (e.code !== "Space" && e.code !== "ArrowUp") return;
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (!inView && state !== "playing") return;
        e.preventDefault();
        if (!e.repeat) jump();
    });

    reset();
    render();
})();