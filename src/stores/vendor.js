import { defineStore } from 'pinia'
import { ep } from 'stores/ep.js'
import { useDataStore } from 'stores/data.js'

// Statusul comenzii folosește peste tot (state, UI, request-uri către
// backend) direct vocabularul backend-ului — opened/ready/closed — fără
// niciun strat de traducere intern, ca aplicația să rămână scalabilă dacă
// mai apar statusuri noi.
export const ORDER_STATUS = { OPENED: 'opened', READY: 'ready', CLOSED: 'closed' }

// Timer-ul de auto-clear al highlight-ului (vezi highlightOrders/clearHighlight
// mai jos) — la nivel de modul, nu de store, ca să nu fie stare reactivă;
// pornește/repornește indiferent dacă VendorPage.vue e montată sau nu, ca
// highlight-ul să funcționeze la fel indiferent pe ce pagină/tab e userul.
let highlightClearTimer = null

// backend-ul (PHP) serializează un array cu un singur element ca obiect
// JSON, nu ca array cu un element (`{"0": {...}}` în loc de `[{...}]`) —
// orice câmp care ar trebui să fie listă (products, orders, extras, items
// dintr-un grup de extra etc.) trebuie trecut prin asta înainte de
// .map/.forEach, altfel exact cazul cel mai comun — o singură intrare —
// aruncă `TypeError: ... .map is not a function`. Filtrează și elementele
// null/undefined din listă (ex. `[null]`/`{"0": null}`), altfel primul
// `.map` care le atinge o proprietate aruncă `Cannot read properties of null`.
export function toArray (value) {
  const arr = Array.isArray(value) ? value : (value && typeof value === 'object' ? Object.values(value) : [])
  return arr.filter(Boolean)
}

// mapează o comandă așa cum vine din POST /v2/app/vendor/get/ (câmp `orders`)
// pe forma consumată de UI — doar comenzile cu type: "online" au `products`
// (restul sunt tranzacții de POS fără listă de produse, gen plată cu cardul
// direct la terminal, fără coș din app)
function mapOrder (raw, prefix) {
  const products = toArray(raw.products)

  return {
    id: `#${prefix}${String(raw.nominal_order_id).padStart(4, '0')}`,
    _id: raw._id,
    // timestamp unix (metadată standard Cockpit CMS, ca la vendor) — folosit
    // ca reper de "cea mai recentă comandă online" în checkNewOnlineOrders().
    _created: raw._created,
    status: raw.status || ORDER_STATUS.OPENED,
    type: raw.type,
    items: products,
    total: Number(raw.subtotal) / 100,
    // notă opțională lăsată de client la comandă — afișată pe card, sub
    // ultimul item, indiferent de type (vezi VendorPage.vue)
    comments: raw.comments || null,
  }
}

// mapează un produs așa cum vine din POST /v2/app/vendor/get/ (câmp `products`,
// formă CMS cu field/value pentru fiecare grup de extra-uri) pe forma
// consumată de UI (VendorNewOrder.vue) — preț în lei (backend trimite bani),
// extraGroups: [{ title, max, required, options: [{ name, price }] }].
// `required` vine din accept_no_selection: dacă backend-ul NU acceptă lipsa
// selecției, grupul e obligatoriu (minim 1 opțiune) — vezi VendorNewOrder.vue.
// `priceRaw`/`plu` se păstrează neatinse (nu doar convertite/afișate) —
// la crearea comenzii (saveOrder) se trimit înapoi la backend exact cum au
// venit, nu valoarea în lei folosită pentru display. `plu` e id-ul din
// casa de marcat.
function mapProduct (raw) {
  return {
    id: raw._id,
    name: raw.title,
    category: raw.category?.display || 'Altele',
    price: Number(raw.price) / 100,
    priceRaw: raw.price,
    plu: raw.plu,
    // active/duration — editate din VendorSettings.vue (on-off + timp de
    // preparare), salvate prin updateProductSettings() la /vendor/settings/
    active: raw.active,
    duration: Number(raw.duration) || 0,
    extraGroups: toArray(raw.extras).map(e => ({
      title: e.value.title,
      max: Number(e.value.selections) || 1,
      required: !e.value.accept_no_selection,
      options: toArray(e.value.items).map(i => ({
        name: i.value.title.trim(),
        price: Number(i.value.price) / 100,
        priceRaw: i.value.price,
        plu: i.value.plu,
      })),
    })),
  }
}

