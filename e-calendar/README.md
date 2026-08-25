# E-Calendar — House & Class Board

Password-protected school calendar. Important dates, festivals, awareness days
aur har month ke House / Class board themes — sab ek jagah.

**Sabko ek hi calendar dikhti hai** — data GitHub par rehta hai, koi database ya
monthly kharcha nahi. Admin badlaav karke **Publish** dabaata hai, baaki sab ko
apne aap pahunch jaata hai.

**Live:** https://niitudit-ai.github.io/kidzee_iglas/e-calendar/

> Ye project apni alag `e-calendar/` folder mein hai. Repo ke baaki projects
> (Kidzee website `/` aur `advocate/`) ko chhua nahi gaya hai — wo waise hi chal rahe hain.

---

## Do tarah ke login

| Role | Kya kar sakta hai |
|---|---|
| 👑 **Admin** | Events aur board themes add / edit / delete, backup, restore |
| 👁️ **Viewer** | Sirf dekh sakta hai — kuch badal nahi sakta |

**Password wahi purana hai, badla nahi gaya.** Password is README mein jaan-boojh kar
nahi likha hai, kyunki ye file GitHub par sabko dikhti hai.

Ek zaroori baat samajh lijiye: ye calendar poora browser mein chalta hai, isliye
password ki suraksha **sirf itni hai ki aam aadmi khol na sake**. Jo banda browser ka
"Inspect" khol kar dekhna jaanta hai, wo password ka hash nikaal sakta hai.
Isliye **is calendar mein koi asli raaz ki baat na daalein** — fees, salary, personal
details, phone numbers waghairah nahi. School ke events ke liye ye bilkul theek hai.

### Password badalna hai?

1. Live site kholein → `F12` dabaayein → **Console** tab.
2. Neeche wala code paste karein, `MERA-NAYA-PASSWORD` ki jagah apna password likhein:

   ```js
   crypto.subtle
     .digest('SHA-256', new TextEncoder().encode('ecal:v2:' + 'MERA-NAYA-PASSWORD'))
     .then(b => console.log([...new Uint8Array(b)]
       .map(x => x.toString(16).padStart(2, '0')).join('')));
   ```

3. Jo lambi line (64 characters) print hogi, use copy karein.
4. `assets/js/app.js` kholein, sabse upar `AUTH` block mein purana hash badal dein:

   ```js
   const AUTH = {
     salt: 'ecal:v2:',
     admin:  'yahan admin ka naya hash',
     viewer: 'yahan viewer ka naya hash'
   };
   ```

5. `sw.js` mein `CACHE_VERSION` bhi thoda badal dein (`ecal-v2.0.0` → `ecal-v2.0.1`),
   warna purani file browser mein cached reh jaayegi.

---

## Features

**Calendar**
- **3 views** — Month grid, Agenda (3 mahine ki list), Year (poore saal ka nazara)
- Kisi bhi din par click → us din ka panel khulta hai (admin wahin se edit/delete kar sakta hai)
- **Search** — type karte hi poore calendar mein dhoond leta hai
- **8 categories** apne rang ke saath: Festival · National · Awareness · School · Activity · Exam · Holiday · Other
- Category chips se filter — sirf jo dekhna hai wahi dikhega
- ⭐ Important mark, aur 🔁 "har saal repeat" (Republic Day type fixed dates ke liye)
- Sidebar: aaj ki date, **agle 60 din ke events countdown ke saath**, month ke stats

**House & Class Board**
- Dono boards ek saath, month ke hisaab se
- Admin theme/activity add, **edit** aur delete kar sakta hai

**Aur bhi**
- 📢 **Sabko ek hi calendar** — data GitHub par rehta hai, Publish karne se sab tak pahunch jaata hai
- 🔄 Patti par dikhta hai ki **last update kab aur kisne** kiya
- 🌙 **Dark mode**
- 🏠 House (neela) / 🎓 Class (baingani) — do theme
- 📱 Mobile par poora chalta hai; chhoti screen par calendar rang ke dots dikhata hai, tap karo to details
- 🖨️ **Print / PDF** — A4 landscape par saaf-suthra month calendar (notice board ke liye)
- 📅 **.ics export** — Google Calendar ya phone ke calendar mein import kar lein
- ⬇️ **Backup / restore** — JSON file
- 📶 **Offline chalta hai** — ek baar khul gaya to internet ke bina bhi khulega (PWA, phone par "Add to Home screen" kar sakte hain)
- ⌨️ Keyboard shortcuts — `←` `→` month, `T` today, `N` naya event, `/` search, `M`/`A`/`Y` view, `P` print, `Esc` band

---

## 📢 Sabko dikhane ke liye — Publish (ye zaroor padhein)

Calendar ka asli data **GitHub par ek file mein** rehta hai:
[`e-calendar/data/calendar.json`](data/calendar.json)

