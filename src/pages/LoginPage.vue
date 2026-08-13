<template>
  <div class="login-page">
    <div class="login-box">
      <div class="text-center q-mb-md">
        <img
          :src="$img('logo.png')"
          alt="Logo"
          class="q-img login-logo">
      </div>

      <q-form
        @submit.prevent="handleSubmit"
        @validation-error="(ref) => scrollToErrorField(ref)"
        greedy>
        <q-input
          v-model="form.user"
          label="User"
          filled
          bg-color="white"
          lazy-rules="ondemand"
          :rules="[val => !!val || 'Userul este obligatoriu']"
        />
        <q-input
          v-model="form.password"
          label="Password"
          type="password"
          filled
          bg-color="white"
          lazy-rules="ondemand"
          :rules="[
            val => !!val || 'Parola este obligatorie',
            val => val.length >= 4 || 'Minim 4 caractere'
          ]"
        />

        <q-btn
          label="Login"
          color="black"
          class="full-width login-btn"
          unelevated
          no-caps
          type="submit"
          :loading="store.isFetching === 'login'"
          :disable="store.isFetching === 'login'"
        />
      </q-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import scrollToErrorField from 'src/mixins/scrollToErrorField.js'
import { useDataStore } from 'stores/data.js'
import { useQuasar } from 'quasar'

const store = useDataStore()
const $q = useQuasar()

const form = reactive({
  user: '',
  password: ''
})

async function handleSubmit() {
  try {
    await store.login({ user: form.user, password: form.password })
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: e.response?.data?.error || 'Eroare la autentificare',
      position: 'top',
    })
  }
}
</script>

<style lang="scss">
.login-page {
  min-height: 100vh;
  background-color: #e53935;
  display: flex;
  align-items: center;
  justify-content: center;
  .login-box {
    width: 100%;
    max-width: 400px;
    padding: 16px;

    .login-logo {
      height: auto;
    }

    .login-btn {
      height: 56px;
      font-size: 16px !important;
      border-radius: 4px;
      margin-top: 8px;

      &.disabled {
        opacity: 1 !important;
        background-color: #4d4d4d !important;
      }
    }

    .q-field__control {
      border-radius: 4px;
    }

    .q-field__bottom {
      padding-top: 5px;
    }

    .q-field__messages {
      color: white;
    }
  }
}
</style>
