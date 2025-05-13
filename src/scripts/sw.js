self.addEventListener('install', (event) => {
  console.log('Service Worker installing...', event);
  self.skipWaiting(); // Ensures the service worker activates immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...', event);
  // Claim clients so the service worker is in control immediately
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Service worker received push notification:', event);

  let title = 'StoryShare';
  let options = {
    body: 'Ada cerita baru untuk Anda!',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
    },
    actions: [
      {
        action: 'explore',
        title: 'Lihat Cerita',
        icon: '/favicon.png',
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: '/favicon.png',
      },
    ],
  };

  // Parse data dari push message jika ada
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data received:', data);

      // Format yang diharapkan dari API:
      // {
      //   "title": "Story berhasil dibuat",
      //   "options": {
      //     "body": "Anda telah membuat story baru dengan deskripsi: <story description>"
      //   }
      // }

      if (data.title) {
        title = data.title;
      }

      if (data.options) {
        options = { ...options, ...data.options };
      }
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  console.log('Showing notification with:', { title, options });
  event.waitUntil(self.registration.showNotification(title, options));
});

// Event listener untuk klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  // Buka aplikasi dan arahkan ke halaman yang sesuai
  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/home'));
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Jika ada jendela yang sudah terbuka, fokuskan
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        // Jika tidak ada jendela yang terbuka, buka yang baru
        return clients.openWindow('/');
      }),
    );
  }
});
