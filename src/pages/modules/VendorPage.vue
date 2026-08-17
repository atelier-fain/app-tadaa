<template>
  <q-page class="orders-page">
    <div class="page-header">
      <span class="page-title">Orders</span>
    </div>

    <div v-if="vendorLoading" class="value-only-panel">
      <div class="orders-grid">
        <div v-for="n in 2" :key="n" class="order-card">
          <div class="card-top">
            <div class="status-stripe skeleton-stripe" />
            <div class="card-body">
              <div class="card-header">
                <q-skeleton type="text" width="72px" height="14px" />
                <q-skeleton type="QBadge" width="70px" />
              </div>

              <div class="card-items">
                <q-skeleton type="text" width="65%" />
                <q-skeleton type="text" width="45%" />
              </div>

              <div class="card-footer">
                <div>
                  <q-skeleton type="text" width="34px" height="11px" />
                  <q-skeleton type="text" width="64px" height="16px" class="q-mt-xs" />
                </div>
                <q-skeleton type="QBtn" width="96px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template v-else-if="showTabs">
    <q-tabs
      v-model="activeTab"
      dense
      no-caps
      align="left"
      class="orders-tabs"
      indicator-color="transparent"
      active-color="white"
    >
      <q-tab
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        class="orders-tab"
        :class="{ 'tab-active': activeTab === tab.name }"
      >
        <div class="orders-tab-label">
          {{ tab.label }}
          <span v-if="tab.name === ORDER_STATUS.OPENED" class="orders-tab-badge">{{ activeCount }}</span>
        </div>
      </q-tab>
    </q-tabs>

    <q-tab-panels
      v-model="activeTab"
      animated
      transition-prev="slide-right"
      transition-next="slide-left"
      class="tab-panels"
    >
      <q-tab-panel
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        class="tab-panel"
      >
        <div v-if="filteredOrders(tab.name).length === 0" class="empty-state">
          <q-icon name="receipt_long" size="40px" color="grey-5" />
          <p>No {{ tab.label.toLowerCase() }} orders</p>
        </div>

        <div v-else class="orders-grid">
          <div
            v-for="order in filteredOrders(tab.name)"
            :key="order.id"
            :id="`order-${order.id.replace('#', '')}`"
            class="order-card"
            :class="{ 'order-card--highlight': activeHighlightIds.includes(order.id) }"
          >
            <div class="card-top">
              <div class="status-stripe" :class="stripeClass(order.status)" />
              <div class="card-body">
                <div class="card-header">
                  <span class="order-id">{{ order.id }}</span>
                  <span
                    v-if="order.status !== ORDER_STATUS.CLOSED"
                    class="order-badge"
                    :class="badgeClass(order.status)"
                  >
                    {{ statusLabel(order.status) }}
                  </span>
                  <span
                    v-else-if="order.type === 'online'"
                    class="order-badge badge-online"
                  >
                    Online
                  </span>
                </div>

                <div class="card-items">
                  <div
                    v-for="(item, i) in order.items"
                    :key="i"
                    class="card-item"
                  >
                    <div class="card-item-row">
                      <span v-if="item.qty > 1" class="item-qty">{{ item.qty }}×</span>
                      <span class="item-name">{{ item.name }}</span>
                    </div>
                    <div
                      v-for="(extra, j) in item.extras"
                      :key="j"
                      class="extra"
                    >
                      + {{ extra?.name }}
                    </div>
                  </div>
                </div>

                <div v-if="order.comments" class="order-comment">* {{ order.comments }}</div>

                <div class="card-footer">
                  <div>
                    <span class="total-label">Total</span>
                    <span class="order-total">{{ order.total }} lei</span>
                  </div>
                  <div
                    v-if="order.status !== ORDER_STATUS.CLOSED"
                    class="status-btn-wrap"
                    @click.capture="onStatusBtnClick(order)"
                    @touchstart.capture="onStatusBtnTouchStart(order)"
                  >
                    <q-btn
                      v-if="order.status === ORDER_STATUS.OPENED"
                      label="Complete"
                      unelevated
                      no-caps
                      class="btn-finalize"
                      :class="{ 'btn-status--waiting': statusChange[order.id]?.loading }"
                      :loading="statusChange[order.id]?.loading"
                      :percentage="statusChange[order.id]?.percentage"
                      :ripple="false"
                    >
                      <template v-slot:loading>
                        <q-spinner-gears class="on-left" />
                        {{ statusChange[order.id]?.requesting ? 'Completing...' : 'Cancel' }}
                      </template>
                    </q-btn>
                    <q-btn
                      v-else
                      label="Close"
                      unelevated
                      no-caps
                      class="btn-close"
                      :class="{ 'btn-status--waiting': statusChange[order.id]?.loading }"
                      :loading="statusChange[order.id]?.loading"
                      :percentage="statusChange[order.id]?.percentage"
                      :ripple="false"
                    >
                      <template v-slot:loading>
                        <q-spinner-gears class="on-left" />
                        {{ statusChange[order.id]?.requesting ? 'Closing...' : 'Cancel' }}
                      </template>
                    </q-btn>
                  </div>
                  <span v-else class="status-done">
                    <q-icon name="check_circle" size="18px" /> Closed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tab.name === ORDER_STATUS.CLOSED && showSeeAllClosed" class="see-all-wrap">
          <q-btn
            no-caps
            outline
            label="See all"
            class="btn-see-all"
            :loading="loadingSeeAllClosed"
            :disable="loadingSeeAllClosed"
            @click="seeAllClosed"
          />
        </div>
      </q-tab-panel>
    </q-tab-panels>
    </template>

    <div v-else-if="valueOnly" class="value-only-panel">
      <div v-if="orders.length === 0" class="empty-state">
        <q-icon name="receipt_long" size="40px" color="grey-5" />
        <p>No orders</p>
      </div>

      <div v-else class="value-only-grid">
        <div v-for="order in orders" :key="order.id" class="value-only-card">
          <span class="vo-order-id">{{ order.id }}</span>
          <span class="vo-order-total">{{ order.total }} lei</span>
        </div>
      </div>
    </div>

    <div v-else class="value-only-panel">
      <div v-if="orders.length === 0" class="empty-state">
        <q-icon name="receipt_long" size="40px" color="grey-5" />
        <p>No orders</p>
      </div>

      <div v-else class="orders-grid">
        <div
          v-for="order in orders"
          :key="order.id"
          :id="`order-${order.id.replace('#', '')}`"
          class="order-card"
          :class="{ 'order-card--highlight': activeHighlightIds.includes(order.id) }"
        >
          <div class="card-top">
            <div class="card-body">
              <div class="card-header">
                <span class="order-id">{{ order.id }}</span>
              </div>

              <div class="card-items">
                <div v-for="(item, i) in order.items" :key="i" class="card-item">
                  <div class="card-item-row">
                    <span v-if="item?.qty > 1" class="item-qty">{{ item?.qty }}×</span>
                    <span class="item-name">{{ item.name }}</span>
                  </div>
                  <div v-for="(extra, j) in item.extras"
                       :key="j"
                       class="extra">
                    + {{ extra?.name }}
                  </div>
                </div>

              </div>

              <div v-if="order.comments" class="order-comment">* {{ order.comments }}</div>

              <div class="card-footer">
                <div>
                  <span class="total-label">Total</span>
                  <span class="order-total">{{ order.total }} lei</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-dialog v-model="showCustomValueModal" @show="onCustomValueDialogShow">
      <q-card class="custom-value-dialog">
        <div class="cv-dialog-body">
          <p class="cv-dialog-label">Custom amount</p>
          <div class="cv-dialog-input-row">
            <input
              ref="customValueInputRef"
              v-model="tempCustomValue"
              type="number"
              inputmode="numeric"
              placeholder="0"
              class="cv-dialog-number-input"
              @wheel.prevent
              @keyup.enter="onCustomValueOk"
            />
            <span class="cv-dialog-currency">lei</span>
          </div>
        </div>
        <div class="cv-dialog-actions">
          <button class="cv-dialog-btn cv-btn-cancel" @click="onCustomValueCancel">Cancel</button>
          <button
            class="cv-dialog-btn cv-btn-ok"
            :disabled="!(Number(tempCustomValue) > 0)"
            @click="onCustomValueOk"
          >
            OK
          </button>
        </div>
      </q-card>
    </q-dialog>

    <VendorPaymentModal v-model="showPayment" :cart="customCart" :cart-total="customCartTotal" />

    <q-page-sticky v-if="!vendorLoading" position="bottom-right" :offset="[18, 18]">
      <q-btn no-caps unelevated icon="add" label="New order" class="new-order-btn" @click="addOrder" />
    </q-page-sticky>

    <q-page-sticky v-if="vendorStore.vendor?.online_orders" position="bottom-left" :offset="[18, 18]">
      <q-btn fab icon="settings" color="grey-7" @click="router.push({ name: 'vendor-settings' })" />
    </q-page-sticky>

  </q-page>
