# Endpoint-uri necesare pentru modulul Vendor

Modulul Vendor (`src/pages/modules/VendorPage.vue`, `VendorSettings.vue`,
`VendorNewOrder.vue`, `src/stores/vendor.js`) a fost construit complet cu date
mock, pentru că endpoint-urile reale nu există încă. Documentul de mai jos
listează exact ce trebuie cerut de la backend ca să înlocuim mock-urile,
cu forma request/response așteptată de codul actual și fișierul unde
se face conectarea.

Convenția de path urmează ce există deja în `src/stores/ep.js`
(`/v2/app/...`), token-ul se trimite automat pe fiecare `_post` prin
`this.token` (vezi `src/stores/data.js:22-26`) — nu e nevoie să fie
documentat separat la fiecare EP de mai jos.

---

## 1. Date vendor (profil) la intrarea pe VendorPage

**De ce**: `VendorPage.vue` momentan nu are niciun concept de "profil vendor"
(nume, logo, status deschis/închis etc.) — afișează direct comenzile din
`vendorStore.orders`. La intrarea pe pagină ar trebui totuși cerut și
profilul vendor-ului curent, ca să putem afișa nume/logo/status în header.

**Sugestie**: `GET /v2/app/vendor/` (sau echivalent — de confirmat cu
backend; posibil identificat implicit din token, fără parametru de id)

**Response confirmat** (exemplu real trimis de backend):
```json
{
  "_id": "62ac6bfd3735659d8d00038c",
  "name": "The italian job",
  "description": "Fresh & hot pizza",
  "prefix": "ita",
  "logo": {
    "path": "/2025/08/18/thumbnail_1000063250_uid_6668252ea49211_uid_68a31eb95c7bf.jpg",
    "width": 500,
    "height": 500
  },
  "thumbnail": {
    "path": "/2025/08/13/Margherita_uid_6668252e160f11_uid_689c91af67ec7.jpg",
    "width": 1600,
    "height": 1024
  },
  "username": "alexandru.boeru@atelierfain.ro",
  "password": "$2y$10$...",
  "opened": true,
  "online_orders": true,
  "value_only": false,
  "_by": "f9ddcbd164376245980001f9",
  "_mby": "913b1904636133802e00013d",
  "_created": 1755089183,
  "_modified": 1756546299
}
```
- Câmpuri relevante pentru UI: `name`, `description`, `logo`/`thumbnail`
  (probabil `logo.path` prefixat cu CDN-ul de imagini, la fel ca restul
  aplicației), `opened` (afișare status deschis/închis), `online_orders`
  (dacă vendor-ul acceptă comenzi online), `prefix` (folosit deja ca prefix
  pentru id-uri de comandă mock, gen `#ita0401` — de văzut dacă id-urile
  reale de comandă vin deja cu el sau trebuie compus în frontend).
- `username`/`password` — **nu ar trebui trimise către frontend**; sunt
  credențiale de login ale contului de vendor, nu au ce căuta în răspunsul
  citit de o pagină autentificată deja prin token. De semnalat la backend.
- `_by`/`_mby`/`_created`/`_modified` — metadate interne, fără folosință în
  UI momentan.
- `value_only` — semnificație neclară, de confirmat cu backend înainte de
  conectare.

**Unde se conectează**: momentan nicăieri — necesită state nou (ex.
`vendor: null` în `src/stores/vendor.js`) și o acțiune `fetch_vendor()`
apelată la mount pe `VendorPage.vue`, plus afișare efectivă în header-ul
paginii (nume/logo/status). Nu există cod existent de înlocuit, e
funcționalitate nouă.

---

## 2. Listă produse / meniu vendor

**De ce**: `src/stores/vendor.js:6-58` — `products` e hardcodat (categorii,
produse, grupuri de extra-uri). Fiecare vendor ar trebui să-și vadă propriul
meniu din backend, nu un array fix în frontend.

