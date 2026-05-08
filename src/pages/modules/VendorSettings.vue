<template>
  <q-page class="settings-page">

    <div class="page-header">
      <span class="page-title">Settings</span>
    </div>

    <div class="products-grid">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
        :class="{ 'product-card--off': !product.enabled }"
      >
        <div class="card-top">
          <div class="status-stripe" :class="product.enabled ? 'stripe-on' : 'stripe-off'" />
          <div class="card-body">

            <div class="card-header">
              <div class="card-header-left">
                <span class="category-tag">{{ product.category }}</span>
                <span class="product-name">{{ product.name }}</span>
              </div>
              <q-btn-toggle
                v-model="product.enabled"
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
              <span>{{ product.price }} RON</span>
            </div>

            <div class="card-footer">
              <span class="prep-label">Prep time</span>
              <div class="prep-controls">
                <q-btn
                  round flat icon="remove" size="sm"
                  class="prep-btn"
                  :disable="product.prepTime <= 1 || !product.enabled"
                  @mousedown="startHold(product, -1)"
                  @touchstart.prevent="startHold(product, -1)"
                  @mouseup="stopHold"
                  @mouseleave="stopHold"
                  @touchend="stopHold"
                />
                <span class="prep-val">{{ product.prepTime }} min</span>
                <q-btn
                  round flat icon="add" size="sm"
                  class="prep-btn"
                  :disable="!product.enabled"
                  @mousedown="startHold(product, 1)"
                  @touchstart.prevent="startHold(product, 1)"
                  @mouseup="stopHold"
                  @mouseleave="stopHold"
                  @touchend="stopHold"
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

  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const products = ref([
  { id: 1, name: 'Pizza Margherita',        category: 'Pizza', price: 39, enabled: true,  prepTime: 10 },
  { id: 2, name: 'Pizza Quattro Formagi',   category: 'Pizza', price: 45, enabled: true,  prepTime: 10 },
  { id: 3, name: 'Pizza Diavola',           category: 'Pizza', price: 43, enabled: true,  prepTime: 10 },
  { id: 4, name: 'Pizza Prosciutto Funghi', category: 'Pizza', price: 48, enabled: true,  prepTime: 10 },
])

const adjustTime = (product, delta) => {
  const next = product.prepTime + delta
  if (next >= 1) product.prepTime = next
}

let holdTimer = null
let holdInterval = null

function startHold(product, delta) {
  adjustTime(product, delta)
  holdTimer = setTimeout(() => {
    holdInterval = setInterval(() => adjustTime(product, delta), 80)
  }, 400)
}

function stopHold() {
  clearTimeout(holdTimer)
  clearInterval(holdInterval)
}
</script>

<style scoped lang="scss">
.settings-page {
  background: $grey-1;
  min-height: 100vh;
}

.page-header {
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
.prep-label {
  font-size: 12px;
  color: $grey-6;
}
.prep-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
.prep-val {
  font-size: 13px;
  font-weight: 600;
  color: $dark;
  min-width: 44px;
  text-align: center;
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
</style>
