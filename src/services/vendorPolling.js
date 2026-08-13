import { Notify, Cookies } from 'quasar'
import { useVendorStore } from 'stores/vendor.js'

// Singurul mecanism de live updates rămas (SSE-ul din vendorStream.js a
// fost scos complet) — un simplu polling: la fiecare tick trimitem cea mai
// recentă comandă online cunoscută (vezi checkNewOnlineOrders în
// stores/vendor.js) și primim înapoi doar ce e mai nou.
// TODO: 10s doar pentru testare — de pus înapoi la 60000 (60s) după.
const POLL_INTERVAL_MS = 10000

let intervalId = null

// Are nevoie de instanța de router doar ca să poată naviga la /modules/vendor
// la click pe "View" din notificare — setter în loc de import direct din
// router/index.js, ca să nu apară un ciclu router -> polling -> router.
let router = null
export function setRouter (instance) {
  router = instance
}

// Sunet + stil de notificare — ding.mp3 + vibrate 200ms (dacă nu e oprit din
// cookie-ul notif_sound_enabled), $q.notify cu color dark/progress/timeout 7000.
const notifSound = new Audio(`${import.meta.env.BASE_URL}sounds/ding.mp3`)

function playNotifSound () {
  if (Cookies.get('notif_sound_enabled') === 'false') return

  notifSound.currentTime = 0
  notifSound.play().catch(() => {})
  if (navigator.vibrate) navigator.vibrate(200)
}

// cea mai recentă (după _created) e prima din listă — scroll target în
// VendorPage.vue, vezi watcher-ul pe highlightOrderIds.
function newestFirst (orders) {
  return [...orders].sort((a, b) => (b._created || 0) - (a._created || 0)).map(o => o.id)
}

// Evidențiază comenzile noi — independent de click pe "View" (vezi poll(),
// mai jos, care cheamă asta automat la fiecare tick cu rezultate noi). DOAR
// highlight, fără scroll — VendorPage.vue pune animația pe carduri oriunde
// s-ar afla userul, fără să-l mute de pe tab-ul/pagina pe care e acum.
function highlightNewOrders (orderIds) {
  useVendorStore().highlightOrders(orderIds)
}

// La click pe "View": re-declanșează highlight-ul (chiar dacă cel automat
// de la sosire s-a stins deja după cele 2.6s din VendorPage.vue), CERE explicit
// scroll-ul (scrollToOrder — spre deosebire de highlight, ăsta NU se
// întâmplă niciodată automat) și sare pe /modules/vendor dacă nu suntem
// deja acolo.
function viewNewOrders (orderIds) {
  highlightNewOrders(orderIds)
  useVendorStore().scrollToOrder(orderIds[0])
  if (router && router.currentRoute.value.name !== 'vendor') {
    router.push({ name: 'vendor' })
  }
}

function notifyNewOrders (orderIds, count) {
  playNotifSound()

  Notify.create({
    position: 'top',
    timeout: 10000,
    progress: true,
    color: 'dark',
    icon: 'notifications_active',
    message: count > 1 ? 'New orders' : 'New order',
    actions: [{ label: 'View', color: 'white', noCaps: true, handler: () => viewNewOrders(orderIds) }]
  })
}

async function poll () {
  try {
    const added = await useVendorStore().checkNewOnlineOrders()
    if (added.length > 0) {
      const orderIds = newestFirst(added)
      // default: doar highlighted la sosire, FĂRĂ scroll/schimbare de tab —
      // scroll-ul se întâmplă doar dacă userul apasă explicit "View" din
      // notificare (vezi viewNewOrders).
      highlightNewOrders(orderIds)
      notifyNewOrders(orderIds, added.length)
    }
  } catch (e) {
    console.error('[vendor/poll] error:', e?.response?.data || e)
  }
}

// Idempotent — a doua chemare nu pornește un al doilea interval.
export function startVendorPolling () {
  if (intervalId) return

  intervalId = setInterval(poll, POLL_INTERVAL_MS)
  console.log('[vendor/poll] pornit, interval', POLL_INTERVAL_MS, 'ms')
}

export function stopVendorPolling () {
  if (!intervalId) return

  clearInterval(intervalId)
  intervalId = null
  console.log('[vendor/poll] oprit')
}
