// Web Audio API Sound System
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

// ສຽງແຈ້ງເຕືອນລູກຄ້າ (ສຽງກະດິ່ງຄາເຟ່)
function playBoutiqueChime(isReady = false) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    if (isReady) {
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.35); // A5
      osc2.frequency.setValueAtTime(880, now + 0.35);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.7); // D6
    } else {
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.25); // E5
    }

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + (isReady ? 1.2 : 0.6));

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  } catch (err) {
    console.warn("Audio restrained by browser policy:", err);
  }
}

// ສຽງແຈ້ງເຕືອນສຳລັບ Admin/Barista ວົນຊ້ຳ (Repeat Alarm) ຈົນກວ່າຈະກົດຮັບ
function startStaffAlarm() {
  const indicator = document.getElementById('staffRingingIndicator');
  if (indicator) indicator.classList.remove('hidden');

  if (staffAlarmInterval) return;

  playStaffPulseTone();
  staffAlarmInterval = setInterval(() => {
    playStaffPulseTone();
  }, 3500);
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

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {}
}

function stopStaffAlarm() {
  if (staffAlarmInterval) {
    clearInterval(staffAlarmInterval);
    staffAlarmInterval = null;
  }
  const indicator = document.getElementById('staffRingingIndicator');
  if (indicator) indicator.classList.add('hidden');
}