**Sugestie**: `GET /v2/app/vendor/products/`

**Response așteptat** (mapabil 1:1 pe ce consumă UI-ul acum):
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
          "options": [
            { "name": "Extra carne", "price": 5 }
          ]
        }
      ]
    }
  ]
}
```
- `price` și `extraGroups[].options[].price` — de clarificat cu backend dacă
  vin în lei întregi (cum e mock-ul acum) sau în bani/cenți (cum sunt
  `check_prepaid_card`/`charge_prepaid_card` — vezi nota de la finalul
  documentului).
- `category` — string liber, folosit doar pentru grupare în tab-uri
  (`vendorStore.categories` getter, `src/stores/vendor.js:64`).

**Unde se conectează**: `src/stores/vendor.js` — `state.products` devine
rezultatul acestui apel (probabil mutat dintr-un `state` static într-o
acțiune `fetch_products()` apelată la intrarea pe `VendorNewOrder.vue`).

---

## 3. Creare comandă vendor

**De ce**: `src/stores/vendor.js:69-84` — `addOrder()` doar împinge comanda
într-un array local (`this.orders.unshift(order)`), nimic nu ajunge în baza
de date. La reload, comenzile dispar.

**Sugestie**: `POST /v2/app/vendor/orders/`

**Body trimis** (forma actuală a `cartItems`, vezi `VendorNewOrder.vue:189-207`):
```json
{
  "items": [
    { "name": "Pizza Margherita", "qty": 1, "extras": [{ "name": "Dulce", "price": 5 }], "lineTotal": 44 }
  ],
  "total": 44,
  "paymentMethod": "cash"
}
```
**Response așteptat**: obiectul comenzii creat, cu un `_id`/cod generat de
backend (mock-ul generează local id-uri gen `#ita0401`, ar trebui înlocuit
cu ce dă backend-ul).

**Unde se conectează**: `src/stores/vendor.js:69` (`addOrder`), apelat din
`VendorNewOrder.vue` (`placeOrder`, quick-add flow) și din `Callback.vue:104-107`
(după succes la plata cu Card/Card Festival).

---

## 4. Listă comenzi vendor + actualizare status

