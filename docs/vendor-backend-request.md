# EP-uri necesare — modul Vendor

Ce mai lipsește/trebuie confirmat de backend pentru modulul Vendor. (Ce
există deja și funcționează — profil vendor + listă comenzi la
`POST /v2/app/vendor/get/`, debitare Card Festival la
`POST /v2/app/prepaid/purchase/` — nu mai e listat aici.)

---

## 1. Listă produse / meniu vendor — lipsește

Fiecare vendor are nevoie de propriul meniu (categorii, produse, prețuri,
grupuri de extra-uri), momentan mockuit în frontend.

**Sugestie**: `GET /v2/app/vendor/products/`

**Response propus**:
```json
{
  "products": [
    {
      "_id": "p1",
      "name": "Pizza Margherita",
      "category": "Pizza",
      "price": 39,
      "extraGroups": [
        {
          "title": "Extra topping",
          "max": 3,
          "options": [{ "name": "Extra carne", "price": 5 }]
        }
      ]
    }
  ]
}
```

**De confirmat**: `price` și `extraGroups[].options[].price` — lei întregi
sau bani/cenți (restul API-ului, ex. `charge_prepaid_card`, ține sumele în
bani/cenți)?

---

## 2. Creare comandă vendor — apelat, răspuns neconfirmat

Frontend-ul apelează deja acest endpoint după fiecare plată reușită (Card
sau Card Festival), dar nu avem încă un răspuns confirmat de backend.

**Endpoint apelat**: `POST /v2/app/vendor/order/create/`

**Body trimis**:
```json
{
  "id": "#ita0401",
  "items": [
    { "name": "Pizza Margherita", "qty": 1, "extras": [{ "name": "Dulce", "price": 5 }], "lineTotal": 44 }
  ],
  "total": 44,
  "paymentMethod": "card"
}
```
(`paymentMethod`: `"card"` pentru Viva, `"prepaid"` pentru Card
Festival; `id` e generat de frontend momentan — de confirmat dacă backend-ul
generează propriul id sau acceptă/preia id-ul trimis)

**De confirmat**: forma răspunsului, și dacă `id`-ul comenzii e generat de
backend sau de frontend.

---

## 3. Actualizare status comandă — lipsește

Vendor-ul poate marca o comandă drept „Completed" sau „Closed" din UI, dar
momentan schimbarea rămâne doar locală (se pierde la refresh).

**Sugestie**: `POST /v2/app/vendor/orders/{id}/status/`

**Body propus**: `{ "status": "ready" }` sau `{ "status": "closed" }`

**Context**: `POST /v2/app/vendor/get/` întoarce deja comenzile cu status
`"opened"` / `"ready"` / `"closed"` — presupunem că endpoint-ul de update
folosește aceleași 3 valori, de confirmat.

---

## 4. Setări produse vendor (activare/dezactivare, timp de preparare) — lipsește

**Sugestie**:
- `GET /v2/app/vendor/products/` — poate fi **același** endpoint de la #1,
  dacă răspunsul include și `enabled`/`prepTime` (de clarificat dacă
  „meniul" și „setările vendor-ului" sunt aceeași resursă sau două separate)
- `POST /v2/app/vendor/products/{id}/` — Body: `{ "enabled": true, "prepTime": 12 }`

---

## Notă generală: convenția preț

De stabilit o singură dată, valabil pentru #1 și #2: sumele vin în lei
întregi sau în bani/cenți? Restul API-ului (bilete, top-up) ține totul în
bani/cenți.
