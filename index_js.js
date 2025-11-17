/* === MOBILE GUARD & lazy init (paste near start of <script>) === */
const __isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const isMobile = __isTouch || window.matchMedia('(max-width:700px)').matches;

// lazy audio: если data-src есть — подгрузим при первом клике Play
const audioEl = document.querySelector('audio[data-src]') || document.getElementById('audio') || document.querySelector('audio');
if (audioEl) {
    // Если в HTML вы поместили data-src (как рекомендовано), используем его
    const dataSrc = audioEl.getAttribute('data-src') || 'temnyy_princ_overdoz.mp3'; // fallback
    audioEl.removeAttribute('src'); // гарантируем, что не начнёт загружаться
    audioEl.dataset.src = dataSrc;
    audioEl.preload = 'none';
}

// guard heavy inits
function initHeavyFeatures() {
    // init snow, coins, wheel, playlist — переместите внутрь этой функции существующие инициализации,
    // которые сейчас выполняются всегда. Пример: generateFlakes(), spawnCoin(), пр.
    // Вставьте туда код генерации flakes / coin spawn / wheel init, которые были раньше.
}

// если мобильный — НЕ выполнять тяжёлые inits, иначе — выполнить
if (!isMobile) {
    // прежняя логика (desktop): сразу инициализируем всё
    try {
        initHeavyFeatures();
    } catch (e) {
        console.warn('heavy init error', e);
    }
} else {
    // mobile: отключаем spawn и скрываем coin UI (доп. страховка)
    try {
        const coin = document.getElementById('coinCounter');
        if (coin) coin.style.display = 'none';
        const wheel = document.getElementById('wheelBtn');
        if (wheel) wheel.style.display = 'none';
        const wheelOverlay = document.getElementById('wheelOverlay');
        if (wheelOverlay) wheelOverlay.style.display = 'none';
        // Также отключаем snow loop полностью
        window.snowEnabled = false; // если используется глобально
    } catch (e) {}
}

// Lazy-load audio source at first user intent (tap/click on play)
const toggleBtn = document.getElementById('toggleBtn');
if (toggleBtn && audioEl) {
    function ensureAudioLoaded() {
        if (!audioEl.src || audioEl.src === '') {
            audioEl.src = audioEl.dataset.src || audioEl.getAttribute('data-src') || '';
            // load but don't autoplay
            try {
                audioEl.load();
            } catch (e) {
                /* ignore */ }
        }
        // remove handler after first run
        toggleBtn.removeEventListener('pointerdown', ensureAudioLoaded);
        toggleBtn.removeEventListener('click', ensureAudioLoaded);
    }
    toggleBtn.addEventListener('pointerdown', ensureAudioLoaded, {
        once: true
    });
    toggleBtn.addEventListener('click', ensureAudioLoaded, {
        once: true
    });
}

// Мерцание лампы: только ореол/яркость меняются, фото остаётся непрозрачным
const lamp = document.getElementById('lampBg');
(function lampFlicker() {
    function trigger() {
        const r = Math.random();
        if (r < 0.06) {
            lamp.classList.add('dim');
            setTimeout(() => lamp.classList.remove('dim'), 300 + Math.random() * 900);
        } else if (r < 0.34) {
            lamp.classList.add('flicker');
            setTimeout(() => lamp.classList.remove('flicker'), 80 + Math.random() * 180);
        } else if (r > 0.986) {
            lamp.classList.add('spark');
            setTimeout(() => lamp.classList.remove('spark'), 90 + Math.random() * 220);
        }
        setTimeout(trigger, 200 + Math.random() * 1000);
    }
    trigger();
})();

// СНЕГ: простой canvas-эффект — включаем сразу при загрузке
const canvas = document.getElementById('snowCanvas');
const ctx = canvas.getContext('2d');
let w = canvas.width = innerWidth;
let h = canvas.height = innerHeight;
let densityMultiplier = 10.0;
let flakes = [];
let snowEnabled = true;
let globalAlphaMultiplier = 1.0;

