# Adv. Krishna Kant Chaturvedy — Website

Static website for **Krishna Kant Chaturvedy, Advocate**, District & Sessions Court, Aligarh.
Plain HTML, CSS and JavaScript — no build step, no framework, no server. Drop the folder on any
host and it works.

Intended domain: **krishnakantchaturvedy.com**

---

## 1. Two image files to add before going live

Both are referenced by the site but could not be included here. Drop them in with these exact
filenames and everything picks them up automatically — no code changes needed.

| Save as | What it is | Used on |
|---|---|---|
| `assets/img/krishna-kant-chaturvedy.jpg` | The portrait photograph | Home hero, About page, social-share preview |
| `assets/img/logo.png` | The original logo artwork | Disclaimer dialog, 404 page |

Until each file exists the page falls back to a built-in substitute, so nothing ever looks broken:
the photo falls back to a neutral placeholder, and the logo falls back to `emblem.svg` — a
hand-built SVG recreation of the logo included in this repository.

For the photo: roughly square, around 1000×1060 px, under 300 KB. Compress it at
<https://squoosh.app> first.

**About the logo.** The header and footer deliberately do *not* use the full logo. The original
artwork is a lockup that already contains the name and the word ADVOCATE, and at the 46 px size a
site header needs, all of that detail turns into an unreadable smudge. So the header pairs a clean
scales-of-justice mark (`assets/img/mark.svg`, drawn to match the logo's navy and gold) with the
name set in type. The full logo is used where there is room for it. The favicon is
`assets/img/favicon.svg`.

---

## 2. Files

```
index.html            Landing page — hero, practice areas, about, process, courts, FAQ, contact
practice-areas.html   Every area of practice, with the specific matters listed under each
about.html            Profile, what to expect in the first meeting, chamber details
contact.html          Full contact details, working hours, map, consultation form
404.html              Not-found page
robots.txt            Search engine instructions
sitemap.xml           Page list for Google Search Console
assets/css/styles.css Whole design system in one file
assets/js/main.js     Language toggle, menu, accordion, form, disclaimer
assets/img/           Logo (SVG), favicon, photo placeholder
```

---

## 3. What the site does

**Bilingual, Hindi and English.** Every visible line exists in both languages. The toggle sits in
the top bar (`EN` / `हिं`) and the choice is remembered on the visitor's device. First-time visitors
on a Hindi-language phone or browser see Hindi automatically; everyone else sees English. This
matters — a large share of district-court clients read Hindi far more comfortably than English.

Text is stored as attributes on the element, so editing is straightforward:

```html
<p data-hi="हिंदी वाक्य यहाँ">English sentence here</p>
```

Change either language by editing that one line. For text containing tags (like `<strong>`), the
attribute is `data-hi-html` instead. For input placeholders it is `data-hi-placeholder`.

**Calls to action, everywhere the visitor might decide.**

| Where | What |
|---|---|
| Top bar and header | Phone number, always visible |
| Hero | *Book a Consultation* + tap-to-call |
| Below the hero | Three cards: call, WhatsApp, chamber directions |
| Bottom of mobile screen | Fixed bar: Call · WhatsApp · Directions |
| Desktop, bottom-right | Floating WhatsApp button |
| Contact section | Consultation form |
| Before the footer | Closing call/WhatsApp band |

**The consultation form needs no backend.** It collects name, phone, type of matter, city, stage
of the case and a description, then opens WhatsApp (or email) with the whole thing already
formatted as a message. The client presses Send. Nothing is stored anywhere, no hosting costs, no
database, and no contact form that silently breaks — which is what usually happens to small
practice websites.

**Google local search.** `Attorney` and `FAQPage` structured data is embedded, so Google can show
the practice with phone, address, hours and the FAQ answers for searches like
*"family lawyer in Aligarh"*. Register the site at
[Google Search Console](https://search.google.com/search-console) and submit `sitemap.xml`, and
create a free [Google Business Profile](https://business.google.com) for the chamber — for a local
practice that profile usually brings more enquiries than the website itself.

**Bar Council compliance.** Under the Bar Council of India rules an advocate may not advertise or
solicit work. The site therefore opens with the standard "no solicitation" acknowledgement (shown
once per device), carries the full disclaimer in the footer, and deliberately avoids claims like
*"best lawyer"*, success percentages, case-count figures and client testimonials. Please keep it
that way — those additions are what create complaints.

---

## 4. Details taken from the visiting card

| | |
|---|---|
| Name | Krishna Kant Chaturvedy, Advocate |
| Court | District & Sessions Court, Aligarh |
| Phone / WhatsApp | +91 90122 22346 |
| Email | advkrishna9012@gmail.com |
| Chamber | Chamber No. 155, A.B.A., Near A.D.R. Bhavan, Aligarh |
| Residence | Shivpuri Asawar, Iglas, Aligarh |

Please confirm these two items, which were **assumed** because the card does not state them:

1. **Working hours** — currently *Monday to Saturday, 10 AM to 6 PM*.
   Appears in: `index.html` (top bar, contact section, footer), `contact.html`, `about.html`,
   and the `openingHoursSpecification` block in the structured data in `index.html`.
2. **Bar Council enrolment number** — not printed on the card, so it is not on the site.
   The BCI rules permit displaying it, and it is a genuine credibility signal. Add it in
   `about.html` inside the `<ul class="creds">` list once you have it.

---

## 5. Editing the content

Open the `.html` file in any text editor. Everything is plain, commented HTML.

**Change the phone number** — it appears as `tel:+919012222346`, `wa.me/919012222346` and as
display text `90122 22346`. Find and replace all three across every `.html` file, and also
`PHONE_E164` at the top of `assets/js/main.js`.

**Change a colour** — every colour is defined once at the top of `assets/css/styles.css` under
`:root`. Editing `--gold-500` or `--navy-800` there restyles the whole site.

**Add a practice area** — copy any `<article class="area-block" id="...">` block in
`practice-areas.html`, and add a matching link to the `anchor-nav` list above it.

---

## 6. Publishing

**Option A — GitHub Pages (free).** Push this folder to a GitHub repository, then
*Settings → Pages → Source: deploy from branch → main / root*. Add the custom domain
`krishnakantchaturvedy.com` on the same screen, and at your domain registrar create these DNS
records:

```
A     @      185.199.108.153
A     @      185.199.109.153
A     @      185.199.110.153
A     @      185.199.111.153
CNAME www    <your-github-username>.github.io
```

**Option B — Netlify or Cloudflare Pages (free).** Drag the folder onto the dashboard, then
attach the domain. Both give HTTPS automatically.

**Option C — ordinary shared hosting.** Upload the contents by FTP into `public_html`.
No PHP, database or Node runtime is needed.

Whichever you choose, make sure HTTPS is switched on before sharing the link.

---

## 7. Worth doing after launch

- Add the photograph (section 1) — the single highest-impact change.
- Confirm the working hours and add the enrolment number (section 4).
- Create the Google Business Profile for Chamber No. 155 and add photos of the chamber.
- Ask the WhatsApp number to be switched to a **WhatsApp Business** account: it allows a greeting
  message, business hours and a catalogue of services, and keeps client chats separate from
  personal ones.
- Once the site is live, replace the Google Maps embed with the exact chamber pin: search the
  chamber location on Google Maps, choose *Share → Embed a map*, and paste the new `src` into the
  `<iframe>` in `index.html` and `contact.html`.

## 8. Not included, and why

No fabricated statistics, no invented years of experience, no sample testimonials. Every figure a
visitor sees should be one the advocate can stand behind if asked. The trust band on the home page
therefore uses verifiable facts — the court, the bar association, the languages, the response time —
rather than numbers. If you want to add *"X years of practice"*, tell me the correct figure and I
will place it in the hero and the trust band.
