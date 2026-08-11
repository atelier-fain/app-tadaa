<template>
  <q-page class="new-order-page">
    <div class="page-header">
      <span class="page-title">New order</span>
    </div>

    <!-- Loading: skeleton cu forma tab-urilor + rândurilor reale, cât timp vendor/get e în zbor -->
    <template v-if="vendorLoading">
      <div class="category-tabs category-tabs--skeleton">
        <q-skeleton v-for="n in 3" :key="n" type="QChip" width="80px" height="50px" class="category-tab-skeleton" />
      </div>

      <div class="products-list">
        <div v-for="n in 4" :key="n" class="product-row">
          <div class="product-main" style="padding: 16px 14px;">
            <div class="product-info">
              <q-skeleton type="text" width="140px" height="16px" />
              <q-skeleton type="text" width="60px" height="13px" class="q-mt-xs" />
            </div>
            <div class="product-actions">
              <q-skeleton type="QBtn" width="76px" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
    <q-tabs
      v-model="activeCategory"
      dense
      no-caps
      align="left"
      class="category-tabs"
      indicator-color="transparent"
      active-color="primary"
    >
      <q-tab
        v-for="cat in vendorStore.categories"
        :key="cat"
        :name="cat"
        :label="cat"
        class="category-tab"
        :class="{ 'tab-active': activeCategory === cat }"
      />
    </q-tabs>

    <div class="products-list">
      <div
        v-for="product in productsInCategory"
        :key="product.id"
        class="product-row"
      >
        <div class="product-main">
          <div class="product-info">
            <span class="product-name">{{ product.name }}</span>
            <span class="product-price">{{ product.price }} lei</span>
          </div>
          <div class="product-actions">
            <q-btn
              v-if="product.extraGroups?.length"
              no-caps
              flat
              label="Extra"
              :icon-right="expandedId === product.id ? 'expand_less' : 'expand_more'"
              class="extra-btn"
              @click="toggleExpand(product)"
            />
            <q-btn
              v-if="expandedId !== product.id"
              no-caps
              unelevated
              label="Add"
              class="add-btn-row"
              @click="quickAdd(product)"
            />
          </div>
        </div>

        <div v-if="expandedId === product.id" class="extras-panel">
          <div
            v-for="group in product.extraGroups"
            :key="group.title"
            class="extras-group"
            :class="{ 'extras-group--error': showRequiredError && group.required && selectedCount(group) === 0 }"
          >
            <div class="group-title">
              {{ group.title }}
              <span v-if="group.required" class="group-required-star" title="Required">*</span>
              <span v-if="group.options.length > group.max" class="group-max">(max {{ group.max }} selections)</span>
            </div>
            <p v-if="showRequiredError && group.required && selectedCount(group) === 0" class="group-error-msg">
              This is required
            </p>
            <div
              v-for="opt in group.options"
              :key="opt.name"
              class="extras-row"
              :class="{ 'extras-row--disabled': !isSelected(opt, group) && selectedCount(group) >= group.max }"
              @click="toggleExtra(group, opt)"
            >
              <div class="extras-checkbox" :class="{ 'is-checked': isSelected(opt, group) }">
                <q-icon v-if="isSelected(opt, group)" name="check" size="17px" />
              </div>
              <span class="extras-name">{{ opt.name }}</span>
              <span class="extras-price" v-html="formatPrice(opt.price, true)" />
            </div>
          </div>

          <div class="extras-footer">
            <span class="extras-total" v-html="formatPrice(expandedTotal, true)" />
            <q-btn
              no-caps
              unelevated
              label="Add to order"
              class="add-btn"
              @click="confirmAdd(product)"
            />
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- Coș sticky -->
    <q-page-sticky v-if="cart.length" position="bottom-right" :offset="[18, 18]">
      <div class="cart-sticky-group" :class="{ 'cart-pulse': cartBump }">
        <q-btn flat icon="info" class="cart-info-btn" @click="cartDialogOpen = true" />
        <q-btn no-caps unelevated class="cart-btn" @click="showPayment = true">
          <span class="cart-count">{{ cartQty }}</span>
          <span class="cart-label">Place order</span>
          <span class="cart-total">{{ cartTotal }} lei</span>
        </q-btn>
      </div>
    </q-page-sticky>

    <q-page-sticky position="bottom-left" :offset="[18, 18]">
      <q-btn fab icon="arrow_back" color="grey-7" @click="router.push({ name: 'vendor' })" />
    </q-page-sticky>

    <!-- Popup comandă completă -->
    <q-dialog v-model="cartDialogOpen">
      <q-card class="cart-summary-card">
        <div class="cart-summary-header">
          <span class="cart-summary-title">Your order</span>
          <q-icon name="close" class="cart-summary-close" @click="cartDialogOpen = false" />
        </div>

        <div v-for="(item, i) in cart" :key="i" class="cart-summary-row">
          <div class="cart-summary-main">
            <span class="cart-summary-name">{{ item.name }}</span>
            <div class="cart-summary-right">
              <span class="cart-summary-price" v-html="formatPrice(item.lineTotal)" />
              <q-icon name="delete_outline" class="cart-summary-delete" @click="removeFromCart(i)" />
            </div>
          </div>
          <div v-if="item.extras.length" class="cart-summary-extras">
            + {{ item.extras.map(e => e.name).join(', ') }}
          </div>
        </div>

        <div class="cart-summary-footer">
          <span>Total</span>
          <span class="cart-summary-total" v-html="formatPrice(cartTotal)" />
        </div>
      </q-card>
    </q-dialog>

    <VendorPaymentModal v-model="showPayment" :cart="cart" :cart-total="cartTotal" />
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVendorStore } from 'stores/vendor.js'
import VendorPaymentModal from 'components/VendorPaymentModal.vue'

