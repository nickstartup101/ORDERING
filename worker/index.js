const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging';
const FCM_CHANNEL_ID = 'ladolce_orders_v1';
const MAX_ORDER_AGE_MS = 10 * 60 * 1000;

let cachedAccessToken = null;
let cachedAccessTokenExpiry = 0;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function encodeJsonBase64Url(value) {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function pemToArrayBuffer(pem) {
  const normalizedPem = String(pem).trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const encoded = normalizedPem
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleAccessToken(env) {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiry - 60_000) {
    return cachedAccessToken;
  }

  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKeyPem = env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail || !privateKeyPem) {
    throw new Error('FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be configured as Worker secrets.');
  }

  const now = Math.floor(Date.now() / 1000);
  const unsignedJwt = `${encodeJsonBase64Url({ alg: 'RS256', typ: 'JWT' })}.${encodeJsonBase64Url({
    iss: clientEmail,
    scope: FIRESTORE_SCOPE,
    aud: OAUTH_TOKEN_URL,
    iat: now,
    exp: now + 3600
  })}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedJwt)
  );
  const assertion = `${unsignedJwt}.${base64Url(new Uint8Array(signature))}`;
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) {
    console.error('Google OAuth token request failed:', response.status, result.error);
    throw new Error('Google service-account authentication failed.');
  }

  cachedAccessToken = result.access_token;
  cachedAccessTokenExpiry = Date.now() + Number(result.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

function firestoreDocumentUrl(projectId, documentPath) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${documentPath}`;
}

function firestoreRunQueryUrl(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
}

function getField(document, name) {
  const field = document?.fields?.[name];
  if (!field) return null;
  return field.stringValue ?? field.integerValue ?? field.doubleValue ?? field.booleanValue ?? field.timestampValue ?? null;
}

function isInvalidFcmToken(response, body) {
  if (response.status === 404 || body?.error?.status === 'NOT_FOUND') return true;
  return (body?.error?.details || []).some(detail => detail.errorCode === 'UNREGISTERED');
}

async function updateOrderNotificationClaim(projectId, orderId, accessToken, updateTime, claimed) {
  const url = new URL(firestoreDocumentUrl(projectId, `orders/${encodeURIComponent(orderId)}`));
  url.searchParams.append('updateMask.fieldPaths', 'staffPushNotified');
  url.searchParams.set('currentDocument.updateTime', updateTime);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      fields: { staffPushNotified: { booleanValue: claimed } }
    })
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error('Unable to claim this order for staff notification.');
    error.status = response.status;
    error.details = body;
    throw error;
  }
  return body.updateTime;
}

async function deactivateInvalidDevice(documentName, accessToken) {
  const url = new URL(`https://firestore.googleapis.com/v1/${documentName}`);
  url.searchParams.append('updateMask.fieldPaths', 'active');
  url.searchParams.append('updateMask.fieldPaths', 'updatedAt');
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        active: { booleanValue: false },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
    })
  });
  if (!response.ok) {
    console.error('Unable to deactivate invalid staff FCM token:', response.status, documentName);
  }
}

async function sendStaffNotification(projectId, accessToken, device, orderId, orderCode, title, body) {
  return sendNotification(projectId, accessToken, device, {
    title,
    body,
    data: { orderId, orderCode }
  });
}

async function sendNotification(projectId, accessToken, device, notification) {
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token: device.token,
          notification: { title: notification.title, body: notification.body },
          android: {
            priority: 'high',
            notification: {
              channelId: FCM_CHANNEL_ID,
              sound: 'order_alert',
              notificationPriority: 'PRIORITY_MAX',
              visibility: 'PUBLIC',
              defaultVibrateTimings: true
            }
          },
          data: notification.data
        }
      })
    }
  );
  const result = await response.json().catch(() => ({}));
  if (response.ok) return { sent: true, httpStatus: response.status, fcmResponse: result };

  if (isInvalidFcmToken(response, result)) {
    await deactivateInvalidDevice(device.documentName, accessToken);
    return { sent: false, invalid: true, httpStatus: response.status, fcmResponse: result };
  }
  console.error('FCM send failed:', response.status, result.error?.status);
  return { sent: false, invalid: false, httpStatus: response.status, fcmResponse: result };
}

