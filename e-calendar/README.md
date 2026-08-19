# E-Calendar — House & Class Board

Password-protected school calendar. Important dates, festivals, awareness days
aur har month ke House / Class board themes — sab ek jagah.

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
- 🌙 **Dark mode**
- 🏠 House (neela) / 🎓 Class (baingani) — do theme
- 📱 Mobile par poora chalta hai; chhoti screen par calendar rang ke dots dikhata hai, tap karo to details
- 🖨️ **Print / PDF** — A4 landscape par saaf-suthra month calendar (notice board ke liye)
- 📅 **.ics export** — Google Calendar ya phone ke calendar mein import kar lein
- ⬇️ **Backup / restore** — JSON file
- 📶 **Offline chalta hai** — ek baar khul gaya to internet ke bina bhi khulega (PWA, phone par "Add to Home screen" kar sakte hain)
- ⌨️ Keyboard shortcuts — `←` `→` month, `T` today, `N` naya event, `/` search, `M`/`A`/`Y` view, `P` print, `Esc` band

---

## ⚠️ Data kahan save hota hai (ye zaroor padhein)

Events aapke **usi browser** mein save hote hain (localStorage), kisi server par nahi.
Iska matlab:

- Aap laptop par event add karenge to **mobile par wo nahi dikhega**.
- Browser ka data / history clear kar diya to **events chale jaayenge**.
- Kisi aur ko bhejna hai to: **⋮ menu → Download backup (.json)**, wo file bhejein,
  saamne wale ke browser mein **⋮ → Restore from backup**.

Isliye **mahine mein ek baar backup download kar lijiye.** Bas 2 second ka kaam hai.

Agar aage chal kar sabko ek hi calendar chahiye (sab devices par same data), to
uske liye server ya Firebase/Supabase jaisa database lagega — tab batayein.

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