const router = useRouter()
const vendorStore = useVendorStore()
const showPayment = ref(false)

// vendor/get e în zbor (declanșat din router/index.js la intrarea pe modul) —
// produsele nu sunt încă disponibile, deci arătăm un skeleton (vezi VendorPage.vue)
const vendorLoading = computed(() => vendorStore.vendor === null)

const activeCategory = ref(vendorStore.categories[0])
// products vine async din fetchVendor() — dacă pagina a fost deschisă direct
// (refresh pe /vendor/new-order), categories e goală la mount, deci fixăm
// tab-ul activ abia când apare prima categorie
watch(() => vendorStore.categories, (categories) => {
  if (!activeCategory.value && categories.length) activeCategory.value = categories[0]
})

const productsInCategory = computed(
  () => vendorStore.products.filter(p => p.category === activeCategory.value)
)

// ----- panou extra-uri (expand inline) -----
const expandedId = ref(null)
const selectedExtras = ref([]) // [{ group, name, price }]
// true = arată highlight + "This is required" pe grupurile obligatorii
// nesatisfăcute — pornit doar după o încercare de Add/Add to order blocată,
// nu la simpla deschidere a panoului (vezi quickAdd/confirmAdd)
const showRequiredError = ref(false)

function toggleExpand (product) {
  if (expandedId.value === product.id) {
    expandedId.value = null
    return
  }
  expandedId.value = product.id
  selectedExtras.value = []
  showRequiredError.value = false
}

function isSelected (opt, group) {
  return selectedExtras.value.some(e => e.group === group.title && e.name === opt.name)
}

function selectedCount (group) {
  return selectedExtras.value.filter(e => e.group === group.title).length
}

// Regula "max N selecții": blochează adăugarea unei noi opțiuni în grup
// odată ce selectedCount(group) a atins group.max — deselectarea rămâne
// mereu posibilă, ca userul să poată înlocui o alegere.
function toggleExtra (group, opt) {
  const idx = selectedExtras.value.findIndex(e => e.group === group.title && e.name === opt.name)
  if (idx >= 0) {
    selectedExtras.value.splice(idx, 1)
    return
  }
  if (selectedCount(group) >= group.max) return
  selectedExtras.value.push({ group: group.title, name: opt.name, price: opt.price, priceRaw: opt.priceRaw, plu: opt.plu })
}

const expandedProduct = computed(
  () => productsInCategory.value.find(p => p.id === expandedId.value)
)
const expandedTotal = computed(
  () => (expandedProduct.value?.price || 0) + selectedExtras.value.reduce((sum, e) => sum + e.price, 0)
)

