// =======================================================
// LA DOLCE — LUXURY SOUND & BACKGROUND NOTIFICATION ENGINE
// =======================================================

let audioCtx = null;
let staffWorker = null;
let isStaffRinging = false;
let originalDocTitle = document.title;
let titleFlashTimer = null;
let lastNotifiedOrderId = null;

// ສ້າງໄຟລ໌ສຽງ WAV ແບບບໍ່ຕ້ອງໂຫຼດຈາກ Server (ເພື່ອໃຫ້ <audio> ຫຼິ້ນໃນ Background ໄດ້ດີຂຶ້ນ)
function generateChimeWavDataUri() {
  const sampleRate = 22050;
  const duration = 0.7;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = t < 0.16 ? 587.33 : t < 0.34 ? 783.99 : 987.77;
    const env = Math.exp(-4.5 * (t % 0.18));
    const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.45;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

const staffBellAudio = new Audio(generateChimeWavDataUri());
staffBellAudio.preload = 'auto';

function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ປົດລັອກສຽງອັດຕະໂນມັດເມື່ອມີການແຕະໜ້າຈໍ
['click', 'touchstart', 'mousedown', 'keydown'].forEach(evt => {
  document.addEventListener(evt, () => {
    getAudioContext();
  }, { once: true, passive: true });
});

// ປຸ່ມໃຫ້ Staff ກົດເປີດສິດ Notification + Unlock ສຽງແຈ້ງເຕືອນ 100%
window.enableStaffNotifications = async function() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') await ctx.resume();

    // ທົດລອງຫຼິ້ນແບບງຽບເພື່ອປົດລັອກ <audio> element
    staffBellAudio.volume = 0.01;
    await staffBellAudio.play().then(() => {
      staffBellAudio.pause();
      staffBellAudio.currentTime = 0;
      staffBellAudio.volume = 1.0;
    }).catch(() => {});

    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        if (typeof showAtelierToast === 'function') {
          showAtelierToast('ເປີດລະບົບສຽງ ແລະ ການແຈ້ງເຕືອນນອກໜ້າແອັບສຳເລັດ!');
        }
        playStaffPulseTone();
      } else {
        if (typeof showAtelierToast === 'function') {
          showAtelierToast('ເປີດສຽງແຈ້ງເຕືອນໃນແອັບແລ້ວ (Notification ຖືກບລັອກໃນ Browser)', 'warning');
        }
      }
    }
    if (typeof updateStaffNotifyBadge === 'function') updateStaffNotifyBadge();
  } catch (e) {
    console.warn('Enable notify error:', e);
  }
};

// Web Worker ສຳລັບຕັ້ງເວລາໃນ Background Tab ໂດຍບໍ່ຖືກ Browser ຢຸດ
function ensureStaffWorker() {
  if (staffWorker) return staffWorker;
  try {
    const workerCode = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(() => self.postMessage('tick'), 3500);
        } else if (e.data === 'stop') {
          if (timer) { clearInterval(timer); timer = null; }
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    staffWorker = new Worker(URL.createObjectURL(blob));
    staffWorker.onmessage = () => {
      if (isStaffRinging) playStaffPulseTone();
    };
  } catch (e) {
    console.warn('Web Worker fallback:', e);
  }
  return staffWorker;
}

// ສຽງ "Kyoto Soft Crystal Marimba" ສຳລັບລູກຄ້າ
function playChime(isReady = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playChimeSound(ctx, isReady)).catch(() => {});
    } else {
      playChimeSound(ctx, isReady);
    }
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

function playChimeSound(ctx, isReady) {
  const now = ctx.currentTime;
  const freqs = isReady ? [659.25, 830.61, 987.77] : [587.33, 880];

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
    gain.gain.setValueAtTime(0.001, now + (idx * 0.08));
    gain.gain.linearRampToValueAtTime(0.25, now + (idx * 0.08) + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.08) + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + (idx * 0.08));
    osc.stop(now + (idx * 0.08) + 1.2);
  });
}

// ສຽງແຈ້ງເຕືອນ Staff (ຫຼິ້ນທັງ <audio> Element ແລະ AudioContext)
function playStaffPulseTone() {
  try {
    staffBellAudio.volume = 1.0;
    staffBellAudio.currentTime = 0;
    staffBellAudio.play().catch(() => {
      // Fallback ໄປ AudioContext ຖ້າ <audio> ຖືກຈຳກັດ
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      osc.frequency.setValueAtTime(880, now + 0.24);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    });
  } catch (e) {}
}

// ແຈ້ງເຕືອນ System Notification ເມື່ອ Staff ຢູ່ໜ້າຕ່າງອື່ນ ຫຼື ພັບແອັບໄວ້
function sendBackgroundOrderNotification(order) {
  if (!order || lastNotifiedOrderId === order.id) return;
  lastNotifiedOrderId = order.id;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const itemsText = (order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
      const noti = new Notification(`ອໍເດີ້ໃໝ່ #${order.orderCode || ''}`, {
        body: `${order.customerName || 'Guest'} | ${formatLAK(order.totalAmount)}\n${itemsText}`,
        tag: 'ladolce-order-' + order.id,
        renotify: true,
        requireInteraction: true
      });
      noti.onclick = () => {
        window.focus();
        noti.close();
      };
    } catch (e) {
      console.warn('Notification display error:', e);
    }
  }
}

function startTitleFlash() {
  if (titleFlashTimer) return;
  let toggle = false;
  titleFlashTimer = setInterval(() => {
    toggle = !toggle;
    document.title = toggle ? '[ມີອໍເດີ້ໃໝ່!] LA DOLCE' : originalDocTitle;
  }, 1000);
}

function stopTitleFlash() {
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer);
    titleFlashTimer = null;
  }
  document.title = originalDocTitle;
}

function startStaffAlarm(order = null) {
  const indicator = document.getElementById('staffRingingIndicator');
  if (indicator) {
    indicator.classList.remove('hidden');
    indicator.classList.add('flex');
  }

  if (order) sendBackgroundOrderNotification(order);
  startTitleFlash();

  if (isStaffRinging) return;
  isStaffRinging = true;

  playStaffPulseTone();
  const worker = ensureStaffWorker();
  if (worker) {
    worker.postMessage('start');
  }
}

function stopStaffAlarm() {
  isStaffRinging = false;
  if (staffWorker) staffWorker.postMessage('stop');
  stopTitleFlash();

  const indicator = document.getElementById('staffRingingIndicator');
  if (indicator) {
    indicator.classList.add('hidden');
    indicator.classList.remove('flex');
  }
}
