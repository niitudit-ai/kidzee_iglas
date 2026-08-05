# Kidzee Iglas — Website

Iglas, Aligarh ke Kidzee preschool ki official website.
Director: **Himanshu Kumar Sharma** · 📞 **91933 33793**

> **Poori website ek hi file mein hai — `index.html`.**
> HTML, CSS aur JavaScript sab uske andar hai. Koi folder, koi setup, koi
> build step nahi. Bas file kholo aur chal jaayegi.

---

## Isme kya hai

```
kidzee-iglas/
├── index.html                  ← 🌟 POORI WEBSITE (HTML + CSS + JS, 110 KB)
├── robots.txt                  ← Google ke liye
├── sitemap.xml                 ← Google ke liye
├── assets/
│   └── img/
│       ├── logo-kidzee-iglas.svg   ← placeholder logo (print/social ke liye)
│       └── README.md           ← 📸 photos ki poori guide (padho!)
└── branding/
    ├── 01-zee-learn-approval-email.md   ← ⚠️ SABSE PEHLE YE PADHO
    ├── 02-brand-guidelines.md           ← colours, fonts, tone of voice
    ├── 03-google-business-profile.md    ← Google Maps par aane ka tarika
    ├── 04-social-media-30-day-plan.md   ← 30 din ka ready content
    └── 05-launch-checklist.md           ← live karne se pehle ka checklist
```

## Kya-kya feature hai

| Feature | Detail |
|---|---|
| 📄 **Ek hi file** | `index.html` — copy karo, kahin bhi rakho, chal jaayegi |
| 📱 Mobile-first | Iglas mein 90% parents mobile par aayenge |
| 🌐 Hindi + English | Header mein **EN / हिं** toggle. Choice yaad rehti hai |
| 💬 WhatsApp lead form | Form bharo → seedha aapke WhatsApp par poori detail. **Koi server nahi chahiye** |
| 📞 Sticky bottom bar | Mobile par "Call Now" + "Enquire" hamesha screen par |
| ⚡ Bahut fast | Koi framework nahi, koi database nahi. 2G par bhi khulti hai |
| 🔍 SEO ready | LocalBusiness + FAQ schema, meta tags, sitemap |
| ♿ Accessible | Keyboard se chalti hai, screen reader friendly |
| 💰 Free hosting possible | Netlify / GitHub Pages par ₹0 |

**13 sections:** Hero · Trust bar · About · Why Us · Programs · Péntemind ·
Daily Routine · Gallery · Testimonials · Admissions · Enquiry Form · FAQ ·
Contact + Map

---

## Website live kaise karein

### Sabse aasaan tarika — Netlify Drop (5 minute, free)

1. `kidzee-iglas` folder ka **ZIP** bana lo
2. [app.netlify.com/drop](https://app.netlify.com/drop) kholo
3. ZIP ko **drag and drop** kar do
4. Bas! Turant ek link mil jaayega jaise `random-name-123.netlify.app`
5. Apna domain jodne ke liye: Site settings → Domain management → Add custom
   domain → `kidzeeiglas.com` daalo → jo DNS records batayein wo apne domain
   provider (GoDaddy/Hostinger) mein daal do

**HTTPS (🔒) Netlify khud free mein laga deta hai.**

### GitHub Pages (free, is repo se seedha)
Settings → Pages → Source: `main` branch → Save.
Kuch minute mein `https://niitudit-ai.github.io/kidzee_iglas/` par live ho jaayegi.

### Normal hosting (Hostinger, GoDaddy etc.)
cPanel → **File Manager** → `public_html` kholo → `index.html`, `robots.txt`,
`sitemap.xml` aur `assets` folder upload kar do. Ho gaya.

> **Note:** `branding/` folder website ka hissa nahi hai — wo sirf aapke padhne ke
> liye hai. Chaho to upload karte waqt hata sakte ho.

---

## Website khud kaise edit karein

Sab kuch `index.html` mein hai. Kisi bhi text editor mein khol lo
(Notepad bhi chalega, lekin **Notepad++** ya **VS Code** behtar hai).

### Phone number badalna
`index.html` mein Ctrl+H (Replace All) se ye 3 cheezein badlo:
- `+919193333793` → naya number
- `919193333793` → naya number
- `91933 33793` → naya number (display ke liye)

Ek jagah JavaScript mein bhi hai (file ke aakhir mein):
```js
var WHATSAPP_NUMBER = "919193333793";   // yahan bhi badal do
```

### Koi bhi text badalna (Hindi + English dono)

Website mein har text **do bhaasha** mein hai. Aisa dikhega:

```html
<h3 data-hi="प्ले ग्रुप">Playgroup</h3>
```

- `data-hi="..."` ke andar = **Hindi** text
- Tag ke beech ka = **English** text

Dono badalna zaroori hai, warna ek bhaasha purani reh jaayegi.

### Colours badalna
`index.html` mein `<style>` ke baad `:root {` dhoondho. Bas wahan ke HEX codes
badal do — poori website ke colours change ho jaayenge.

### Photos daalna
👉 Poori guide: **`assets/img/README.md`** — isme 21-shot list bhi hai.

Chhota version: photo ko `assets/img/` mein daalo, phir `index.html` mein
dashed placeholder wali line:
```html
<div class="photo photo--empty"><div><span class="ph-ico">🏫</span><span ...>Classroom photo<br>g1.jpg</span></div></div>
```
ko isse badal do:
```html
<div class="photo"><img src="assets/img/g1.jpg" alt="Classroom at Kidzee Iglas" loading="lazy"></div>
```

### Naya FAQ jodna
`id="faq"` dhoondho. Ek `<div class="faq__item">` block copy karke neeche paste
kar do, aur sawaal-jawab badal do.

### Programs ke age badalna
`id="programs"` dhoondho. Har card mein `<span class="prog__age">` hai — wahan
badlo (English aur `data-hi` dono).

---

## ⚠️ Live karne se pehle ye zaroor karo

1. **`branding/01-zee-learn-approval-email.md` padho** — "Kidzee" trademark hai,
   Zee Learn se permission zaroori hai
2. **`branding/05-launch-checklist.md` follow karo** — pura checklist hai
3. Website mein `[Parent's Name]` wale **testimonial placeholders bharo** — ye
   khaali templates hain, asli reviews nahi
4. Jo facility aapke paas nahi hai (CCTV, transport, daycare, meals) uska
   **claim hata do**
5. Bachchon ki photo par **parents ki likhit permission** lo

---

## Test karna

Bas `index.html` par **double-click** kar do — browser mein khul jaayegi.
Kuch install karne ki zaroorat nahi.

---

## Technical

- Pure HTML5 + CSS3 + vanilla JavaScript, **ek self-contained file mein**
- Zero dependencies, zero build step, zero backend
- Fonts: Baloo 2 + Nunito (Google Fonts, Devanagari support ke saath)
- Icons: emoji + inline SVG (koi icon library nahi)
- Form: `wa.me` deep link se WhatsApp par jaata hai — koi server nahi chahiye
- Browsers: Chrome, Firefox, Safari, Edge + Android/iOS mobile browsers
- Page weight: ~110 KB (photos ke bina)