// grupurile obligatorii (accept_no_selection: false pe backend) fără nicio
// opțiune bifată încă — blochează "Add to order" cât timp lista nu e goală
const missingRequiredGroups = computed(() => (expandedProduct.value?.extraGroups || [])
  .filter(group => group.required && selectedCount(group) === 0)
  .map(group => group.title)
)

function formatPrice (value, withUnit = false) {
  return `${Math.floor(value)}<sup>00</sup>${withUnit ? ' lei' : ''}`
}

// fiecare click de "Add" creează o linie nouă în coș (nu incrementează o
// cantitate), deci nu există un câmp qty pe item.
// Dacă produsul are vreun grup de extra obligatoriu, "Add" (quick-add) nu
// mai adaugă direct — deschide panoul de extra-uri și arată highlight +
// "This is required" pe grupul nesatisfăcut, la fel ca la un "Add to order"
// blocat (altfel quick-add ocolea complet validarea).
function quickAdd (product) {
  if (product.extraGroups?.some(g => g.required)) {
    expandedId.value = product.id
    selectedExtras.value = []
    showRequiredError.value = true
    return
  }

  cart.value.push({
    name: product.name,
    productId: product.id,
    plu: product.plu,
    priceRaw: product.priceRaw,
    extras: [],
    lineTotal: product.price,
  })
  bumpCart()
}

function confirmAdd (product) {
  if (missingRequiredGroups.value.length) {
    showRequiredError.value = true
    return
  }

  cart.value.push({
    name: product.name,
    productId: product.id,
    plu: product.plu,
    priceRaw: product.priceRaw,
    extras: selectedExtras.value.map(e => ({ name: e.name, price: e.price, priceRaw: e.priceRaw, plu: e.plu })),
    lineTotal: expandedTotal.value,
  })
  expandedId.value = null
  selectedExtras.value = []
  showRequiredError.value = false
  bumpCart()
}

// ----- coș -----
const cart = ref([])
// fiecare linie din cart reprezintă 1 bucată (nu mai există qty per item)
const cartQty = computed(() => cart.value.length)
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.lineTotal, 0))
const cartDialogOpen = ref(false)

// șterge o linie din coș direct din popup-ul "Your order" — dacă rămâne
// gol, închidem popup-ul (butonul sticky care l-a deschis dispare oricum)
function removeFromCart (index) {
  cart.value.splice(index, 1)
  if (!cart.value.length) cartDialogOpen.value = false
}

// declanșează un puls dublu pe box-shadow-ul butonului "Place order" la fiecare adăugare
const cartBump = ref(false)
let bumpTimeout = null

function bumpCart () {
  cartBump.value = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { cartBump.value = true })
  })
  clearTimeout(bumpTimeout)
  bumpTimeout = setTimeout(() => { cartBump.value = false }, 1200)
}

</script>

<style scoped lang="scss">
.new-order-page {
  background: $grey-1;
  min-height: 100vh;
  padding-bottom: 5rem;
}

.page-header {
  padding: 0.75rem 1rem 0.5rem;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: $dark;
  letter-spacing: -0.3px;
}

/* Tabs categorii */
.category-tabs {
  padding: 0 1rem 0.75rem;
  background: transparent;

  :deep(.q-tabs__content) {
    gap: 6px;
  }
}
.category-tabs--skeleton {
  display: flex;
  gap: 6px;
}
.category-tab-skeleton {
  border-radius: 22px;
}
.category-tab {
  border-radius: 22px;
  padding: 8px 18px;
  font-size: 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.15);
  background: white;
  color: $grey-7;
  min-height: 44px;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &.tab-active {
    background: #EAF2FC;
    color: $primary;
    border-color: $primary;
  }

  :deep(.q-tab__label) {
    font-size: 14px;
    font-weight: 600;
  }
}

/* Listă produse */
.products-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 1rem;
}
.product-row {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  overflow: hidden;
}
.product-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
}
.product-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.product-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.extra-btn {
  color: $grey-7 !important;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 12px;
  min-height: 44px;

  :deep(.q-icon.on-right) {
    margin-left: 0;
  }
}
.add-btn-row {
  background: white !important;
  color: $primary !important;
  border: 1.5px solid $primary;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  padding: 8px 18px;
  min-height: 44px;
}
.product-name {
  font-size: 14px;
  font-weight: 600;
  color: $dark;
}
.product-price {
  font-size: 13px;
  color: $grey-6;
}