Jo bhi link kholta hai, wo yahi file padhta hai. Isliye **sabko ek hi calendar dikhti hai.**

Lekin ek baat samajhna zaroori hai:

> Admin jab event add/edit/delete karta hai, wo pehle **sirf uske browser mein** hota hai.
> Jab tak **Publish** nahi karega, kisi aur ko nahi dikhega.

App aapko bhoolne nahi degi. Jab tak publish nahi hota, **4 jagah** yaad dilaya jaata hai:

- Screen ke **sabse neeche ek narangi patti chipki rehti hai** —
  *"📢 Ye badlaav sirf aapko dikh rahe hain · 2 events publish karna baaki hai"*.
  Ye scroll karne par bhi nahi hatti, isliye nazar se nahi chhootegi.
- Page ke upar bhi ek patti aati hai.
- ⋮ button par **laal bindi** lag jaati hai.
- Har event save karne par likha aata hai *"abhi sirf aapko dikh raha hai, Publish karein"*.
- Aur agar aap bina publish kiye **Lock & sign out** karenge, to app pehle poochhegi.

### Publish kaise karein (3 step, 1 minute)

1. Peeli patti par **📢 Sabko dikhaayein** dabaayein (ya ⋮ → Publish).
   JSON apne aap copy ho jaata hai.
2. **🔗 GitHub par kholein** dabaayein → nayi tab khulegi →
   `Ctrl`+`A` (purana sab select) → `Ctrl`+`V` (paste) →
   neeche hara **“Commit changes”** button dabaayein.
3. Wapas calendar par aayein → **✅ Ho gaya, check karein** dabaayein.
   App khud live file padhkar batayegi ki pahunch gaya ya nahi.

GitHub ko commit ke baad **1–2 minute** lagte hain. Agar pehli baar mein
"purana data hai" bole, to thoda ruk kar dobara check karein.

> Paste karna mushkil lage to step 2 mein **"File upload kar dein"** khol lein —
> file download karke GitHub ke upload page par drag-drop kar dein. Naam
> `calendar.json` hi rehne dein.

### 📱 Phone se publish karna

Ho jaata hai, par thoda mushkil hai — phone par `Ctrl+A` nahi hota. App phone
par khud alag tareeka dikhati hai: text par **der tak ungli dabaayein** →
**"Select all"** → **"Paste"**.

**Sabse aaram ka tareeka:** events phone se hi add kar lein (wo browser mein
safe pade rehte hain, gum nahi honge), aur **publish laptop se** kar dein.
Narangi patti tab tak dikhti rahegi jab tak publish na ho, to bhoolne ka
darr nahi hai.

### Baaki logon ko naya calendar kaise milega

Apne aap. Wo jab page kholenge ya refresh karenge, nayi file aa jaayegi.
Bina page band kiye dekhna ho to **🔄 Refresh** dabaa lein.

Patti par ye bhi likha rehta hai ki **last update kab hua aur kisne kiya** —
Publish karte waqt apna naam daal dein, to sabko dikhega.

### Do log ek hi waqt par badlein to?

App pakad leti hai. Agar aapke bin-publish badlaav pade hain aur is beech kisi
aur ne publish kar diya, to warning aati hai:
*"⚠️ is beech kisi ne nayi calendar publish ki hai"* — tab
**🔄 Refresh** dekh lein, ya **"Mere badlaav hata dein"** se live wali le lein.

### Publish kaun kar sakta hai

Jiske paas is GitHub repo ka access hai. **Password se koi GitHub par kuch nahi
badal sakta** — jaan-boojh kar aisa banaya hai. Agar page mein GitHub ka token
daal dete, to jo koi page ka source dekh leta wo poora calendar bigaad sakta tha.

### Internet na ho to?

Calendar khulti rahegi (jo aakhri baar dekha tha wo dikhega), par upar likha
aayega *"⚠️ Offline"*. Us waqt Publish band rehta hai — warna aadha-adhoora
data live chala jaata.

### Backup

Publish karte hi backup apne aap ban jaata hai, kyunki poori calendar GitHub
par save hai aur wahan **history** bhi rehti hai (⋮ → *Kaun kab badla*).
Alag file chahiye to ⋮ → **Download backup (.json)**.

---

## Naya event kaise add karein

**Aasaan tareeka (recommended):** Admin login karein → `＋ New event`, ya calendar
mein us din par click karein. Bas.

**Code mein permanent add karna hai** (taaki naye browser mein bhi by default aaye):
`assets/js/app.js` mein `SEED` list hai, wahan ek line jodein —

```js
{ id: 'sports-day-2026', title: 'Annual Sports Day', date: '2026-12-12',
  cat: 'school', star: 1, annual: 0, desc: 'March past, races, prize distribution.' },
```

