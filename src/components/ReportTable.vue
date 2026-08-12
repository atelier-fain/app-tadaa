<template>
  <section class="report-section">
    <div class="report-section-header">
      <div class="report-section-icon">
        <q-icon :name="icon" />
      </div>
      <h2 class="report-section-title">{{ title }}</h2>
    </div>

    <q-card flat bordered class="report-card">
      <q-table
        flat
        dense
        :rows="tableRows"
        :columns="tableColumns"
        row-key="date"
        :rows-per-page-options="[0]"
        hide-bottom
        no-data-label="No data available"
        class="report-table"
      >
        <template #header="props">
          <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
              <q-skeleton v-if="loading" type="text" width="34px" class="report-skeleton-cell" />
              <template v-else>{{ col.label }}</template>
            </q-th>
          </q-tr>
        </template>

        <template #body="props">
          <q-tr :props="props" :class="{ 'report-total-row': props.row.isTotal }">
            <q-td key="date" :props="props">
              <q-skeleton v-if="props.row.__skeleton" type="text" width="64px" />
              <template v-else>{{ props.row.date }}</template>
            </q-td>
            <q-td v-for="col in columns" :key="col.name" :props="props">
              <q-skeleton v-if="props.row.__skeleton" type="text" width="48px" class="report-skeleton-cell" />
              <template v-else>
                <span v-if="col.money" v-html="_formattedPrice(props.row[col.name])" />
                <span v-else>{{ props.row[col.name] }}</span>
              </template>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import _formattedPrice from 'src/mixins/formattedPrice.js'

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: 'insert_chart_outlined' },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  // [{ name, label, money }] — coloanele de date (fără `date`, care e mereu prima)
  columns: { type: Array, required: true }
})

const tableColumns = computed(() => [
  { name: 'date', label: 'Date', field: 'date', align: 'left' },
  ...props.columns.map(c => ({ name: c.name, label: c.label, field: c.name, align: 'right' }))
])

// Cât timp încărcăm, randăm rânduri fictive cu __skeleton: true — body
// slot-ul le desenează cu q-skeleton în loc de valori reale, refolosind
// exact markup-ul/clasele tabelului real (thead, coloane, padding), ca
// spacing-ul să fie identic cu tabelul încărcat (vezi și TicketsPage.vue).
// rândul de total se calculează din datele deja încărcate (nu vine din
// backend) — apare doar când există cel puțin un rând de date, ca să nu
// stea singur peste no-data-label-ul din tabel.
const tableRows = computed(() => {
  if (props.loading) return Array.from({ length: 4 }, (_, i) => ({ date: i, __skeleton: true }))

  if (!props.rows.length) return []

  const totals = { date: 'Total', isTotal: true }
  props.columns.forEach(col => {
    totals[col.name] = props.rows.reduce((sum, r) => sum + (Number(r[col.name]) || 0), 0)
  })

  return [...props.rows, totals]
})
</script>

<style lang="scss">
.report-section {
  margin-bottom: 24px;
}

.report-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
}

.report-section-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #FBEAE9;
  color: #e15350;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .q-icon {
    font-size: 17px;
  }
}

.report-section-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: $dark;
}

.report-card {
  border-radius: 12px !important;
  border-color: $grey-3 !important;
  overflow: hidden;
}

.report-table {
  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    background: $grey-1;
  }

  thead tr th {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $grey-7;
  }

  tbody td {
    font-size: 13px;
    color: $dark;
  }

  tbody tr:not(.report-total-row):hover {
    background: $grey-1;
  }

  .report-total-row {
    td {
      font-weight: 700;
      border-top: 1.5px solid $grey-4;
      background: #FBEAE9;
      color: #a83b38;
    }
  }
}
</style>
