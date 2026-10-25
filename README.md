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

## Hópar
- **Hópur 1 · á staðnum** og **Hópur 3 · framhald:** þú skráir tölurnar. Iðkendur sjá bara.
- **Hópur 2 · fjarþjálfun** og **Hópur 4 · framhald fjarþjálfun:** iðkendur fá flipann **Skrá æfingu** og skrá sjálfir meðalpúls, hámarkspúls og kaloríur. Í Prófi 1 skrá þeir síðasta RPM og hámarkspúls, og síðan reiknar mínúturnar. Tími í svæðum er valfrjáls.
- Þú velur hóp þegar þú bætir við iðkendum og getur breytt honum í töflunni **Iðkendur og kóðar** (smelltu svo á **Vista breytingar**).
- Í **Skrá niðurstöður** velurðu hópinn efst. Þú getur líka leiðrétt tölur fjariðkenda þar.
- Hver iðkandi ber sig saman við meðaltal **síns hóps**. Meðaltal hóps 2 uppfærist þegar þú opnar þjálfarasíðuna, svo gott er að kíkja inn einu sinni til tvisvar í viku.
- Iðkandi í fjarþjálfun getur aðeins breytt æfingatölunum sínum, ekki nafni eða hópi, og ekki hjá öðrum.
- **Tæki í fjarþjálfun:** Æfingarnar má gera á 1, 2 eða 3 þoltækjum að eigin vali. Próf 1 er alltaf á Assault Bike. Í Prófi 2 velur hann tæki fyrir hvern af þremur hlutunum (BikeErg, RowErg, Assault Bike, SkiErg, hlaupabretti eða annað) og skráir kaloríurnar. Sama tæki og sama röð í viku 1 og viku 5.
- **Samanburður í fjarhópum:** Þar sem tækin eru misjöfn ber „Þú og hópurinn“ saman **bætingu í %** í Prófi 1 og Prófi 2, ekki mínútur eða kaloríur.
- **Leiðbeiningar fyrir fjarhópa:** Á síðu fjariðkenda er spjaldið **Svona tekur þú æfingarnar**. Þar er sagt frá þriðjudögum (hátt tempó, öndun og endurheimt í hvíldinni), fimmtudögum (jafn hraði, neföndun, hraðar á sama púlsi) og heimaæfingunni (zone 2, með þeirra eigin bpm).
- **Heimaæfing (valfrjálst):** Fjariðkendur geta líka skráð rólegu heimaæfinguna (zone 2, 60–70%) í vikum 1–4 undir **Skrá æfingu** (mínútur, og valfrjálst meðalpúls, kaloríur og hvað þeir gerðu). Hún birtist í spjaldinu **Heimaæfingar** á síðu iðkandans en telst ekki með í æfingunum 10 eða meðaltali hópsins.

## Innskráning þjálfara í síma og iPad
Google-innskráning virkar ekki alltaf í símum (t.d. Chrome á iPhone). Þá notarðu lykilorð:
1. **Einu sinni í Firebase:** Authentication → Sign-in method → **Add new provider** → **Email/Password** → kveikja á **Enable** (ekki "Email link") → **Save**.
2. **Einu sinni í tölvunni:** Skráðu þig inn með Google → Skrá niðurstöður → **Innskráning í síma og iPad** → veldu lykilorð (minnst 8 stafir) → **Vista lykilorð**.
3. **Í símanum:** Á innskráningarskjánum, smelltu á **Í síma? Skráðu þig inn með lykilorði**, skrifaðu netfangið og lykilorðið.

## Æfingaplan
- Flipinn **Æfingaplan** (aðeins fyrir þjálfara) geymir 10 æfingar fyrir hvorn hóp: titil og lýsingu fyrir hverja æfingu, vika 1–5.
- **Birta hjá iðkendum:** veldu vikuna sem er í gangi og smelltu á **Vista æfingaplan**. Iðkendur í hópnum sjá báðar æfingar vikunnar efst á síðunni sinni.
- **Snið:** Skrifaðu æfingar eins og á töfluna, ein lína í senn: `3 mín @ 60–65%`. Fyrirsagnir með hástöfum (UPPHITUN, AÐALÆFING …). Línur með 90+ verða rauðar, línur með hvíld gráar, og lína sem byrjar á `~` verður athugasemd.
- **Setja inn BOX800 planið:** fyllir allar 10 æfingarnar í hópnum sem er valinn (hópar 2 og 4 fá útgáfu fyrir fjarþjálfun). Smelltu tvisvar og svo á **Vista æfingaplan**.
- Fyrir prófin er takkinn **Nota lýsingu prófsins** sem fyllir út framkvæmdina.
- **Afrita æfingar úr:** veldu annan hóp og smelltu tvisvar á **Afrita** til að fá æfingarnar hans. Breyttu svo því sem er öðruvísi og vistaðu.
- Fjariðkendur sjá líka lýsinguna þegar þeir velja æfingu í **Skrá æfingu**.
- **Myndir:** Smelltu á **+ Bæta við mynd** undir æfingu, t.d. til að setja inn skorblað fyrir prófin. Myndin er minnkuð sjálfkrafa og vistast strax. Iðkendur sjá hana með æfingum vikunnar og geta smellt á hana til að sjá hana stóra.
- Mundu að skipta um viku á mánudögum.