async function listActiveStaffDevices(projectId, accessToken) {
  const response = await fetch(firestoreRunQueryUrl(projectId), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'staff_devices' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'active' },
            op: 'EQUAL',
            value: { booleanValue: true }
          }
        }
      }
    })
  });
  const results = await response.json();
  if (!response.ok) {
    console.error('Firestore staff-device query failed:', response.status);
    throw new Error('staff_device_lookup_failed');
  }

  return results
    .filter(result => result.document)
    .map(result => ({
      token: getField(result.document, 'token'),
      documentName: result.document.name
    }))
    .filter(device => typeof device.token === 'string' && device.token.length > 0);
}

function diagnosticsAuthorizationError(request, env) {
  const expectedToken = env.PUSH_DIAGNOSTICS_TOKEN;
  if (!expectedToken) return jsonResponse({ error: 'push_diagnostics_not_configured' }, 503);
  if (request.headers.get('authorization') !== `Bearer ${expectedToken}`) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  return null;
}

async function pushStatus(request, env) {
  if (request.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, 405);
  const authError = diagnosticsAuthorizationError(request, env);
  if (authError) return authError;

  const projectId = env.FIREBASE_PROJECT_ID || 'ladolceordering';
  const status = {
    hasProjectId: Boolean(projectId),
    hasClientEmail: Boolean(env.FIREBASE_CLIENT_EMAIL?.trim()),
    hasPrivateKey: Boolean(env.FIREBASE_PRIVATE_KEY?.trim()),
    oauthOk: false,
    activeDevicesCount: null,
    error: null
  };

  try {
    const accessToken = await getGoogleAccessToken(env);
    status.oauthOk = true;
    status.activeDevicesCount = (await listActiveStaffDevices(projectId, accessToken)).length;
  } catch (error) {
    status.error = error.message === 'staff_device_lookup_failed'
      ? 'staff_device_lookup_failed'
      : 'firebase_authentication_failed';
  }
  return jsonResponse(status);
}

async function testPush(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);
  const authError = diagnosticsAuthorizationError(request, env);
  if (authError) return authError;

  const projectId = env.FIREBASE_PROJECT_ID || 'ladolceordering';
  try {
    const accessToken = await getGoogleAccessToken(env);
    const devices = await listActiveStaffDevices(projectId, accessToken);
    const results = await Promise.all(devices.map(async device => {
      try {
        const result = await sendNotification(projectId, accessToken, device, {
          title: 'LA DOLCE Staff notification test',
          body: 'Push notifications are working.',
          data: { test: 'true' }
        });
        return {
          deviceId: device.documentName.split('/').pop(),
          sent: result.sent,
          invalid: result.invalid || false,
          httpStatus: result.httpStatus,
          fcmResponse: result.fcmResponse
        };
      } catch (error) {
        console.error('FCM test notification failed:', error.message);
        return {
          deviceId: device.documentName.split('/').pop(),
          sent: false,
          error: 'fcm_request_failed'
        };
      }
    }));
    return jsonResponse({
      ok: results.every(result => result.sent),
      activeDevicesCount: devices.length,
      sent: results.filter(result => result.sent).length,
      results
    });
  } catch (error) {
    console.error('Staff push test failed:', error.message);
    return jsonResponse({ error: error.message === 'staff_device_lookup_failed'
      ? 'staff_device_lookup_failed'
      : 'firebase_authentication_failed' }, 502);
  }
}

