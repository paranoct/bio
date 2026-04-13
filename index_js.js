const mobileQuery = window.matchMedia("(max-width: 767px)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const isMobile = mobileQuery.matches || navigator.maxTouchPoints > 0;

document.body.dataset.mobile = String(isMobile);

const tracks = [
  { title: "Тёмный принц — Овердоз", src: "temnyy_princ_overdoz.mp3" },
  { title: "Тёмный принц — ПАПА", src: "PAPA.mp3" },
  { title: "KSB Music — Баратрум", src: "bara.mp3" },
  { title: "KSB Music — Я вытащу тебя со дна", src: "so_dna.mp3" },
  { title: "KSB Music — На урсе", src: "na_urse.mp3" },
  { title: "Drowning Love", src: "edit_aizen.mp3" },
  { title: "zxcursed, interworld — Metamorphosis 3", src: "meta3.mp3" },
  { title: "Серега Пират — АМ ФП", src: "AMFP.mp3" },
  { title: "Лида, Серега Пират — ЧСВ", src: "CHSV.mp3" },
  { title: "Серега Пират — Тильт", src: "TILT.mp3" },
  { title: "Napoleon's song — Amour Plastique", src: "napoleon.mp3" },
  { title: "Серега Пират — И я кричу остановите катку", src: "KATKA.mp3" }
];

const audio = document.getElementById("audio");
const currentTrackTitle = document.getElementById("currentTrackTitle");
const toggleBtn = document.getElementById("toggleBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const loopBtn = document.getElementById("loopBtn");
const playlistBtn = document.getElementById("playlistBtn");
const playlistPanel = document.getElementById("playlistPanel");
const progBar = document.getElementById("prog");
const progFill = progBar.querySelector("i");
const timeLabel = document.getElementById("timeLabel");
const volumeRange = document.getElementById("volumeRange");
const volumeValue = document.getElementById("volumeValue");
const toast = document.getElementById("toast");
const leafLayer = document.getElementById("leafLayer");
const terminalOutput = document.getElementById("terminalOutput");
const terminalForm = document.getElementById("terminalForm");
const terminalInput = document.getElementById("terminalInput");
const VOLUME_STORAGE_KEY = "paranoct_volume";
const TRACK_INDEX_STORAGE_KEY = "paranoct_track_index";
const TRACK_TIME_STORAGE_KEY = "paranoct_track_time";
const TRACK_DURATION_STORAGE_KEY = "paranoct_track_duration";
const LOOP_STORAGE_KEY = "paranoct_loop";

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`storage write failed for ${key}`, error);
  }
}

const state = {
  currentIndex: 0,
  loop: false,
  loadedSrc: "",
  toastTimer: 0,
  resumeTime: 0,
  lastSavedSecond: -1
};

function loadInitialVolume() {
  const fallback = isMobile ? 0.18 : 0.24;

  const saved = safeStorageGet(VOLUME_STORAGE_KEY);
  const parsed = Number.parseFloat(saved);

  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
    return parsed;
  }

  return fallback;
}

function persistVolume() {
  safeStorageSet(VOLUME_STORAGE_KEY, String(audio.volume));
}

function loadInitialLoopState() {
  return safeStorageGet(LOOP_STORAGE_KEY) === "1";
}

function persistLoopState() {
  safeStorageSet(LOOP_STORAGE_KEY, state.loop ? "1" : "0");
}

function loadInitialTrackIndex() {
  const saved = Number.parseInt(safeStorageGet(TRACK_INDEX_STORAGE_KEY), 10);

  if (Number.isInteger(saved) && saved >= 0 && saved < tracks.length) {
    return saved;
  }

  return 0;
}

function loadInitialTrackTime() {
  const saved = Number.parseFloat(safeStorageGet(TRACK_TIME_STORAGE_KEY));

  if (Number.isFinite(saved) && saved >= 0) {
    return saved;
  }

  return 0;
}

function persistTrackIndex() {
  safeStorageSet(TRACK_INDEX_STORAGE_KEY, String(state.currentIndex));
}

function persistTrackPosition(force = false) {
  const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : state.resumeTime;
  const roundedSecond = Math.floor(currentTime);

  if (!force && roundedSecond === state.lastSavedSecond) {
    return;
  }

  state.lastSavedSecond = roundedSecond;
  state.resumeTime = currentTime;
  safeStorageSet(TRACK_TIME_STORAGE_KEY, String(currentTime));

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    safeStorageSet(TRACK_DURATION_STORAGE_KEY, String(audio.duration));
  }
}

audio.volume = isMobile ? 0.18 : 0.24;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1700);
}

function updateToggleButton() {
  const paused = audio.paused;

  toggleBtn.innerHTML = paused
    ? '<i class="fa-solid fa-play"></i>'
    : '<i class="fa-solid fa-pause"></i>';
  toggleBtn.setAttribute("aria-label", paused ? "Воспроизвести" : "Пауза");
}

function updatePlaylistSelection() {
  playlistPanel.querySelectorAll(".playlist-item").forEach((item, index) => {
    item.classList.toggle("selected", index === state.currentIndex);
  });
}

