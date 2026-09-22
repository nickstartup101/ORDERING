// =======================================================
// LA DOLCE — MINIMAL LUXURY ATELIER SOUND ENGINE
// =======================================================

let audioCtx = null;
let staffAlarmInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ປົດລັອກສຽງທັນທີເມື່ອມີການແຕະໜ້າຈໍຄັ້ງທຳອິດ
['click', 'touchstart', 'mousedown'].forEach(evt => {
  document.addEventListener(evt, () => {
    getAudioContext();
  }, { once: true, passive: true });
});

// 🔥 ສຽງ "Kyoto Soft Crystal Marimba" ສຳລັບລູກຄ້າ (Minimal, Warm, Premium)
function playChime(isReady = false) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    // Harmonic Frequencies: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz)
    const freqs = isReady ? [659.25, 830.61, 987.77] : [587.33, 880];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine'; // Sine wave ໃຫ້ສຽງມົນ, ອົບອຸ່ນ ບໍ່ແສບຫູ
      osc.frequency.setValueAtTime(freq, now + (idx * 0.08));

      // Attack & Decay ແບບລະຄັງແກ້ວ Marimba
      gain.gain.setValueAtTime(0.001, now + (idx * 0.08));
      gain.gain.linearRampToValueAtTime(0.2, now + (idx * 0.08) + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.08) + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + (idx * 0.08));
      osc.stop(now + (idx * 0.08) + 1.2);
    });
  } catch (e) {
    console.warn("Audio feedback issue:", e);
  }
}

// ສຽງເຕືອນ Barista ເມື່ອມີອໍເດີ້ໃໝ່ເຂົ້າມາ (Boutique Triangle Pulse)
function playStaffPulseTone() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(659.25, now + 0.12);
    osc.frequency.setValueAtTime(880, now + 0.24);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {}
}

function startStaffAlarm() {
  const indicator = document.getElementById('staffRingingIndicator');
  if (indicator) indicator.classList.remove('hidden');

  if (staffAlarmInterval) return;

  playStaffPulseTone();
  staffAlarmInterval = setInterval(() => {
    playStaffPulseTone();
  }, 3500);
}

function stopStaffAlarm() {
  if (staffAlarmInterval) {
    clearInterval(staffAlarmInterval);
    staffAlarmInterval = null;
  }
  const indicator = document.getElementById('staffRingingIndicator');
  if (indicator) indicator.classList.add('hidden');
}