function rand(a, b) {
    return Math.random() * (b - a) + a
}

function generateFlakes() {
    const base = Math.floor((w * h) / 38000);
    const COUNT = Math.max(6, Math.floor(base * densityMultiplier));
    flakes.length = 0;
    for (let i = 0; i < COUNT; i++) flakes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(0.6, 2.2),
        speed: rand(0.2, 0.9),
        baseAlpha: rand(0.005, 0.03)
    });
}
generateFlakes();
addEventListener('resize', () => {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    generateFlakes()
});

function draw() {
    ctx.clearRect(0, 0, w, h);
    if (!snowEnabled) {
        requestAnimationFrame(draw);
        return
    }
    for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        ctx.beginPath();
        const alpha = Math.max(0, Math.min(1, f.baseAlpha * globalAlphaMultiplier));
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        f.y += f.speed;
        f.x += Math.sin(f.y * 0.01 + i) * 0.4;
        if (f.y > h + 6) {
            f.y = -10;
            f.x = Math.random() * w
        }
    }
    requestAnimationFrame(draw)
}
draw();

// UI: toast & copy logic
const toast = document.getElementById('toast');
let toastTimer = null;

function showToast(text, ms = 1600) {
    toast.textContent = text;
    toast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
    }, ms);
}

// skill buttons copy
document.querySelectorAll('.skill-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const s = btn.dataset.skill || btn.textContent.trim();
        try {
            await navigator.clipboard.writeText(s);
            showToast(`Скопировано: ${s}`);
        } catch (e) {
            showToast('Нельзя скопировать автоматически');
        }
        btn.animate([{
            transform: 'scale(1)'
        }, {
            transform: 'scale(1.06)'
        }, {
            transform: 'scale(1)'
        }], {
            duration: 260
        });
    });
});

// DISCORD button: копирует ник "paranoct"
const discordBtn = document.getElementById('discordBtn');
if (discordBtn) {
    discordBtn.addEventListener('click', async () => {
        const nick = 'paranoct';
        try {
            await navigator.clipboard.writeText(nick);
            if (typeof showToast === 'function') showToast(`Скопировано: ${nick}`);
            else alert(`Скопировано: ${nick}`);
        } catch (e) {
            if (typeof showToast === 'function') showToast('Не получилось скопировать');
            else alert('Не удалось скопировать');
        }
        discordBtn.animate([{
            transform: 'translateY(0)'
        }, {
            transform: 'translateY(-6px)'
        }, {
            transform: 'translateY(0)'
        }], {
            duration: 220
        });
    });
}

// AUDIO controls
const audio = document.getElementById('audio');
audio.volume = 0.007;
const progBar = document.getElementById('prog');
const progFill = progBar.querySelector('i');
const timeLabel = document.getElementById('timeLabel');

function updateBtn() {
    toggleBtn.textContent = audio.paused ? '▶' : '⏸'
}
toggleBtn.addEventListener('click', () => {
    if (audio.paused) audio.play();
    else audio.pause();
    updateBtn();
});
audio.addEventListener('play', updateBtn);
audio.addEventListener('pause', updateBtn);
audio.addEventListener('timeupdate', () => {
    if (!audio.duration || isNaN(audio.duration)) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progFill.style.width = pct + '%';
    timeLabel.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration)
});

function formatTime(s) {
    if (!s || isNaN(s)) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}
progBar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    audio.currentTime = Math.max(0, Math.min(1, x / rect.width)) * audio.duration;
});

// SETTINGS UI
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
settingsToggle.addEventListener('click', () => {
    const show = settingsPanel.style.display !== 'flex';
    settingsPanel.style.display = show ? 'flex' : 'none';
    settingsPanel.setAttribute('aria-hidden', show ? 'false' : 'true');
});

const volRange = document.getElementById('volRange');
const volVal = document.getElementById('volVal');
volRange.value = audio.volume;
volVal.textContent = Math.round((Number(audio.volume).toFixed(2) * 100)) + "%";
volRange.addEventListener('input', () => {
    audio.volume = Number(volRange.value);
    volVal.textContent = Math.round((Number(audio.volume).toFixed(2) * 100)) + "%";
});

