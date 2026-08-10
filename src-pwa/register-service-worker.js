import { register } from 'register-service-worker'

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

// The custom service worker calls skipWaiting()/clientsClaim() immediately,
// so a new SW takes control of open tabs in the background. Without forcing
// a reload here, the already-running page keeps executing the OLD bundle
// against the NEW cache/precache manifest, which is what caused users to
// see broken behavior until they manually closed and reopened the app.
let refreshing = false

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready (registration) {
    // Actively re-check for a new deployment every 5 minutes while the app
    // stays open, since an installed PWA may never trigger a fresh
    // navigation-based update check on its own.
    setInterval(() => {
      registration.update()
    }, 5 * 60 * 1000)

    // Background/inactive tabs get their timers throttled by the browser,
    // so a user who leaves the tab open for a while and comes back could
    // still be on the stale interval. Force a check the moment the tab
    // becomes visible again.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
  },

  registered (/* registration */) {
    // console.log('Service worker has been registered.')
  },

  cached (/* registration */) {
    // console.log('Content has been cached for offline use.')
  },

  updatefound (/* registration */) {
    // console.log('New content is downloading.')
  },

  updated (/* registration */) {
    // New SW is installed and waiting; the custom SW's skipWaiting() call
    // activates it right away, which fires 'controllerchange' above and
    // reloads the page automatically.
  },

  offline () {
    // console.log('No internet connection found. App is running in offline mode.')
  },

  error (/* err */) {
    // console.error('Error during service worker registration:', err)
  }
})