</template>

<script setup>
import {ref, reactive, computed, watch, nextTick, onBeforeUnmount, onMounted} from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import VendorPaymentModal from 'components/VendorPaymentModal.vue'
import { useVendorStore, ORDER_STATUS } from 'stores/vendor.js'

const router = useRouter()
const vendorStore = useVendorStore()

// clasa CSS de highlight e legată DIRECT de vendorStore.highlightOrderIds —
// setat de vendorPolling.js automat la sosirea de comenzi noi ȘI la click pe
// "View" din notificare (de fiecare dată repornit, vezi highlightOrders() în
// stores/vendor.js). Complet independent de pe ce tab/pagină e userul: dacă
// e pe /vendor cu tab-ul potrivit deschis, cardul apare highlighted imediat;
// dacă nu, apare highlighted în clipa în care ajunge acolo (navigare sau
// schimbare de tab) — timer-ul de auto-clear (2.6s) e gestionat în store,
// nu aici, ca să funcționeze la fel indiferent de montarea paginii.
const activeHighlightIds = computed(() => vendorStore.highlightOrderIds)

// vendor/get e în zbor (declanșat din router/index.js la intrarea pe modul) —
// nu știm încă value_only/online_orders, deci arătăm un skeleton generic
// în loc să ghicim ce variantă de layout se potrivește
const vendorLoading = computed(() => vendorStore.vendor === null)

