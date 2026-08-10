<template>
  <q-page class="orders-page">
    <div class="page-header">
      <span class="page-title">Orders</span>
    </div>
    <template v-if="!valueOnly">
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
          <span v-if="tab.name === 'lucru'" class="orders-tab-badge">{{ activeCount }}</span>
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
                    <span class="item-qty">{{ item.qty }}×</span>
                    <span class="item-name">{{ item.name }}</span>
                  </div>
                  <div v-if="order.extra" class="extra">
                    + {{ order.extra }}
                  </div>
                  <div
                    v-if="order.items.length > 1 && order.status !== 'lucru'"
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
                  <q-btn
                    v-if="order.status === 'lucru'"
                    label="Complete"
                    unelevated
                    no-caps
                    class="btn-finalize"
                    @click="finalizeOrder(order.id)"
                  />
                  <q-btn
                    v-else-if="order.status === 'finalizat'"
                    label="Close"
                    unelevated
                    no-caps
                    class="btn-close"
                    @click="closeOrder(order.id)"
                  />
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

    <!-- Comenzi vendor value_only: listă plată, fără status/tab-uri -->
    <div v-else class="value-only-panel">
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

    <!-- Dialog confirmare finalizare -->
    <q-dialog v-model="confirmDialog" persistent>
      <q-card style="min-width: 280px">
        <q-card-section>
          <div class="text-body1">Confirm completing order <strong>{{ pendingOrderId }}</strong>?</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="No" v-close-popup />
          <q-btn unelevated no-caps label="Yes" color="dark" @click="confirmFinalize" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog confirmare închidere -->
    <q-dialog v-model="closeDialog" persistent>
      <q-card style="min-width: 280px">
        <q-card-section>
          <div class="text-body1">Confirm closing order <strong>{{ pendingOrderId }}</strong>?</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="No" v-close-popup />
          <q-btn unelevated no-caps label="Yes" color="dark" @click="confirmClose" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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

    <VendorPaymentModal ref="paymentModalRef" :cart="customCart" :cart-total="customCartTotal" />

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
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import VendorPaymentModal from 'components/VendorPaymentModal.vue'
import { useVendorStore } from 'stores/vendor.js'

const router = useRouter()
const vendorStore = useVendorStore()

const highlightedOrderId = ref(null)

// vendor fără meniu de produse — ia doar plăți cu sumă custom, fără
// tab-urile In progress/Completed/Closed (vezi docs/vendor-api-requirements.md #1)
const valueOnly = computed(() => vendorStore.vendor?.value_only)

// orders trăiesc în store-ul vendor ca să fie vizibile și din pagina new-order
const orders = computed(() => vendorStore.orders)

// ----- tabs -----
const tabs = [
  { name: 'lucru',     label: 'In progress' },
  { name: 'finalizat', label: 'Completed' },
  { name: 'inchis',    label: 'Closed' },
]
const activeTab = ref('lucru')

// ----- computed -----
const activeCount = computed(
  () => orders.value.filter(o => o.status === 'lucru').length
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
  order.items.length <= 1 || order.status === 'lucru' || isExpanded(order.id)
    ? order.items
    : order.items.slice(0, 1)

// ----- helpers -----
const statusLabel = (status) => ({
  lucru:     'In progress',
  finalizat: 'Completed',
  inchis:    'Closed',
}[status] ?? status)

const stripeClass = (status) => ({
  lucru:     'stripe-lucru',
  finalizat: 'stripe-finalizat',
  inchis:    'stripe-inchis',
}[status])

const badgeClass = (status) => ({
  lucru:     'badge-lucru',
  finalizat: 'badge-finalizat',
  inchis:    'badge-inchis',
}[status])

// ----- actions -----
const confirmDialog = ref(false)
const closeDialog = ref(false)
const pendingOrderId = ref(null)

const finalizeOrder = (id) => {
  pendingOrderId.value = id
  confirmDialog.value = true
}

const confirmFinalize = () => {
  const order = orders.value.find(o => o.id === pendingOrderId.value)
  if (order) order.status = 'finalizat'
  confirmDialog.value = false
}

const closeOrder = (id) => {
  pendingOrderId.value = id
  closeDialog.value = true
}

const confirmClose = () => {
  const order = orders.value.find(o => o.id === pendingOrderId.value)
  if (order) order.status = 'inchis'
  closeDialog.value = false
}

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
const paymentModalRef = ref(null)
const customCart = ref([])
const customCartTotal = computed(() => customCart.value.reduce((sum, item) => sum + item.lineTotal, 0))

const onCustomValueOk = () => {
  if (!(Number(tempCustomValue.value) > 0)) return

  customCart.value = [{ name: 'Custom amount', qty: 1, extras: [], lineTotal: Number(tempCustomValue.value) }]
  showCustomValueModal.value = false
  nextTick(() => paymentModalRef.value?.open())
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
  padding: 8px 18px;
  font-size: 14px;
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

/* Listă comenzi vendor value_only (doar id + valoare) */
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
}
.btn-close {
  background: $grey-2 !important;
  color: $grey-8 !important;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 18px;
  min-height: 44px;
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
