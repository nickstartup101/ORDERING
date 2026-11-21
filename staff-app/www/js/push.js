// =======================================================
// LA DOLCE — NATIVE STAFF PUSH REGISTRATION
// =======================================================

const STAFF_PUSH_CHANNEL_ID = 'ladolce_orders_v1';
const STAFF_PUSH_DEVICE_ID_KEY = 'ladolce_staff_push_device_id';
const STAFF_PUSH_EMAIL_KEY = 'ladolce_staff_push_email';
let staffPushInitialization = null;
let staffPushListenersInstalled = false;
let pendingStaffPushOrderId = null;

function isStaffNativePlatform() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

function isStaffPushUser(user = currentUser) {
  return Boolean(user && ['staff', 'superadmin'].includes(user.role) && user.email);
}

async function getStaffPushDeviceId(token) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure token hashing is unavailable on this device.');
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function saveStaffPushToken(token) {
  if (!db || !isStaffPushUser()) {
    throw new Error('A signed-in staff account is required to save this device token.');
  }

  const user = currentUser;
  const deviceId = await getStaffPushDeviceId(token);
  const device = db.collection('staff_devices').doc(deviceId);
  await device.set({
    token,
    email: user.email,
    name: user.name || '',
    role: user.role,
    platform: 'android',
    active: true,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  if (!isStaffPushUser() || currentUser.email !== user.email) {
    await device.set({
      active: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return;
  }

  localStorage.setItem(STAFF_PUSH_DEVICE_ID_KEY, deviceId);
  localStorage.setItem(STAFF_PUSH_EMAIL_KEY, user.email);
}

async function installStaffPushListeners(plugin) {
  if (staffPushListenersInstalled) return;

  await Promise.all([
    plugin.addListener('registration', result => {
      saveStaffPushToken(result.value).catch(error => {
        console.error('Unable to save staff push token:', error);
        showAtelierToast('ບັນທຶກ Push token ບໍ່ສຳເລັດ', 'error');
      });
    }),
    plugin.addListener('registrationError', error => {
      console.error('Staff push registration failed:', error);
      showAtelierToast('ລົງທະບຽນ Push Notification ບໍ່ສຳເລັດ', 'error');
    }),
    plugin.addListener('pushNotificationActionPerformed', action => {
      const orderId = action.notification?.data?.orderId;
      if (!orderId) return;
      pendingStaffPushOrderId = String(orderId);
      flushPendingStaffPushOrderReview();
    })
  ]);
  staffPushListenersInstalled = true;
}

async function initializeStaffPush() {
  if (!isStaffNativePlatform() || !isStaffPushUser()) return false;
  if (staffPushInitialization) return staffPushInitialization;

  staffPushInitialization = (async () => {
    const plugin = window.Capacitor?.Plugins?.PushNotifications;
    if (!plugin) throw new Error('Capacitor Push Notifications plugin is unavailable.');

    await plugin.createChannel({
      id: STAFF_PUSH_CHANNEL_ID,
      name: 'LA DOLCE New Orders',
      importance: 5,
      visibility: 1,
      lights: true,
      vibration: true,
      sound: 'order_alert.wav'
    });
    await installStaffPushListeners(plugin);

    const permission = await plugin.requestPermissions();
    if (permission.receive !== 'granted') {
      showAtelierToast('ກະລຸນາອະນຸຍາດ Notification ເພື່ອຮັບອໍເດີ້', 'warning');
      return false;
    }

    await plugin.register();
    return true;
  })().catch(error => {
    console.error('Staff push initialization failed:', error);
    showAtelierToast('ເປີດ Push Notification ບໍ່ສຳເລັດ', 'error');
    return false;
  }).finally(() => {
    staffPushInitialization = null;
  });

  return staffPushInitialization;
}

async function deactivateStaffPushToken() {
  const deviceId = localStorage.getItem(STAFF_PUSH_DEVICE_ID_KEY);
  const email = localStorage.getItem(STAFF_PUSH_EMAIL_KEY);
  if (!deviceId || !email || !db) return;

  await db.collection('staff_devices').doc(deviceId).set({
    active: false,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  localStorage.removeItem(STAFF_PUSH_DEVICE_ID_KEY);
  localStorage.removeItem(STAFF_PUSH_EMAIL_KEY);
}

function flushPendingStaffPushOrderReview() {
  if (!pendingStaffPushOrderId || !isStaffPushUser()) return;
  const orderExists = (window.allStaffOrders || []).some(order => order.id === pendingStaffPushOrderId);
  if (!orderExists || typeof window.openStaffOrderReviewModal !== 'function') return;

  const orderId = pendingStaffPushOrderId;
  pendingStaffPushOrderId = null;
  window.openStaffOrderReviewModal(orderId);
}

const enableBrowserStaffNotifications = window.enableStaffNotifications;
window.enableStaffNotifications = async function() {
  if (!isStaffNativePlatform()) {
    if (enableBrowserStaffNotifications) await enableBrowserStaffNotifications();
    return;
  }

  if (typeof unlockAllAudio === 'function') unlockAllAudio();
  await initializeStaffPush();
  if (typeof playStaffPulseTone === 'function') playStaffPulseTone();
  if (typeof updateStaffNotifyBadge === 'function') updateStaffNotifyBadge();
};

window.initializeStaffPush = initializeStaffPush;
window.deactivateStaffPushToken = deactivateStaffPushToken;
window.flushPendingStaffPushOrderReview = flushPendingStaffPushOrderReview;
