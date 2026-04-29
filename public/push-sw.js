// Mobile11 Native Push Notification Service Worker
// Uses Web Push (VAPID) standard for push notifications

self.addEventListener('install', (event) => {
  console.log('[Push SW] Installing service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Push SW] Service worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Push SW] Push message received:', event);
  
  let data = {
    title: 'Mobile11',
    body: 'You have a new notification',
    icon: '/favicon-512.png',
    badge: '/favicon-512.png',
    tag: 'mobile11-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || {}
      };
    } catch (e) {
      console.log('[Push SW] Failed to parse push data:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: data.data.actions || []
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, options),
      // Set PWA app icon badge in parallel (iOS 16.4+, Chrome, Edge)
      (async () => {
        if (self.navigator.setAppBadge) {
          try {
            await self.navigator.setAppBadge(data.data.unread_count || 1);
            console.log('[Push SW] setAppBadge succeeded');
          } catch (e) {
            console.log('[Push SW] setAppBadge failed:', e);
          }
        } else {
          console.log('[Push SW] setAppBadge not available');
        }
      })(),
      // Forward push data to any open app windows for in-app toast
      (async () => {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach(client => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            title: data.title,
            body: data.body,
            data: data.data
          });
        });
      })()
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Push SW] Notification clicked:', event);
  
  event.notification.close();

  // Clear PWA app icon badge
  if (self.navigator.clearAppBadge) {
    self.navigator.clearAppBadge().catch(() => {});
  }

  const urlToOpen = event.notification.data?.url || '/';
  const conversationId = event.notification.data?.conversation_id;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Notify the window so it can decrement unread count & clear badge
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              conversation_id: conversationId
            });
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[Push SW] Notification closed:', event);
  // Clear PWA app icon badge
  if (self.navigator.clearAppBadge) {
    self.navigator.clearAppBadge().catch(() => {});
  }
});

// Handle subscription change (e.g., browser refreshes push subscription)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Push SW] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey
    }).then((subscription) => {
      // Send new subscription to server
      return fetch('https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/save-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          resubscribe: true
        })
      });
    })
  );
});
