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

## 1. Date vendor (profil) la intrarea pe VendorPage — ✅ implementat

**Endpoint confirmat**: `POST /v2/app/vendor/get/`

**Body trimis**: `{ "token": "<auth token, injectat automat prin dataStore.token> }`

**Response confirmat** (exemplu real trimis de backend):
```json
{
  "name": "The italian job",
  "_mby": "913b1904636133802e00013d",
  "_by": "f9ddcbd164376245980001f9",
  "_modified": 1756546299,
  "_created": 1755089183,
  "_id": "62ac6bfd3735659d8d00038c",
  "description": "Fresh & hot pizza",
  "prefix": "ita",
  "username": "alexandru.boeru@atelierfain.ro",
  "password": "$2y$10$...",
  "opened": true,
  "online_orders": true,
  "value_only": false
}
```
- Nu conține `logo`/`thumbnail` (exemplul vechi de mai jos era speculativ —
  de confirmat cu backend dacă/cum vine imaginea vendor-ului).
- Câmpuri relevante pentru UI: `name`, `description`, `opened` (afișare
  status deschis/închis — încă neafișat în UI), `online_orders` (dacă
  vendor-ul acceptă comenzi online), `value_only` (ascunde tab-urile de
  status și meniul de produse), `prefix` (folosit deja ca prefix pentru
  id-uri de comandă mock, gen `#ita0401`).
- `username`/`password` — trimise de backend și ajung în `vendorStore.vendor`
  ca atare (nefolosite de UI momentan).
- `_by`/`_mby`/`_created`/`_modified` — metadate interne, fără folosință în
  UI momentan.
