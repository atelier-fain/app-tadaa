<template>
  <div class="login-page">
    <div class="login-box">
      <div class="text-center q-mb-md">
        <q-img
          no-spinner
          :src="$img('logo.png')"
          alt="Logo"
          class="login-logo" />
      </div>

      <q-form ref="formRef">
        <q-input
          ref="userRef"
          v-model="form.user"
          label="User"
          filled
          bg-color="white"
          :rules="[val => !!val || 'Userul este obligatoriu']"
        />
        <q-input
          ref="passwordRef"
          v-model="form.password"
          label="Password"
          type="password"
          filled
          bg-color="white"
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
          :loading="store.isFetching === 'login'"
          :disable="store.isFetching === 'login'"
          @click="handleSubmit"
        />
      </q-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import scrollToErrorField from 'src/mixins/scrollToErrorField.js'
import {useDataStore} from "stores/data.js";

const formRef = ref(null)
const userRef = ref(null)
const passwordRef = ref(null)

const store = useDataStore()

const form = reactive({
  user: '',
  password: ''
})

async function handleSubmit() {
  const valid = await formRef.value.validate()
  if (!valid) {
    const firstError = [userRef, passwordRef].find(r => r.value?.hasError)
    if (firstError) scrollToErrorField(firstError.value)
    return
  }
  console.log('Login submitted:', { user: form.user, password: form.password })
  await store.login({user: form.user, password: form.password})
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

      &.disabled {
        opacity: 1 !important;
        background-color: #4d4d4d !important;
      }
    }

    .q-field__control {
      border-radius: 4px;

      &::before {
        border: none !important;
      }

      &::after {
        border: none !important;
        height: 0 !important;
      }
    }

    .q-field--focused .q-field__control {
      background: white !important;
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
