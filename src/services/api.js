import axios from 'axios'

// Plain module (not a boot file) so stores can import `api` statically
// without defeating Vite's code-splitting of src/boot/axios.js, which
// Quasar's client-entry imports dynamically.
export const api = axios.create({
  baseURL: process.env.NODE_ENV !== 'production' ? "/v2/" : "https://api.tadaa.ro/",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer 747424c0f4cb4f6bd645e8ea1347c50c"
  }
})
