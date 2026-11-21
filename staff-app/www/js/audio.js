// =======================================================
// LA DOLCE — LUXURY SOUND & BACKGROUND NOTIFICATION ENGINE
// =======================================================

let audioCtx = null;
let staffWorker = null;
let isStaffRinging = false;
let isBellAudioUnlocked = false;
let originalDocTitle = document.title;
let titleFlashTimer = null;
let lastNotifiedOrderId = null;

function generateChimeWavDataUri() {
  const sampleRate = 22050;
  const duration = 0.75;
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
    const env = Math.exp(-4.0 * (t % 0.18));
    const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.65;
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

function unlockAllAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (!isBellAudioUnlocked) {
      staffBellAudio.volume = 0.01;
      staffBellAudio.play().then(() => {
        staffBellAudio.pause();
        staffBellAudio.currentTime = 0;
        staffBellAudio.volume = 1.0;
        isBellAudioUnlocked = true;
        // ຖ້າມີອໍເດີ້ຄ້າງສົ່ງສຽງຢູ່ ໃຫ້ດັງທັນທີຫຼັງປົດລັອກ
        if (isStaffRinging) playStaffPulseTone();
      }).catch(() => {
        staffBellAudio.volume = 1.0;
      });
    }
  } catch (_) {}
}

// ປົດລັອກສຽງທຸກຄັ້ງທີ່ Staff ແຕະ/ຄລິກບ່ອນໃດກໍໄດ້ຈົນກວ່າຈະປົດລັອກສຳເລັດ
['click', 'touchstart', 'mousedown', 'keydown'].forEach(evt => {
  document.addEventListener(evt, () => {
    if (!isBellAudioUnlocked) unlockAllAudio();
  }, { passive: true });
});

window.enableStaffNotifications = async function() {
  try {
    unlockAllAudio();
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        if (typeof showAtelierToast === 'function') {
          showAtelierToast('ເປີດລະບົບສຽງ ແລະ ການແຈ້ງເຕືອນນອກໜ້າແອັບສຳເລັດ!');
        }
      } else {
        if (typeof showAtelierToast === 'function') {
          showAtelierToast('ເປີດສຽງແຈ້ງເຕືອນໃນແອັບແລ້ວ (Notification ຖືກບລັອກໃນ Browser)', 'warning');
        }
      }
    }
    playStaffPulseTone();
    if (typeof updateStaffNotifyBadge === 'function') updateStaffNotifyBadge();
  } catch (e) {
    console.warn('Enable notify error:', e);
  }
};

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
    gain.gain.linearRampToValueAtTime(0.28, now + (idx * 0.08) + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.08) + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + (idx * 0.08));
    osc.stop(now + (idx * 0.08) + 1.2);
  });
}

function playStaffPulseTone() {
  try {
    staffBellAudio.volume = 1.0;
    staffBellAudio.currentTime = 0;
    staffBellAudio.play().catch(() => {
      // Fallback Web Audio API
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.3, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    });
  } catch (e) {}
}

function sendBackgroundOrderNotification(order) {
  if (!order || lastNotifiedOrderId === order.id) return;
  lastNotifiedOrderId = order.id;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const itemsText = (order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
      const noti = new Notification(`ອໍເດີ້ໃໝ່ #${order.orderCode || ''}`, {
        body: `${order.customerName || 'Guest'} | ${formatLAK(order.totalAmount ?? order.total ?? 0)}\n${itemsText}`,
        tag: 'ladolce-order-' + order.id,
        renotify: true,
        requireInteraction: true
      });
      noti.onclick = () => {
        window.focus();
        noti.close();
      };
    } catch (e) {}
  }
}

function startTitleFlash() {
  if (titleFlashTimer) return;
  let toggle = false;
  titleFlashTimer = setInterval(() => {
    toggle = !toggle;
    const cafeName = (typeof brandSettings !== 'undefined' && brandSettings?.cafeName) ? brandSettings.cafeName : 'LA DOLCE';
    document.title = toggle ? `[ມີອໍເດີ້ໃໝ່!] ${cafeName}` : originalDocTitle;
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
  if (worker) worker.postMessage('start');
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