// vendor fără meniu de produse — ia doar plăți cu sumă custom, fără
// tab-urile In progress/Completed/Closed (vezi docs/vendor-api-requirements.md #1)
const valueOnly = computed(() => vendorStore.vendor?.value_only)

// tab-urile de status (In progress/Completed/Closed) au sens doar dacă
// vendor-ul are meniu de produse (!valueOnly) și acceptă comenzi online —
// altfel (online_orders: false) nu există flux de status gestionat de
// vendor, deci comenzile apar într-o listă plată (fără tab-uri).
const showTabs = computed(() => !valueOnly.value && vendorStore.vendor?.online_orders !== false)

// orders trăiesc în store-ul vendor ca să fie vizibile și din pagina new-order
const orders = computed(() => vendorStore.orders)

// ----- tabs -----
const tabs = [
  { name: ORDER_STATUS.OPENED, label: 'In progress' },
  { name: ORDER_STATUS.READY,  label: 'Completed' },
  { name: ORDER_STATUS.CLOSED, label: 'Closed' },
]
const activeTab = ref(ORDER_STATUS.OPENED)

// ----- computed -----
const activeCount = computed(
  () => orders.value.filter(o => o.status === ORDER_STATUS.OPENED).length
)
const filteredOrders = (status) =>
  orders.value.filter(o => o.status === status)

