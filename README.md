# Þolþjálfun · Niðurstöður

Lítil vefsíða fyrir 5 vikna þolþjálfunina. Iðkendur sjá sínar æfingar og samanburð á prófum í viku 1 og viku 5. Þú skráir tölurnar eftir hverja æfingu.

## Skrárnar

| Skrá | Hvað hún er |
|---|---|
| `index.html` | Síðan sjálf |
| `style.css` | Litir, letur og útlit |
| `app.js` | Gröf, samanburður, PIN-skjár og Skrá niðurstöður |
| `data.js` | **Allar niðurstöður, nöfn og PIN-númer.** Þetta er eina skráin sem þú skiptir út á meðan verkefnið stendur. |

## 1. Opna í VS Code

1. Afþjappaðu möppuna og opnaðu hana í VS Code (File → Open Folder).
2. Settu upp viðbótina **Live Server**, hægrismelltu á `index.html` og veldu **Open with Live Server**. Þú getur líka tvísmellt á `index.html` til að opna hana í vafra.

Síðan byrjar með tilbúnum dæmatölum svo þú sjáir hvernig hún lítur út.

## 2. Setja á netið (GitHub Pages, ókeypis)

1. Búðu til aðgang á GitHub ef þú átt hann ekki, og svo nýtt repository sem heitir `thol-tracker` (Public).
2. Í VS Code: opnaðu Source Control, veldu **Initialize Repository**, skrifaðu skilaboð eins og `Fyrsta útgáfa` og ýttu á **Commit**.
3. Ýttu á **Publish Branch** og veldu `thol-tracker`. Eða í terminal:
   ```
   git init
   git add .
   git commit -m "Fyrsta útgáfa"
   git branch -M main
   git remote add origin https://github.com/NOTANDANAFN/thol-tracker.git
   git push -u origin main
   ```
4. Á GitHub: farðu í **Settings → Pages** í repository-inu. Undir "Build and deployment" veldu **Deploy from a branch**, svo `main` og `/ (root)`, og ýttu á **Save**.
5. Eftir eina til tvær mínútur er síðan á `https://NOTANDANAFN.github.io/thol-tracker/`.

## 3. Hlekkir til að senda

| Endir á hlekk | Opnar |
|---|---|
| `…/thol-tracker/` | PIN-skjáinn |
| `…/thol-tracker/#a1` … `#a12` | PIN-skjáinn með nafn iðkandans valið |
| `…/thol-tracker/#coach` | PIN-skjáinn með "Þjálfari" valið |

Allir hlekkir opna PIN-skjáinn fyrst. Merkið velur bara nafnið.

## 4. PIN-númer

- **Þjálfara-PIN er `1234` í byrjun.** Breyttu því strax fyrsta skiptið sem þú skráir þig inn: Skrá niðurstöður → Nöfn, PIN-númer og titill → PIN þjálfara → Vista nöfn, og settu svo nýju `data.js` á GitHub.
- Settu 4–8 stafa PIN-númer fyrir hvern iðkanda á sama stað. Iðkandi án PIN-númers fær skilaboð um að tala við þjálfarann.
- **Skrifaðu PIN-númerin niður áður en þú vistar.** Þau eru geymd dulkóðuð, svo síðan getur ekki sýnt þau aftur. Ef einhver gleymir sínu setur þú bara nýtt.
- Iðkendur sjá aðeins sína eigin síðu: engin önnur nöfn og ekki hópinn.
- Þú (þjálfari) sérð alla iðkendur, Hópinn og Skrá niðurstöður.
- "Muna eftir mér á þessu tæki" heldur þeim innskráðum í símanum. Hnappurinn Skrá út efst hættir því.

## 5. Eftir hverja æfingu

1. Opnaðu síðuna og skráðu þig inn sem Þjálfari.
2. Farðu í **Skrá niðurstöður**, veldu æfinguna og sláðu inn tölurnar. Skildu línu eftir auða ef einhver mætti ekki.
   - Úr Polar skráir þú alltaf bpm (ekki %): HR AVG í Meðalpúls, HR MAX í Hámarkspúls og CALORIES í Kaloríur.
   - **Tími í svæðum** er í sömu röð og hjá Polar (svæði 5 fyrst). Skrifaðu tímann eins og Polar sýnir hann, t.d. `00:22:16` eða `22:16`. Það má sleppa honum.
   - Í Prófi 1 er einn reitur fyrir hverja mínútu (1 = 50 rpm, 2 = 52 … 6 = 60, 7 = 61 … 20 = 74). Skrifaðu púlsinn fyrir hverja mínútu sem iðkandinn kláraði. Ef hann kláraði 5 mínútur fyllir þú 5 reiti, og síðan sýnir sjálfkrafa „5 mín · 58 rpm“ undir nafninu. Hæsti púlsinn fer í Hámarkspúls nema þú skrifir annað þar, t.d. hámarkspúlsinn frá Polar.
3. Ýttu á **Vista æfingu**. Vafrinn sækir nýja `data.js`.
4. Skiptu gömlu `data.js` í möppunni út fyrir þá nýju.
5. Commit og push (í VS Code: Source Control → skilaboð eins og `Vika 2 þriðjudagur` → Commit → Sync).
6. Um mínútu síðar sjá iðkendur nýju tölurnar. Biddu þá að endurhlaða síðuna ef þeir sjá enn þær gömlu.

Fyrsta skiptið sem þú vistar skaltu líka setja inn nöfn og PIN-númer í **Nöfn, PIN-númer og titill**. Dæmatölurnar hverfa við fyrstu vistun.

Byrjaðu alltaf á vefsíðunni sjálfri, eða nýjustu `data.js`, áður en þú skráir næstu æfingu. Skráin sem sækist inniheldur allt sem hefur verið vistað, svo ef þú skráir út frá gömlu eintaki týnast nýrri æfingar.

## Gott að vita

- PIN-númerin eru til að halda hverjum iðkanda á sinni síðu, ekki alvöru öryggi. Tölurnar eru í `data.js`, sem hver sem kann getur opnað í vafranum eða á GitHub. Fínt fyrir æfingatölur, en ekki setja neitt viðkvæmt þar inn.
- Að skrá niðurstöður á síðunni breytir ekki vefsíðunni sjálfri. Aðeins `data.js` sem er sett á GitHub gerir það.
- Þú getur líka lagað eina tölu beint í `data.js` í VS Code eða á github.com.
