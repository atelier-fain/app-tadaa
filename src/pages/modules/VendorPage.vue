<template>
  <q-page class="orders-page">
    <div class="page-header">
      <span class="page-title">Orders</span>
    </div>
    <!-- Loading: skeleton cu forma cardurilor reale, cât timp vendor/get e în zbor -->
    <div v-if="vendorLoading" class="value-only-panel">
      <div class="orders-grid">
        <div v-for="n in 3" :key="n" class="order-card">
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

    <!-- Tab panels cu animatie -->
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
            :class="{ 'order-card--highlight': highlightedOrderId === order.id }"
          >
            <div class="card-top">
              <div class="status-stripe" :class="stripeClass(order.status)" />
              <div class="card-body">
                <div class="card-header">
                  <span class="order-id">{{ order.id }}</span>
                  <span class="order-badge" :class="badgeClass(order.status)">
                    {{ statusLabel(order.status) }}
                  </span>
                </div>

                <div class="card-items">
                  <div
                    v-for="(item, i) in visibleItems(order)"
                    :key="i"
                    class="card-item"
                  >
                    <span v-if="item.qty > 1" class="item-qty">{{ item.qty }}×</span>
                    <span class="item-name">{{ item.name }}</span>
                  </div>
                  <div v-if="order.extra" class="extra">
                    + {{ order.extra }}
                  </div>
                  <div
                    v-if="order.items.length > 1 && order.status !== ORDER_STATUS.OPENED"
                    class="expand-toggle"
                    @click="toggleOrderExpand(order.id)"
                  >
                    <q-icon :name="isExpanded(order.id) ? 'expand_less' : 'expand_more'" size="20px" />
                    <span>{{ isExpanded(order.id) ? 'See less' : 'See more' }}</span>
                  </div>
                </div>

                <div class="card-footer">
                  <div>
                    <span class="total-label">Total</span>
                    <span class="order-total">{{ order.total }} lei</span>
                  </div>
                  <!-- @click.capture pe wrapper (nu pe q-btn): cât timp loading e true,
                       QBtn face stopAndPrevent pe propriul click intern (vezi
                       QBtn.js/onLoadingEvt), deci un @click direct pe buton nu se mai
                       declanșează la al doilea click — capture pe un ancestor tot
                       primește evenimentul, indiferent, fiindcă rulează înaintea
                       handler-ului intern al butonului -->
                  <div
                    v-if="order.status !== ORDER_STATUS.CLOSED"
                    class="status-btn-wrap"
                    @click.capture="onStatusBtnClick(order)"
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
                    >
                      <template v-slot:loading>
                        <q-spinner-gears class="on-left" />
                        Completing...
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
                    >
                      <template v-slot:loading>
                        <q-spinner-gears class="on-left" />
                        Closing...
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
      </q-tab-panel>
    </q-tab-panels>
    </template>

    <!-- value_only: true — comenzi cu sumă custom, carduri minimale (doar id + total) -->
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

    <!-- value_only: false + online_orders: false — fără tab-uri de status; carduri ca la
         Completed (produse), dar fără stripe/badge/buton Close și fără "See more" —
         toate produsele apar direct -->
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
          :class="{ 'order-card--highlight': highlightedOrderId === order.id }"
        >
          <div class="card-top">
            <div class="card-body">
              <div class="card-header">
                <span class="order-id">{{ order.id }}</span>
              </div>

              <div class="card-items">
                <div v-for="(item, i) in order.items" :key="i" class="card-item">
                  <span v-if="item.qty > 1" class="item-qty">{{ item.qty }}×</span>
                  <span class="item-name">{{ item.name }}</span>
                </div>
                <div v-if="order.extra" class="extra">
                  + {{ order.extra }}
                </div>
              </div>

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

    <!-- Dialog sumă custom (vendor value_only, fără meniu de produse) -->
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

    <!-- FAB adaugă comandă -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="dark" @click="addOrder" />
    </q-page-sticky>

    <!-- FAB settings (doar dacă vendor-ul acceptă comenzi online) -->
    <q-page-sticky v-if="vendorStore.vendor?.online_orders" position="bottom-left" :offset="[18, 18]">
      <q-btn fab icon="settings" color="grey-7" @click="router.push({ name: 'vendor-settings' })" />
    </q-page-sticky>

  </q-page>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import VendorPaymentModal from 'components/VendorPaymentModal.vue'
import { useVendorStore, ORDER_STATUS } from 'stores/vendor.js'

const router = useRouter()
const vendorStore = useVendorStore()

const highlightedOrderId = ref(null)

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

// ----- expand comenzi cu mai multe produse -----
const expandedOrders = ref(new Set())

const isExpanded = (id) => expandedOrders.value.has(id)

const toggleOrderExpand = (id) => {
  if (expandedOrders.value.has(id)) {
    expandedOrders.value.delete(id)
  } else {
    expandedOrders.value.add(id)
  }
}

const visibleItems = (order) =>
  order.items.length <= 1 || order.status === ORDER_STATUS.OPENED || isExpanded(order.id)
    ? order.items
    : order.items.slice(0, 1)

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

const nextStatus = (status) => status === ORDER_STATUS.OPENED ? ORDER_STATUS.READY : ORDER_STATUS.CLOSED

const onStatusBtnClick = (order) => {
  const pending = statusChange[order.id]

  if (pending?.loading) {
    // request-ul real deja a pornit — nu se mai poate anula, butonul nu
    // primește alte acțiuni până vine răspunsul
    if (pending.requesting) return

    clearInterval(statusChangeTimers[order.id]?.interval)
    clearTimeout(statusChangeTimers[order.id]?.timeout)
    delete statusChangeTimers[order.id]
    delete statusChange[order.id]
    return
  }

  statusChange[order.id] = { loading: true, percentage: 0, requesting: false }

  const start = Date.now()
  const interval = setInterval(() => {
    statusChange[order.id].percentage = Math.min(100, ((Date.now() - start) / 5000) * 100)
  }, 100)

  const timeout = setTimeout(() => {
    clearInterval(interval)
    statusChange[order.id].percentage = 100

    // QBtn animă umplerea barei de progres cu transition: transform 0.6s —
    // dacă am ascunde loading-ul chiar acum, tranziția n-ar apuca să ajungă
    // vizual la 100% (rămânea undeva la ~85-90%). Așteptăm să se vadă plin
    // înainte să pornească request-ul real.
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
    }, 650)
  }, 5000)

  statusChangeTimers[order.id] = { interval, timeout }
}

onBeforeUnmount(() => {
  Object.values(statusChangeTimers).forEach(({ interval, timeout }) => {
    clearInterval(interval)
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
      order-highlight 2.5s ease-in-out forwards,
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

/* Card items */
.card-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 10px;
}
.card-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: $dark;
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
.expand-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: $primary;
  margin-left: -6px;
  padding: 0 8px 6px;
  min-height: 30px;
  cursor: pointer;
  width: fit-content;
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
  font-size: 16px;
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
  // anticipeze culoarea de status "Completed" (badge-finalizat mai jos)
  :deep(.q-btn__progress-indicator) {
    background: #1D9E75;
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
  // textul devine ilizibil peste zona umplută
  :deep(.q-btn__progress-indicator) {
    background: $grey-5;
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
