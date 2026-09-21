// =======================================================
// AUDIO ENGINE (NOTIFICATIONS & REPEATING ALARM)
// =======================================================

let audioCtx = null;
let staffAlarmInterval = null;

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playChime(isReady = false) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isReady ? 880 : 587, now);
    osc.frequency.exponentialRampToValueAtTime(isReady ? 1174 : 880, now + 0.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  } catch (e) {}
}

function playStaffPulseTone() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(659.25, now + 0.15);
    osc.frequency.setValueAtTime(880, now + 0.30);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

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