## Eftir hverja æfingu
1. Opnaðu síðuna (þú ert áfram innskráður á tækinu).
2. **Skrá niðurstöður** → veldu æfinguna → sláðu inn tölurnar úr Polar → **Vista æfingu**.
3. Búið. Iðkendur sjá tölurnar strax. Engar skrár og ekkert GitHub.

Hvað er skráð:
- Úr Polar skráir þú alltaf bpm (ekki %): HR AVG í Meðalpúls, HR MAX í Hámarkspúls og CALORIES í Kaloríur.
- **Tími í svæðum** er í sömu röð og hjá Polar (svæði 5 fyrst). Skrifaðu tímann eins og Polar sýnir hann, t.d. `00:22:16` eða `22:16`. Það má sleppa honum.
- Í **Prófi 1** er einn reitur fyrir hverja mínútu (1 = 50 rpm, 2 = 52 … 6 = 60, 7 = 61 … 20 = 74). Skrifaðu púlsinn fyrir hverja mínútu sem iðkandinn kláraði. Síðan reiknar sjálf út mínútur og RPM, og hæsti púlsinn fer í Hámarkspúls nema þú skrifir annað þar. Í reitinn **Púls 1 mín** skráirðu púlsinn nákvæmlega 60 sekúndum eftir að iðkandinn hætti (iðkandinn hvílir þessa mínútu). Síðan reiknar út **endurheimt**: hámarkspúls mínus púls eftir 1 mín.

## Gott að vita
- **Púlstaflan:** Efst á síðu hvers iðkanda er tafla sem sýnir hvaða púls (bpm) passar við 60–65%, 65–70% … upp í 90%+, miðað við hámarkspúls hans. Gott fyrir þá sem eru með úr sem sýnir bara slög. Iðkendur í öllum hópum geta skráð núverandi hámarkspúls sinn í töflunni, svo hún virkar strax frá fyrsta degi. Skráði hámarkspúlsinn stýrir töflunni. Ef enginn hefur verið skráður er hæsti púls af prófi eða æfingu notaður. Til að þetta virki þarf að líma nýju `firestore.rules` inn í Firebase (Firestore → Rules → Publish).
- **Meðaltal hópsins:** Iðkendur sjá spjaldið „Þú og hópurinn“ og strikaða línu fyrir meðalpúls hópsins í grafinu. Meðaltalið uppfærist í hvert sinn sem þú vistar. Það birtist aðeins þegar a.m.k. 3 iðkendur eru með tölur, svo enginn geti reiknað út tölur annarra.
- **Mynd fyrir Instagram:** Á síðu hvers iðkanda er takkinn **Búa til mynd**. Þar velur maður Story (9:16) eða ferning (1:1), og dökkan eða gegnsæjan bakgrunn. Í síma fer myndin beint í myndasafnið eða á Instagram. Þú getur líka búið hana til fyrir iðkendur þegar þú skoðar síðuna þeirra sem þjálfari.
- **Kóðar:** Ef kóði fer á flakk smellirðu á **Nýr kóði**. Gamli kóðinn hættir þá að virka og öll gögn haldast. Sendu iðkandanum nýja hlekkinn.
- **Afrit:** **Sækja afrit (JSON)** sækir skrá með öllum gögnum. Gott að gera það í lok hverrar viku.
- **Öryggi:** Iðkendur geta bara sótt sitt eigið skjal með kóðanum og geta hvorki séð lista yfir aðra né breytt neinu. Aðeins netfangið í reglunum getur skráð og breytt.
- **Kostnaður:** Þetta er langt undir ókeypis mörkum Firebase (Spark-áskrift).
- **Breytingar á síðunni sjálfri** (nýr `app.js` eða `style.css`) fara áfram í gegnum VS Code og GitHub eins og áður.
