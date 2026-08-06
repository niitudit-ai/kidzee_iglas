# Kidzee Iglas — Website

Iglas, Aligarh ke Kidzee play school ki official website.
Director: **Himanshu Kumar Sharma** · 📞 **91933 33793**

> **Poori website ek hi file mein hai — `index.html`** (~64 KB).
> HTML, CSS aur JavaScript sab uske andar. Koi folder, koi setup, koi build step nahi.
> Double-click karo, browser mein khul jaayegi.

---

## Structure

```
kidzee_iglas/
├── index.html                  🌟 POORI WEBSITE
├── robots.txt · sitemap.xml · .gitignore
├── assets/img/
│   ├── logo-kidzee-iglas.svg
│   └── README.md               📸 photo shot-list + parent permission guide
└── branding/
    ├── 01-zee-learn-approval-email.md   ⚠️ pehle ye padho
    ├── 02-brand-guidelines.md
    ├── 03-google-business-profile.md
    ├── 04-social-media-30-day-plan.md   30 din ke ready captions
    └── 05-launch-checklist.md
```

## Features

| Feature | Detail |
|---|---|
| 📄 Ek hi file | `index.html` — kahin bhi rakho, chal jaayegi |
| ⚡ Halki aur tez | ~64 KB, koi framework nahi, koi bahar ki image nahi. 2G par bhi khulti hai |
| 📱 Mobile-first | Bottom par Call / WhatsApp / Enquiry bar hamesha screen par |
| 💬 3 lead forms | Hero · Enroll section · Exit popup — sab **seedha WhatsApp** par (koi server nahi chahiye) |
| 📞 CTA har jagah | Topbar, hero, har program card, 2 CTA bands, side rail, mobile bar, popup |
| ⏳ Real countdown | `CONFIG.offerEnds` ki date par khud chhup jaata hai — jhoothi urgency nahi |
| 🔔 Toast notifications | Sirf sacchi jaankari (admissions open, free visit) — fake "X ne admission liya" nahi |
| 🎈 Creative design | Purple + yellow (aapke logo se), mascot, marquee, counters, scroll animations |
| 🔍 SEO ready | LocalBusiness schema, meta tags, sitemap |

**Sections:** Hero + form · Marquee · Stats · About · Programs (Playgroup/Nursery/LKG/UKG) ·
Why Us · Péntemind · Daily Routine · CTA band · Gallery · Reviews · Admission process ·
Enroll form · FAQ · Contact + Map · Footer

---

## Live kaise karein

### GitHub Pages (free, 2 minute)
Repo → **Settings** → **Pages** → Branch `main`, folder `/ (root)` → **Save**
→ `https://niitudit-ai.github.io/kidzee_iglas/`

### Netlify Drop (free)
Folder ka ZIP banao → [app.netlify.com/drop](https://app.netlify.com/drop) par drag-drop.
HTTPS free milta hai. Baad mein `kidzeeiglas.com` domain jod sakte ho.

### Normal hosting
cPanel → File Manager → `public_html` → `index.html`, `robots.txt`, `sitemap.xml`, `assets/` upload.

---

## Khud edit kaise karein

Sab kuch `index.html` mein hai — Notepad se bhi khul jaayega.

### 1. Phone number / offer date badalna
File ke aakhir mein `<script>` ke andar sabse upar:
```js
var CONFIG = {
  wa: "919193333793",              // WhatsApp (91 + 10 digit)
  school: "Kidzee Iglas",
  offerEnds: "2026-09-30T23:59:59" // ⚠️ ASLI date daalein
};
```
Phir Ctrl+H se `+919193333793` aur `91933 33793` bhi replace kar dein.

### 2. Apna asli logo lagana
Apni logo file ka naam **`logo.png`** rakh kar `assets/img/` mein daal do.
Website usse khud utha legi aur andar wala SVG logo chhup jaayega. Bas itna.

### 3. Photos lagana
Photo `assets/img/` mein daalo, phir gallery mein ye line:
```html
<div class="ph"><i>🏫</i>Classroom<br>assets/img/g1.jpg</div>
```
isse badal do:
```html
<div class="ph"><img src="assets/img/g1.jpg" alt="Classroom" loading="lazy"></div>
```
👉 Poori guide + 21-shot list: `assets/img/README.md`

### 4. Colours badalna
`<style>` ke shuru mein `:root {` block hai — bas HEX codes badal do.
`--pur` = purple, `--yel` = yellow.

### 5. Text / FAQ / age badalna
Seedha HTML mein dhoondh kar badal do. FAQ ke liye `<details class="qa">` block copy-paste karo.

---

## ⚠️ Live karne se pehle (zaroori)

1. **`branding/01-zee-learn-approval-email.md` padho** — "Kidzee" trademark hai, Zee Learn se permission lo
2. **3 testimonials bharo** — `[Parent ka naam]` wale khaali template hain, **asli reviews nahi**
3. **`CONFIG.offerEnds`** mein asli date daalo
4. **`CCTV ki suvidha*`** — hero mein likha hai; **agar CCTV nahi hai to hata do**
5. **Day Care** — agar nahi chalate to program section aur FAQ se hata do
6. Timings (8:30–1:30) aur age bands check kar lo
7. Bacchon ki photo par **parents ki likhit permission** lo
8. Footer/social ke `href="#"` ko asli Facebook/Instagram link se badlo
9. Poora checklist: `branding/05-launch-checklist.md`

---

## Technical

Pure HTML5 + CSS3 + vanilla JS, ek self-contained file. Zero dependencies, zero backend.
Fonts: Baloo 2 + Nunito (Google Fonts). Icons: emoji + inline SVG.
Forms `wa.me` deep link se WhatsApp par jaate hain.
Chrome, Firefox, Safari, Edge + Android/iOS mobile browsers.