- `orders` — răspunsul conține și array-ul de comenzi al vendor-ului (vezi
  #4, nu mai e nevoie de un `GET` separat de listare).

**Unde e conectat**: `ep.js` (`vendorGet`), `src/stores/vendor.js`
(`fetchVendor()`, populează `vendor: null` → obiectul primit, plus
`orders` din `data.orders` dacă există), apelat din `VendorPage.vue`
(`onMounted`). Afișare efectivă în header (nume/status) tot lipsește —
momentan doar `value_only`/`online_orders` sunt consumate în UI.

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

## 3. Creare comandă vendor — 🔶 conectat, răspuns neconfirmat

**De ce**: `addOrder()` doar împingea comanda într-un array local
(`this.orders.unshift(order)`), nimic nu ajungea în baza de date. La reload,
comenzile dispăreau.

**Endpoint apelat** (neconfirmat încă de backend, spre deosebire de #1/#5 —
de verificat dacă path-ul/forma răspunsului sunt corecte după primul test
real): `POST /v2/app/vendor/order/create/`

**Body trimis** (payload logat în consolă la fiecare apel, vezi
`fetchVendor`/`saveOrder` — `[vendor/orders] payload:`):
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
(`id` e generat local, cu prefixul din `vendorStore.vendor.prefix`, ca
fallback până confirmă backend-ul dacă generează el id-ul; `paymentMethod`
e `"card"` pentru Viva sau `"prepaid"` pentru Card Festival)

**Response**: neconfirmat — de completat aici după primul test real (vezi
`[vendor/orders] response:` / `[vendor/orders] error:` în consolă).

**Unde e conectat**: `ep.js` (`vendorOrderCreate`), `src/stores/vendor.js`
(`saveOrder()` — înlocuiește vechile `addOrder`/`reportOrderPayment`, unifică
crearea comenzii cu raportarea plății într-un singur apel, vezi #6),
apelat din `Callback.vue` după succes la plata cu Card/Card Festival —
același punct pentru `value_only: true` (cart cu un singur item "Custom
amount") și `value_only: false` (cart cu produse din meniu), formă identică
de `cart` în ambele cazuri.

---

## 4. Listă comenzi vendor + actualizare status — 🔶 listare implementată, status rămas local

**De ce**: `VendorPage.vue` ținea toate comenzile („In progress" / „Completed"
/ „Closed") doar în `vendorStore.orders` (memorie), și `confirmFinalize`/
`confirmClose` doar schimbă `order.status` local, fără niciun apel către
server. La refresh, orice progres se pierdea.

**Listare — ✅ acoperită de #1, formă confirmată**: nu mai e nevoie de un
`GET` separat — `POST /v2/app/vendor/get/` întoarce deja `orders` alături de
profilul vendor-ului. Forma reală per comandă e diferită de mock:
```json
{
  "vendor": "62ac6bfd3735659d8d00038c",
  "nominal_order_id": "406",
  "subtotal": "4500",
  "status": "opened",
  "type": "online",
  "paid": true,
  "products": [
    { "qty": "1", "price": "4500", "name": "Pizza Margherita", "extras": [{ "name": "Dulce", "price": "500" }] }
  ]
}
```
- `subtotal` — în bani/cenți, la fel ca restul aplicației (`"4500"` = 45 lei).
- `nominal_order_id` — numărul secvențial al comenzii; combinat cu
  `vendor.prefix` dă id-ul afișat (`#ita0406`), la fel ca id-urile generate
  local de `saveOrder()` (#3) — le face compatibile 1:1.
- `status` — `"opened"` / `"ready"` / `"closed"`. Aplicația folosește
  peste tot (state, UI, request-uri) direct aceste 3 valori — fără niciun
  strat de traducere intern (vezi `ORDER_STATUS` din `src/stores/vendor.js`).
- `products` — apare **doar** la `type: "online"` (comenzi plasate prin
  coșul din app). Restul tipurilor (`"card"`, `"prepaid"`) sunt tranzacții
  de POS (plată directă la terminal, fără coș din app) — nu au listă de
  produse, doar `subtotal`.

**Unde e conectat**: `src/stores/vendor.js` — `mapOrder()` (helper la nivel
de modul) transformă fiecare comandă brută în forma UI (`{ id, status,
items, extra, total }`), apelat din `fetchVendor()` pentru `data.orders`.

**Actualizare status — ✅ implementat**: nu mai există modal de confirmare —
la click pe Complete/Close, butonul intră 5s în loading (progress simulat);
un al doilea click în acest interval anulează acțiunea. Doar dacă cele 5s
trec fără să fie anulat, pornește request-ul real — butonul rămâne în
loading (nu mai primește click-uri) până vine răspunsul; comanda se mută în
alt tab (In progress → Completed → Closed) doar la succes, nu optimist. La
eroare, comanda rămâne neschimbată (vezi consolă).

**Endpoint confirmat**: `POST /v2/app/vendor/order/change_status/`

**Body trimis**:
```json
{ "_id": "0ec09ddb373934777c0003ae", "status": "opened" }
```
(`_id` e id-ul real din backend — **nu** id-ul afișat `#ita0405` — vezi
`order._id`, populat de `mapOrder()` din `_id`-ul primit la #1; `status` e
mereu una din `ORDER_STATUS` — `opened`/`ready`/`closed` — trimisă ca atare,
fără nicio traducere intermediară.)

**Response confirmat**:
```json
{ "_id": "0ec09ddb373934777c0003ae", "status": "opened", "_by": null, "_modified": 1786434249 }
```

**De reținut**: comenzile create local prin `saveOrder()` (#3) nu au încă
`order._id` real (backend-ul de creare comandă e tot neconfirmat) — dacă
userul apasă Complete/Close pe o astfel de comandă înainte de a exista un
`_id` real, `updateOrderStatus()` loghează o eroare clară în consolă în loc
să trimită `_id: undefined`.

**Unde e conectat**: `ep.js` (`vendorOrderStatus`), `src/stores/vendor.js`
(`mapOrder()` — populează `order._id`; `updateOrderStatus()`), apelat din
`VendorPage.vue` (`onStatusBtnClick`).

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

## 6. Raportare comandă vendor plătită (Card / Card Festival) — merge cu #3

**De ce**: `reportOrderPayment()` era stub, doar loghea `{ order,
paymentMethod }` în consolă.

**Decizie**: unificat cu #3 — `saveOrder()` trimite `paymentMethod` în
același payload cu care creează comanda, într-un singur apel „creează +
marchează plătită", în loc de două request-uri separate.

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