// ----- scroll + switch de tab la comanda nouă — DOAR la click explicit pe
// "View" din notificare (vezi vendorStore.scrollToOrder/vendorPolling.js).
// Highlight-ul (activeHighlightIds, mai sus) e complet separat/automat —
// aici se ocupă STRICT de "du-mă acolo", nu de evidențiere. -----
watch(() => vendorStore.scrollToId, (orderId) => {
  if (!orderId) return

  // tab-ul e determinat de statusul REAL al comenzii (opened/ready/closed),
  // nu presupus "In progress" — o comandă poate ajunge deja Completed/Closed
  // până apasă userul pe "View" din notificare.
  const order = orders.value.find(o => o.id === orderId)
  const tabChanged = showTabs.value && !!order && activeTab.value !== order.status
  if (showTabs.value && order) activeTab.value = order.status

  nextTick(() => {
    // panoul Quasar alunecă ~300ms DOAR dacă am schimbat efectiv tab-ul —
    // dacă eram deja pe tab-ul corect, nu mai așteptăm degeaba.
    setTimeout(() => {
      const el = document.getElementById(`order-${orderId.replace('#', '')}`)
      if (el) {
        const rect = el.getBoundingClientRect()
        const top = rect.top + window.scrollY - (window.innerHeight - rect.height) / 2
        window.scrollTo({ top, behavior: 'smooth' })
      }
      vendorStore.clearScrollRequest()
    }, tabChanged ? 350 : 0)
  })
}, { immediate: true })

// ----- See all (tab Closed) -----
// Un singur apel aduce TOATE comenzile closed rămase — nu există paginare,
// deci butonul dispare necondiționat după primul apel reușit (indiferent
// câte comenzi a adus), nu doar când răspunsul e gol.
const loadingSeeAllClosed = ref(false)
const showSeeAllClosed = ref(true)

const seeAllClosed = async () => {
  if (loadingSeeAllClosed.value || !showSeeAllClosed.value) return

  loadingSeeAllClosed.value = true
  try {
    await vendorStore.fetchMoreClosedOrders()
    showSeeAllClosed.value = false
  } catch (e) {
    console.error('[vendor/orders/get_more] error:', e)
    Notify.create({ type: 'negative', message: 'Could not load the rest of the orders', position: 'top' })
  } finally {
    loadingSeeAllClosed.value = false
  }
}

// ----- helpers -----
const statusLabel = (status) => ({
  [ORDER_STATUS.OPENED]: 'In progress',
  [ORDER_STATUS.READY]:  'Completed',
  [ORDER_STATUS.CLOSED]: 'Closed',
}[status] ?? status)

const stripeClass = (status) => ({
  [ORDER_STATUS.OPENED]: 'stripe-lucru',
  [ORDER_STATUS.READY]:  'stripe-finalizat',
  [ORDER_STATUS.CLOSED]: 'stripe-inchis',
}[status])

const badgeClass = (status) => ({
  [ORDER_STATUS.OPENED]: 'badge-lucru',
  [ORDER_STATUS.READY]:  'badge-finalizat',
  [ORDER_STATUS.CLOSED]: 'badge-inchis',
}[status])

// ----- schimbare status (Complete/Close) — fără modal de confirmare -----
// La click, butonul intră în loading 5s (progress simulat, ca la exemplul
// Quasar "Compute PI"); un al doilea click în acest interval anulează
// acțiunea. Doar dacă cele 5s trec fără să fie anulat, pornește request-ul
// real — butonul rămâne în loading (fără să mai poată primi alte click-uri)
// până vine răspunsul, iar comanda se mută în alt tab (In progress →
// Completed → Closed) doar la succes.
const statusChange = reactive({})
const statusChangeTimers = {}

// pe Android, preventDefault() pe touchstart-ul intern al QBtn (onLoadingEvt)
// nu suprimă mereu, în practică, click-ul sintetic care urmează — tap-ul de
// Cancel ajunge de două ori (o dată prin @touchstart.capture, apoi din nou
// prin @click.capture), iar a doua invocare vede starea deja ștearsă și
// repornește countdown-ul imediat (exact bug-ul "se oprește și pornește
// instant la loc"). Blocăm orice a doua invocare pentru aceeași comandă cât
// timp se întâmplă în aceeași "atingere" (sub 300ms), indiferent care dintre
// cele două evenimente a ajuns primul.
const lastActionAt = {}

const nextStatus = (status) => status === ORDER_STATUS.OPENED ? ORDER_STATUS.READY : ORDER_STATUS.CLOSED