/* Panou extra-uri (expand inline) */
.extras-panel {
  background: #F5F8FC;
  color: $dark;
  padding: 16px 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.extras-group {
  margin-bottom: 14px;
  padding: 8px;
  margin-left: -8px;
  margin-right: -8px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  transition: border-color 0.15s, background 0.15s;

  &--error {
    border-color: $negative;
    background: rgba(210, 50, 50, 0.06);
  }
}
.group-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
  color: $dark;
}
.group-max {
  font-size: 13px;
  font-weight: 400;
  color: $grey-6;
}
.group-required-star {
  font-size: 16px;
  font-weight: 700;
  color: $negative;
  margin-left: 2px;
}
.group-error-msg {
  margin: -4px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: $negative;
}
.extras-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  min-height: 44px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;

  &:last-child {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
}
.extras-checkbox {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 7px;
  border: 1.5px solid $grey-5;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;

  &.is-checked {
    background: $primary;
    border-color: $primary;
    color: white;
  }
}
.extras-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: $dark;
}
.extras-price {
  font-size: 14px;
  font-weight: 700;
  color: $dark;

  :deep(sup) {
    font-size: 10px;
  }
}
.extras-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
.extras-total {
  font-size: 22px;
  font-weight: 700;
  color: $dark;

  :deep(sup) {
    font-size: 12px;
  }
}
.add-btn {
  background: white !important;
  color: $primary !important;
  border: 1.5px solid $primary;
  border-radius: 12px;
  padding: 8px 22px;
  min-height: 48px;
  font-size: 15px;
  font-weight: 700;
}

/* Coș sticky */
.cart-sticky-group {
  display: flex;
  align-items: stretch;
  border-radius: 30px;
  overflow: hidden;
  background: white;
  border: 1.5px solid $primary;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);

  &.cart-pulse {
    animation: cart-pulse 0.9s ease-out 1;
  }
}

@keyframes cart-pulse {
  0%   { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05), 0 0 0 0 rgba(25, 118, 210, 0.45); }
  70%  { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05), 0 0 0 14px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05), 0 0 0 0 rgba(25, 118, 210, 0); }
}
.cart-info-btn {
  background: white !important;
  color: $primary !important;
  border-radius: 0 !important;
  padding: 0 18px !important;
  min-height: 52px;
  border-right: 1.5px solid $primary;
}
.cart-btn {
  background: white !important;
  color: $primary !important;
  border-radius: 0 !important;
  padding: 14px 22px;
  min-height: 52px;

  :deep(.q-btn__content) {
    gap: 10px;
  }
}
.cart-count {
  background: $primary;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}
.cart-label {
  font-size: 15px;
  font-weight: 600;
}
.cart-total {
  font-size: 15px;
  font-weight: 700;
}

/* Popup comandă completă */
.cart-summary-card {
  width: 100%;
  max-width: 380px;
  background: white;
  color: $dark;
  padding: 20px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.cart-summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.cart-summary-title {
  font-size: 20px;
  font-weight: 700;
  color: $dark;
}
.cart-summary-close {
  cursor: pointer;
  font-size: 26px;
  color: $grey-7;
  padding: 6px;
  margin: -6px;
}
.cart-summary-row {
  padding: 12px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  &:last-of-type {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
}
.cart-summary-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cart-summary-name {
  font-size: 16px;
  font-weight: 500;
  color: $dark;
}
.cart-summary-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}
.cart-summary-price {
  font-size: 16px;
  font-weight: 700;
  color: $dark;

  :deep(sup) {
    font-size: 11px;
  }
}
.cart-summary-delete {
  font-size: 24px;
  color: $grey-6;
  cursor: pointer;
  padding: 6px;
  margin: -6px;

  &:active {
    color: $negative;
  }
}
.cart-summary-extras {
  font-size: 13px;
  color: $grey-6;
  margin-top: 4px;
}
.cart-summary-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  font-size: 16px;
  font-weight: 600;
  color: $dark;
}
.cart-summary-total {
  font-size: 24px;
  font-weight: 700;
  color: $primary;

  :deep(sup) {
    font-size: 11px;
  }
}

</style>
