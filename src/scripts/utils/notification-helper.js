// Fungsi untuk memeriksa apakah Notification API tersedia
export function isNotificationAvailable() {
  return 'Notification' in window;
}

// Fungsi untuk memeriksa apakah izin notifikasi sudah diberikan
export function isNotificationGranted() {
  return Notification.permission === 'granted';
}

// Fungsi untuk memeriksa apakah izin notifikasi ditolak
export function isNotificationDenied() {
  return Notification.permission === 'denied';
}

// Fungsi untuk meminta izin notifikasi
export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error('Notification API tidak didukung di browser ini.');
    return false;
  }

  if (isNotificationGranted()) {
    return true;
  }

  const status = await Notification.requestPermission();

  if (status === 'denied') {
    alert('Izin notifikasi ditolak.');
    return false;
  }

  if (status === 'default') {
    alert('Permintaan izin notifikasi ditutup atau diabaikan.');
    return false;
  }

  return true;
}

// Fungsi untuk mendapatkan langganan push saat ini
export async function getPushSubscription() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker API tidak didukung di browser ini.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.error('Service worker tidak terdaftar.');
      return null;
    }
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

// Fungsi untuk memeriksa apakah langganan push saat ini tersedia
export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}

// Fungsi untuk mengkonversi base64 ke Uint8Array (untuk VAPID key)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Fungsi untuk berlangganan notifikasi
export async function subscribeNotification() {
  console.log('Attempting to subscribe to notifications...');

  if (!(await requestNotificationPermission())) {
    console.error('Failed to get notification permission');
    return false;
  }

  if (await isCurrentPushSubscriptionAvailable()) {
    console.log('Already subscribed to notifications');
    alert('Anda sudah berlangganan notifikasi.');
    return true;
  }

  try {
    // Pastikan service worker sudah terdaftar dan aktif
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.error('Service worker tidak terdaftar. Notifikasi tidak dapat diaktifkan.');
      alert('Service worker tidak terdaftar. Notifikasi tidak dapat diaktifkan.');
      return false;
    }

    console.log('Service worker is ready:', registration);

    // Gunakan VAPID key dari API
    const vapidPublicKey =
      'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
    console.log('Using VAPID key:', vapidPublicKey);

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    console.log('Converted application server key:', applicationServerKey);

    console.log('Subscribing to push service...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });

    console.log('Push subscription created:', subscription);

    // Kirim subscription ke server
    const { getAccessToken } = await import('../utils/auth');
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.error('No access token available');
      alert('Anda harus login untuk mengaktifkan notifikasi.');
      await subscription.unsubscribe();
      return false;
    }

    const subscriptionJson = subscription.toJSON();
    console.log('Subscription JSON to send to server:', subscriptionJson);

    console.log('Sending subscription to server...');
    const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
        },
      }),
    });

    const responseData = await response.json();
    console.log('Server response:', responseData);

    if (!response.ok) {
      console.error('Failed to subscribe on server:', responseData);
      alert(`Gagal mendaftarkan notifikasi ke server: ${responseData.message}`);
      await subscription.unsubscribe();
      return false;
    }

    console.log('Successfully subscribed to notifications:', responseData);
    alert('Notifikasi berhasil diaktifkan! Anda akan menerima notifikasi saat ada cerita baru.');

    // Test notification to verify everything is working
    showCustomNotification(
      'Notifikasi Diaktifkan',
      'Anda akan menerima notifikasi saat ada cerita baru dibuat.',
      {
        duration: 5000,
      },
    );

    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    alert(`Gagal mengaktifkan notifikasi: ${error.message}. Silakan coba lagi nanti.`);
    return false;
  }
}

// Fungsi untuk berhenti berlangganan notifikasi
export async function unsubscribeNotification() {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) {
      console.log('No active subscription found');
      alert('Anda belum berlangganan notifikasi.');
      return false;
    }

    const subscriptionJson = subscription.toJSON();
    console.log('Unsubscribing with subscription:', subscriptionJson);

    // Kirim permintaan unsubscribe ke server
    const { getAccessToken } = await import('../utils/auth');
    const accessToken = getAccessToken();

    console.log('Sending unsubscribe request to server...');
    const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint: subscriptionJson.endpoint,
      }),
    });

    const responseData = await response.json();
    console.log('Server unsubscribe response:', responseData);

    if (!response.ok) {
      console.error('Failed to unsubscribe on server:', responseData);
      alert(`Gagal menonaktifkan notifikasi di server: ${responseData.message}`);
      return false;
    }

    console.log('Unsubscribing from push manager...');
    const result = await subscription.unsubscribe();
    if (result) {
      console.log('Successfully unsubscribed');
      alert('Notifikasi berhasil dinonaktifkan.');
      return true;
    } else {
      console.error('Failed to unsubscribe in browser');
      alert('Gagal menonaktifkan notifikasi di browser.');
      return false;
    }
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    alert(`Gagal menonaktifkan notifikasi: ${error.message}`);
    return false;
  }
}

// Fungsi untuk toggle langganan notifikasi
export async function toggleNotificationSubscription() {
  const isSubscribed = await isCurrentPushSubscriptionAvailable();
  console.log('Current subscription status:', isSubscribed);

  if (isSubscribed) {
    const confirmUnsubscribe = confirm('Apakah Anda ingin menonaktifkan notifikasi?');
    if (confirmUnsubscribe) {
      return await unsubscribeNotification();
    }
    return false;
  } else {
    const confirmSubscribe = confirm(
      'Apakah Anda ingin mengaktifkan notifikasi? Anda akan menerima pemberitahuan setiap ada cerita baru.',
    );
    if (confirmSubscribe) {
      return await subscribeNotification();
    }
    return false;
  }
}

// Fungsi untuk menampilkan notifikasi kustom di UI (bukan push notification)
export function showCustomNotification(title, message, options = {}) {
  const notificationContainer = document.createElement('div');
  notificationContainer.className = 'custom-notification';

  const notificationContent = document.createElement('div');
  notificationContent.className = 'custom-notification-content';

  const notificationTitle = document.createElement('h3');
  notificationTitle.textContent = title;

  const notificationMessage = document.createElement('p');
  notificationMessage.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.className = 'custom-notification-close';
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', 'Close notification');

  notificationContent.appendChild(notificationTitle);
  notificationContent.appendChild(notificationMessage);

  if (options.actions && options.actions.length) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'custom-notification-actions';

    options.actions.forEach((action) => {
      const button = document.createElement('button');
      button.textContent = action.text;
      button.className = action.primary ? 'primary-action' : 'secondary-action';
      button.addEventListener('click', () => {
        if (options.onAction) options.onAction(action.action);
        document.body.removeChild(notificationContainer);
      });
      actionsContainer.appendChild(button);
    });

    notificationContent.appendChild(actionsContainer);
  }

  notificationContainer.appendChild(notificationContent);
  notificationContainer.appendChild(closeButton);

  closeButton.addEventListener('click', () => {
    document.body.removeChild(notificationContainer);
  });

  document.body.appendChild(notificationContainer);

  // Auto-dismiss after duration if specified
  if (options.duration) {
    setTimeout(() => {
      if (document.body.contains(notificationContainer)) {
        document.body.removeChild(notificationContainer);
      }
    }, options.duration);
  }
}
