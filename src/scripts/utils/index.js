// Add this function to test if push notifications are working
export async function testPushNotification() {
  try {
    if (!('serviceWorker' in navigator)) {
      alert('Service Worker API tidak didukung di browser ini.');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      alert('Service worker tidak terdaftar.');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      alert('Anda belum berlangganan notifikasi. Silakan aktifkan notifikasi terlebih dahulu.');
      return false;
    }

    // Simulate a push notification
    registration.showNotification('Test Notification', {
      body: 'Ini adalah notifikasi test untuk memastikan push notification berfungsi.',
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'explore',
          title: 'Lihat',
          icon: '/favicon.png',
        },
        {
          action: 'close',
          title: 'Tutup',
          icon: '/favicon.png',
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Error testing push notification:', error);
    alert(`Gagal mengirim notifikasi test: ${error.message}`);
    return false;
  }
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export async function createCarousel(containerElement, options = {}) {
  const { tns } = await import('tiny-slider');

  return tns({
    container: containerElement,
    mouseDrag: true,
    swipeAngle: false,
    speed: 600,

    nav: true,
    navPosition: 'bottom',

    autoplay: false,
    controls: false,

    ...options,
  });
}

export function convertBlobToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export function convertBase64ToBlob(base64Data, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

export function convertBase64ToUint8Array(base64String) {
  try {
    // Pastikan input adalah string
    if (typeof base64String !== 'string') {
      console.error('convertBase64ToUint8Array: Input bukan string', base64String);
      throw new Error('Input must be a string');
    }

    // Log untuk debugging
    console.log('Converting base64 string to Uint8Array, length:', base64String.length);

    // Tambahkan padding jika diperlukan
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);

    // Ganti karakter URL-safe dengan karakter Base64 standar
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    // Decode base64 ke string biner
    let rawData;
    try {
      rawData = atob(base64);
    } catch (error) {
      console.error('Error decoding base64:', error);
      throw new Error('Invalid base64 string');
    }

    // Konversi string biner ke Uint8Array
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    // Log untuk debugging
    console.log('Converted to Uint8Array, length:', outputArray.length);

    return outputArray;
  } catch (error) {
    console.error('Error in convertBase64ToUint8Array:', error);
    // Fallback ke implementasi alternatif jika konversi gagal
    return fallbackBase64ToUint8Array(base64String);
  }
}

// Implementasi alternatif jika metode utama gagal
function fallbackBase64ToUint8Array(base64String) {
  try {
    console.log('Using fallback base64 conversion method');

    // Metode alternatif menggunakan TextEncoder
    const binaryString = window.atob(base64String);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  } catch (error) {
    console.error('Fallback conversion also failed:', error);
    // Jika semua metode gagal, kembalikan array kosong
    return new Uint8Array(0);
  }
}

export function transitionHelper({ skipTransition = false, updateDOM }) {
  if (skipTransition || !document.startViewTransition) {
    const updateCallbackDone = Promise.resolve(updateDOM()).then(() => undefined);

    return {
      ready: Promise.reject(Error('View transitions unsupported')),
      updateCallbackDone,
      finished: updateCallbackDone,
    };
  }

  return document.startViewTransition(updateDOM);
}

export function formatCoordinates(lat, lon) {
  if (lat === undefined || lon === undefined || lat === null || lon === null) {
    return 'Unknown location';
  }

  return `${lat}, ${lon}`;
}

export function isServiceWorkerAvailable() {
  return 'serviceWorker' in navigator;
}

export async function registerServiceWorker() {
  if (!isServiceWorkerAvailable()) {
    console.log('Service Worker API unsupported');
    return;
  }

  try {
    console.log('Registering service worker...');
    const registration = await navigator.serviceWorker.register('/sw.bundle.js');
    console.log('Service worker telah terpasang', registration);

    // Tunggu service worker aktif
    if (registration.installing) {
      console.log('Service worker installing');
      const sw = registration.installing || registration.waiting;
      sw.addEventListener('statechange', (e) => {
        console.log('Service worker state changed:', e.target.state);
      });
    } else if (registration.active) {
      console.log('Service worker already active');
    }

    // Setelah service worker terdaftar, periksa apakah perlu berlangganan notifikasi
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      const { isCurrentPushSubscriptionAvailable, subscribeNotification } = await import(
        './notification-helper'
      );
      if (!(await isCurrentPushSubscriptionAvailable())) {
        console.log('No active subscription found, attempting to subscribe...');
        // Jika izin sudah diberikan tapi belum berlangganan, coba berlangganan otomatis
        await subscribeNotification();
      } else {
        console.log('Active subscription found');
      }
    } else {
      console.log('Notification permission not granted:', Notification.permission);
    }

    // Tampilkan notifikasi selamat datang
    const { showCustomNotification } = await import('./notification-helper');
    showCustomNotification(
      'Selamat Datang di StoryShare',
      'Aplikasi siap digunakan. Aktifkan notifikasi untuk mendapatkan update cerita terbaru.',
      {
        duration: 5000,
      },
    );

    return registration;
  } catch (error) {
    console.error('Failed to install service worker:', error);
    return null;
  }
}

// Fungsi untuk menguji notifikasi
export async function testNotification() {
  const { showCustomNotification } = await import('./notification-helper');
  showCustomNotification(
    'Ini Notifikasi Test',
    'Ini adalah contoh notifikasi yang muncul di ujung kanan layar.',
    {
      actions: [
        {
          action: 'view',
          text: 'Lihat',
          primary: true,
        },
        {
          action: 'dismiss',
          text: 'Tutup',
        },
      ],
      onAction: (action) => {
        if (action === 'view') {
          alert('Anda mengklik tombol Lihat');
        }
      },
    },
  );
}
