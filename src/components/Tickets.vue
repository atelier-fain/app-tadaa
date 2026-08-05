<template>
  <div class="tickets">
    <q-card v-for="{ title, tickets } in ticketCategories"
            :key="title">
      <span class="title">{{ title }}</span>
      <div class="list">
        <div class="ticket-container"
             v-for="({ _id, price, name, compare_at_price }, index) in tickets"
             :key="_id">
          <div class="ticket">
            <span class="title-ticket">{{ name }}</span>
            <div class="right">
              <div class="price">
                <div v-if="compare_at_price" class="discount">
                  <span class="old" v-html="_formattedPrice(compare_at_price)"></span>
                  <span class="new" v-html="_formattedPrice(price)"></span>
                </div>
                <span v-else class="current-price" v-html="_formattedPrice(price)"></span>
              </div>
              <div class="handle-qty">
                <q-btn icon="remove"
                       dense
                       flat
                       :disable="!ticketsQuantity[_id] || ticketsQuantity[_id] === 0"
                       @mousedown="handleQty({ action: 'remove', _id })"
                       @touchstart.prevent="handleQty({ action: 'remove', _id })"
                />
                <q-field outlined dense>
                  <template v-slot:control>
                    <div class="self-center full-width no-outline" tabindex="0">
                      {{ ticketsQuantity[_id] || 0 }}
                    </div>
                  </template>
                </q-field>
                <q-btn icon="add" dense flat
                       @mousedown="handleQty({ action: 'add', _id })"
                       @touchstart.prevent="handleQty({ action: 'add', _id })"
                />
              </div>
            </div>
          </div>
          <q-separator v-if="index + 1 !== tickets.length" />
        </div>
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import _formattedPrice from "src/mixins/formattedPrice.js";

const props = defineProps({
  tickets: { type: Object, default: null }
})

const ticketCategories = computed(() => props.tickets?.ticket_categories || [])

const emit = defineEmits(['update:totalQty', 'update:totalPrice'])

const ticketsQuantity = reactive({})

const allTickets = computed(() => ticketCategories.value.flatMap(c => c.tickets))

const totalPrice = computed(() =>
  Object.entries(ticketsQuantity).reduce((sum, [id, qty]) => {
    const ticket = allTickets.value.find(t => t._id === id)
    return sum + (ticket ? Number(ticket.price) * qty : 0)
  }, 0)
)

function handleQty({ action, _id }) {
  if (action === 'add') {
    ticketsQuantity[_id] = (ticketsQuantity[_id] || 0) + 1
  } else if (action === 'remove' && ticketsQuantity[_id] > 0) {
    ticketsQuantity[_id] -= 1
  }
  const total = Object.values(ticketsQuantity).reduce((sum, qty) => sum + qty, 0)
  emit('update:totalQty', total)
  emit('update:totalPrice', totalPrice.value)
}

const selectedTicketIds = computed(() =>
  Object.entries(ticketsQuantity).flatMap(([id, qty]) =>
    Array(qty).fill(id)
  )
)

function reset() {
  Object.keys(ticketsQuantity).forEach(k => delete ticketsQuantity[k])
  emit('update:totalQty', 0)
  emit('update:totalPrice', 0)
}

defineExpose({ reset, selectedTicketIds })
</script>

<style lang="scss">
.tickets {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;

  .title {
    font-size: 20px;
    font-weight: 700;
    display: block;
    margin-bottom: 16px;
  }

  > .q-card {
    padding: 16px;

    .list {
      display: flex;
      gap: 10px;
      flex-direction: column;

      .ticket-container {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .ticket {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .title-ticket {
            font-size: 14px;
            width: 65%;
            color: $dark;
          }

          .right {
            width: 35%;
            display: flex;
            align-items: center;
            justify-content: space-between;

            .price {
              width: 150px;
              text-align: center;
              font-size: 16px;

              .discount {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;

                .old {
                  font-size: 14px;
                  text-decoration: line-through;
                  color: $grey;
                }

                .new {
                  font-weight: 700;
                  font-size: 18px;
                  color: $dark;
                }
              }

              .current-price {
                font-weight: 700;
                font-size: 18px;
                color: $dark;
              }
            }

            .handle-qty {
              display: flex;
              align-items: center;
              gap: 6px;

              .q-btn {
                touch-action: manipulation !important;
                user-select: none !important;
              }

              .q-field {
                width: 50px;

                .q-field__inner .q-field__control .q-field__control-container .q-field__native {
                  text-align: center;
                }
              }
            }
          }
        }
      }
    }
  }

  @media only screen and (max-width: 768px) {
    .q-card {
      .title {
        font-size: 18px;
      }

      .list {
        .ticket-container {
          .ticket {
            flex-direction: column;
            align-items: unset;
            gap: 6px;

            .title-ticket {
              width: 100%;
            }

            .right {
              width: 100%;

              .price {
                width: unset;

                .discount {
                  .old {
                    font-size: 12px;
                  }

                  .new {
                    font-size: 16px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
