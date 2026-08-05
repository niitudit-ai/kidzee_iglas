# Photos — exactly what to click and where to put it

Photos are the single biggest thing that will make this website convert.
A parent in Iglas decides in about 5 seconds, and they decide from the photos.

Take everything on a **normal smartphone in daylight** (morning light through the
windows is best). No flash. Clean the room first.

---

## Files this website is looking for

Save them into this folder (`assets/img/`) with **exactly these names**:

| File name | What it should show | Where it appears |
|---|---|---|
| `hero.jpg` | Your single best photo — 3-5 children happily busy in an activity, teacher visible | Big photo at the top |
| `g1.jpg` | A classroom, wide shot, tidy, decorated walls | Gallery (large tile) |
| `g2.jpg` | Children doing art / craft / colouring, hands visible | Gallery |
| `g3.jpg` | Outdoor or indoor play area with slides / toys | Gallery |
| `g4.jpg` | A festival or celebration day — costumes, decorations | Gallery |
| `g5.jpg` | A teacher sitting with children, reading or explaining | Gallery |
| `share-preview.jpg` | Same as hero, cropped to 1200 x 630 pixels | WhatsApp / Facebook link preview |
| `logo.png` | Official Kidzee logo from Zee Learn, transparent background | Header + footer |

---

## Full shot list (click 40, keep the best 10)

**Classrooms**
1. Wide shot of each classroom, empty and tidy
2. Same classroom with children seated and busy
3. Close-up of the learning wall / charts / alphabet display
4. Reading corner or book shelf

**Children learning (the most important ones)**
5. Children building blocks together
6. A child concentrating hard on writing or colouring
7. Circle time — everyone sitting in a circle
8. A child laughing (this one photo does more than any paragraph of text)
9. Teacher kneeling down to a child's eye level

**Facilities that build parent trust**
10. Play area / slide / swings
11. Clean washroom (parents genuinely check this)
12. Drinking water arrangement
13. Entrance gate with the Kidzee board visible
14. The building from outside, from across the road

**People**
15. Director Mr. Himanshu Kumar Sharma — a warm, friendly portrait
16. All teachers together, smiling, in one group photo
17. Each teacher individually (useful for social media posts)

**Events**
18. Independence Day / Republic Day
19. Diwali, Holi, Janmashtami celebrations
20. Annual day / sports day
21. Graduation day of the KG batch

---

## Rules for good photos

**Do**
- Hold the phone **sideways** (landscape) for the website
- Get down to the child's height, not shooting from above
- Capture children *doing* something, not posing stiffly
- Keep the background clean — hide bags, dustbins, wires

**Don't**
- Don't use flash
- Don't shoot against a bright window (faces go dark)
- Don't include any child whose parent has not given permission

---

## ⚠️ Parent permission — please do not skip this

Before putting **any** child's photo on the website, Instagram or Facebook,
get written permission from that child's parent.

Easiest way: add one line to your admission form —

> "I permit Kidzee Iglas to use photographs/videos of my child taken during
> school activities for the school's website, social media and printed
> publicity material.  ☐ Yes  ☐ No"

Keep a list of the children whose parents said **No**, and make sure they never
appear in any photo you publish. Also share this list with whoever manages your
social media.

---

## How to add a photo to the website

Right now the website shows dashed placeholder boxes. To put a real photo in,
find this in `index.html`:

```html
<div class="photo photo--empty"><div><span class="ph-ico">🏫</span><span ...>Classroom photo<br>g1.jpg</span></div></div>
```

and replace the whole line with:

```html
<div class="photo"><img src="assets/img/g1.jpg" alt="Classroom at Kidzee Iglas" loading="lazy"></div>
```

Do the same for `g2.jpg` to `g5.jpg`. For the big top photo, replace the
`hero__photo-main` placeholder with:

```html
<div class="photo hero__photo-main"><img src="assets/img/hero.jpg" alt="Children learning at Kidzee Iglas"></div>
```

**Tip:** before uploading, shrink each photo to about 1600 pixels wide and under
300 KB (use any free "compress image" tool). This keeps the site fast on the
slower mobile networks around Iglas.