// SNOW settings: задаём значение сразу, чтобы снег был виден при загрузке
const snowOpacity = document.getElementById('snowOpacity');
const snowOpVal = document.getElementById('snowOpVal');
// Значение по умолчанию — 0.6 (в пределах 0.4..0.9 установленного слайдера)
snowOpacity.value = 0.9;
globalAlphaMultiplier = 0.9 / 0.03; // сразу применяем прозрачность
snowOpacity.addEventListener('input', () => {
    const v = Number(snowOpacity.value);
    globalAlphaMultiplier = v / 0.03;
});

const snowDensity = document.getElementById('snowDensity');
const snowDenVal = document.getElementById('snowDenVal');
snowDensity.value = 20.0;
densityMultiplier = Number(snowDensity.value);
generateFlakes();

snowDensity.addEventListener('input', () => {
    densityMultiplier = Number(snowDensity.value);
    generateFlakes();
});

function toggleSnow() {
    snowEnabled = !snowEnabled;
    showToast(snowEnabled ? 'Снег включён' : 'Снег отключён');
}

// hotkeys
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (audio.paused) audio.play();
        else audio.pause();
        updateBtn();
    }
    if (e.key === 's' || e.key === 'S') {
        toggleSnow();
    }
    if (e.key === 'm' || e.key === 'M') {
        audio.muted = !audio.muted;
        showToast(audio.muted ? 'Звук выключён' : 'Звук включён');
    }
    if (e.key === 'Escape') {
        settingsPanel.style.display = 'none';
    }
});

// click outside settings closes it
document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
        if (settingsPanel.style.display === 'flex') settingsPanel.style.display = 'none';
    }
});