- `id` — unique rakhein (dobaara wahi id na ho)
- `cat` — `festival` · `national` · `awareness` · `school` · `activity` · `exam` · `holiday` · `other`
- `star: 1` — important (⭐ lagega)
- `annual: 1` — **har saal same date** par. Republic Day, Teachers' Day ke liye `1`.
  **Holi, Diwali, Eid ke liye `0`** — unki date har saal badalti hai.
- `time: '10:30'`, `end: '12:00'` — optional

`SEED` badalne ke baad `sw.js` ka `CACHE_VERSION` bhi badal dein.

---

## Structure

```
e-calendar/
├── index.html                  page ka dhaancha
├── manifest.webmanifest        PWA (Add to Home screen)
├── sw.js                       offline caching
├── robots.txt                  (dekhein neeche ka note)
├── .nojekyll
├── data/
│   └── calendar.json       🌟 SABKA data yahin hai — Publish isi ko badalta hai
└── assets/
    ├── css/app.css             design system, dark mode, print layout
    ├── js/app.js               poora app logic + default events
    └── img/
        ├── favicon.svg         📅 calendar icon (tab aur bookmark mein)
        └── icon-maskable.svg   Android home-screen icon
```

Koi framework nahi, koi build step nahi, koi npm install nahi. Plain HTML + CSS + JS.
`index.html` ko seedha browser mein khol kar bhi chala sakte hain.

> **Google se chhupane ke baare mein:** search engine sirf **domain ke root** ka
> `robots.txt` padhte hain — yaani `niitudit-ai.github.io/robots.txt`, jo GitHub ke
> control mein hai, hamare. Isliye `e-calendar/robots.txt` sirf apni marzi zaahir
> karta hai, wo asal mein rok nahi lagata. Jo cheez **asal mein kaam karti hai** wo
> `index.html` ke andar `<meta name="robots" content="noindex, nofollow">` hai —
> use hata na dein.

---

## Purane version se kya theek hua

Pehle poora calendar ek hi HTML file mein tha. Jo problems thin:

| Problem | Ab |
|---|---|
| Event **edit/delete karne ka koi rasta hi nahi tha** — `openEdit()` function likha tha par use kabhi call nahi hota tha; din par click karne se sirf "Add Event" khulta tha | Din par click → panel khulta hai, har event par ✏️ aur 🗑️ |
| **Delete kiya hua default event reload par wapas aa jaata tha** (merge logic use dobara jod deta tha) | Delete permanent hai. Wapas chahiye to ⋮ → "Restore default events" |
| Password **plain text** mein source code mein tha | SHA-256 hash — View Source se seedha nahi dikhta (upar likhi hui limitation ke saath) |
| **Logout ka option nahi tha** — role badalne ke liye storage clear karna padta tha | ⋮ → Lock & sign out |
| Board section `<main>` ke **bahar** tha, isliye layout se bahar nikal jaata tha | Layout ke andar, theek se |
| Board theme sirf delete ho sakta tha, edit nahi | Edit bhi ho sakta hai |
| Event title mein HTML daal kar script chalayi ja sakti thi | Sab text `textContent` se lagta hai — script chal hi nahi sakti |
| `function open()` ne browser ka `window.open` dhak diya tha | Hata diya |
| Time `14:30` aise dikhta tha | `2:30 PM` |
| Koi favicon nahi | 📅 calendar favicon |
| Search / filter / dark mode / print / backup / export kuch nahi tha | Sab hai |
| **Data sirf ek browser mein rehta tha** — laptop par event daalo to mobile par kuch nahi dikhta tha | Data GitHub par ek shared file mein. **Publish karne se sabko dikhta hai** |

**Purana data safe hai.** Pehli baar khulne par app aapke browser se purane events,
board themes aur theme choice khud utha leta hai. Jo default events aapne delete kiye
the wo delete hi rahenge. Purani storage keys chhedi nahi gayin.

**Dates verify ki gayi hain.** Aapke saare 2026 dates Bharat sarkaar ki official
holiday list se milaye gaye — sab sahi the. Upar se aur zaroori din jode gaye:
Children's Day, Teachers' Day, Hindi Diwas, Yoga Day, National Science Day,
Makar Sankranti, Id-ul-Fitr, Good Friday, Bakrid, Muharram, Milad-un-Nabi waghairah.
Kul **55 events**.

> Chaand par depend karne wale tyohaar (Id, Bakrid, Muharram) ki date thodi aage-peeche
> ho sakti hai — school mein use karne se pehle ek baar dekh lein.

---

## Live kaise hai

GitHub Pages, `main` branch, root folder se serve hota hai. `e-calendar/` folder
push hone ke baad khud live ho jaata hai — koi setting badalne ki zaroorat nahi.
