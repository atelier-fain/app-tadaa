<template>
  <q-page class="settings-page">

    <div class="page-header">
      <span class="page-title">Online Ordering Settings</span>
    </div>


    <div v-if="vendorLoading" class="products-grid">
      <div v-for="n in 2" :key="n" class="product-card">
        <div class="card-top">
          <div class="status-stripe skeleton-stripe" />
          <div class="card-body">
            <div class="card-header">
              <div class="card-header-left">
                <q-skeleton type="text" width="50px" height="11px" />
                <q-skeleton type="text" width="150px" height="16px" class="q-mt-xs" />
              </div>
              <q-skeleton type="QBtn" width="88px" height="30px" />
            </div>

            <q-skeleton type="text" width="55px" height="12px" />

            <div class="card-footer">
              <div class="prep-info">
                <q-skeleton type="text" width="58px" height="11px" />
                <q-skeleton type="text" width="46px" height="15px" class="q-mt-xs" />
              </div>
              <div class="prep-controls">
                <q-skeleton type="QBtn" width="46px" height="46px" />
                <q-skeleton type="QBtn" width="46px" height="46px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="products-grid">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
        :class="{ 'product-card--off': !product.active }"
      >
        <div class="card-top">
          <div class="status-stripe" :class="product.active ? 'stripe-on' : 'stripe-off'" />
          <div class="card-body">

            <div class="card-header">
              <div class="card-header-left">
                <span class="category-tag">{{ product.category }}</span>
                <span class="product-name">{{ product.name }}</span>
              </div>
              <q-btn-toggle
                v-model="product.active"
                no-caps
                rounded
                unelevated
                size="sm"
                :options="[
                  { label: 'Off', value: false },
                  { label: 'On',  value: true  }
                ]"
                toggle-color="dark"
                toggle-text-color="white"
                class="toggle-btn-group"
              />
            </div>

            <div class="card-meta">
              <span v-html="_formattedPrice(product.priceRaw)" />
            </div>

            <div class="card-footer">
              <div class="prep-info">
                <span class="prep-label">Prep time</span>
                <span class="prep-val">{{ product.duration }} min</span>
              </div>
              <div class="prep-controls">
                <q-btn
                  round flat icon="remove" size="sm"
                  class="prep-btn"
                  :disable="product.duration <= 1 || !product.active"
                  @click="adjustTime(product, -1)"
                />
                <q-btn
                  round flat icon="add" size="sm"
                  class="prep-btn"
                  :disable="!product.active"
                  @click="adjustTime(product, 1)"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <q-page-sticky position="bottom-left" :offset="[18, 18]">
      <q-btn fab icon="arrow_back" color="grey-7" @click="router.push({ name: 'vendor' })" />
    </q-page-sticky>

    <q-page-sticky v-if="hasChanges" position="bottom-right" :offset="[18, 18]">
      <q-btn
        no-caps
        unelevated
        label="Save changes"
        icon="save"
        class="save-btn"
        :loading="saving"
        @click="saveSettings"
      />
    </q-page-sticky>

  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { useVendorStore, toArray } from 'stores/vendor.js'
import NotificationsBell from 'components/NotificationsBell.vue'
import _formattedPrice from 'src/mixins/formattedPrice.js'

const router = useRouter()
const vendorStore = useVendorStore()

// vendor/get e în zbor (declanșat din router/index.js la intrarea pe modul) —
// vezi VendorPage.vue/VendorNewOrder.vue pentru același pattern
const vendorLoading = computed(() => vendorStore.vendor === null)

// copie locală editabilă — nu mutăm direct vendorStore.products, ca să știm
// exact ce s-a schimbat (dirty tracking) și să trimitem la /vendor/settings/
// doar produsele modificate, nu tot meniul; fără extras — pagina asta
// editează doar active/duration.
const products = ref([])
const savedSnapshot = ref({}) // id -> { active, duration } — ultima stare salvată

function snapshotOf (list) {
  return Object.fromEntries(list.map(p => [p.id, { active: p.active, duration: p.duration }]))
}

watch(() => vendorStore.products, (list) => {
  if (!list.length) return
  products.value = list.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    active: p.active,
    duration: p.duration,
  }))
  savedSnapshot.value = snapshotOf(products.value)
}, { immediate: true })