(function() {
    // state + localStorage
    const STORAGE_KEY = 'paranoct_coins';
    const SPAWN_ENABLED_KEY = 'spawnCoinsEnabled';
    let coins = 0;
    const coinCountEl = document.getElementById('coinCount');
    const coinCounterEl = document.getElementById('coinCounter');
    const wheelBtn = document.getElementById('wheelBtn');
    const wheelOverlay = document.getElementById('wheelOverlay');
    const wheelEl = document.getElementById('wheel');
    const spinBtn = document.getElementById('spinBtn');
    const closeWheel = document.getElementById('closeWheel');
    const wheelResult = document.getElementById('wheelResult');
    let spawnEnabled = true;

    let spinning = false; // блокировка выхода во время прокрутки

    function loadCoins() {
        const v = parseInt(localStorage.getItem(STORAGE_KEY));
        coins = isNaN(v) ? 0 : v;
        const enabled = localStorage.getItem(SPAWN_ENABLED_KEY);
        spawnEnabled = enabled !== '0';
        const spawnToggle = document.getElementById('spawnCoinsToggle');
        if (spawnToggle) spawnToggle.checked = spawnEnabled;
    }

    function saveCoins() {
        localStorage.setItem(STORAGE_KEY, String(coins));
    }

    loadCoins();

    // helper UI update
    function updateCoinUI() {
        if (coinCountEl) coinCountEl.textContent = coins;
        if (coinCounterEl) coinCounterEl.animate([{
            transform: 'scale(1)'
        }, {
            transform: 'scale(1.04)'
        }, {
            transform: 'scale(1)'
        }], {
            duration: 220
        });
        saveCoins();
    }

    function showToastLocal(text) {
        if (typeof showToast === 'function') showToast(text);
        else {
            const t = document.createElement('div');
            t.textContent = text;
            t.style.position = 'fixed';
            t.style.left = '50%';
            t.style.bottom = '22px';
            t.style.transform = 'translateX(-50%)';
            t.style.background = 'rgba(0,0,0,0.7)';
            t.style.color = '#fff';
            t.style.padding = '8px 12px';
            t.style.borderRadius = '8px';
            t.style.zIndex = 10005;
            document.body.appendChild(t);
            setTimeout(() => t.style.opacity = '0', 1400);
            setTimeout(() => t.remove(), 2000);
        }
    }

    // spawn coin (avoid UI zones)
    function spawnCoin() {
        const coin = document.createElement('div');
        coin.className = 'coin spawn-anim';
        coin.textContent = '¢';

        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        // collect exclusion rects (settings, panel, wheel button, coinCounter, main card and its parts)
        const exclusionEls = [
            document.getElementById('settingsToggle'),
            document.getElementById('settingsPanel'),
            wheelBtn,
            coinCounterEl,
            document.querySelector('main.card'),
            document.querySelector('.right'),
            document.querySelector('.profile'),
            document.querySelector('.card-footer')
        ];
        const exclusionRects = exclusionEls.reduce((acc, el) => {
            try {
                if (el && typeof el.getBoundingClientRect === 'function') acc.push(el.getBoundingClientRect());
            } catch (e) {}
            return acc;
        }, []);

        // try multiple attempts to find non-overlapping position
        let x = 40,
            y = 120,
            attempt = 0;
        while (attempt < 80) {
            const leftMargin = 20;
            const topMargin = 60;
            const marginRight = vw < 420 ? 60 : 220; // меньше на мобильных
            const bottomMargin = vh < 600 ? 180 : 140; // больше на мобильных для избежания низа
            x = Math.floor(Math.random() * Math.max(20, vw - marginRight - 80)) + leftMargin;
            y = Math.floor(Math.random() * Math.max(20, vh - bottomMargin)) + topMargin;

            const rect = {
                left: x,
                right: x + 44,
                top: y,
                bottom: y + 44
            };
            const overlap = exclusionRects.some(r => !(rect.right < r.left || rect.left > r.right || rect.bottom < r.top || rect.top > r.bottom));
            if (!overlap) break;
            attempt++;
        }

        // if we failed to find a non-overlapping spot, nudge coin to top-left safe area
        if (attempt >= 80) {
            x = 24;
            y = 100;
        }

        coin.style.left = x + 'px';
        coin.style.top = y + 'px';
        coin.style.opacity = '0.92';
        document.body.appendChild(coin);

        const autoRem = setTimeout(() => {
            if (coin.parentNode) coin.remove();
        }, 120000);

        // Prevent double-collect: mark immediately on pointerdown/click
        function collectOnce(e) {
            e.stopPropagation();
            // if already collected, ignore
            if (coin.dataset.collected) return;
            coin.dataset.collected = '1';
            clearTimeout(autoRem);
            // make non-interactive immediately
            coin.style.pointerEvents = 'none';
            coin.style.transform = 'scale(1.4) translateY(-8px)';
            coin.style.opacity = '0';
            setTimeout(() => {
                try {
                    coin.remove();
                } catch (e) {}
            }, 260);
            coins += 1;
            updateCoinUI();
            showToastLocal('Монетка собрана +1');
        }

        // attach both pointerdown and click to be robust; pointerdown is first and ensures dataset is set early
        coin.addEventListener('pointerdown', collectOnce, {
            once: true
        });
        // fallback click in case pointerdown not fired
        coin.addEventListener('click', collectOnce);
    }

    // initial spawn + interval
    if (spawnEnabled) spawnCoin();
    const spawnInterval = 360000;
    setInterval(() => {
        if (spawnEnabled) spawnCoin();
    }, spawnInterval);

    // spawn toggle handler
    const spawnToggle = document.getElementById('spawnCoinsToggle');
    if (spawnToggle) {
        spawnToggle.addEventListener('change', () => {
            spawnEnabled = spawnToggle.checked;
            localStorage.setItem(SPAWN_ENABLED_KEY, spawnEnabled ? '1' : '0');
            showToastLocal(spawnEnabled ? 'Спавн монеток включён' : 'Спавн монеток отключён');
        });
    }

    // wheel labels and spin logic
    const labels = [
        'Как дела?',
        'Привет!',
        '2 монеты',
        'Проверь директорию /secret/secret.html Вдруг там что-то интересное?'
    ];
    const segmentCount = labels.length;
    const segmentSize = 360 / segmentCount;

    // ---- REPLACED: robust spin logic with pointer at TOP (12 o'clock) ----
    // Pointer at TOP corresponds to POINTER_ANGLE = 270 (in conic-gradient coordinates: 0deg = right)
    const POINTER_ANGLE = 90;

    function debugLogIdx(totalDeg) {
        const norm = ((totalDeg % 360) + 360) % 360;
        const angleAtPointer = (POINTER_ANGLE - norm + 360) % 360;
        const idx = Math.floor(angleAtPointer / segmentSize) % segmentCount;
        console.log({
            totalDeg,
            norm,
            angleAtPointer,
            idx,
            label: labels[idx]
        });
        return idx;
    }

    function spinWheel() {
        if (spinning) return; // ещё крутится
        if (coins < 1) {
            showToastLocal('Нужно 1 монетка, чтобы крутить');
            return;
        }
        coins -= 1;
        updateCoinUI();
        spinning = true;
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.textContent = 'Крутится...';
        }
        if (closeWheel) closeWheel.disabled = true;
        if (wheelResult) wheelResult.textContent = '';

        const fullSpins = Math.floor(Math.random() * 4) + 5;
        const finalAngle = Math.floor(Math.random() * 360);
        const totalDeg = fullSpins * 360 + finalAngle;
        const ANIM_DURATION_MS = 5000;

        if (wheelEl) {
            wheelEl.style.transition = `transform ${ANIM_DURATION_MS/1000}s cubic-bezier(.14,.9,.36,1)`;
            void wheelEl.offsetWidth; // force reflow
            wheelEl.style.transform = `rotate(${totalDeg}deg)`;
        }

        let finished = false;

        function finishSpin() {
            if (finished) return;
            finished = true;
            const norm = ((totalDeg % 360) + 360) % 360;
            const angleAtPointer = (POINTER_ANGLE - norm + 360) % 360;
            let idx = Math.floor(angleAtPointer / segmentSize) % segmentCount;
            if (idx < 0) idx = 0;
            const result = labels[idx] || '—';
            if (wheelResult) wheelResult.textContent = 'Результат: ' + result;

            if (result.includes('2 монеты')) {
                coins += 2;
                updateCoinUI();
                showToastLocal('+2 монетки!');
            } else if (result.includes('10 XP')) {
                showToastLocal('Получено 10 XP');
            }

            if (spinBtn) {
                spinBtn.disabled = false;
                spinBtn.textContent = 'Крутить (1 монета)';
            }
            if (closeWheel) closeWheel.disabled = false;
            spinning = false;
        }

        function onEnd(e) {
            if (e && e.propertyName && e.propertyName !== 'transform') return;
            if (wheelEl) wheelEl.removeEventListener('transitionend', onEnd);
            clearTimeout(fallbackTimer);
            finishSpin();
        }
        if (wheelEl) wheelEl.addEventListener('transitionend', onEnd);
        const fallbackTimer = setTimeout(() => {
            try {
                if (wheelEl) wheelEl.removeEventListener('transitionend', onEnd);
            } catch (e) {}
            finishSpin();
        }, ANIM_DURATION_MS + 120);
    }
    // ---- END REPLACED ----

    // open/close handlers
    if (wheelBtn) {
        wheelBtn.addEventListener('click', () => {
            if (!wheelOverlay) return;
            wheelOverlay.classList.add('open');
            wheelOverlay.setAttribute('aria-hidden', 'false');
            if (wheelEl) {
                wheelEl.style.transition = 'none';
                wheelEl.style.transform = 'rotate(0deg)';
            }
            if (wheelResult) wheelResult.textContent = '';
        });
    }

    if (closeWheel) {
        closeWheel.addEventListener('click', () => {
            if (spinning) {
                showToastLocal('Нельзя закрыть, пока колесо крутится');
                return;
            }
            if (wheelOverlay) {
                wheelOverlay.classList.remove('open');
                wheelOverlay.setAttribute('aria-hidden', 'true');
            }
        });
    }

    if (spinBtn) spinBtn.addEventListener('click', spinWheel);

    if (wheelOverlay) wheelOverlay.addEventListener('click', (e) => {
        // clicking the dim background closes only if not spinning and target is overlay itself
        if (e.target === wheelOverlay) {
            if (spinning) {
                showToastLocal('Нельзя выйти во время прокрутки');
                return;
            }
            wheelOverlay.classList.remove('open');
            wheelOverlay.setAttribute('aria-hidden', 'true');
        }
    });

    // prevent navigation/escape close while spinning: intercept before potential handlers
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Escape' || e.key === 'Esc') && spinning) {
            // prevent accidental closing
            e.stopImmediatePropagation();
            e.preventDefault();
            showToastLocal('Нельзя закрыть, пока колесо крутится');
        }
    }, true); // capture phase to block earlier handlers

    // initial UI sync
    updateCoinUI();

    // debug API
    window.__gameCoins = {
        get: () => coins,
        add: (n) => {
            coins += n;
            updateCoinUI();
        }
    };
})();

