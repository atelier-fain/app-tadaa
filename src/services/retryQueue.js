import { Cookies } from 'quasar'
import { useDataStore } from 'stores/data.js'
import { useVendorStore } from 'stores/vendor.js'

// Coadă persistentă (localStorage) de update-uri DB eșuate DUPĂ ce o plată
// a reușit deja (card prin Viva sau cash încasat de vendor) — cel mai des
// din cauza internetului, nu a datelor trimise. În loc să blocheze userul
// cu un ecran de eroare (vezi Callback.vue/pay_cash din stores/data.js),
// item-ul intră aici și se reîncearcă automat, din minut în minut, în
// fundal, indiferent pe ce pagină e userul — până vine 200, abia atunci se
// șterge din coadă. Un singur item nu poate fi procesat de două ori simultan
// (processQueue rulează secvențial, vezi mai jos), deci nu există risc de
// dublare — dacă un retry primește 200, item-ul dispare din listă înainte
// să mai apuce vreun alt tick să-l reia.
const STORAGE_KEY = 'pendingDbUpdates'
const POLL_INTERVAL_MS = 60000

let intervalId = null
// instanța Pinia, injectată din boot (src/boot/retry-queue.js) — necesară ca
// useDataStore()/useVendorStore() să funcționeze aici, în afara oricărui
// component/router guard (la fel ca `store` din router/index.js)
let pinia = null

// SINGURUL criteriu de "reîncearcă automat": nu a venit niciun răspuns de la
// server (offline, timeout, conexiune întreruptă la mijloc) — e.response
// lipsește la axios exact în cazul ăsta. Dacă backend-ul A răspuns (orice
// status non-2xx: sold insuficient, date invalide, token expirat etc.), e o
// respingere reală, nu o problemă de infrastructură — NU intră în coadă,
// trebuie arătată userului ca atare de către apelant (Callback.vue/pay_cash).
export function isRetryableError (e) {
  return !e?.response
}

function generateId () {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function load () {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch (e) {
    return []
  }
}

function save (queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

function remove (id) {
  save(load().filter(item => item.id !== id))
}

function recordFailure (id, error) {
  const queue = load()
  const item = queue.find(i => i.id === id)
  if (item) {
    item.attempts += 1
    item.lastAttemptAt = Date.now()
    item.lastError = error?.response?.data || error?.message || String(error)
  }
  save(queue)
}

// mapare source -> ce store action se cheamă și cu ce payload — exact
// aceleași 3 acțiuni apelate deja din Callback.vue (persistOrder) și
// pay_cash (stores/data.js) pentru tickets/topup/vendor
const handlers = {
  tickets: (payload) => useDataStore(pinia).buy_tickets(payload),
  topup: (payload) => useDataStore(pinia).charge_prepaid_card(payload),
  // saveOrder NU marchează singur pendingOrder.orderSaved (spre deosebire de
  // buy_tickets/charge_prepaid_card) — asta o face în mod normal apelantul
  // (Callback.vue), ca VendorNewOrder.vue să nu preia din greșeală un cart
  // deja salvat prin coada asta drept "eșuat" (vezi takeOverFailedCart) și
  // să-l retrimită manual, dublând comanda.
  vendor: async (payload) => {
    const dataStore = useDataStore(pinia)
    const order = await useVendorStore(pinia).saveOrder(
      payload.cartItems, payload.paymentMethod, payload.transactionId, payload.shortOrderCode
    )
    dataStore.pendingOrder = { source: 'vendor', orderSaved: true }
    Cookies.set('pendingOrder', dataStore.pendingOrder, { path: '/', expires: 1 })
    return order
  },
}

// apelată din Callback.vue (card) și pay_cash (stores/data.js, cash) când
// save-ul eșuează — id-ul e generat local, doar pentru gestionarea cozii de
// aici; NU e transactionId-ul trimis la backend (la cash acela rămâne gol,
// ca înainte — payload.transactionId nu se atinge)
export function enqueueUpdate (source, payload) {
  const queue = load()
  queue.push({
    id: generateId(),
    source,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  })
  save(queue)
  startRetryQueue()
}

// procesează coada secvențial (nu Promise.all) — dacă un item mai lent ar
// rula în paralel cu un tick următor, ar putea porni de două ori același
// request; secvențial + un singur interval activ elimină complet riscul
async function processQueue () {
  const queue = load()
  if (!queue.length) {
    stopRetryQueue()
    return
  }

  for (const item of queue) {
    try {
      await handlers[item.source](item.payload)
      remove(item.id)
    } catch (e) {
      console.error(`[retryQueue] ${item.source} retry failed (attempt ${item.attempts + 1})`, e?.response?.data || e)
      recordFailure(item.id, e)
    }
  }

  if (!load().length) stopRetryQueue()
}

// idempotent — a doua chemare nu pornește un al doilea interval
export function startRetryQueue () {
  if (intervalId) return
  intervalId = setInterval(processQueue, POLL_INTERVAL_MS)
}

export function stopRetryQueue () {
  if (!intervalId) return
  clearInterval(intervalId)
  intervalId = null
}

// apelată o singură dată, din boot (src/boot/retry-queue.js) — reia coada
// salvată din localStorage la fiecare pornire a aplicației (ex. userul a
// închis tab-ul/aplicația cu update-uri încă nereușite) și încearcă imediat
// un tur, fără să aștepte primul minut
export function initRetryQueue (piniaInstance) {
  pinia = piniaInstance
  if (load().length) {
    processQueue()
    startRetryQueue()
  }
}