async function notifyStaff(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return jsonResponse({ error: 'content_type_must_be_application_json' }, 415);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }
  const orderId = typeof payload?.orderId === 'string' ? payload.orderId.trim() : '';
  if (!orderId || orderId.includes('/') || orderId.length > 150) {
    return jsonResponse({ error: 'invalid_order_id' }, 400);
  }

  const projectId = env.FIREBASE_PROJECT_ID || 'ladolceordering';
  try {
    const accessToken = await getGoogleAccessToken(env);
    const orderResponse = await fetch(
      firestoreDocumentUrl(projectId, `orders/${encodeURIComponent(orderId)}`),
      { headers: { authorization: `Bearer ${accessToken}` } }
    );
    if (orderResponse.status === 404) return jsonResponse({ error: 'order_not_found' }, 404);
    const order = await orderResponse.json();
    if (!orderResponse.ok) {
      console.error('Firestore order lookup failed:', orderResponse.status, order.error?.status);
      return jsonResponse({ error: 'order_lookup_failed' }, 502);
    }

    const orderCode = String(getField(order, 'orderCode') || orderId.slice(0, 6).toUpperCase());
    const status = getField(order, 'status');
    const createdAt = getField(order, 'createdAt');
    const orderAge = createdAt ? Date.now() - Date.parse(createdAt) : Number.POSITIVE_INFINITY;
    if (status !== 'pending' || getField(order, 'staffPushNotified') === true ||
        !Number.isFinite(orderAge) || orderAge < -60_000 || orderAge > MAX_ORDER_AGE_MS) {
      return jsonResponse({ ok: true, sent: 0, skipped: true });
    }

    let devices;
    try {
      devices = await listActiveStaffDevices(projectId, accessToken);
    } catch {
      return jsonResponse({ error: 'staff_device_lookup_failed' }, 502);
    }
    if (devices.length === 0) return jsonResponse({ ok: true, sent: 0 });

    let claimedUpdateTime;
    try {
      claimedUpdateTime = await updateOrderNotificationClaim(
        projectId, orderId, accessToken, order.updateTime, true
      );
    } catch (error) {
      if (error.status === 409 || error.details?.error?.status === 'FAILED_PRECONDITION') {
        return jsonResponse({ ok: true, sent: 0, duplicate: true });
      }
      console.error('Order notification claim failed:', error.status || 'network_error');
      return jsonResponse({ error: 'order_notification_claim_failed' }, 502);
    }

    const customerName = String(getField(order, 'customerName') || 'Customer');
    const totalAmount = Number(getField(order, 'totalAmount') || 0);
    const formattedTotal = Number.isFinite(totalAmount) ? totalAmount.toLocaleString('en-US') : '0';
    const title = `New order ${orderCode}`;
    const body = `${customerName} · ${formattedTotal} LAK`;
    const results = await Promise.all(devices.map(device =>
      sendStaffNotification(projectId, accessToken, device, orderId, orderCode, title, body)
        .catch(error => {
          console.error('FCM request failed:', error.message);
          return { sent: false, invalid: false };
        })
    ));
    const sent = results.filter(result => result.sent).length;

    if (sent === 0) {
      try {
        await updateOrderNotificationClaim(
          projectId, orderId, accessToken, claimedUpdateTime, false
        );
      } catch (error) {
        console.error('Unable to release failed notification claim:', error.status || 'network_error');
      }
      return jsonResponse({ error: 'notification_delivery_failed', sent: 0 }, 502);
    }

    return jsonResponse({
      ok: true,
      sent,
      inactive: results.filter(result => result.invalid).length
    });
  } catch (error) {
    console.error('Staff notification request failed:', error.message);
    return jsonResponse({ error: 'staff_notification_failed' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/notify-staff') {
      return notifyStaff(request, env);
    }
    if (url.pathname === '/api/push-status') {
      return pushStatus(request, env);
    }
    if (url.pathname === '/api/test-push') {
      return testPush(request, env);
    }
    if (url.pathname.startsWith('/api/')) {
      return jsonResponse({ error: 'not_found' }, 404);
    }
    return env.ASSETS.fetch(request);
  }
};
