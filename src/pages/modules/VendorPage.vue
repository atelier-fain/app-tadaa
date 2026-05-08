<template>
  <q-page class="orders-page">
    <div class="summary-bar">
      <div class="summary-chip">
        <span class="chip-label">Active orders</span>
        <span class="chip-val">{{ activeCount }}</span>
      </div>
      <div class="summary-chip">
        <span class="chip-label">Today's total</span>
        <span class="chip-val">{{ totalToday }} RON</span>
      </div>
      <div class="summary-actions">
        <NotificationsBell :trigger="notifTrigger" :notification="notifData" />
        <q-btn flat round dense icon="settings" @click="router.push({ name: 'vendor-settings' })" />
      </div>
    </div>
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
        :label="tab.label"
        class="orders-tab"
        :class="{ 'tab-active': activeTab === tab.name }"
      />
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
                    v-for="(item, i) in order.items"
                    :key="i"
                    class="card-item"
                  >
                    <span class="item-qty">{{ item.qty }}×</span>
                    <span class="item-name">{{ item.name }}</span>
                  </div>
                  <div v-if="order.extra" class="extra">
                    + {{ order.extra }}
                  </div>
                </div>

                <div class="card-footer">
                  <div>
                    <span class="total-label">Total</span>
                    <span class="order-total">{{ order.total }} RON</span>
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

    <!-- FAB adaugă comandă -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="dark" @click="addOrder" />
    </q-page-sticky>

    <!-- FAB test notificare (mockup) -->
    <q-page-sticky position="bottom-left" :offset="[18, 18]">
      <q-btn fab icon="notifications" color="grey-7" @click="simulateNewOrder" />
    </q-page-sticky>

  </q-page>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import NotificationsBell from 'components/NotificationsBell.vue'

const router = useRouter()

const notifTrigger = ref(0)
const notifData = ref({})
const highlightedOrderId = ref(null)

function scrollToOrder(orderId) {
  const alreadyOnTab = activeTab.value === 'lucru'
  activeTab.value = 'lucru'

  const doScroll = () => {
    const el = document.getElementById(`order-${orderId.replace('#', '')}`)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
    setTimeout(() => {
      highlightedOrderId.value = orderId
      setTimeout(() => { highlightedOrderId.value = null }, 2600)
    }, 350)
  }

  if (alreadyOnTab) {
    nextTick(doScroll)
  } else {
    setTimeout(doScroll, 350)
  }
}

function simulateNewOrder() {
  const orderId = '#ita0403'
  notifData.value = {
    icon: 'notifications_active',
    message: `New order ${orderId}`,
    caption: '1× Pizza Quattro Formagi · 45 RON',
    actions: [{ label: 'View', color: 'white', noCaps: true, handler: () => scrollToOrder(orderId) }]
  }
  notifTrigger.value++
}

// ----- date mock -----
const orders = ref([
  {
    id: '#ita0406',
    status: 'lucru',
    items: [{ qty: 1, name: 'Pizza Quattro Formagi' }],
    extra: null,
    total: 45,
  },
  {
    id: '#ita0405',
    status: 'lucru',
    items: [{ qty: 1, name: 'Pizza Prosciutto Funghi' }],
    extra: 'Dulce (5 RON)',
    total: 48,
  },
  {
    id: '#ita0404',
    status: 'lucru',
    items: [{ qty: 1, name: 'Pizza Margherita' }],
    extra: null,
    total: 39,
  },
  {
    id: '#ita0403',
    status: 'lucru',
    items: [{ qty: 1, name: 'Pizza Quattro Formagi' }],
    extra: null,
    total: 45,
  },
  {
    id: '#ita0402',
    status: 'lucru',
    items: [{ qty: 2, name: 'Pizza Diavola' }],
    extra: null,
    total: 80,
  },
  {
    id: '#ita0401',
    status: 'lucru',
    items: [{ qty: 1, name: 'Pizza Capricciosa' }, { qty: 1, name: 'Tiramisu' }],
    extra: null,
    total: 62,
  },
  {
    id: '#ita0400',
    status: 'lucru',
    items: [{ qty: 3, name: 'Pizza Margherita' }],
    extra: 'Fara gluten',
    total: 117,
  },
])

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
const totalToday = computed(
  () => orders.value.reduce((sum, o) => sum + o.total, 0)
)

const filteredOrders = (status) =>
  orders.value.filter(o => o.status === status)

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
  // TODO: deschide dialog/formular comandă nouă
  console.log('Adaugă comandă nouă')
}
</script>

<style scoped lang="scss">
.orders-page {
  background: $grey-1;
  min-height: 100vh;
}

/* Summary bar */
.summary-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1rem 1rem 0.75rem;
}
.summary-actions {
  display: flex;
  flex-direction: column;
}
.summary-chip {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.07);
}
.chip-label {
  font-size: 11px;
  color: $grey-6;
  display: block;
  margin-bottom: 2px;
}
.chip-val {
  font-size: 20px;
  font-weight: 600;
  color: $dark;
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
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 13px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: white;
  color: $grey-7;
  min-height: 32px;
  transition: background 0.15s, color 0.15s;

  &.tab-active {
    background: $dark;
    color: white;
    border-color: $dark;
  }

  :deep(.q-tab__label) {
    font-size: 13px;
    font-weight: 500;
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
  border-radius: 6px;
  font-size: 13px;
  padding: 4px 14px;
}
.btn-close {
  background: $grey-2 !important;
  color: $grey-8 !important;
  border-radius: 6px;
  font-size: 13px;
  padding: 4px 14px;
}
.status-done {
  font-size: 12px;
  color: $grey-5;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