function updateTrackUI() {
  currentTrackTitle.textContent = tracks[state.currentIndex].title;
  updatePlaylistSelection();
}

function resetProgress() {
  progFill.style.width = "0%";
  progBar.setAttribute("aria-valuenow", "0");
  timeLabel.textContent = "00:00 / 00:00";
}

function updateVolumeUI() {
  const percent = Math.round(audio.volume * 100);

  volumeRange.value = String(percent);
  volumeValue.textContent = `${percent}%`;
}

function applySavedPlayerState() {
  state.currentIndex = loadInitialTrackIndex();
  state.resumeTime = loadInitialTrackTime();
  state.lastSavedSecond = Math.floor(state.resumeTime);
  state.loop = loadInitialLoopState();
  audio.volume = loadInitialVolume();
  loopBtn.classList.toggle("active", state.loop);
  loopBtn.setAttribute("aria-pressed", String(state.loop));
  updateTrackUI();
  updateVolumeUI();
}

function ensureTrackLoaded() {
  const track = tracks[state.currentIndex];

  if (state.loadedSrc === track.src) {
    return;
  }

  audio.src = track.src;
  audio.load();
  state.loadedSrc = track.src;
  resetProgress();
}

async function playCurrentTrack() {
  ensureTrackLoaded();

  try {
    await audio.play();
  } catch (error) {
    showToast("Браузер заблокировал воспроизведение");
  }
}

function setTrack(index, options = {}) {
  const autoplay = Boolean(options.autoplay);
  const total = tracks.length;

  state.currentIndex = (index + total) % total;
  state.loadedSrc = "";
  state.resumeTime = 0;
  state.lastSavedSecond = -1;

  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  persistTrackIndex();
  persistTrackPosition(true);
  updateTrackUI();
  resetProgress();
  updateVolumeUI();

  if (autoplay) {
    void playCurrentTrack();
  } else {
    updateToggleButton();
  }
}

function togglePlaylist(force) {
  const shouldOpen = typeof force === "boolean"
    ? force
    : !playlistPanel.classList.contains("open");

  playlistPanel.classList.toggle("open", shouldOpen);
  playlistPanel.setAttribute("aria-hidden", String(!shouldOpen));
  playlistBtn.setAttribute("aria-expanded", String(shouldOpen));
}

function renderPlaylist() {
  playlistPanel.innerHTML = "";

  tracks.forEach((track, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "playlist-item";
    item.innerHTML = `<strong>${track.title}</strong><span>Трек ${String(index + 1).padStart(2, "0")}</span>`;

    item.addEventListener("click", () => {
      const shouldAutoplay = !audio.paused;
      togglePlaylist(false);
      setTrack(index, { autoplay: shouldAutoplay });
    });

    playlistPanel.appendChild(item);
  });

  updatePlaylistSelection();
}

function initLeaves() {
  if (isMobile || reducedMotionQuery.matches || !leafLayer) {
    return;
  }

  const spawnLeaf = () => {
    if (document.hidden || leafLayer.childElementCount >= 6) {
      return;
    }

    const leaf = document.createElement("span");
    leaf.className = "leaf";
    leaf.style.left = `${6 + Math.random() * 88}%`;
    leaf.style.setProperty("--drift", `${Math.round(Math.random() * 180 - 90)}px`);
    leaf.style.setProperty("--turn", `${Math.round(180 + Math.random() * 260)}deg`);
    leaf.style.setProperty("--fall-duration", `${(12 + Math.random() * 6).toFixed(2)}s`);
    leaf.style.setProperty("--scale", `${(0.7 + Math.random() * 0.9).toFixed(2)}`);

    leaf.addEventListener("animationend", () => {
      leaf.remove();
    }, { once: true });

    leafLayer.appendChild(leaf);
  };

  const queueNextLeaf = () => {
    const delay = 2400 + Math.random() * 3600;

    window.setTimeout(() => {
      spawnLeaf();
      queueNextLeaf();
    }, delay);
  };

  spawnLeaf();
  window.setTimeout(spawnLeaf, 1800);
  queueNextLeaf();
}

