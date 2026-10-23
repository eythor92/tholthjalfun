# Þolþjálfun · Niðurstöður

Vefsíða fyrir 5 vikna þolþjálfunina. Þú skráir niðurstöður beint á síðunni (í tölvu, fartölvu, síma eða iPad) og iðkendur sjá þær strax. Gögnin eru geymd í Google Firebase (ókeypis).

- **Þú (þjálfari)** skráir þig inn með Google-aðganginum þínum.
- **Iðkendur** fá hver sinn kóða (t.d. `K7PQ-4MXA`) eða persónulegan hlekk og sjá aðeins sína eigin síðu.

## Skrárnar

| Skrá | Hvað hún er |
|---|---|
| `index.html` | Síðan sjálf |
| `style.css` | Útlit |
| `app.js` | Allt sem síðan gerir |
| `firebase-config.js` | **Þínar Firebase-stillingar og netfangið þitt.** Þú fyllir hana út einu sinni. |
| `firestore.rules` | Aðgangsreglur fyrir gagnagrunninn. Þú límir þær inn í Firebase einu sinni. |

`data.js` er ekki notuð lengur. Eyddu henni úr möppunni og af GitHub.

## Uppsetning (einu sinni, um 20 mínútur)

### 1. Búa til Firebase-verkefni
1. Farðu á **console.firebase.google.com** og skráðu þig inn með Google-aðganginum sem þú ætlar að nota sem þjálfari.
2. Smelltu á **Create a project** (eða Add project). Nafn: `tholthjalfun`.
3. Slökktu á Google Analytics (þarf ekki) og smelltu á **Create project**.

### 2. Tengja vefsíðuna
1. Á forsíðu verkefnisins, smelltu á **</>** (Web) táknið til að bæta við vefforriti.
2. Nafn: `thol-tracker`. **Ekki** haka við Firebase Hosting. Smelltu á **Register app**.
3. Þú sérð kóða með `const firebaseConfig = { apiKey: "...", ... }`. Afritaðu gildin inn í `firebase-config.js` í staðinn fyrir `SETTU-INN`.
4. Settu Google-netfangið þitt í `window.COACH_EMAILS = ["netfang@gmail.com"];` í sömu skrá.

### 3. Kveikja á gagnagrunninum
1. Í valmyndinni vinstra megin: **Build → Firestore Database → Create database**.
2. Staðsetning: veldu Evrópu (t.d. `eur3` eða `europe-west`).
3. Veldu **Start in production mode** og smelltu á **Create**.
4. Farðu í flipann **Rules**, eyddu öllu sem er þar og límdu inn allt úr `firestore.rules`.
5. Breyttu `thjalfari@gmail.com` í reglunum í **þitt netfang, með litlum stöfum**, og smelltu á **Publish**.

### 4. Kveikja á Google-innskráningu
1. **Build → Authentication → Get started**.
2. Undir **Sign-in method**, veldu **Google**, kveiktu á **Enable**, veldu netfangið þitt sem "support email" og smelltu á **Save**.
3. Farðu í **Settings → Authorized domains → Add domain** og bættu við `NOTANDANAFN.github.io` (vefslóðin þín á GitHub, án `/thol-tracker`).

### 5. Setja á GitHub
1. Settu nýju skrárnar í möppuna (`index.html`, `style.css`, `app.js`, `firebase-config.js`, `firestore.rules`, `README.md`) og eyddu `data.js`.
2. Í VS Code: Source Control → skilaboð t.d. `Firebase` → **Commit** → **Sync Changes**.
3. Eftir um mínútu er nýja útgáfan komin á síðuna.

### 6. Bæta við iðkendum
1. Opnaðu síðuna og smelltu á **Þjálfari? Skráðu þig inn með Google**.
2. Farðu í **Skrá niðurstöður → Iðkendur og kóðar**. Skrifaðu nöfnin, eitt í hverja línu, og smelltu á **Bæta við**.
3. Hver iðkandi fær kóða. Smelltu á **Afrita hlekk** og sendu hverjum sinn hlekk (t.d. í skilaboðum). Hlekkurinn opnar síðuna hans beint, og síminn man eftir honum.

## Eftir hverja æfingu
1. Opnaðu síðuna (þú ert áfram innskráður á tækinu).
2. **Skrá niðurstöður** → veldu æfinguna → sláðu inn tölurnar úr Polar → **Vista æfingu**.
3. Búið. Iðkendur sjá tölurnar strax. Engar skrár og ekkert GitHub.

Hvað er skráð:
- Úr Polar skráir þú alltaf bpm (ekki %): HR AVG í Meðalpúls, HR MAX í Hámarkspúls og CALORIES í Kaloríur.
- **Tími í svæðum** er í sömu röð og hjá Polar (svæði 5 fyrst). Skrifaðu tímann eins og Polar sýnir hann, t.d. `00:22:16` eða `22:16`. Það má sleppa honum.
- Í **Prófi 1** er einn reitur fyrir hverja mínútu (1 = 50 rpm, 2 = 52 … 6 = 60, 7 = 61 … 20 = 74). Skrifaðu púlsinn fyrir hverja mínútu sem iðkandinn kláraði. Síðan reiknar sjálf út mínútur og RPM, og hæsti púlsinn fer í Hámarkspúls nema þú skrifir annað þar.

## Gott að vita
- **Meðaltal hópsins:** Iðkendur sjá spjaldið „Þú og hópurinn“ og strikaða línu fyrir meðalpúls hópsins í grafinu. Meðaltalið uppfærist í hvert sinn sem þú vistar. Það birtist aðeins þegar a.m.k. 3 iðkendur eru með tölur, svo enginn geti reiknað út tölur annarra.
- **Kóðar:** Ef kóði fer á flakk smellirðu á **Nýr kóði**. Gamli kóðinn hættir þá að virka og öll gögn haldast. Sendu iðkandanum nýja hlekkinn.
- **Afrit:** **Sækja afrit (JSON)** sækir skrá með öllum gögnum. Gott að gera það í lok hverrar viku.
- **Öryggi:** Iðkendur geta bara sótt sitt eigið skjal með kóðanum og geta hvorki séð lista yfir aðra né breytt neinu. Aðeins netfangið í reglunum getur skráð og breytt.
- **Kostnaður:** Þetta er langt undir ókeypis mörkum Firebase (Spark-áskrift).
- **Breytingar á síðunni sjálfri** (nýr `app.js` eða `style.css`) fara áfram í gegnum VS Code og GitHub eins og áður.