const onStatusBtnClick = (order) => {
  const now = Date.now()
  if (lastActionAt[order.id] && now - lastActionAt[order.id] < 300) return
  lastActionAt[order.id] = now

  const pending = statusChange[order.id]

  if (pending?.loading) {
    // request-ul real deja a pornit — nu se mai poate anula, butonul nu
    // primește alte acțiuni până vine răspunsul
    if (pending.requesting) return

    cancelAnimationFrame(statusChangeTimers[order.id]?.rafId)
    clearTimeout(statusChangeTimers[order.id]?.timeout)
    delete statusChangeTimers[order.id]
    delete statusChange[order.id]
    return
  }

  statusChange[order.id] = { loading: true, percentage: 0, requesting: false }

  // requestAnimationFrame, nu setInterval — QBtn animă bara de progres cu
  // transition: transform 0.6s (fix intern, vezi use-btn.js/percentageStyle),
  // deci actualizări la fiecare 100ms rețintesc o tranziție de 0.6s încă în
  // desfășurare, iar bara "tremură" în loc să curgă lin. Pe frame (raf) +
  // transition dezactivat pe .q-btn__progress-indicator (vezi stil mai jos)
  // desenăm noi fiecare pas, fără nicio tranziție CSS care să se lupte cu ele.
  const start = Date.now()
  let rafId
  const tick = () => {
    const pct = Math.min(100, ((Date.now() - start) / 5000) * 100)
    statusChange[order.id].percentage = pct
    if (pct < 100) {
      rafId = requestAnimationFrame(tick)
    }
  }
  rafId = requestAnimationFrame(tick)

  const timeout = setTimeout(() => {
    cancelAnimationFrame(rafId)
    statusChange[order.id].percentage = 100

    statusChangeTimers[order.id].timeout = setTimeout(() => {
      delete statusChangeTimers[order.id]
      // rămâne loading:true — dispare abia după ce vine răspunsul (succes
      // sau eroare), ca userul să vadă clar cât timp e request-ul în zbor
      statusChange[order.id].requesting = true

      vendorStore.updateOrderStatus(order.id, nextStatus(order.status))
        .catch((e) => {
          console.error('[vendor/orders/status] failed, order rămâne neschimbat:', e?.response?.data || e)
        })
        .finally(() => {
          delete statusChange[order.id]
        })
    }, 250)
  }, 5000)

  statusChangeTimers[order.id] = { rafId, timeout }
}

// legat separat pe @touchstart.capture (nu pe onStatusBtnClick direct) —
// acționează DOAR când butonul e deja în waiting (loading, nu încă
// requesting). Pe primul tap (pornirea countdown-ului) QBtn nu blochează
// touchstart-ul lui normal, deci click-ul sintetic tot ajunge și pornește
// countdown-ul acolo; dacă am fi anulat/pornit direct de aici, primul tap
// ar fi pornit pe touchstart și s-ar fi anulat imediat pe click-ul care
// urmează (fals "dublu tap").
const onStatusBtnTouchStart = (order) => {
  const pending = statusChange[order.id]
  if (pending?.loading && !pending.requesting) {
    onStatusBtnClick(order)
  }
}

onBeforeUnmount(() => {
  Object.values(statusChangeTimers).forEach(({ rafId, timeout }) => {
    cancelAnimationFrame(rafId)
    clearTimeout(timeout)
  })
})

const addOrder = () => {
  if (valueOnly.value) {
    tempCustomValue.value = ''
    showCustomValueModal.value = true
    return
  }
  router.push({ name: 'vendor-new-order' })
}

// ----- sumă custom (vendor value_only) -----
const showCustomValueModal = ref(false)
const tempCustomValue = ref('')
const customValueInputRef = ref(null)

const onCustomValueDialogShow = async () => {
  await nextTick()
  customValueInputRef.value?.focus()
}

const onCustomValueCancel = () => {
  showCustomValueModal.value = false
}

// La confirmare, se deschide direct VendorPaymentModal (Card Festival/Card)
// peste pagina curentă, fără nicio navigare — coșul e un singur produs
// (suma custom introdusă).
const showPayment = ref(false)
const customCart = ref([])
const customCartTotal = computed(() => customCart.value.reduce((sum, item) => sum + item.lineTotal, 0))