function appendTerminalLine(text, className = "response") {
  const line = document.createElement("div");
  line.className = `terminal-line ${className}`;
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function printTerminalIntro() {
  terminalOutput.innerHTML = "";
  appendTerminalLine("Type `help` to see available commands.");
}

async function runTerminalCommand(rawInput) {
  const commandLine = rawInput.trim();

  if (!commandLine) {
    return;
  }

  appendTerminalLine(`paranoct@forest:~$ ${commandLine}`, "command");

  const [command, ...args] = commandLine.split(/\s+/);
  const normalized = command.toLowerCase();

  if (normalized === "help") {
    appendTerminalLine("help, about, status, track, play, pause, next, prev, volume <0-100>, links, clear");
    return;
  }

  if (normalized === "about") {
    appendTerminalLine("InfoSec, Python, C++, and a green forest mood.");
    return;
  }

  if (normalized === "status") {
    appendTerminalLine(`Track: ${tracks[state.currentIndex].title}`);
    appendTerminalLine(`State: ${audio.paused ? "paused" : "playing"} | Volume: ${Math.round(audio.volume * 100)}% | Loop: ${state.loop ? "on" : "off"}`);
    return;
  }

  if (normalized === "track") {
    appendTerminalLine(tracks[state.currentIndex].title);
    return;
  }

  if (normalized === "play") {
    await playCurrentTrack();
    appendTerminalLine("Playback started.");
    return;
  }

  if (normalized === "pause") {
    audio.pause();
    appendTerminalLine("Playback paused.");
    return;
  }

  if (normalized === "next") {
    setTrack(state.currentIndex + 1, { autoplay: true });
    appendTerminalLine(`Next: ${tracks[state.currentIndex].title}`);
    return;
  }

  if (normalized === "prev") {
    setTrack(state.currentIndex - 1, { autoplay: true });
    appendTerminalLine(`Previous: ${tracks[state.currentIndex].title}`);
    return;
  }

  if (normalized === "links") {
    appendTerminalLine("GitHub: https://github.com/paranoct");
    appendTerminalLine("Telegram: https://t.me/korben_322");
    return;
  }

  if (normalized === "volume") {
    const value = Number.parseInt(args[0], 10);

    if (!Number.isFinite(value) || value < 0 || value > 100) {
      appendTerminalLine("Usage: volume 0-100");
      return;
    }

    audio.volume = value / 100;
    persistVolume();
    updateVolumeUI();
    appendTerminalLine(`Volume set to ${value}%`);
    return;
  }

  if (normalized === "clear") {
    printTerminalIntro();
    return;
  }

  appendTerminalLine(`Unknown command: ${command}. Try help.`);
}

toggleBtn.addEventListener("click", () => {
  if (audio.paused) {
    void playCurrentTrack();
  } else {
    audio.pause();
  }
});

prevBtn.addEventListener("click", () => {
  setTrack(state.currentIndex - 1, { autoplay: !audio.paused });
});

nextBtn.addEventListener("click", () => {
  setTrack(state.currentIndex + 1, { autoplay: !audio.paused });
});

loopBtn.addEventListener("click", () => {
  state.loop = !state.loop;
  loopBtn.classList.toggle("active", state.loop);
  loopBtn.setAttribute("aria-pressed", String(state.loop));
  persistLoopState();
});

playlistBtn.addEventListener("click", () => {
  togglePlaylist();
});

volumeRange.addEventListener("input", () => {
  audio.volume = Number(volumeRange.value) / 100;
  persistVolume();
  updateVolumeUI();
});

progBar.addEventListener("click", (event) => {
  ensureTrackLoaded();

  if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
    return;
  }

  const rect = progBar.getBoundingClientRect();
  const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);

  audio.currentTime = ratio * audio.duration;
  persistTrackPosition(true);
});

terminalForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const value = terminalInput.value;
  terminalInput.value = "";
  await runTerminalCommand(value);
});

audio.addEventListener("loadedmetadata", () => {
  if (state.resumeTime > 0 && audio.duration > 0) {
    audio.currentTime = Math.min(state.resumeTime, Math.max(audio.duration - 0.25, 0));
  }

  persistTrackIndex();
  persistTrackPosition(true);
  timeLabel.textContent = `00:00 / ${formatTime(audio.duration)}`;
});

audio.addEventListener("timeupdate", () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
    return;
  }

  const progress = (audio.currentTime / audio.duration) * 100;
  progFill.style.width = `${progress}%`;
  progBar.setAttribute("aria-valuenow", progress.toFixed(0));
  timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  persistTrackPosition();
});

audio.addEventListener("play", updateToggleButton);
audio.addEventListener("pause", () => {
  updateToggleButton();
  persistTrackPosition(true);
});

audio.addEventListener("ended", () => {
  state.resumeTime = 0;
  state.lastSavedSecond = -1;
  persistTrackPosition(true);

  if (state.loop) {
    audio.currentTime = 0;
    void audio.play();
    return;
  }

  setTrack(state.currentIndex + 1, { autoplay: true });
});

document.addEventListener("click", (event) => {
  if (playlistPanel.classList.contains("open")
    && !playlistPanel.contains(event.target)
    && !playlistBtn.contains(event.target)) {
    togglePlaylist(false);
  }
});

document.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement ? document.activeElement.tagName : "";

  if (event.code === "Space" && activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
    event.preventDefault();

    if (audio.paused) {
      void playCurrentTrack();
    } else {
      audio.pause();
    }
  }

  if (event.key === "Escape") {
    togglePlaylist(false);
  }
});

window.addEventListener("beforeunload", () => {
  persistVolume();
  persistLoopState();
  persistTrackIndex();
  persistTrackPosition(true);
});

printTerminalIntro();
renderPlaylist();
applySavedPlayerState();
updateToggleButton();
persistVolume();
persistLoopState();
persistTrackIndex();
initLeaves();
