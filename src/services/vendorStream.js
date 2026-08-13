import { Notify, Cookies } from 'quasar'
import { api } from 'src/services/api.js'
import { ep } from 'stores/ep.js'
import { useVendorStore } from 'stores/vendor.js'

// Modul izolat de router: nu știe nimic despre navigare, doar expune
// connect/disconnect + setRouter. Cine decide CÂND se cheamă connect/disconnect
// (intrare/ieșire din modulul /vendor) e src/router/index.js, la fel cum
// decide și când se cheamă fetchVendor(); router/index.js ne dă și instanța
// de router (setRouter, mai jos), ca notificarea de comandă nouă să poată
// naviga la click pe "View" fără un import circular către router/index.js.
let router = null
export function setRouter (instance) {
  router = instance
}

// Resume după un disconnect lung (telefonul a dormit, tab restore etc.) —
// la reconectare trimitem ultimul id văzut, ca backend-ul să retrimită doar
// ce am ratat, nu tot istoricul. Cheia e aceeași ca în implementarea de
// referință (vezi stream.jpeg).
const LAST_EVENT_ID_KEY = 'vendorLastEventId'

// Tipurile de eveniment SSE trimise de backend pe acest stream. Se adaugă
// aici pe măsură ce apar altele noi — switch/case-ul din handleStreamEvent
// e locul unde crește reacția per tip (momentan doar logging pentru cele
// netratate încă).
const STREAM_EVENTS = ['order.created', 'order.updated']

let source = null
let connectedVendorId = null

// Sunet + stil de notificare identice cu implementarea inițială (mock) din
// NotificationsBell.vue/VendorPage.vue: ding.mp3 + vibrate 200ms (dacă
// sunetul nu e oprit de user din cookie-ul notif_sound_enabled), $q.notify
// cu color dark/progress/timeout 7000, icon + message + caption + un singur
// buton de acțiune ("View").
const notifSound = new Audio(`${import.meta.env.BASE_URL}sounds/ding.mp3`)

function playNotifSound () {
  if (Cookies.get('notif_sound_enabled') === 'false') return

  notifSound.currentTime = 0
  notifSound.play().catch(() => {})
  if (navigator.vibrate) navigator.vibrate(200)
}

// La click pe "View": sare pe /modules/vendor (dacă nu suntem deja acolo) și
// cere evidențierea comenzii — VendorPage.vue urmărește vendorStore.highlightOrderId
// și face el scroll + highlight, indiferent dacă pagina era deja montată sau
// tocmai s-a montat acum.
function viewOrder (order) {
  useVendorStore().highlightOrder(order.id)
  if (router && router.currentRoute.value.name !== 'vendor') {
    router.push({ name: 'vendor' })
  }
}

function notifyNewOrder (order) {
  const itemsText = (order.items || [])
    .map(i => `${i.qty || 1}× ${i.name}`)
    .join(', ')

  playNotifSound()

  Notify.create({
    position: 'top',
    timeout: 7000,
    progress: true,
    color: 'dark',
    icon: 'notifications_active',
    message: `New order ${order.id}`,
    caption: itemsText ? `${itemsText} · ${order.total} lei` : `${order.total} lei`,
    actions: [{ label: 'View', color: 'white', noCaps: true, handler: () => viewOrder(order) }]
  })
}

function handleStreamEvent (eventName, e) {
  if (e.lastEventId) {
    window.localStorage.setItem(LAST_EVENT_ID_KEY, e.lastEventId)
  }

  let payload
  try {
    payload = JSON.parse(e.data)
  } catch (err) {
    console.error('[vendor/stream] payload invalid (nu e JSON):', eventName, e.data, err)
    return
  }

  switch (eventName) {
    case 'order.created': {
      console.log('[vendor/stream] order.created:', payload)

      // Dacă userul curent a creat el comanda, saveOrder() a adăugat-o deja
      // local (imediat după succesul POST-ului) — addOrderFromStream
      // deduplică după _id și întoarce null în cazul ăsta, ca să nu apară
      // de două ori în listă și nici să nu se notifice singur.
      const order = useVendorStore().addOrderFromStream(payload)
      if (order) {
        notifyNewOrder(order)
      }
      break
    }

    case 'order.updated':
      console.log('[vendor/stream] order.updated:', payload)
      break

    default:
      console.log('[vendor/stream] eveniment necunoscut:', eventName, payload)
  }
}

// Idempotent: a doua chemare pentru același vendor (ex. navigare între
// /vendor și /vendor/settings) nu face nimic — conexiunea rămâne deschisă,
// nu se redeschide la fiecare hop în interiorul modulului. Dacă se cere alt
// vendor (relogin cu alt cont), conexiunea veche se închide întâi.
export function connectVendorStream (vendorId) {
  if (!vendorId) return
  if (source && connectedVendorId === vendorId) return

  disconnectVendorStream()

  const lastId = window.localStorage.getItem(LAST_EVENT_ID_KEY)
  const url = api.getUri({
    url: ep.vendorEvent,
    params: lastId ? { vendor: vendorId, lastId } : { vendor: vendorId }
  })

  source = new EventSource(url)
  connectedVendorId = vendorId

  source.addEventListener('open', () => {
    console.log('[vendor/stream] conectat:', vendorId)
  })

  // Serverul reciclează conexiunea periodic; browser-ul reconectează singur
  // (retry nativ EventSource) — nu tratăm asta ca eroare reală, doar log.
  source.onerror = () => {
    console.log('[vendor/stream] reconectare...')
  }

  STREAM_EVENTS.forEach((eventName) => {
    source.addEventListener(eventName, (e) => handleStreamEvent(eventName, e))
  })
}

export function disconnectVendorStream () {
  if (!source) return

  source.close()
  source = null
  connectedVendorId = null
  console.log('[vendor/stream] deconectat')
}