const dirtyProducts = computed(() => products.value.filter(p => {
  const saved = savedSnapshot.value[p.id]
  return !saved || saved.active !== p.active || saved.duration !== p.duration
}))
const hasChanges = computed(() => dirtyProducts.value.length > 0)

const saving = ref(false)

async function saveSettings () {
  if (!hasChanges.value || saving.value) return

  // capturat înainte de await — dirtyProducts se golește după ce
  // savedSnapshot se resetează la succes
  const updatedCount = dirtyProducts.value.length

  saving.value = true
  try {
    const confirmed = await vendorStore.updateProductSettings(
      dirtyProducts.value.map(p => ({ _id: p.id, duration: p.duration, active: p.active }))
    )

    // aliniem copia locală cu ce a salvat efectiv backend-ul (posibile
    // normalizări/respingeri per produs) — toArray acoperă și cazul cu un
    // singur produs salvat, serializat de backend ca obiect, nu ca array
    const byId = new Map(toArray(confirmed).map(p => [p._id, p]))
    products.value.forEach(p => {
      const updated = byId.get(p.id)
      if (updated) {
        p.active = updated.active
        p.duration = Number(updated.duration)
      }
    })

    // POST-ul a reușit (n-a aruncat) — resetăm evidența indiferent de forma
    // exactă a răspunsului, ca butonul Save să dispară oricum
    savedSnapshot.value = snapshotOf(products.value)

    Notify.create({
      type: 'positive',
      message: `Settings updated successfully`,
      position: 'top'
    })
  } catch (e) {
    console.error('[vendor/settings] error:', e?.response?.data || e)
    Notify.create({
      type: 'negative',
      message: e?.response?.data?.message || 'Could not save product settings. Please try again.',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

// @click simplu (nu press-and-hold) — un tap = un minut, ca să nu se
// modifice accidental duration-ul la o apăsare ținută mai lung
const adjustTime = (product, delta) => {
  const next = product.duration + delta
  if (next >= 1) product.duration = next
}
</script>

<style scoped lang="scss">
.settings-page {
  background: $grey-1;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.75rem;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: $dark;
  letter-spacing: -0.3px;
}

.products-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 1rem 5rem;
}

/* Card */
.product-card {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  overflow: hidden;
  transition: border-color 0.15s, opacity 0.15s;

  &:hover {
    border-color: rgba(0, 0, 0, 0.15);
  }

  &--off {
    opacity: 0.5;
  }
}
.card-top {
  display: flex;
  align-items: stretch;
}
.status-stripe {
  width: 4px;
  flex-shrink: 0;
}
.stripe-on  { background: #1D9E75; }
.stripe-off { background: #B4B2A9; }
.skeleton-stripe { background: $grey-3; }

.card-body {
  flex: 1;
  padding: 12px 14px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.card-header-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.category-tag {
  display: inline-block;
  align-self: flex-start;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: $grey-6;
  background: $grey-2;
  border-radius: 4px;
  padding: 1px 6px;
}
.product-name {
  font-size: 14px;
  font-weight: 600;
  color: $dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Meta */
.card-meta {
  font-size: 12px;
  color: $grey-6;
}

/* Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.prep-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.prep-label {
  font-size: 12px;
  color: $grey-6;
}
.prep-val {
  font-size: 15px;
  font-weight: 700;
  color: $dark;
}
.prep-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
.prep-btn {
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  width: 46px !important;
  height: 46px !important;
  touch-action: manipulation !important;
  user-select: none !important;
}

.toggle-btn-group {
  :deep(.q-btn) {
    font-size: 13px !important;
    padding: 4px 14px !important;
    color: $grey-6 !important;
    border: 1px solid rgba(0, 0, 0, 0.2) !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px;
  }

  :deep(.q-btn.bg-dark) {
    border-color: $dark !important;
    color: white !important;
  }

  :deep(.q-btn:first-child) {
    border-radius: 20px 0 0 20px !important;
  }

  :deep(.q-btn:last-child) {
    border-radius: 0 20px 20px 0 !important;
    margin-left: -1px;
  }
}

.save-btn {
  background: $primary !important;
  color: white !important;
  border-radius: 30px;
  padding: 12px 22px;
  min-height: 52px;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}
</style>
