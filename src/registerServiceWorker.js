// Service Worker Registration & Live Version Update Manager

let swRegistration = null;
let updateCallbacks = [];

export function registerServiceWorker(onUpdateFound) {
  if (onUpdateFound) {
    updateCallbacks.push(onUpdateFound);
  }

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          swRegistration = registration;
          console.log('[PWA] ServiceWorker registered with scope:', registration.scope);

          // Check if there is already a waiting worker
          if (registration.waiting) {
            notifyUpdateAvailable(registration.waiting);
          }

          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] New version ready to apply.');
                    notifyUpdateAvailable(installingWorker);
                  } else {
                    console.log('[PWA] App is ready for offline use.');
                  }
                }
              });
            }
          });

          // Check for updates periodically every 15 minutes
          setInterval(() => {
            registration.update().catch((err) => console.warn('[PWA] Auto update check failed:', err));
          }, 15 * 60 * 1000);

          // Check for updates when user returns to the window
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              registration.update().catch(() => {});
            }
          });
        })
        .catch((error) => {
          console.warn('[PWA] ServiceWorker registration error:', error);
        });

      // Reload page when new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }
}

function notifyUpdateAvailable(worker) {
  updateCallbacks.forEach((cb) => {
    try {
      cb(worker);
    } catch (e) {
      console.error(e);
    }
  });
}

export function onUpdateAvailable(callback) {
  updateCallbacks.push(callback);
}

// Manually trigger an update check
export async function checkForUpdate() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, updated: false, message: 'مرورگر شما از ServiceWorker پشتیبانی نمی‌کند.' };
  }

  try {
    if (!swRegistration) {
      swRegistration = await navigator.serviceWorker.getRegistration();
    }

    if (swRegistration) {
      await swRegistration.update();
      if (swRegistration.waiting) {
        return { supported: true, updated: true, message: 'نسخه جدید آماده نصب است!' };
      }
      return { supported: true, updated: false, message: 'شما در حال استفاده از آخرین نسخه موجود هستید.' };
    }
    return { supported: true, updated: false, message: 'سرویس‌ورکر هنوز فعال نشده است.' };
  } catch (error) {
    console.warn('[PWA] Manual update check error:', error);
    return { supported: true, updated: false, message: 'خطا در برقراری ارتباط با سرور به‌روزرسانی.' };
  }
}

// Apply update immediately
export function applyUpdate() {
  if (swRegistration && swRegistration.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    });
  } else {
    window.location.reload();
  }
}