// small mobile-friendly tweak: if phone detected, reduce snow and slightly adjust coin spawn
(function() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const isMobile = isTouch || window.matchMedia('(max-width:700px)').matches;
    if (isMobile) {
        try {
            densityMultiplier = Math.max(4, Math.min(8, densityMultiplier));
            generateFlakes();
            globalAlphaMultiplier = Math.min(globalAlphaMultiplier, 6);
            snowEnabled = false; // отключить снег на мобильных для производительности
        } catch (e) {}
        try {
            const coin = document.getElementById('coinCounter');
            const wheel = document.getElementById('wheelBtn');
            const wheelOverlay = document.getElementById('wheelOverlay');
            if (coin) coin.style.display = 'none';
            if (wheel) wheel.style.display = 'none';
            if (wheelOverlay) wheelOverlay.style.display = 'none';
        } catch (e) {}
        // Disable spawning on mobile
        spawnEnabled = false;
        const spawnToggle = document.getElementById('spawnCoinsToggle');
        if (spawnToggle) spawnToggle.checked = false;
    }
})();

// Плейлист логика
(function() {
    const tracks = [{
            title: 'Тёмный принц - Овердоз',
            src: 'temnyy_princ_overdoz.mp3',
            duration: null
        },
        {
            title: 'Тёмный принц - ПАПА',
            src: 'PAPA.mp3',
            duration: null
        },
        {
            title: 'KSB Music - Баратрум',
            src: 'bara.mp3',
            duration: null
        },
        {
            title: 'KSB Music - Я вытащу тебя со дна',
            src: 'so_dna.mp3',
            duration: null
        },
        {
            title: 'KSB Music - На урсе',
            src: 'na_urse.mp3',
            duration: null
        },
        {
            title: 'Drowning Love',
            src: 'edit_aizen.mp3',
            duration: null
        },
        {
            title: 'zxcursed, interworld - Metamarphosis 3',
            src: 'meta3.mp3',
            duration: null
        },
        {
            title: 'Серега Пират - АМ ФП',
            src: 'AMFP.mp3',
            duration: null
        },
        {
            title: 'Лида, Серега Пират - ЧСВ',
            src: 'CHSV.mp3',
            duration: null
        },
        {
            title: 'Серега Пират - Тильт',
            src: 'TILT.mp3',
            duration: null
        },
        {
            title: "Napoleon's song - Amour Plastique",
            src: 'napoleon.mp3',
            duration: null
        },
        {
            title: 'Серега Пират - И я кричу остановите катку!',
            src: 'KATKA.mp3',
            duration: null
        }
    ];
    let currentTrackIndex = 0;
    let isLoop = false;

    const playlistBtn = document.getElementById('playlistBtn');
    const playlistPanel = document.getElementById('playlistPanel');
    const currentTrackTitle = document.getElementById('currentTrackTitle');
    const loopBtn = document.getElementById('loopBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Функция для загрузки и воспроизведения трека
    function loadAndPlayTrack(index) {
        currentTrackIndex = index;
        audio.src = tracks[index].src;
        audio.load();
        audio.play().then(() => {
            updateBtn();
            currentTrackTitle.textContent = tracks[index].title;
            document.querySelectorAll('.playlist-item').forEach(item => item.classList.remove('selected'));
            document.querySelector(`.playlist-item[data-index="${index}"]`).classList.add('selected');
        }).catch(err => console.error('Ошибка воспроизведения:', err));
    }

    // Обновление отображения длительности в плейлисте
    function updatePlaylistItemDuration(index, duration) {
        const item = document.querySelector(`.playlist-item[data-index="${index}"]`);
        if (item) {
            const durationSpan = item.querySelector('.duration');
            if (!durationSpan) {
                const span = document.createElement('span');
                span.className = 'duration';
                span.style.opacity = '0.7';
                span.style.fontSize = '13px';
                item.appendChild(span);
            }
            item.querySelector('.duration').textContent = formatTime(duration);
        }
    }

    // Асинхронная загрузка длительности треков
    tracks.forEach((track, index) => {
        const tempAudio = new Audio(track.src);
        tempAudio.addEventListener('loadedmetadata', () => {
            tracks[index].duration = tempAudio.duration;
            updatePlaylistItemDuration(index, tempAudio.duration);
            // Если это текущий трек, обновляем timeLabel
            if (index === currentTrackIndex) {
                timeLabel.textContent = '00:00 / ' + formatTime(tempAudio.duration);
            }
        });
    });

    // Создаём список треков динамически
    tracks.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = `<div style="display: flex; align-items: center; gap: 16px;"><span>${index + 1}</span><span>${track.title}</span></div><span class="duration" style="opacity:0.7; font-size:13px;">--:--</span>`;
        item.dataset.index = index;
        if (index === currentTrackIndex) item.classList.add('selected');
        playlistPanel.appendChild(item);
    });

    // Toggle плейлиста
    playlistBtn.addEventListener('click', () => {
        playlistPanel.classList.toggle('open');
    });

    // Выбор трека
    playlistPanel.addEventListener('click', (e) => {
        if (e.target.closest('.playlist-item')) {
            const index = parseInt(e.target.closest('.playlist-item').dataset.index);
            loadAndPlayTrack(index);
            playlistPanel.classList.remove('open');
        }
    });

    // Закрытие плейлиста при клике вне
    document.addEventListener('click', (e) => {
        if (!playlistPanel.contains(e.target) && !playlistBtn.contains(e.target)) {
            playlistPanel.classList.remove('open');
        }
    });

    // Дополнительные кнопки: prev, next, loop
    prevBtn.addEventListener('click', () => {
        const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadAndPlayTrack(prevIndex);
    });

    nextBtn.addEventListener('click', () => {
        const nextIndex = (currentTrackIndex + 1) % tracks.length;
        loadAndPlayTrack(nextIndex);
    });

    loopBtn.addEventListener('click', () => {
        isLoop = !isLoop;
        loopBtn.classList.toggle('active', isLoop);
    });

    // Автоматический переход на следующий трек или повтор
    audio.addEventListener('ended', () => {
        if (isLoop) {
            audio.play();
        } else {
            const nextIndex = (currentTrackIndex + 1) % tracks.length;
            loadAndPlayTrack(nextIndex);
        }
    });

    // Инициализация
    currentTrackTitle.textContent = tracks[currentTrackIndex].title;
    audio.src = tracks[currentTrackIndex].src;
    // Загружаем duration для первого трека сразу
    audio.addEventListener('loadedmetadata', () => {
        tracks[currentTrackIndex].duration = audio.duration;
        updatePlaylistItemDuration(currentTrackIndex, audio.duration);
        timeLabel.textContent = '00:00 / ' + formatTime(audio.duration);
    });
})();