const onCustomValueOk = () => {
  if (!(Number(tempCustomValue.value) > 0)) return

  customCart.value = [{ name: 'Custom amount', qty: 1, extras: [], lineTotal: Number(tempCustomValue.value) }]
  showCustomValueModal.value = false
  showPayment.value = true
}
</script>

<style scoped lang="scss">
.orders-page {
  background: $grey-1;
  min-height: 100vh;
}

/* Page header */
.page-header {
  padding: 1rem 1rem 0.75rem;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: $dark;
  letter-spacing: -0.3px;
}

/* Tabs */
.orders-tabs {
  padding: 0 1rem 0.75rem;
  background: transparent;

  :deep(.q-tabs__content) {
    gap: 6px;
  }
}
.orders-tab {
  border-radius: 22px;
  padding: 8px 16px;
  font-size: 13px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: white;
  color: $grey-7;
  min-height: 44px;
  transition: background 0.15s, color 0.15s;

  &.tab-active {
    background: $dark;
    color: white;
    border-color: $dark;
  }

  :deep(.q-tab__label) {
    font-size: 14px;
    font-weight: 600;
  }
}
.orders-tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.orders-tab-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: $dark;
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;

  .tab-active & {
    background: white;
    color: $dark;
  }
}

/* Tab panels */
.tab-panels {
  background: transparent;
}
.tab-panel {
  padding: 0 1rem 5rem;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3rem 0;
  color: $grey-5;
  font-size: 14px;
}

/* Orders grid */
.orders-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Listă plată (fără tab-uri): value_only (carduri minimale) sau
   online_orders: false (reutilizează .order-card, vezi mai jos) */
.value-only-panel {
  padding: 0.5rem 1rem 5rem;
}
.value-only-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.value-only-card {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.vo-order-id {
  font-size: 13px;
  font-weight: 600;
  color: $grey-7;
  letter-spacing: 0.5px;
  font-family: monospace;
}
.vo-order-total {
  font-size: 16px;
  font-weight: 700;
  color: $dark;
}

/* Order card */
.order-card {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  overflow: hidden;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(0, 0, 0, 0.15);
  }

  &--highlight {
    animation:
      order-highlight 5s ease-in-out forwards,
      order-bounce 0.7s ease-out;
  }
}

@keyframes order-highlight {
  0%   { background-color: white; }
  20%  { background-color: #FFF3DC; }
  70%  { background-color: #FFF3DC; }
  100% { background-color: white; }
}

@keyframes order-bounce {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.025); }
  55%  { transform: scale(0.98); }
  80%  { transform: scale(1.01); }
  100% { transform: scale(1); }
}

