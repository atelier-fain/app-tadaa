<template>
  <q-page class="report-page">
    <!-- auto deploy -->
    <div class="report-container">
      <h1 class="report-title">Report</h1>

      <template v-if="checkingUser">
        <ReportTable title="Tickets" icon="confirmation_number" :rows="[]" :loading="true" :columns="paymentColumns" />
        <ReportTable title="Vendor" icon="storefront" :rows="[]" :loading="true" :columns="vendorColumns" />
        <ReportTable title="Access" icon="qr_code_scanner" :rows="[]" :loading="true" :columns="accessColumns" />
        <ReportTable title="Top Up" icon="account_balance_wallet" :rows="[]" :loading="true" :columns="paymentColumns" />
      </template>

      <template v-else>
        <p v-if="!hasAnyReport" class="report-empty">
          You don't have access to any report data.
        </p>

        <ReportTable
          v-if="dataStore.user?.app_tickets"
          title="Tickets"
          icon="confirmation_number"
          :rows="reportStore.tickets"
          :loading="reportStore.loading.tickets"
          :columns="paymentColumns"
        />

        <ReportTable
          v-if="dataStore.user?.app_vendor"
          title="Vendor"
          icon="storefront"
          :rows="reportStore.vendor"
          :loading="reportStore.loading.vendor"
          :columns="vendorColumns"
        />

        <ReportTable
          v-if="dataStore.user?.app_access"
          title="Access"
          icon="qr_code_scanner"
          :rows="reportStore.access"
          :loading="reportStore.loading.access"
          :columns="accessColumns"
        />

        <ReportTable
          v-if="dataStore.user?.app_topup"
          title="Top Up"
          icon="account_balance_wallet"
          :rows="reportStore.topUp"
          :loading="reportStore.loading.topUp"
          :columns="paymentColumns"
        />
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDataStore } from 'stores/data.js'
import { useReportStore } from 'stores/report.js'
import ReportTable from 'components/ReportTable.vue'

const dataStore = useDataStore()
const reportStore = useReportStore()

const checkingUser = ref(true)

const paymentColumns = [
  { name: 'cash', label: 'Cash', money: true },
  { name: 'card', label: 'Card', money: true },
  { name: 'total', label: 'Total', money: true }
]

const vendorColumns = [
  { name: 'online', label: 'Online', money: true },
  { name: 'card', label: 'Card', money: true },
  { name: 'prepaid', label: 'Prepaid', money: true },
  { name: 'total', label: 'Total', money: true }
]

const accessColumns = [
  { name: 'scans', label: 'Scans', money: false }
]

const hasAnyReport = computed(() => !!(
  dataStore.user?.app_tickets || dataStore.user?.app_vendor || dataStore.user?.app_access || dataStore.user?.app_topup
))

onMounted(async () => {
  // /report nu are permisiune (accesibil oricărui user logat) — spre
  // deosebire de celelalte module, permisiunile pentru fiecare tabel nu
  // sunt verificate de router guard, deci le reverificăm aici direct din
  // backend înainte de a decide ce request-uri de date se fac.
  try {
    await dataStore.check_token()
  } catch (e) {
    // dataStore.user rămâne pe ce era în cookie; tabelele oricum nu se
    // afișează dacă userul nu are permisiunea corespunzătoare
  } finally {
    checkingUser.value = false
  }

  if (dataStore.user?.app_tickets) reportStore.fetchTicketsReport()
  if (dataStore.user?.app_vendor) reportStore.fetchVendorReport()
  if (dataStore.user?.app_access) reportStore.fetchAccessReport()
  if (dataStore.user?.app_topup) reportStore.fetchTopUpReport()
})
</script>

<style lang="scss">
.report-page {
  padding: 20px 16px 60px;
}

.report-container {
  max-width: 720px;
  margin: 0 auto;
}

.report-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 18px;
}

.report-empty {
  color: $grey-6;
  font-size: 14px;
}
</style>