export const useVendorStore = defineStore('vendor', {
  state: () => ({
    // profil vendor — populat de fetchVendor() la intrarea pe VendorPage
    // (POST /v2/app/vendor/get/, vezi docs/vendor-api-requirements.md #1).
    // value_only: true = vendor fără meniu/produse, ia doar plăți cu sumă
    // custom (fără tab-uri In progress/Completed/Closed).
    // online_orders: true = butonul de Settings apare pe /vendor.
    vendor: null,

    // populat de fetchVendor() din câmpul `products` al POST /v2/app/vendor/get/
    // (vezi mapProduct) — gol până vine răspunsul, VendorNewOrder.vue arată
    // skeleton cât timp vendor === null.
    products: [],

    orders: [],

    // id-urile comenzilor (`order.id`, gen "#ita0406") care trebuie
    // evidențiate în UI chiar acum — setate de vendorPolling.js atât automat
    // (la sosirea unor comenzi noi), cât și la click pe "View" din
    // notificare. NU implică scroll — doar animația de highlight pe carduri
    // (vezi VendorPage.vue). Scroll-ul e un semnal separat, mai jos.
    highlightOrderIds: [],

    // id-ul comenzii spre care trebuie făcut scroll (+ switch de tab dacă e
    // nevoie) — setat DOAR la click explicit pe "View" din notificare
    // (vendorPolling.js), NICIODATĂ la highlight-ul automat de sosire, ca să
    // nu sară userul de pe tab-ul/pagina pe care se uită fără să ceară el asta.
    scrollToId: null,
  }),

  getters: {
    categories: (state) => [...new Set(state.products.map(p => p.category))],
  },

  actions: {
    // POST /v2/app/vendor/get/ — profil vendor curent (identificat din token),
    // vine împreună cu array-ul de orders al vendor-ului.
    async fetchVendor () {
      const dataStore = useDataStore()
      const { data } = await dataStore._post(ep.vendorGet)
      this.vendor = data
      if (data.orders) {
        this.orders = toArray(data.orders).map(o => mapOrder(o, data.prefix || 'ita'))
      }
      if (data.products) {
        this.products = toArray(data.products).map(mapProduct)
      }
      return data
    },

    // Apelat din Callback.vue după succesul plății (Card sau Card Festival),
    // atât pentru value_only: true (cart cu un singur item "Custom amount",
    // fără productId/priceRaw/plu — nu vine dintr-un produs real de meniu),
    // cât și pentru value_only: false (cart cu produse din meniu, populat
    // din VendorNewOrder.vue cu productId/priceRaw/plu) — aceeași formă
    // de cart în ambele cazuri, deci un singur punct de salvare.
    // cartItems: [{ name, productId?, plu?, priceRaw?, extras: [{name, price, priceRaw?, plu?}], lineTotal }]
    // Comanda e trimisă către backend ÎNAINTE să apară în this.orders — dacă
    // POST-ul pică, funcția aruncă mai departe (nu înghite eroarea) și nimic
    // nu ajunge în listă. Altfel (varianta veche, optimistă) vendorul vedea
    // comanda ca "intrată" în /vendor chiar dacă order-create-ul chiar picase
    // pe backend, deși clientul plătise deja — fals pozitiv fără nicio cale
    // de retry. Caller-ul (Callback.vue) decide ce arată userului la eroare.
    async saveOrder (cartItems, paymentMethod, transactionId, shortOrderCode) {
      const prefix = this.vendor?.prefix || 'ita'

      // preț brut per item/extra — cel primit de la backend prin vendor/get
      // (item.priceRaw/e.priceRaw, vezi mapProduct), nu valoarea în lei
      // folosită pentru display; "Custom amount" (value_only) n-are
      // priceRaw fiindcă nu vine dintr-un produs real, deci cade pe
      // lineTotal-ul introdus manual convertit în bani.
      const rawPrice = (value, fallbackLei) => value ?? String(Math.round(fallbackLei * 100))

      const products = cartItems.map(item => ({
        price: rawPrice(item.priceRaw, item.lineTotal),
        product: item.productId || null,
        name: item.name,
        plu: item.plu ?? null,
        extras: item.extras.map(e => ({
          name: e.name,
          price: rawPrice(e.priceRaw, e.price),
          plu: e.plu ?? null,
        })),
      }))

      const payload = {
        order: {
          // type reflectă metoda de plată — paymentMethod e deja "card" (Card/Viva)
          // sau "prepaid" (Card Festival, vezi VendorPaymentModal.vue), nu mai e
          // nevoie de nicio traducere intermediară
          type: paymentMethod,
          subtotal: String(products.reduce((sum, p) => sum + Number(p.price) + p.extras.reduce((s, e) => s + Number(e.price), 0), 0)),
          comments: '',
          shortOrderCode,
          transactionId,
          products,
        },
      }
      console.log('[vendor/orders] payload:', payload)

      const dataStore = useDataStore()
      const { data } = await dataStore._post(ep.vendorOrderCreate, payload)
      console.log('[vendor/orders] response:', data)

      // răspunsul e comanda reală creată în backend (aceeași formă ca
      // `orders` din vendor/get, vezi mapOrder) — dacă are _id, o folosim ca
      // atare; altfel (răspuns minimal/neconfirmat încă) construim local
      // aceeași formă din cartItems, ca vendorul să vadă totuși comanda
      // odată ce backend-ul a confirmat cu 200. Id-ul afișat se formează
      // mereu din prefix + nominal_order_id (la fel ca mapOrder) — folosim
      // nominal_order_id din răspuns dacă există și fără _id; doar dacă
      // backend-ul nu trimite niciunul din cele două cădem pe un contor
      // simplu (this.orders.length), fără să mai parsăm/ghicim din id-urile
      // deja existente (asta producea NaN dacă vreun id nu se potrivea cu
      // prefixul curent — vezi Math.max(...NaN...) => NaN).
      const order = data?._id
        ? mapOrder(data, prefix)
        : {
            id: `#${prefix}${String(data?.nominal_order_id ?? this.orders.length + 401).padStart(4, '0')}`,
            status: ORDER_STATUS.OPENED,
            items: cartItems.map(item => ({ name: item.name })),
            extra: cartItems.flatMap(item => item.extras.map(e => e.name)).join(', ') || null,
            total: cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
          }

      this.orders.unshift(order)

      return order
    },

    // Apelat din VendorPage.vue după cele 5s de "waiting" pe butonul
    // Complete/Close (fără modal de confirmare, vezi onStatusBtnClick).
    // Comanda se mută din tab-ul curent (In progress/Completed) doar după ce
    // vine efectiv răspunsul 200 — nu optimist, la fel ca mutarea butonului
    // în loading. Dacă request-ul pică, aruncă mai departe (caller-ul decide
    // ce arată userului) și comanda rămâne neschimbată.
    // Endpoint confirmat: POST /v2/app/vendor/order/change_status/, body
    // { _id, status } — _id e id-ul real din backend (order._id, vezi
    // mapOrder), NU id-ul afișat gen "#ita0405". `status` e mereu una din
    // ORDER_STATUS (opened/ready/closed) — trimisă ca atare, fără traducere.
    async updateOrderStatus (orderId, status) {
      const order = this.orders.find(o => o.id === orderId)
      if (!order?._id) {
        console.error('[vendor/order/change_status] lipsește order._id (comandă creată local, neconfirmată încă de backend?):', orderId)
      }

      const payload = { _id: order?._id, status }
      console.log('[vendor/order/change_status] payload:', payload)

      const dataStore = useDataStore()
      const { data } = await dataStore._post(ep.vendorOrderStatus, payload)
      console.log('[vendor/order/change_status] response:', data)

      if (order) order.status = status

      return order
    },

    // Apelat din VendorPage.vue la click pe "See all" (doar tab-ul Closed).
    // Endpoint confirmat: POST /v2/app/vendor/orders/get_more/ — body-ul nu
    // trimite niciun offset/cursor explicit, doar token-ul de auth injectat
    // automat de _post (la fel ca la restul apelurilor). Un singur apel
    // întoarce TOATE comenzile closed rămase (nu există paginare) — de-aia
    // caller-ul (VendorPage.vue) ascunde butonul necondiționat după primul
    // apel reușit, nu doar când vine un array gol. Comenzile primite au
    // aceeași formă ca `orders` din vendor/get (vezi mapOrder) și se adaugă
    // la finalul listei existente, fără duplicate (după _id).
    async fetchMoreClosedOrders () {
      const dataStore = useDataStore()
      const { data } = await dataStore._post(ep.vendorOrdersGetMore)

      const prefix = this.vendor?.prefix || 'ita'
      const existingIds = new Set(this.orders.map(o => o._id).filter(Boolean))
      const newOrders = toArray(data.orders ?? data)
        .map(o => mapOrder(o, prefix))
        .filter(o => !existingIds.has(o._id))

      this.orders.push(...newOrders)

      return newOrders
    },

    // Apelat din vendorPolling.js la fiecare tick — trimite _created-ul
    // (timestamp unix) celei mai recente comenzi ONLINE (comandă plasată
    // prin coșul din app, type === 'online'; comenzile POS create local prin
    // saveOrder au alt `type` — 'card'/'prepaid' — și nu intră în calcul
    // aici) pe care o are deja în listă, ca EP-ul de polling să întoarcă doar
    // ce e mai nou de-atât. Dacă nu există încă niciuna, trimite null (primul
    // poll din sesiune) — EP-ul decide ce înseamnă asta.
    //
    // Endpoint confirmat (vezi ep.js -> vendorOrdersNew): POST
    // /v2/app/vendor/orders/get_new/, request { timestamp }, response array
    // direct de orders brute (aceeași formă ca `orders` din vendor/get).
    async checkNewOnlineOrders () {
      const lastOnline = this.orders.reduce((latest, o) => {
        if (o.type !== 'online' || !o._created) return latest
        return (!latest || o._created > latest._created) ? o : latest
      }, null)

      const dataStore = useDataStore()
      const { data } = await dataStore._post(ep.vendorOrdersNew, { timestamp: lastOnline?._created ?? null })

      return this.addNewOrders(toArray(data.orders ?? data))
    },

    // Deduplichează după `_id` (id-ul real din backend, confirmat prezent în
    // răspunsul de la /vendor/orders/get_new/) — nu după nominal_order_id.
    // Adaugă doar comenzile chiar noi la începutul listei; întoarce doar
    // pe-alea, ca vendorPolling.js să știe pentru care să notifice/evidențieze
    // — dacă vine listă goală (nimic nou), nu se întâmplă nimic vizibil.
    addNewOrders (rawOrders) {
      const prefix = this.vendor?.prefix || 'ita'
      const existingIds = new Set(this.orders.map(o => o._id).filter(Boolean))

      const added = toArray(rawOrders)
        .filter(raw => raw?._id && !existingIds.has(raw._id))
        .map(raw => mapOrder(raw, prefix))

      this.orders.unshift(...added)

      return added
    },

    // Apelat din vendorPolling.js — automat la sosirea unor comenzi noi ȘI
    // la click pe "View" din notificare, indiferent de starea curentă
    // (deja evidențiate, animația deja terminată, etc.) — de fiecare dată
    // repornește highlight-ul de la zero. VendorPage.vue leagă direct clasa
    // CSS de highlightOrderIds (computed simplu, fără watcher), deci
    // evidențierea e complet independentă de pe ce tab/pagină e userul —
    // apare pe orice card din listă ale cărui id-uri sunt aici, oricând.
    // [...orderIds] (nu doar `orderIds`) — la un click pe "View" cât timp
    // highlight-ul de la sosire e ÎNCĂ activ, array-ul primit ar putea fi
    // literalmente ACELAȘI obiect din closure-ul din vendorPolling.js; fără
    // copiere, reasignarea n-ar schimba referința și Vue n-ar detecta nicio
    // schimbare. Cu o copie nouă de fiecare dată, referința diferă mereu,
    // deci re-highlight-ul funcționează indiferent de starea anterioară.
    // Timer-ul de auto-clear (5.1s, puțin peste cei 5s cât ține animația CSS
    // order-highlight din VendorPage.vue) e gestionat AICI, nu într-un
    // watcher din VendorPage.vue — pornește/repornește la fiecare apel,
    // indiferent dacă pagina e montată, ca reapelarea "View" să funcționeze
    // chiar dacă userul a plecat și s-a întors între timp.
    highlightOrders (orderIds) {
      this.highlightOrderIds = [...orderIds]

      clearTimeout(highlightClearTimer)
      highlightClearTimer = setTimeout(() => {
        this.highlightOrderIds = []
      }, 5100)
    },

    clearHighlight () {
      clearTimeout(highlightClearTimer)
      this.highlightOrderIds = []
    },

    // Apelat DOAR din vendorPolling.js la click explicit pe "View". VendorPage.vue
    // urmărește asta separat de highlightOrderIds, ca să sară pe tab-ul
    // corect și să deruleze la comandă doar când userul chiar a cerut asta.
    scrollToOrder (orderId) {
      this.scrollToId = orderId
    },

    clearScrollRequest () {
      this.scrollToId = null
    },

    // Apelat din VendorSettings.vue la "Save", doar cu produsele modificate
    // (on/off + timp de preparare). Endpoint confirmat: POST /v2/app/vendor/settings/,
    // body { products: [{ _id, duration, active }] }, răspuns:
    // [{ _id, duration, active, _by, _modified }].
    async updateProductSettings (products) {
      const payload = { products }
      console.log('[vendor/settings] payload:', payload)

      const dataStore = useDataStore()
      const { data } = await dataStore._post(ep.vendorSettingsUpdate, payload)
      console.log('[vendor/settings] response:', data)

      // sincronizăm valorile confirmate de backend înapoi în vendorStore.products,
      // ca o revenire pe pagină (fără refetch) să reflecte ce s-a salvat.
      // toArray acoperă și cazul cu un singur produs salvat (backend-ul îl
      // serializează ca obiect, nu ca array cu un element); dacă răspunsul
      // nu e deloc utilizabil (ack minimal etc.), toArray dă listă goală și
      // pur și simplu sărim peste sincronizare, fără să aruncăm.
      const byId = new Map(toArray(data).map(p => [p._id, p]))
      this.products.forEach(p => {
        const updated = byId.get(p.id)
        if (updated) {
          p.active = updated.active
          p.duration = Number(updated.duration)
        }
      })

      return data
    }
  }
})