.card-top {
  display: flex;
  align-items: stretch;
}
.status-stripe {
  width: 4px;
  flex-shrink: 0;
  border-radius: 0;
}
.stripe-lucru    { background: #EF9F27; }
.stripe-finalizat { background: #1D9E75; }
.stripe-inchis   { background: #B4B2A9; }
.skeleton-stripe { background: $grey-3; }

.card-body {
  flex: 1;
  padding: 12px 14px 12px 12px;
}

/* Card header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.order-id {
  font-size: 12px;
  font-weight: 600;
  color: $grey-7;
  letter-spacing: 0.5px;
  font-family: monospace;
}
.order-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: 600;
}
.badge-lucru     { background: #FAEEDA; color: #854F0B; }
.badge-finalizat { background: #E1F5EE; color: #0F6E56; }
.badge-inchis    { background: #F1EFE8; color: #5F5E5A; }
.badge-online    { background: #FF7A00; color: white; font-weight: 700; }

/* Card items */
.card-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 10px;
}
.card-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  color: $dark;
}
.card-item-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.item-qty {
  font-size: 12px;
  font-weight: 600;
  color: $grey-6;
  min-width: 20px;
}
.extra {
  font-size: 12px;
  color: $grey-6;
  margin-left: 26px;
}
.order-comment {
  font-size: 12px;
  font-style: italic;
  color: $grey-6;
  font-weight: 500;
  margin-top: 6px;
}
/* Card footer */
.card-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.status-btn-wrap {
  display: contents;
}
.total-label {
  font-size: 11px;
  color: $grey-5;
  display: block;
  margin-bottom: 1px;
}
.order-total {
  font-size: 18px;
  font-weight: 600;
  color: $dark;
}

/* Buttons */
.btn-finalize {
  background: $dark !important;
  color: white !important;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 18px;
  min-height: 44px;

  // umplerea (progress fill) din timpul loading-ului — verde, ca vizual să
  // anticipeze culoarea de status "Completed" (badge-finalizat mai jos).
  // transition: none — QBtn pune implicit transition: transform 0.6s (vezi
  // use-btn.js/percentageStyle), dar percentage se actualizează pe fiecare
  // frame (requestAnimationFrame, vezi script), deci o tranziție CSS peste
  // asta doar reținteste constant o animație încă în desfășurare și bara
  // "tremură" în loc să curgă lin.
  :deep(.q-btn__progress-indicator) {
    background: #1D9E75;
    transition: none !important;
  }
}
.btn-close {
  background: $grey-2 !important;
  color: $grey-8 !important;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 18px;
  min-height: 44px;

  // umplerea din timpul loading-ului — gri mai închis decât fundalul
  // butonului ($grey-2), dar mai deschis decât textul ($grey-8), altfel
  // textul devine ilizibil peste zona umplută. transition: none — vezi
  // explicația de la .btn-finalize mai sus.
  :deep(.q-btn__progress-indicator) {
    background: $grey-5;
    transition: none !important;
  }
}
.new-order-btn {
  background: $positive !important;
  color: white !important;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 600;
  padding: 14px 22px;
  min-height: 52px;

  :deep(.q-btn__content) {
    gap: 10px;
  }

  :deep(.q-icon.on-left) {
    margin-right: 0;
  }
}
// Conținutul slotului "loading" e randat de Quasar într-un span separat,
// absolut poziționat peste tot butonul — class="absolute-full flex flex-center"
// (nu în .q-btn__content, vezi QBtn.js). .flex e clasa utilitară Quasar cu
// flex-wrap:wrap, de-aia iconița sare pe linia ei când nu încape lângă
// "Completing...". nowrap ține totul pe un rând — dar fiind position:absolute,
// span-ul ăsta NU poate lărgi singur butonul, iar fără loc suficient flex-ul
// face shrink pe iconiță până la width:0 (dispare complet) ca să țină
// white-space:nowrap pe text. De-aia .btn-status--waiting dă puțin spațiu în
// plus DOAR cât timp e activ loading-ul (nu modifică butonul în starea normală).
.btn-finalize, .btn-close {
  :deep(.absolute-full) {
    flex-wrap: nowrap;
    white-space: nowrap;
  }
  :deep(.q-spinner) {
    flex-shrink: 0;
  }
  &.btn-status--waiting {
    min-width: 150px;
  }
}
.status-done {
  font-size: 12px;
  color: $grey-5;
  display: flex;
  align-items: center;
  gap: 4px;
}

.see-all-wrap {
  display: flex;
  justify-content: center;
  padding: 20px 0 8px;
}

.btn-see-all {
  color: $grey-8 !important;
  border-color: $grey-4 !important;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 24px;
  min-height: 40px;
}

/* Dialog sumă custom (vendor value_only) */
.custom-value-dialog {
  width: 300px;
  border-radius: 14px !important;
  overflow: hidden;
}
.cv-dialog-body {
  padding: 28px 24px 20px;
}
.cv-dialog-label {
  font-size: 13px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0 0 12px;
}
.cv-dialog-input-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  border-bottom: 2px solid $dark;
  padding-bottom: 6px;
}
.cv-dialog-number-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  width: 100%;

  &::placeholder { color: #ddd; }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; }
  &[type='number'] { -moz-appearance: textfield; }
}
.cv-dialog-currency {
  font-size: 18px;
  font-weight: 600;
  color: $dark;
  flex-shrink: 0;
}
.cv-dialog-actions {
  display: flex;
  border-top: 1px solid #f0f0f0;
}
.cv-dialog-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:active { background: #f5f5f5; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
}
.cv-btn-cancel {
  color: #999;
  border-right: 1px solid #f0f0f0;
}
.cv-btn-ok {
  color: $dark;
}
</style>