**De ce**: `VendorPage.vue` ține toate comenzile („In progress" / „Completed"
/ „Closed") doar în `vendorStore.orders` (memorie), și `confirmFinalize`/
`confirmClose` (`VendorPage.vue:279-294`) doar schimbă `order.status` local,
fără niciun apel către server. La refresh, orice progres se pierde.

**Sugestie**:
- `GET /v2/app/vendor/orders/` — listă comenzi pentru vendor-ul curent (poate
  filtrată pe zi/eveniment).
- `POST /v2/app/vendor/orders/{id}/status/` — schimbă statusul unei comenzi.
  Body: `{ "status": "finalizat" | "inchis" }` (sau echivalentul lor în
  engleză, de aliniat cu backend: `in_progress` / `completed` / `closed`).

**Unde se conectează**: `src/stores/vendor.js` (`orders` ar deveni populat
din `GET`, plus acțiuni noi `finalizeOrder(id)`/`closeOrder(id)` care fac
`POST` în loc să mute direct starea), consumate din `VendorPage.vue:274-294`.

---

## 5. Debitare Card Festival (plată comandă cu cardul de festival) — ✅ implementat

**Endpoint confirmat**: `POST /v2/app/prepaid/purchase/`

**Body trimis**:
```json
{ "_id": "<TDID scanat de pe card>", "amount": 2000, "token": "<auth token, injectat automat de _post>" }
```
(`amount` în bani/cenți; `token` e adăugat automat de `_post`, la fel ca la
toate celelalte apeluri — nu e nevoie să fie pasat explicit)

**Response confirmat**:
```json
{ "error": false, "balance": "108900" }
```
(`error: true` + `balance` = soldul curent, când soldul e insuficient pentru
`amount`)

**Comportament nou — nu se mai trece prin Check**: spre deosebire de restul
fluxurilor cu card prepaid, la Card Festival în `VendorNewOrder.vue` cardul
scanat (TDID) se trimite **direct** la acest endpoint, fără niciun apel către
`check_prepaid_card` în prealabil — verificarea de sold și debitarea se fac
într-un singur pas pe backend. Dacă `error` e `true`, UI arată ecranul
"Insufficient credit"; altfel comanda continuă spre `/callback` ca și restul
metodelor de plată.

**Unde e conectat**: `ep.js` (`purchasePrepaidCard`), `src/stores/data.js`
(`purchase_prepaid_card`), apelat din `VendorNewOrder.vue`
(`chargeFestivalCard`, declanșată direct din `ndef.onreading`/
`simulateFestivalScan`). Stub-ul vechi `debitFestivalCard` din
`src/stores/vendor.js` a fost eliminat.

---

## 6. Raportare comandă vendor plătită (Card / Card Festival)

**De ce**: `src/stores/vendor.js:98-102` — `reportOrderPayment()` e stub,
doar loghează `{ order, paymentMethod }` în consolă.

**Sugestie**: se poate suprapune cu #3 (creare comandă) dacă backend-ul
preferă un singur apel „creează + marchează plătită", sau rămâne separat:
`POST /v2/app/vendor/orders/{id}/payment/`

**Body trimis**:
```json
{ "paymentMethod": "card" }
```
(`paymentMethod` e `"card"` pentru plata Viva sau `"card_festival"` pentru
Card Festival — vezi `Callback.vue:104-107` și `VendorNewOrder.vue`
query param-ul `paymentMethod` trimis către `/callback`)

**Unde se conectează**: `src/stores/vendor.js:100` (`reportOrderPayment`),
apelat din `Callback.vue:106` după succesul plății.

---

## 7. Setări produse vendor (activare/dezactivare, timp de preparare)

**De ce**: `VendorSettings.vue:91-96` — `products` e hardcodat cu doar 4
pizza, fără niciun apel de citire sau salvare. Toggle-ul On/Off și
stepper-ul de „Prep time" (`adjustTime`, `VendorSettings.vue:98-101`)
modifică doar starea locală — dispare la refresh.

**Sugestie**:
- `GET /v2/app/vendor/products/` (poate fi **același** endpoint de la #2,
  dacă backend-ul întoarce și `enabled`/`prepTime` alături de `price`/
  `extraGroups` — de clarificat dacă „meniul" și „setările vendor-ului"
  sunt aceeași resursă sau două separate)
- `POST /v2/app/vendor/products/{id}/` — salvează `enabled`/`prepTime`
  pentru un produs. Body: `{ "enabled": true, "prepTime": 12 }`

**Unde se conectează**: `VendorSettings.vue` — `products` populat din `GET`,
`q-btn-toggle`/`adjustTime` ar trebui să declanșeze `POST`-ul la schimbare
(momentan doar mută `ref` local).

---

## Notă generală: convenția `price`/`amount`

Restul aplicației (tickete, top-up) ține toate sumele **în bani/cenți**
(`amount * 100`, vezi `_formattedPrice`, `src/mixins/formattedPrice.js`),
inclusiv `check_prepaid_card`/`charge_prepaid_card`. Modulul Vendor, fiind
100% mock, ține prețurile în **lei întregi** (`product.price = 39`) direct
în UI, fără conversie.

Când vin EP-urile reale, trebuie stabilit cu backend-ul dacă `price`-urile
produselor și `amount`-urile trimise la comenzi/debitare vin tot în bani
(cenți) — cel mai probabil da, ca să fie consistent cu restul API-ului — caz
în care conversiile (`* 100` / `/ 100`) trebuie adăugate explicit în
`VendorNewOrder.vue`/`vendor.js` la conectare, ele lipsind acum pentru că
totul e mock.
