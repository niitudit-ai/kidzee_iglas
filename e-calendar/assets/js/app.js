/* =============================================================================
   E-Calendar — application logic
   Plain ES2017, no dependencies, no build step.

   Contents
     1  config & seed data
     2  sha-256 (for password hashes)
     3  small helpers
     4  storage + one-time migration from the old version
     5  auth / lock screen
     6  occurrence engine (handles yearly repeats)
     7  rendering: month · agenda · year · sidebar · board
     8  day drawer
     9  event editor
    10  board editor
    11  data tools: print · ics · backup · restore
    12  wiring, keyboard shortcuts, service worker
   ========================================================================== */

(function () {
  'use strict';

  /* == 1 · CONFIG & SEED DATA ============================================== */

  /* Passwords are stored as SHA-256 hashes so they are not sitting in plain
     text in the page source. This is obfuscation, NOT real security — anything
     that runs in the browser can be inspected. Do not keep genuinely secret
     information in this calendar. To change a password see README.md. */
  const AUTH = {
    salt: 'ecal:v2:',
    admin: '446c9da99968931344255db1576e5f8becc9ee231006a2ceceaf9930d3dcc0e4',
    viewer: 'c96038350d6037a46b589ba2ecd594b6803c09729aaeb0b795e9fb4a48127759'
  };

  /* The shared calendar everyone sees. This file lives in the repo, so GitHub
     Pages serves it to every visitor — that is what makes one person's changes
     visible to everybody. Admin edits are a local draft until published. */
  const SHARED = {
    file: 'data/calendar.json',
    repo: 'niitudit-ai/kidzee_iglas',
    branch: 'main',
    path: 'e-calendar/data/calendar.json'
  };

  const GH = {
    edit: 'https://github.com/' + SHARED.repo + '/edit/' + SHARED.branch + '/' + SHARED.path,
    upload: 'https://github.com/' + SHARED.repo + '/upload/' + SHARED.branch + '/' +
            SHARED.path.replace(/\/[^/]+$/, ''),
    history: 'https://github.com/' + SHARED.repo + '/commits/' + SHARED.branch + '/' + SHARED.path
  };

  const KEYS = {
    events: 'ECAL_V2_EVENTS',
    board: 'ECAL_V2_BOARD',
    hidden: 'ECAL_V2_HIDDEN',
    prefs: 'ECAL_V2_PREFS',
    role: 'ECAL_V2_ROLE',
    baseAt: 'ECAL_V2_BASE_AT',     // publishedAt our local copy started from
    pubName: 'ECAL_V2_PUB_NAME',   // remembered "published by" name
    // keys written by the previous version — read once, then left alone
    oldEvents: 'PRIVATE_ECALENDAR_EVENTS_FINAL',
    oldBoard: 'PRIVATE_ECALENDAR_BOARD_ACTIVITIES',
    oldTheme: 'PRIVATE_ECALENDAR_THEME'
  };

  const CATS = {
    festival:  { label: 'Festival',  icon: '🎉', color: '#e11d48' },
    national:  { label: 'National',  icon: '🇮🇳', color: '#ea580c' },
    awareness: { label: 'Awareness', icon: '🌍', color: '#0284c7' },
    school:    { label: 'School',    icon: '🏫', color: '#7c3aed' },
    activity:  { label: 'Activity',  icon: '🎨', color: '#db2777' },
    exam:      { label: 'Exam',      icon: '📝', color: '#b91c1c' },
    holiday:   { label: 'Holiday',   icon: '🌴', color: '#15803d' },
    other:     { label: 'Other',     icon: '📌', color: '#64748b' }
  };

  const CAT_KEYS = Object.keys(CATS);
  const DEFAULT_CAT = 'other';

  /* ids that existed in version 1 — used to detect events the admin deleted */
  const V1_IDS = [
    'world-lung-day-2026', 'world-environment-day-2026', 'world-health-day-2026',
    'world-science-day-2026', 'world-water-day-2026', 'world-mental-health-day-2026',
    'world-aids-day-2026', 'women-girls-science-day-2026', 'world-soil-day-2026',
    'world-microbiome-day-2026', 'world-biotechnology-day-2026', 'world-computer-day-2026',
    'republic-day-2026', 'holi-2026', 'ram-navami-2026', 'mahavir-jayanti-2026',
    'buddha-purnima-2026', 'independence-day-2026', 'raksha-bandhan-2026',
    'janmashtami-2026', 'gandhi-jayanti-2026', 'dussehra-2026', 'diwali-2026',
    'govardhan-puja-2026', 'bhai-dooj-2026', 'guru-nanak-jayanti-2026', 'christmas-2026'
  ];

  /* annual:true  -> same date every year (Republic Day, Teachers' Day…)
     annual:false -> date changes each year (Holi, Diwali, Eid…), so it is
                     pinned to 2026 and must be re-entered for other years. */
  const SEED = [
    // ---- national days -------------------------------------------------
    { id: 'republic-day-2026',      title: 'Republic Day',      date: '2026-01-26', cat: 'national', star: 1, annual: 1, desc: 'Bharat ka Gantantra Diwas — flag hoisting aur cultural programme.' },
    { id: 'independence-day-2026',  title: 'Independence Day',  date: '2026-08-15', cat: 'national', star: 1, annual: 1, desc: 'Swatantrata Diwas — jhanda rohan, deshbhakti geet aur speech.' },
    { id: 'gandhi-jayanti-2026',    title: 'Gandhi Jayanti',    date: '2026-10-02', cat: 'national', star: 1, annual: 1, desc: 'Mahatma Gandhi ka janmadin — swachhata aur ahimsa par activity.' },
    { id: 'national-youth-day',     title: 'National Youth Day', date: '2026-01-12', cat: 'national', star: 0, annual: 1, desc: 'Swami Vivekananda ka janmadin.' },

    // ---- festivals & religious days (2026 dates) ------------------------
    { id: 'new-year',               title: 'New Year',            date: '2026-01-01', cat: 'festival', star: 1, annual: 1, desc: 'Naya saal mubarak.' },
    { id: 'makar-sankranti-2026',   title: 'Makar Sankranti',     date: '2026-01-14', cat: 'festival', star: 0, annual: 0, desc: 'Patang aur til-gud ka tyohaar.' },
    { id: 'holi-2026',              title: 'Holi',                date: '2026-03-04', cat: 'festival', star: 1, annual: 0, desc: 'Rangon ka tyohaar.' },
    { id: 'id-ul-fitr-2026',        title: 'Id-ul-Fitr',          date: '2026-03-21', cat: 'festival', star: 1, annual: 0, desc: 'Ramzan Id. Chaand ke hisaab se date badal sakti hai.' },
    { id: 'ram-navami-2026',        title: 'Ram Navami',          date: '2026-03-26', cat: 'festival', star: 1, annual: 0, desc: 'Bhagwan Ram ka janmotsav.' },
    { id: 'mahavir-jayanti-2026',   title: 'Mahavir Jayanti',     date: '2026-03-31', cat: 'festival', star: 1, annual: 0, desc: 'Bhagwan Mahavir ka janmadin.' },
    { id: 'good-friday-2026',       title: 'Good Friday',         date: '2026-04-03', cat: 'festival', star: 0, annual: 0, desc: 'Good Friday.' },
    { id: 'buddha-purnima-2026',    title: 'Buddha Purnima',      date: '2026-05-01', cat: 'festival', star: 1, annual: 0, desc: 'Bhagwan Buddha ka janmadin.' },
    { id: 'id-ul-zuha-2026',        title: 'Id-ul-Zuha (Bakrid)', date: '2026-05-27', cat: 'festival', star: 1, annual: 0, desc: 'Bakrid. Chaand ke hisaab se date badal sakti hai.' },
    { id: 'muharram-2026',          title: 'Muharram',            date: '2026-06-26', cat: 'festival', star: 0, annual: 0, desc: 'Muharram.' },
    { id: 'milad-un-nabi-2026',     title: 'Milad-un-Nabi',       date: '2026-08-26', cat: 'festival', star: 0, annual: 0, desc: 'Paighambar Mohammad sahab ka janmadin.' },
    { id: 'raksha-bandhan-2026',    title: 'Raksha Bandhan',      date: '2026-08-28', cat: 'festival', star: 1, annual: 0, desc: 'Bhai-behen ke pyaar ka tyohaar.' },
    { id: 'janmashtami-2026',       title: 'Janmashtami',         date: '2026-09-04', cat: 'festival', star: 1, annual: 0, desc: 'Shri Krishna ka janmotsav — dahi handi aur jhoola.' },
    { id: 'dussehra-2026',          title: 'Dussehra',            date: '2026-10-20', cat: 'festival', star: 1, annual: 0, desc: 'Vijay Dashmi — buraai par acchai ki jeet.' },
    { id: 'diwali-2026',            title: 'Diwali (Deepavali)',  date: '2026-11-08', cat: 'festival', star: 1, annual: 0, desc: 'Roshni ka tyohaar — diya, rangoli aur mithai.' },
    { id: 'govardhan-puja-2026',    title: 'Govardhan Puja',      date: '2026-11-09', cat: 'festival', star: 0, annual: 0, desc: 'Govardhan Puja / Annakut.' },
    { id: 'bhai-dooj-2026',         title: 'Bhai Dooj',           date: '2026-11-11', cat: 'festival', star: 0, annual: 0, desc: 'Bhai Dooj.' },
    { id: 'guru-nanak-jayanti-2026',title: "Guru Nanak's Birthday", date: '2026-11-24', cat: 'festival', star: 1, annual: 0, desc: 'Guru Nanak Dev ji ka prakash parv.' },
    { id: 'christmas-2026',         title: 'Christmas Day',       date: '2026-12-25', cat: 'festival', star: 1, annual: 1, desc: 'Christmas — tree, carol aur Santa.' },

    // ---- school days ----------------------------------------------------
    { id: 'teachers-day',        title: "Teachers' Day",       date: '2026-09-05', cat: 'school', star: 1, annual: 1, desc: 'Dr. Sarvepalli Radhakrishnan ka janmadin.' },
    { id: 'hindi-diwas',         title: 'Hindi Diwas',         date: '2026-09-14', cat: 'school', star: 0, annual: 1, desc: 'Hindi kavita aur bhashan pratiyogita.' },
    { id: 'childrens-day',       title: "Children's Day",      date: '2026-11-14', cat: 'school', star: 1, annual: 1, desc: 'Pandit Nehru ka janmadin — bacchon ka din.' },
    { id: 'national-sports-day', title: 'National Sports Day', date: '2026-08-29', cat: 'school', star: 0, annual: 1, desc: 'Major Dhyan Chand ka janmadin — sports day.' },

    // ---- awareness days -------------------------------------------------
    { id: 'women-girls-science-day-2026', title: 'Women and Girls in Science Day', date: '2026-02-11', cat: 'awareness', star: 0, annual: 1, desc: 'International Day of Women and Girls in Science.' },
    { id: 'world-computer-day-2026',      title: 'World Computer Day',      date: '2026-02-15', cat: 'awareness', star: 0, annual: 1, desc: 'Computer literacy activity.' },
    { id: 'mother-language-day',          title: 'Mother Language Day',     date: '2026-02-21', cat: 'awareness', star: 0, annual: 1, desc: 'International Mother Language Day.' },
    { id: 'national-science-day',         title: 'National Science Day',    date: '2026-02-28', cat: 'awareness', star: 0, annual: 1, desc: 'Raman Effect ki khoj ka din — science exhibition.' },
    { id: 'womens-day',                   title: "International Women's Day", date: '2026-03-08', cat: 'awareness', star: 0, annual: 1, desc: "International Women's Day." },
    { id: 'world-forest-day',             title: 'World Forest Day',        date: '2026-03-21', cat: 'awareness', star: 0, annual: 1, desc: 'International Day of Forests.' },
    { id: 'world-water-day-2026',         title: 'World Water Day',         date: '2026-03-22', cat: 'awareness', star: 0, annual: 1, desc: 'Paani bachao — poster making.' },
    { id: 'world-health-day-2026',        title: 'World Health Day',        date: '2026-04-07', cat: 'awareness', star: 0, annual: 1, desc: 'Health aur hygiene activity.' },
    { id: 'earth-day',                    title: 'Earth Day',               date: '2026-04-22', cat: 'awareness', star: 0, annual: 1, desc: 'Dharti ke liye — plantation drive.' },
    { id: 'world-book-day',               title: 'World Book Day',          date: '2026-04-23', cat: 'awareness', star: 0, annual: 1, desc: 'Reading habit — story telling session.' },
    { id: 'labour-day',                   title: 'Labour Day',              date: '2026-05-01', cat: 'awareness', star: 0, annual: 1, desc: 'International Workers Day.' },
    { id: 'national-technology-day',      title: 'National Technology Day', date: '2026-05-11', cat: 'awareness', star: 0, annual: 1, desc: 'National Technology Day.' },
    { id: 'world-environment-day-2026',   title: 'World Environment Day',   date: '2026-06-05', cat: 'awareness', star: 0, annual: 1, desc: 'Paudha lagao, plastic hatao.' },
    { id: 'world-biotechnology-day-2026', title: 'World Biotechnology Day', date: '2026-06-16', cat: 'awareness', star: 0, annual: 1, desc: 'World Biotechnology Day.' },
    { id: 'yoga-day',                     title: 'International Yoga Day',  date: '2026-06-21', cat: 'awareness', star: 1, annual: 1, desc: 'Subah yoga session.' },
    { id: 'world-microbiome-day-2026',    title: 'World Microbiome Day',    date: '2026-06-27', cat: 'awareness', star: 0, annual: 1, desc: 'World Microbiome Day.' },
    { id: 'world-population-day',         title: 'World Population Day',    date: '2026-07-11', cat: 'awareness', star: 0, annual: 1, desc: 'World Population Day.' },
    { id: 'peace-day',                    title: 'International Day of Peace', date: '2026-09-21', cat: 'awareness', star: 0, annual: 1, desc: 'Shanti diwas.' },
    { id: 'world-lung-day-2026',          title: 'World Lung Day',          date: '2026-09-25', cat: 'awareness', star: 0, annual: 1, desc: 'Saans aur pradushan par jaankari.' },
    { id: 'world-animal-day',             title: 'World Animal Day',        date: '2026-10-04', cat: 'awareness', star: 0, annual: 1, desc: 'Jaanvaron se pyaar — pet show.' },
    { id: 'world-mental-health-day-2026', title: 'World Mental Health Day', date: '2026-10-10', cat: 'awareness', star: 0, annual: 1, desc: 'Mann ki sehat par baat.' },
    { id: 'world-students-day',           title: "World Students' Day",     date: '2026-10-15', cat: 'awareness', star: 0, annual: 1, desc: 'Dr. A.P.J. Abdul Kalam ka janmadin.' },
    { id: 'world-food-day',               title: 'World Food Day',          date: '2026-10-16', cat: 'awareness', star: 0, annual: 1, desc: 'Khaana barbaad na karein — healthy tiffin day.' },
    { id: 'world-science-day-2026',        title: 'World Science Day',       date: '2026-11-10', cat: 'awareness', star: 0, annual: 1, desc: 'Science model display.' },
    { id: 'world-aids-day-2026',          title: 'World AIDS Day',          date: '2026-12-01', cat: 'awareness', star: 0, annual: 1, desc: 'World AIDS Day.' },
    { id: 'world-soil-day-2026',          title: 'World Soil Day',          date: '2026-12-05', cat: 'awareness', star: 0, annual: 1, desc: 'Mitti bachao.' },
    { id: 'human-rights-day',             title: 'Human Rights Day',        date: '2026-12-10', cat: 'awareness', star: 0, annual: 1, desc: 'Human Rights Day.' },
    { id: 'national-maths-day',           title: 'National Mathematics Day', date: '2026-12-22', cat: 'awareness', star: 0, annual: 1, desc: 'Srinivasa Ramanujan ka janmadin — maths quiz.' }
  ];

  /* == 2 · SHA-256 ========================================================
     Written out in plain JS instead of crypto.subtle, because crypto.subtle
     is unavailable when the page is opened directly from disk (file://).   */

  const K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function sha256Hex(text) {
    const msg = new TextEncoder().encode(text);
    const size = (msg.length + 9 + 63) & ~63;
    const buf = new Uint8Array(size);
    buf.set(msg);
    buf[msg.length] = 0x80;

    const dv = new DataView(buf.buffer);
    const bits = msg.length * 8;
    dv.setUint32(size - 8, Math.floor(bits / 4294967296), false);
    dv.setUint32(size - 4, bits >>> 0, false);

    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
        h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));

    for (let i = 0; i < size; i += 64) {
      for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4, false);
      for (let t = 16; t < 64; t++) {
        const a15 = w[t - 15], a2 = w[t - 2];
        const s0 = rotr(a15, 7) ^ rotr(a15, 18) ^ (a15 >>> 3);
        const s1 = rotr(a2, 17) ^ rotr(a2, 19) ^ (a2 >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }

      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K256[t] + w[t]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }

      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }

    return [h0, h1, h2, h3, h4, h5, h6, h7]
      .map((x) => x.toString(16).padStart(8, '0')).join('');
  }

  /* == 3 · HELPERS ======================================================== */

  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  /* Build DOM nodes instead of concatenating HTML strings — user text always
     goes in via textContent, so a title like <img onerror=…> can never run. */
  function el(tag, props) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((k) => {
        const v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style') node.setAttribute('style', v);
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.keys(v).forEach((d) => { node.dataset[d] = v[d]; });
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    for (let i = 2; i < arguments.length; i++) {
      const kid = arguments[i];
      if (kid === null || kid === undefined || kid === false) continue;
      node.appendChild(typeof kid === 'object' ? kid : document.createTextNode(String(kid)));
    }
    return node;
  }

  const pad2 = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());

  /* Never use new Date("YYYY-MM-DD") — that parses as UTC and shifts the day
     in India (+05:30). Always build a local date explicitly. */
  function parseISO(s) {
    const p = String(s || '').split('-');
    return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
  }

  const monthKey = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1);
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const todayISO = () => iso(new Date());

  const fmtMonthYear = (d) => d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const fmtMonthShort = (d) => d.toLocaleDateString('en-IN', { month: 'short' });
  const fmtFull = (d) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtDow = (d) => d.toLocaleDateString('en-IN', { weekday: 'short' });

  function fmtTime(t) {
    if (!t) return '';
    const p = String(t).split(':');
    let h = +p[0];
    const m = p[1] || '00';
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ap;
  }

  const dayDiff = (aISO, bISO) =>
    Math.round((parseISO(aISO) - parseISO(bISO)) / 86400000);

  function relLabel(n) {
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n === -1) return 'Yesterday';
    if (n > 0) return 'in ' + n + ' days';
    return Math.abs(n) + ' days ago';
  }

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const val = JSON.parse(raw);
      return val === null ? fallback : val;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      toast('Browser storage full — changes may not be saved.', 'err');
      return false;
    }
  }

  /* == 4 · STATE, STORAGE, MIGRATION ====================================== */

  const state = {
    role: null,                 // 'admin' | 'viewer'
    view: 'month',              // 'month' | 'agenda' | 'year'
    viewBeforeSearch: null,
    cursor: startOfDay(new Date()),
    selected: null,             // ISO date shown in the drawer
    query: '',
    cats: new Set(CAT_KEYS),
    events: [],
    board: [],
    hidden: [],
    prefs: { board: 'house', theme: 'light' },
    published: null,            // the shared file, once fetched
    offline: false,             // shared file could not be reached
    conflict: false,            // somebody else published after our draft began
    hasLocal: false             // this browser already had saved data
  };

  function normaliseEvent(raw) {
    const ev = {
      id: String(raw.id || uid()),
      title: String(raw.title || '').slice(0, 120).trim() || 'Untitled',
      date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : todayISO(),
      time: /^\d{2}:\d{2}/.test(raw.time || '') ? String(raw.time).slice(0, 5) : '',
      end: /^\d{2}:\d{2}/.test(raw.end || '') ? String(raw.end).slice(0, 5) : '',
      cat: CATS[raw.cat] ? raw.cat : DEFAULT_CAT,
      desc: String(raw.desc || '').slice(0, 800),
      star: raw.star ? 1 : 0,
      annual: raw.annual ? 1 : 0,
      seed: raw.seed ? 1 : 0
    };
    // version 1 only had type:"important" | "normal"
    if (!CATS[raw.cat] && raw.type) {
      ev.star = raw.type === 'important' ? 1 : ev.star;
      ev.cat = raw.type === 'important' ? 'festival' : 'other';
    }
    return ev;
  }

  function normaliseBoardItem(raw) {
    return {
      id: String(raw.id || uid()),
      board: raw.board === 'class' ? 'class' : 'house',
      month: /^\d{4}-\d{2}$/.test(raw.month) ? raw.month : monthKey(new Date()),
      title: String(raw.title || '').slice(0, 120).trim() || 'Untitled',
      desc: String(raw.desc || '').slice(0, 800)
    };
  }

  const seedEvent = (s) => normaliseEvent(Object.assign({}, s, { seed: 1 }));

  /* Whatever this browser already had. Runs before the shared file arrives, so
     the app still works offline or if GitHub is unreachable. */
  function loadLocal() {
    state.prefs = Object.assign({ board: 'house', theme: 'light' },
      readJSON(KEYS.prefs, null) || {});
    state.hidden = (readJSON(KEYS.hidden, []) || []).map(String);

    const stored = readJSON(KEYS.events, null);

    if (Array.isArray(stored)) {
      state.events = stored.map(normaliseEvent);
      state.board = (readJSON(KEYS.board, []) || []).map(normaliseBoardItem);
      state.hasLocal = true;
    } else {
      migrateFromV1();
    }
  }

  /* Only used when the shared file cannot be read: fill in built-in events so
     a brand new browser is not staring at an empty calendar. */
  function mergeSeeds() {
    const have = new Set(state.events.map((e) => e.id));
    const gone = new Set(state.hidden);
    let added = 0;
    SEED.forEach((s) => {
      if (!have.has(s.id) && !gone.has(s.id)) { state.events.push(seedEvent(s)); added++; }
    });
    if (added) saveEvents();
  }

  /* == 4b · THE SHARED FILE =============================================== */

  /* Read the calendar everyone shares. Cache-busted and no-store, because a
     stale copy here would mean somebody misses a change. */
  function fetchPublished() {
    if (!window.fetch || location.protocol === 'file:') return Promise.resolve(null);

    return fetch(SHARED.file + '?t=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.events)) return null;
        return {
          publishedAt: String(data.publishedAt || ''),
          publishedBy: String(data.publishedBy || ''),
          events: data.events.map(normaliseEvent),
          board: Array.isArray(data.board) ? data.board.map(normaliseBoardItem) : [],
          hidden: Array.isArray(data.hidden) ? data.hidden.map(String) : []
        };
      })
      .catch(() => null);
  }

  /* A content fingerprint that ignores ordering and publish metadata, so we can
     tell "my draft differs from what is live" from "identical, nothing to do". */
  const evSig = (e) =>
    [e.id, e.title, e.date, e.time, e.end, e.cat, e.desc, e.star, e.annual].join('\u0001');
  const bdSig = (b) => [b.id, b.board, b.month, b.title, b.desc].join('\u0001');

  function signature(events, board, hidden) {
    return JSON.stringify([
      events.map(evSig).sort(),
      board.map(bdSig).sort(),
      hidden.slice().sort()
    ]);
  }

  function localSignature() {
    return signature(state.events, state.board, state.hidden);
  }

  function publishedSignature() {
    const p = state.published;
    return p ? signature(p.events, p.board, p.hidden) : null;
  }

  /* true when the admin has edits that nobody else can see yet */
  function hasUnpublished() {
    const pub = publishedSignature();
    return pub !== null && pub !== localSignature();
  }

  /* Throw away the local copy and take the shared one. */
  function adoptPublished() {
    const p = state.published;
    if (!p) return;
    state.events = p.events.map((e) => Object.assign({}, e));
    state.board = p.board.map((b) => Object.assign({}, b));
    state.hidden = p.hidden.slice();
    state.conflict = false;
    saveEvents();
    saveBoard();
    saveHidden();
    writeJSON(KEYS.baseAt, p.publishedAt);
  }

  /* Decide what this person actually sees. Called after login, because the
     answer depends on whether they are the admin. */
  function resolveWorkingSet() {
    if (!state.published) {          // GitHub unreachable / opened from disk
      state.offline = true;
      mergeSeeds();
      return;
    }
    state.offline = false;

    // nothing saved here yet, or local is identical to live: just use live
    if (!state.hasLocal || !hasUnpublished()) {
      adoptPublished();
      return;
    }

    // local differs. Only the admin has a reason to keep unpublished edits.
    if (!isAdmin()) {
      adoptPublished();
      return;
    }

    // did someone else publish while we were drafting?
    const base = readJSON(KEYS.baseAt, '');
    state.conflict = !!(base && state.published.publishedAt && base !== state.published.publishedAt);
  }

  /* Re-read the shared file and apply it if we have nothing of our own. */
  function checkForUpdates(announce) {
    return fetchPublished().then((pub) => {
      if (!pub) {
        if (announce) toast('Shared calendar padhi nahi ja saki. Internet dekh lein.', 'err');
        return false;
      }

      const before = publishedSignature();
      state.published = pub;
      const after = publishedSignature();
      state.offline = false;

      if (hasUnpublished() && isAdmin()) {
        // keep the admin's draft, but flag if the live copy moved underneath it
        const base = readJSON(KEYS.baseAt, '');
        state.conflict = !!(base && pub.publishedAt && base !== pub.publishedAt);
        renderSyncBar();
        if (announce) {
          toast(state.conflict
            ? 'Nayi calendar aayi hai, par aapke bin-publish badlaav bhi hain.'
            : 'Aapke paas bin-publish badlaav hain — pehle Publish karein.', 'info');
        }
        return before !== after;
      }

      adoptPublished();
      renderAll();
      if (announce) {
        toast(before === after ? 'Calendar already latest hai ✓' : 'Nayi calendar aa gayi ✓', 'ok');
      }
      return before !== after;
    });
  }

  /* Runs once: pulls the old version's events, board items and theme across so
     nothing the family already typed in is lost. */
  function migrateFromV1() {
    const oldEvents = readJSON(KEYS.oldEvents, null);
    const oldBoard = readJSON(KEYS.oldBoard, null);
    const oldTheme = localStorage.getItem(KEYS.oldTheme);

    const seedById = {};
    SEED.forEach((s) => { seedById[s.id] = s; });

    state.events = [];

    if (Array.isArray(oldEvents) && oldEvents.length) {
      const seen = new Set();

      oldEvents.forEach((old) => {
        const base = seedById[old.id];
        if (base) {
          // known default: keep our category/repeat metadata, keep their text
          state.events.push(seedEvent(Object.assign({}, base, {
            title: old.title || base.title,
            date: old.date || base.date,
            time: old.time || '',
            desc: old.desc !== undefined ? old.desc : base.desc,
            star: old.type === 'important' ? 1 : base.star
          })));
        } else {
          state.events.push(normaliseEvent(old));
        }
        seen.add(String(old.id));
      });

      // a v1 default that is absent was deleted on purpose — keep it deleted
      V1_IDS.forEach((id) => { if (!seen.has(id)) state.hidden.push(id); });
      writeJSON(KEYS.hidden, state.hidden);

      state.hasLocal = true;
      toast('Purane calendar ka data le liya gaya ✓', 'ok');
    }

    state.board = Array.isArray(oldBoard) ? oldBoard.map(normaliseBoardItem) : [];

    if (oldTheme === 'class' || oldTheme === 'house') state.prefs.board = oldTheme;

    saveEvents();
    saveBoard();
    savePrefs();
  }

  const saveEvents = () => writeJSON(KEYS.events, state.events);
  const saveBoard = () => writeJSON(KEYS.board, state.board);
  const saveHidden = () => writeJSON(KEYS.hidden, state.hidden);
  const savePrefs = () => writeJSON(KEYS.prefs, state.prefs);

  /* == 5 · AUTH =========================================================== */

  function attemptLogin(role) {
    const input = $('pw');
    const value = input.value.trim();
    const msg = $('lockMsg');

    if (!value) {
      msg.textContent = 'Pehle password daaliye.';
      shakeCard();
      input.focus();
      return;
    }

    const digest = sha256Hex(AUTH.salt + value);
    const expected = role === 'admin' ? AUTH.admin : AUTH.viewer;

    if (digest !== expected) {
      const other = role === 'admin' ? AUTH.viewer : AUTH.admin;
      msg.textContent = digest === other
        ? (role === 'admin'
            ? 'Ye viewer ka password hai — "Viewer Login" dabaayein.'
            : 'Ye admin ka password hai — "Admin Login" dabaayein.')
        : 'Galat password. Dobara koshish kijiye.';
      shakeCard();
      input.select();
      return;
    }

    msg.textContent = '';
    input.value = '';
    signIn(role);
  }

  function shakeCard() {
    const card = $('lockCard');
    card.classList.remove('shake');
    void card.offsetWidth;              // restart the animation
    card.classList.add('shake');
  }

  function signIn(role) {
    state.role = role;
    try { sessionStorage.setItem(KEYS.role, role); } catch (err) { /* private mode */ }

    document.body.classList.remove('is-locked');
    $('lock').hidden = true;
    $('hdr').hidden = false;
    $('app').hidden = false;
    $('footer').hidden = false;

    applyRole();

    // the shared file decides what is shown, and that depends on the role
    sharedReady.then(function () {
      resolveWorkingSet();
      renderAll();
    });
  }

  function signOut() {
    state.role = null;
    try { sessionStorage.removeItem(KEYS.role); } catch (err) { /* ignore */ }

    closeDrawer();
    closeEventModal();
    closeBoardModal();
    closeMenu();

    document.body.classList.add('is-locked');
    $('lock').hidden = false;
    $('hdr').hidden = true;
    $('app').hidden = true;
    $('footer').hidden = true;
    $('lockMsg').textContent = '';
    $('pw').value = '';
    $('pw').focus();
  }

  function isAdmin() { return state.role === 'admin'; }

  function applyRole() {
    const admin = isAdmin();
    const badge = $('roleBadge');
    badge.textContent = admin ? '👑 Admin' : '👁️ Viewer';
    badge.classList.toggle('role--admin', admin);

    $('addBtn').hidden = !admin;
    $('boardAddBtn').hidden = !admin;
    $$('#menuPanel [data-admin]').forEach((b) => { b.hidden = !admin; });
  }

  /* == 6 · OCCURRENCE ENGINE ============================================== */

  /* An event with annual:1 happens on the same day every year, so it has many
     "occurrences". Everything that renders dates goes through this. */
  function occurrencesBetween(fromISO, toISO) {
    const out = [];
    const fromY = +fromISO.slice(0, 4);
    const toY = +toISO.slice(0, 4);

    state.events.forEach((ev) => {
      if (!ev.annual) {
        if (ev.date >= fromISO && ev.date <= toISO) out.push({ ev: ev, date: ev.date });
        return;
      }
      const mm = ev.date.slice(5, 7);
      const dd = ev.date.slice(8, 10);
      for (let y = fromY; y <= toY; y++) {
        // 29 Feb only exists in leap years
        if (+dd > daysInMonth(y, +mm - 1)) continue;
        const d = y + '-' + mm + '-' + dd;
        if (d >= fromISO && d <= toISO) out.push({ ev: ev, date: d });
      }
    });

    return out;
  }

  function passesFilter(ev) {
    if (!state.cats.has(ev.cat)) return false;
    if (!state.query) return true;
    const q = state.query;
    return ev.title.toLowerCase().indexOf(q) > -1 ||
           ev.desc.toLowerCase().indexOf(q) > -1 ||
           CATS[ev.cat].label.toLowerCase().indexOf(q) > -1;
  }

  function sortOccurrences(list) {
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      const at = a.ev.time || '99:99';
      const bt = b.ev.time || '99:99';
      if (at !== bt) return at < bt ? -1 : 1;
      if (a.ev.star !== b.ev.star) return b.ev.star - a.ev.star;
      return a.ev.title.localeCompare(b.ev.title);
    });
  }

  /* date -> occurrences, filtered and sorted */
  function occurrenceMap(fromISO, toISO, useFilter) {
    const map = Object.create(null);
    let list = occurrencesBetween(fromISO, toISO);
    if (useFilter !== false) list = list.filter((o) => passesFilter(o.ev));
    sortOccurrences(list).forEach((o) => {
      (map[o.date] || (map[o.date] = [])).push(o);
    });
    return map;
  }

  function eventsOn(dateISO, useFilter) {
    return (occurrenceMap(dateISO, dateISO, useFilter)[dateISO] || []);
  }

  /* == 7 · RENDERING ====================================================== */

  function renderAll() {
    applyPrefs();
    renderSyncBar();
    renderChips();
    renderPeriod();
    renderCurrentView();
    renderSidebar();
    renderBoard();
    renderPrintHead();
  }

  function applyPrefs() {
    const board = state.prefs.board === 'class' ? 'class' : 'house';
    document.documentElement.dataset.board = board;
    document.documentElement.dataset.theme = state.prefs.theme === 'dark' ? 'dark' : 'light';

    $('appTitle').textContent = board === 'class' ? 'Class E-Calendar' : 'House E-Calendar';
    $('appSub').textContent = board === 'class'
      ? 'Class Board · events & activities'
      : 'Important dates, festivals & activities';

    $$('.board-switch button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.board === board));
    });

    const dark = state.prefs.theme === 'dark';
    $('themeBtn').textContent = dark ? '☀️' : '🌙';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#111a2e' : '#2f5cf0');
  }

  function renderChips() {
    const box = $('chips');
    if (box.childElementCount) {                 // already built — just refresh
      $$('.chip', box).forEach((c) => {
        c.setAttribute('aria-pressed', String(state.cats.has(c.dataset.cat)));
      });
      return;
    }

    CAT_KEYS.forEach((key) => {
      const c = CATS[key];
      const chip = el('button', {
        class: 'chip',
        type: 'button',
        'aria-pressed': String(state.cats.has(key)),
        dataset: { cat: key },
        style: '--c:' + c.color,
        onclick: function () {
          if (state.cats.has(key)) state.cats.delete(key); else state.cats.add(key);
          if (!state.cats.size) state.cats = new Set(CAT_KEYS);   // never show nothing
          renderChips();
          renderCurrentView();
          renderSidebar();
        }
      }, el('span', { class: 'swatch' }), c.icon + ' ' + c.label);
      box.appendChild(chip);
    });
  }

  function renderPeriod() {
    const label = $('periodLabel');

    if (state.view === 'year') {
      label.textContent = String(state.cursor.getFullYear());
    } else if (state.view === 'agenda') {
      const end = addMonths(state.cursor, 2);
      label.innerHTML = '';
      label.appendChild(document.createTextNode(fmtMonthShort(state.cursor) + ' – ' + fmtMonthShort(end) + ' '));
      label.appendChild(el('span', { text: String(end.getFullYear()) }));
    } else {
      label.innerHTML = '';
      label.appendChild(document.createTextNode(state.cursor.toLocaleDateString('en-IN', { month: 'long' }) + ' '));
      label.appendChild(el('span', { text: String(state.cursor.getFullYear()) }));
    }

    $('jump').value = monthKey(state.cursor);
  }

  function renderCurrentView() {
    $('viewMonth').hidden = state.view !== 'month';
    $('viewAgenda').hidden = state.view !== 'agenda';
    $('viewYear').hidden = state.view !== 'year';

    $$('.seg button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.view === state.view));
    });

    if (state.view === 'month') renderMonth();
    else if (state.view === 'agenda') renderAgenda();
    else renderYear();

    renderPeriod();
  }

  /* -- month grid ------------------------------------------------------- */
  function renderMonth() {
    const grid = $('monthGrid');
    grid.innerHTML = '';

    const y = state.cursor.getFullYear();
    const m = state.cursor.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const total = daysInMonth(y, m);
    const cells = Math.ceil((firstDow + total) / 7) * 7;

    const gridStart = iso(new Date(y, m, 1 - firstDow));
    const gridEnd = iso(new Date(y, m, cells - firstDow));
    const map = occurrenceMap(gridStart, gridEnd);
    const today = todayISO();
    const admin = isAdmin();

    for (let i = 0; i < cells; i++) {
      const d = new Date(y, m, i - firstDow + 1);
      const dISO = iso(d);
      const list = map[dISO] || [];
      const out = d.getMonth() !== m;

      const cell = el('button', {
        class: 'cell' +
          (out ? ' is-out' : '') +
          (dISO === today ? ' is-today' : '') +
          (dISO === state.selected ? ' is-selected' : '') +
          (d.getDay() === 0 ? ' is-sun' : ''),
        type: 'button',
        dataset: { date: dISO },
        'aria-label': fmtFull(d) + (list.length ? ' — ' + list.length + ' event' + (list.length > 1 ? 's' : '') : ' — no events')
      }, el('span', { class: 'cell__num', text: String(d.getDate()) }));

      list.slice(0, 3).forEach((o) => {
        cell.appendChild(el('span', {
          class: 'pill' + (o.ev.star ? ' pill--star' : ''),
          style: '--c:' + CATS[o.ev.cat].color
        },
          o.ev.star ? '⭐' : CATS[o.ev.cat].icon,
          el('span', {
            class: 'pill__txt',
            text: o.ev.title + (o.ev.time ? ' · ' + fmtTime(o.ev.time) : '')
          })
        ));
      });

      if (list.length > 3) {
        cell.appendChild(el('span', { class: 'cell__more', text: '+' + (list.length - 3) + ' more' }));
      }

      if (list.length) {
        const dots = el('span', { class: 'cell__dots', 'aria-hidden': 'true' });
        list.slice(0, 6).forEach((o) => {
          dots.appendChild(el('i', { style: '--c:' + CATS[o.ev.cat].color }));
        });
        cell.appendChild(dots);
      }

      cell.addEventListener('click', function () {
        if (!list.length && admin) openEventModal(null, dISO);
        else openDrawer(dISO);
      });

      grid.appendChild(cell);
    }
  }

  /* -- agenda ----------------------------------------------------------- */
  function renderAgenda() {
    const box = $('agendaList');
    box.innerHTML = '';

    let fromISO, toISO, scopeText;

    if (state.query) {
      const now = new Date();
      fromISO = iso(new Date(now.getFullYear() - 1, 0, 1));
      toISO = iso(new Date(now.getFullYear() + 2, 11, 31));
      scopeText = 'Search results for “' + state.query + '”';
    } else {
      const start = new Date(state.cursor.getFullYear(), state.cursor.getMonth(), 1);
      const endMonth = addMonths(start, 2);
      fromISO = iso(start);
      toISO = iso(new Date(endMonth.getFullYear(), endMonth.getMonth(),
        daysInMonth(endMonth.getFullYear(), endMonth.getMonth())));
      scopeText = fmtMonthYear(start) + ' – ' + fmtMonthYear(endMonth);
    }

    const map = occurrenceMap(fromISO, toISO);
    const dates = Object.keys(map).sort();
    const count = dates.reduce((n, d) => n + map[d].length, 0);

    $('agendaSub').textContent = scopeText + ' · ' + count + ' event' + (count === 1 ? '' : 's');

    if (!dates.length) {
      box.appendChild(el('p', {
        class: 'empty',
        text: state.query ? 'Is search se kuch nahi mila.' : 'Is period mein koi event nahi hai.'
      }));
      return;
    }

    const today = todayISO();

    dates.forEach((dISO) => {
      const d = parseISO(dISO);
      const diff = dayDiff(dISO, today);

      const items = el('div', { class: 'agenda__items' });
      map[dISO].forEach((o) => items.appendChild(eventRow(o, dISO)));

      box.appendChild(el('div', { class: 'agenda__day' + (dISO === today ? ' is-today' : '') },
        el('div', { class: 'agenda__date' },
          el('span', { text: fmtDow(d) }),
          el('b', { text: String(d.getDate()) }),
          el('span', { text: fmtMonthShort(d) }),
          Math.abs(diff) <= 30 ? el('em', { text: relLabel(diff) }) : null
        ),
        items
      ));
    });
  }

  /* one event row, reused by agenda and drawer */
  function eventRow(occ, dateISO) {
    const ev = occ.ev;
    const cat = CATS[ev.cat];
    const admin = isAdmin();

    const meta = el('span', { class: 'ev__meta' },
      el('span', { class: 'ev__tag', style: '--c:' + cat.color, text: cat.label })
    );

    if (ev.time) {
      meta.appendChild(el('span', {
        text: '🕒 ' + fmtTime(ev.time) + (ev.end ? ' – ' + fmtTime(ev.end) : '')
      }));
    }
    if (ev.annual) meta.appendChild(el('span', { text: '🔁 every year' }));
    if (ev.star) meta.appendChild(el('span', { text: '⭐ important' }));

    const body = el('div', { class: 'ev__body' },
      el('b', { class: 'ev__title', text: ev.title }),
      meta,
      ev.desc ? el('p', { class: 'ev__desc', text: ev.desc }) : null
    );

    const row = el('div', {
      class: 'ev',
      style: '--c:' + cat.color
    },
      el('span', { class: 'ev__icon', text: ev.star ? '⭐' : cat.icon }),
      body
    );

    if (admin) {
      row.appendChild(el('div', { class: 'ev__act' },
        el('button', {
          class: 'btn btn--sm btn--ghost', type: 'button',
          title: 'Edit', 'aria-label': 'Edit ' + ev.title,
          onclick: function (e) { e.stopPropagation(); openEventModal(ev.id, dateISO); }
        }, '✏️'),
        el('button', {
          class: 'btn btn--sm btn--ghost', type: 'button',
          title: 'Delete', 'aria-label': 'Delete ' + ev.title,
          onclick: function (e) { e.stopPropagation(); deleteEvent(ev.id); }
        }, '🗑️')
      ));
    }

    return row;
  }

  /* -- year ------------------------------------------------------------- */
  function renderYear() {
    const box = $('yearGrid');
    box.innerHTML = '';

    const y = state.cursor.getFullYear();
    const map = occurrenceMap(y + '-01-01', y + '-12-31');
    const today = todayISO();
    const nowMonth = monthKey(new Date());
    let yearTotal = 0;

    for (let m = 0; m < 12; m++) {
      const first = new Date(y, m, 1);
      const key = monthKey(first);
      const total = daysInMonth(y, m);
      const firstDow = first.getDay();
      let monthCount = 0;

      const cells = el('div', { class: 'mini__grid' });
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d) => cells.appendChild(el('u', { text: d })));
      for (let i = 0; i < firstDow; i++) cells.appendChild(el('i'));

      for (let day = 1; day <= total; day++) {
        const dISO = y + '-' + pad2(m + 1) + '-' + pad2(day);
        const list = map[dISO] || [];
        monthCount += list.length;

        const cls = dISO === today ? 'today' : (list.length ? 'has' : 'd');
        const style = list.length ? '--c:' + CATS[list[0].ev.cat].color : null;
        cells.appendChild(el('i', { class: cls, style: style, text: String(day) }));
      }

      yearTotal += monthCount;

      box.appendChild(el('button', {
        class: 'mini' + (key === nowMonth ? ' is-current' : ''),
        type: 'button',
        'aria-label': fmtMonthYear(first) + ' — ' + monthCount + ' events',
        onclick: function () {
          state.cursor = first;
          setView('month');
        }
      },
        el('div', { class: 'mini__head' },
          el('b', { text: first.toLocaleDateString('en-IN', { month: 'long' }) }),
          el('span', { text: monthCount ? monthCount + ' ev' : '' })
        ),
        cells
      ));
    }

    $('yearSub').textContent = yearTotal + ' events in ' + y + ' · month par click karke calendar kholein';
  }

  /* -- sidebar ---------------------------------------------------------- */
  function renderSidebar() {
    const now = new Date();
    const nowISO = todayISO();

    $('todayDate').textContent = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    $('todayDow').textContent =
      now.toLocaleDateString('en-IN', { weekday: 'long' }) + ' · ' + now.getFullYear();

    const mine = eventsOn(nowISO, false);
    const note = $('todayNote');
    if (mine.length) {
      note.hidden = false;
      note.textContent = mine.map((o) => (o.ev.star ? '⭐ ' : '') + o.ev.title).join(' · ');
    } else {
      note.hidden = true;
    }

    // coming up — next 60 days
    const box = $('upcomingList');
    box.innerHTML = '';
    const until = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60);
    const list = sortOccurrences(
      occurrencesBetween(nowISO, iso(until)).filter((o) => passesFilter(o.ev))
    ).slice(0, 7);

    if (!list.length) {
      box.appendChild(el('p', { class: 'empty', text: 'Agle 60 din mein kuch nahi hai.' }));
    } else {
      list.forEach((o) => {
        const d = parseISO(o.date);
        const diff = dayDiff(o.date, nowISO);
        box.appendChild(el('button', {
          class: 'up',
          type: 'button',
          style: '--c:' + CATS[o.ev.cat].color,
          onclick: function () { jumpToDate(o.date); }
        },
          el('span', { class: 'up__when' },
            el('b', { text: String(d.getDate()) }),
            el('span', { text: fmtMonthShort(d) })
          ),
          el('span', { class: 'up__body' },
            el('b', { text: (o.ev.star ? '⭐ ' : '') + o.ev.title }),
            el('span', { text: CATS[o.ev.cat].label + (o.ev.time ? ' · ' + fmtTime(o.ev.time) : '') })
          ),
          el('span', {
            class: 'up__in' + (diff <= 1 ? ' is-now' : ''),
            text: relLabel(diff)
          })
        ));
      });
    }

    // month stats (unfiltered, so the numbers always describe the whole month)
    const y = state.cursor.getFullYear();
    const m = state.cursor.getMonth();
    const from = iso(new Date(y, m, 1));
    const to = iso(new Date(y, m, daysInMonth(y, m)));
    const monthOcc = occurrencesBetween(from, to);
    const key = monthKey(state.cursor);

    $('statTotal').textContent = String(monthOcc.length);
    $('statStar').textContent = String(monthOcc.filter((o) => o.ev.star).length);
    $('statBoard').textContent = String(state.board.filter((b) => b.month === key).length);
    $('statsSub').textContent = fmtMonthYear(state.cursor);
  }

  /* -- board ------------------------------------------------------------ */
  function renderBoard() {
    const key = monthKey(state.cursor);
    $('boardMonthName').textContent = fmtMonthYear(state.cursor);

    [['house', 'houseItems', 'houseCount'], ['class', 'classItems', 'classCount']]
      .forEach(function (cfg) {
        const kind = cfg[0];
        const box = $(cfg[1]);
        box.innerHTML = '';

        const items = state.board.filter((b) => b.board === kind && b.month === key);
        $(cfg[2]).textContent = String(items.length);

        if (!items.length) {
          box.appendChild(el('p', {
            class: 'empty',
            text: 'Is month ka koi theme nahi. ' + (isAdmin() ? '“Add theme” dabaayein.' : '')
          }));
          return;
        }

        items.forEach((item) => {
          const head = el('div', { class: 'bi__head' }, el('b', { text: item.title }));

          if (isAdmin()) {
            head.appendChild(el('div', { class: 'bi__act' },
              el('button', {
                class: 'btn btn--sm btn--ghost', type: 'button',
                title: 'Edit', 'aria-label': 'Edit ' + item.title,
                onclick: function () { openBoardModal(item.id); }
              }, '✏️'),
              el('button', {
                class: 'btn btn--sm btn--ghost', type: 'button',
                title: 'Delete', 'aria-label': 'Delete ' + item.title,
                onclick: function () { deleteBoardItem(item.id); }
              }, '🗑️')
            ));
          }

          box.appendChild(el('div', { class: 'bi' },
            head,
            item.desc ? el('p', { text: item.desc }) : null
          ));
        });
      });
  }

  function renderPrintHead() {
    const board = state.prefs.board === 'class' ? 'Class' : 'House';
    $('printTitle').textContent = board + ' E-Calendar — ' +
      (state.view === 'year' ? state.cursor.getFullYear() : fmtMonthYear(state.cursor));
    $('printSub').textContent = 'Printed on ' + fmtFull(new Date());
  }

  /* == 8 · DAY DRAWER ===================================================== */

  let lastFocus = null;

  function openDrawer(dateISO) {
    const wasOpen = !$('drawer').hidden;
    state.selected = dateISO;
    // only remember the outside element, not the drawer's own buttons
    if (!wasOpen) lastFocus = document.activeElement;

    const d = parseISO(dateISO);
    const diff = dayDiff(dateISO, todayISO());

    $('drawerTitle').textContent = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    $('drawerSub').textContent =
      d.toLocaleDateString('en-IN', { weekday: 'long' }) + ' · ' + relLabel(diff);

    const body = $('drawerBody');
    body.innerHTML = '';

    const list = eventsOn(dateISO, false);
    if (!list.length) {
      body.appendChild(el('p', { class: 'empty', text: 'Is din koi event nahi hai.' }));
    } else {
      list.forEach((o) => body.appendChild(eventRow(o, dateISO)));
    }

    $('drawerFoot').hidden = !isAdmin();
    $('drawerScrim').hidden = false;
    $('drawer').hidden = false;
    document.body.classList.add('is-modal');
    if (!wasOpen) $('drawerClose').focus();

    if (state.view === 'month') renderMonth();
  }

  function closeDrawer() {
    if ($('drawer').hidden) return;
    $('drawer').hidden = true;
    $('drawerScrim').hidden = true;
    state.selected = null;
    unlockScroll();
    if (state.view === 'month') renderMonth();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function refreshDrawer() {
    if (!$('drawer').hidden && state.selected) openDrawer(state.selected);
  }

  function unlockScroll() {
    const open = !$('drawer').hidden || !$('eventModal').hidden ||
                 !$('boardModal').hidden || !$('helpModal').hidden ||
                 !$('pubModal').hidden;
    if (!open) document.body.classList.remove('is-modal');
  }

  function jumpToDate(dateISO) {
    const d = parseISO(dateISO);
    state.cursor = new Date(d.getFullYear(), d.getMonth(), 1);
    if (state.view === 'year') setView('month'); else renderAll();
    openDrawer(dateISO);
  }

  /* == 9 · EVENT EDITOR =================================================== */

  let editingId = null;

  function buildCatOptions() {
    const sel = $('evCat');
    if (sel.childElementCount) return;
    CAT_KEYS.forEach((k) => {
      sel.appendChild(el('option', { value: k, text: CATS[k].icon + ' ' + CATS[k].label }));
    });
  }

  function openEventModal(id, dateISO) {
    if (!isAdmin()) return;
    buildCatOptions();
    lastFocus = document.activeElement;
    editingId = id || null;

    const ev = id ? state.events.find((e) => e.id === id) : null;

    $('eventModalTitle').textContent = ev ? 'Edit event' : 'Add event';
    $('evTitle').value = ev ? ev.title : '';
    // editing a repeat: show the occurrence's year but keep the stored day/month
    $('evDate').value = ev ? ev.date : (dateISO || todayISO());
    $('evTime').value = ev ? ev.time : '';
    $('evEnd').value = ev ? ev.end : '';
    $('evCat').value = ev ? ev.cat : 'school';
    $('evDesc').value = ev ? ev.desc : '';
    $('evStar').checked = ev ? !!ev.star : false;
    $('evAnnual').checked = ev ? !!ev.annual : false;
    $('evDelete').hidden = !ev;

    $('eventScrim').hidden = false;
    $('eventModal').hidden = false;
    document.body.classList.add('is-modal');
    $('evTitle').focus();
  }

  function closeEventModal() {
    if ($('eventModal').hidden) return;
    $('eventModal').hidden = true;
    $('eventScrim').hidden = true;
    editingId = null;
    unlockScroll();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function saveEvent() {
    if (!isAdmin()) return;

    const title = $('evTitle').value.trim();
    const date = $('evDate').value;

    if (!title) { toast('Title likhna zaroori hai.', 'err'); $('evTitle').focus(); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast('Sahi date chuniye.', 'err'); $('evDate').focus(); return; }

    const time = $('evTime').value;
    const end = $('evEnd').value;
    if (time && end && end < time) { toast('End time start time se pehle nahi ho sakta.', 'err'); return; }

    const patch = {
      title: title,
      date: date,
      time: time,
      end: end,
      cat: $('evCat').value,
      desc: $('evDesc').value.trim(),
      star: $('evStar').checked ? 1 : 0,
      annual: $('evAnnual').checked ? 1 : 0
    };

    if (editingId) {
      const ev = state.events.find((e) => e.id === editingId);
      if (!ev) { toast('Event mil nahi raha.', 'err'); return; }
      Object.assign(ev, normaliseEvent(Object.assign({}, ev, patch)));
      toast('Event update ho gaya ✓', 'ok');
    } else {
      state.events.push(normaliseEvent(Object.assign({ id: uid() }, patch)));
      toast('Event add ho gaya ✓', 'ok');
    }

    saveEvents();
    closeEventModal();

    const d = parseISO(date);
    state.cursor = new Date(d.getFullYear(), d.getMonth(), 1);
    renderAll();
    refreshDrawer();
  }

  function deleteEvent(id) {
    if (!isAdmin()) return;
    const ev = state.events.find((e) => e.id === id);
    if (!ev) return;
    if (!window.confirm('“' + ev.title + '” delete karna hai?')) return;

    state.events = state.events.filter((e) => e.id !== id);
    // remember that a built-in event was removed, so it does not come back
    if (ev.seed && state.hidden.indexOf(id) === -1) { state.hidden.push(id); saveHidden(); }

    saveEvents();
    closeEventModal();
    toast('Event delete ho gaya.', 'ok');
    renderAll();
    refreshDrawer();
  }

  /* == 10 · BOARD EDITOR ================================================== */

  let editingBoardId = null;

  function openBoardModal(id) {
    if (!isAdmin()) return;
    lastFocus = document.activeElement;
    editingBoardId = id || null;

    const item = id ? state.board.find((b) => b.id === id) : null;

    $('boardModalTitle').textContent = item ? 'Edit board theme' : 'Add board theme';
    $('bdType').value = item ? item.board : (state.prefs.board === 'class' ? 'class' : 'house');
    $('bdMonth').value = item ? item.month : monthKey(state.cursor);
    $('bdTitle').value = item ? item.title : '';
    $('bdDesc').value = item ? item.desc : '';
    $('bdDelete').hidden = !item;

    $('boardScrim').hidden = false;
    $('boardModal').hidden = false;
    document.body.classList.add('is-modal');
    $('bdTitle').focus();
  }

  function closeBoardModal() {
    if ($('boardModal').hidden) return;
    $('boardModal').hidden = true;
    $('boardScrim').hidden = true;
    editingBoardId = null;
    unlockScroll();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function saveBoardItem() {
    if (!isAdmin()) return;

    const title = $('bdTitle').value.trim();
    const month = $('bdMonth').value;

    if (!title) { toast('Theme ya activity ka naam likhiye.', 'err'); $('bdTitle').focus(); return; }
    if (!/^\d{4}-\d{2}$/.test(month)) { toast('Month chuniye.', 'err'); $('bdMonth').focus(); return; }

    const patch = {
      board: $('bdType').value,
      month: month,
      title: title,
      desc: $('bdDesc').value.trim()
    };

    if (editingBoardId) {
      const item = state.board.find((b) => b.id === editingBoardId);
      if (!item) { toast('Item mil nahi raha.', 'err'); return; }
      Object.assign(item, normaliseBoardItem(Object.assign({}, item, patch)));
      toast('Board theme update ho gaya ✓', 'ok');
    } else {
      state.board.push(normaliseBoardItem(Object.assign({ id: uid() }, patch)));
      toast('Board theme add ho gaya ✓', 'ok');
    }

    saveBoard();
    closeBoardModal();

    const p = month.split('-');
    state.cursor = new Date(+p[0], +p[1] - 1, 1);
    renderAll();
  }

  function deleteBoardItem(id) {
    if (!isAdmin()) return;
    const item = state.board.find((b) => b.id === id);
    if (!item) return;
    if (!window.confirm('“' + item.title + '” delete karna hai?')) return;

    state.board = state.board.filter((b) => b.id !== id);
    saveBoard();
    closeBoardModal();
    toast('Board theme delete ho gaya.', 'ok');
    renderBoard();
    renderSidebar();
    renderSyncBar();
  }

  /* == 11 · DATA TOOLS ==================================================== */

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  const stamp = () => {
    const d = new Date();
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
  };

  function exportBackup() {
    download('e-calendar-backup-' + stamp() + '.json', JSON.stringify({
      app: 'e-calendar',
      version: 2,
      exportedAt: new Date().toISOString(),
      events: state.events,
      board: state.board,
      hidden: state.hidden
    }, null, 2), 'application/json');
    toast('Backup download ho gaya ✓', 'ok');
  }

  function importBackup(file) {
    const reader = new FileReader();

    reader.onload = function () {
      let data;
      try { data = JSON.parse(String(reader.result)); }
      catch (err) { toast('Ye file padhi nahi ja saki.', 'err'); return; }

      if (!data || !Array.isArray(data.events)) {
        toast('Ye E-Calendar ka backup nahi lagta.', 'err');
        return;
      }
      if (!window.confirm('Backup se ' + data.events.length +
        ' events restore karna hai?\n\nAbhi ka saara data replace ho jaayega.')) return;

      state.events = data.events.map(normaliseEvent);
      state.board = Array.isArray(data.board) ? data.board.map(normaliseBoardItem) : [];
      state.hidden = Array.isArray(data.hidden) ? data.hidden.map(String) : [];

      saveEvents(); saveBoard(); saveHidden();
      toast('Restore ho gaya ✓ ' + state.events.length + ' events. Sabko dikhane ke liye Publish karein.', 'ok');
      renderAll();
      refreshDrawer();
    };

    reader.onerror = function () { toast('File padhi nahi ja saki.', 'err'); };
    reader.readAsText(file);
  }

  /* == 11b · PUBLISH: making one person's changes visible to everyone ======
     GitHub Pages serves data/calendar.json to every visitor, so publishing is
     simply "get this JSON into that file". There is no server and no API token
     in the page — the admin commits it through GitHub, signed in as themselves.
     That is deliberate: a token sitting in a public page would let anyone edit. */

  function buildPublishJSON(name) {
    return JSON.stringify({
      app: 'e-calendar',
      version: 2,
      note: 'Ye calendar ki asli file hai. Sab log ise padhte hain. App ke Publish button se hi badlein.',
      publishedAt: new Date().toISOString(),
      publishedBy: name || '',
      events: state.events,
      board: state.board,
      hidden: state.hidden
    }, null, 2) + '\n';
  }

  /* what exactly is about to change for everybody else */
  function diffSummary() {
    const pub = state.published;
    if (!pub) return null;

    const count = (mineArr, theirsArr, sig) => {
      const mine = new Map(mineArr.map((x) => [x.id, sig(x)]));
      const theirs = new Map(theirsArr.map((x) => [x.id, sig(x)]));
      let added = 0, removed = 0, changed = 0;
      mine.forEach((s, id) => {
        if (!theirs.has(id)) added++;
        else if (theirs.get(id) !== s) changed++;
      });
      theirs.forEach((s, id) => { if (!mine.has(id)) removed++; });
      return { added: added, removed: removed, changed: changed };
    };

    return {
      events: count(state.events, pub.events, evSig),
      board: count(state.board, pub.board, bdSig)
    };
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }

  /* Older browsers, and any case where the Clipboard API is blocked. Uses its
     own off-screen textarea — the visible one sits inside a collapsed <details>
     and cannot be selected while hidden. */
  function fallbackCopy(text) {
    try {
      const ta = el('textarea', {
        readonly: true,
        style: 'position:fixed;top:-2000px;left:0;opacity:0;pointer-events:none'
      });
      ta.value = text;
      document.body.appendChild(ta);
      ta.focus();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand && document.execCommand('copy');
      ta.remove();
      return !!ok;
    } catch (err) {
      return false;
    }
  }

  function openPublishModal() {
    if (!isAdmin()) return;
    lastFocus = document.activeElement;

    if (state.offline) {
      toast('Shared file padhi nahi ja saki, isliye publish karna theek nahi. Internet dekh lein.', 'err');
      return;
    }
    if (!hasUnpublished()) {
      toast('Koi naya badlaav nahi hai — sab already publish hai ✓', 'info');
      return;
    }

    const name = localStorage.getItem(KEYS.pubName) || '';
    $('pubName').value = name;
    $('pubJSON').value = buildPublishJSON(name);

    // summary of what changes for everyone
    const d = diffSummary();
    const box = $('pubSummary');
    box.innerHTML = '';
    [['Events', d.events], ['Board themes', d.board]].forEach(function (row) {
      const parts = [];
      if (row[1].added) parts.push(row[1].added + ' naye');
      if (row[1].changed) parts.push(row[1].changed + ' badle');
      if (row[1].removed) parts.push(row[1].removed + ' hataye');
      if (!parts.length) return;
      box.appendChild(el('div', { class: 'pubrow' },
        el('b', { text: row[0] }),
        el('span', { text: parts.join(' · ') })
      ));
    });
    if (!box.childElementCount) {
      box.appendChild(el('div', { class: 'pubrow' }, el('span', { text: 'Chhote-mote badlaav.' })));
    }

    $('pubConflict').hidden = !state.conflict;
    $('pubEditLink').href = GH.edit;
    $('pubUploadLink').href = GH.upload;

    $('pubScrim').hidden = false;
    $('pubModal').hidden = false;
    document.body.classList.add('is-modal');

    // most people will just want it on the clipboard
    copyText($('pubJSON').value).then(function (ok) {
      $('pubCopyState').textContent = ok
        ? '✓ JSON copy ho gaya — ab step 2'
        : 'Copy nahi hua, neeche box se khud copy kar lein.';
    });

    $('pubCopyBtn').focus();
  }

  function closePublishModal() {
    if ($('pubModal').hidden) return;
    $('pubModal').hidden = true;
    $('pubScrim').hidden = true;
    unlockScroll();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function rememberPubName() {
    const name = $('pubName').value.trim().slice(0, 40);
    try { localStorage.setItem(KEYS.pubName, name); } catch (err) { /* ignore */ }
    $('pubJSON').value = buildPublishJSON(name);
    return name;
  }

  /* Admin says "I have committed it on GitHub". We re-read the live file and
     confirm it really landed, rather than taking their word for it. */
  function verifyPublished() {
    const btn = $('pubVerifyBtn');
    btn.disabled = true;
    btn.textContent = 'Dekh rahe hain…';

    const mine = localSignature();

    return fetchPublished().then(function (pub) {
      btn.disabled = false;
      btn.textContent = '✅ Ho gaya, check karein';

      if (!pub) {
        toast('Live file padhi nahi ja saki. Thodi der baad dobara.', 'err');
        return;
      }

      state.published = pub;

      if (signature(pub.events, pub.board, pub.hidden) === mine) {
        writeJSON(KEYS.baseAt, pub.publishedAt);
        state.conflict = false;
        closePublishModal();
        toast('Publish ho gaya ✓ Ab ye sabko dikhega.', 'ok');
        renderAll();
      } else {
        toast('Abhi live file mein purana data hai. GitHub par commit hone ke baad 1–2 minute lagte hain — dobara check karein.', 'info');
      }
    });
  }

  function discardDraft() {
    if (!state.published) return;
    if (!window.confirm('Aapke bin-publish badlaav hat jaayenge aur live calendar aa jaayegi. Theek hai?')) return;
    adoptPublished();
    toast('Live calendar le li gayi.', 'ok');
    closePublishModal();
    renderAll();
    refreshDrawer();
  }

  /* == 11c · SYNC BAR ===================================================== */

  function fmtStamp(isoStamp) {
    if (!isoStamp) return 'pata nahi';
    const d = new Date(isoStamp);
    if (isNaN(d)) return 'pata nahi';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }

  function renderSyncBar() {
    const bar = $('syncBar');
    if (!bar) return;
    bar.innerHTML = '';
    bar.className = 'syncbar';

    // could not reach the shared file at all
    if (state.offline) {
      bar.classList.add('syncbar--warn');
      bar.appendChild(el('span', { class: 'syncbar__txt' },
        el('b', { text: '⚠️ Offline — ' }),
        'ye aapke browser ka data hai, shared calendar nahi. Internet aane par refresh karein.'
      ));
      bar.hidden = false;
      return;
    }

    const pub = state.published;
    const unpublished = isAdmin() && hasUnpublished();

    if (unpublished) {
      bar.classList.add('syncbar--warn');

      bar.appendChild(el('span', { class: 'syncbar__txt' },
        el('b', { text: state.conflict ? '⚠️ Publish karna baaki hai (dhyan dein) — ' : '📢 Publish karna baaki hai — ' }),
        state.conflict
          ? 'aapke badlaav abhi sirf aapko dikh rahe hain, aur is beech kisi ne nayi calendar publish ki hai.'
          : 'aapke badlaav abhi sirf aapko dikh rahe hain, kisi aur ko nahi.'
      ));

      bar.appendChild(el('div', { class: 'syncbar__act' },
        el('button', {
          class: 'btn btn--primary btn--sm', type: 'button',
          onclick: openPublishModal
        }, '📢 Sabko dikhaayein'),
        el('button', {
          class: 'btn btn--sm', type: 'button',
          title: 'Apne badlaav hata kar live calendar le aayein',
          onclick: discardDraft
        }, 'Hata dein')
      ));

      bar.hidden = false;
      return;
    }

    // everything in sync — show who updated it last, so everyone can see
    bar.classList.add('syncbar--ok');
    bar.appendChild(el('span', { class: 'syncbar__txt' },
      el('b', { text: '✅ Sabko yahi dikh raha hai' }),
      ' · last update ' + fmtStamp(pub && pub.publishedAt) +
        (pub && pub.publishedBy ? ' · ' + pub.publishedBy : '')
    ));

    bar.appendChild(el('div', { class: 'syncbar__act' },
      el('button', {
        class: 'btn btn--sm', type: 'button',
        onclick: function () { checkForUpdates(true); }
      }, '🔄 Refresh')
    ));

    bar.hidden = false;
  }

  function restoreDefaults() {
    if (!isAdmin()) return;
    if (!window.confirm('Saare default (built-in) events wapas laane hain?\n\nAapke khud ke banaye events safe rahenge.')) return;

    state.hidden = [];
    saveHidden();

    const have = new Set(state.events.map((e) => e.id));
    let restored = 0;

    SEED.forEach((s) => {
      if (!have.has(s.id)) { state.events.push(seedEvent(s)); restored++; }
    });

    saveEvents();
    toast(restored
      ? restored + ' default event' + (restored === 1 ? '' : 's') + ' wapas aa gaye ✓'
      : 'Sab default events already maujood hain.', 'ok');
    renderAll();
    refreshDrawer();
  }

  /* -- iCalendar export ------------------------------------------------- */
  const icsEscape = (s) => String(s || '')
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

  /* RFC 5545 caps a line at 75 OCTETS (not characters) and continues it with a
     leading space. Titles here contain em dashes and emoji, so measure bytes
     and never split in the middle of a character. */
  function fold(line) {
    const enc = new TextEncoder();
    if (enc.encode(line).length <= 75) return line;

    const out = [];
    let cur = '';
    let bytes = 0;
    let limit = 75;

    for (const ch of line) {                      // iterates by code point
      const size = enc.encode(ch).length;
      if (bytes + size > limit) {
        out.push(cur);
        cur = ' ' + ch;                           // continuation line
        bytes = 1 + size;
        limit = 74;                               // the space counts too
      } else {
        cur += ch;
        bytes += size;
      }
    }

    if (cur) out.push(cur);
    return out.join('\r\n');
  }

  function exportICS() {
    const dt = (dateISO) => dateISO.replace(/-/g, '');
    const nextDay = (dateISO) => {
      const d = parseISO(dateISO);
      d.setDate(d.getDate() + 1);
      return dt(iso(d));
    };
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//E-Calendar//House and Class Board//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:E-Calendar',
      'X-WR-TIMEZONE:Asia/Kolkata'
    ];

    state.events.forEach((ev) => {
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + ev.id + '@e-calendar');
      lines.push('DTSTAMP:' + dtstamp);
      lines.push(fold('SUMMARY:' + icsEscape((ev.star ? '⭐ ' : '') + ev.title)));

      if (ev.time) {
        const endTime = ev.end || ev.time;
        lines.push('DTSTART:' + dt(ev.date) + 'T' + ev.time.replace(':', '') + '00');
        lines.push('DTEND:' + dt(ev.date) + 'T' + endTime.replace(':', '') + '00');
      } else {
        lines.push('DTSTART;VALUE=DATE:' + dt(ev.date));
        lines.push('DTEND;VALUE=DATE:' + nextDay(ev.date));
      }

      if (ev.annual) lines.push('RRULE:FREQ=YEARLY');
      if (ev.desc) lines.push(fold('DESCRIPTION:' + icsEscape(ev.desc)));
      lines.push('CATEGORIES:' + icsEscape(CATS[ev.cat].label));
      lines.push('TRANSP:TRANSPARENT');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');

    download('e-calendar-' + stamp() + '.ics', lines.join('\r\n'), 'text/calendar');
    toast('.ics file ready — Google Calendar mein import kar lein ✓', 'ok');
  }

  /* == 12 · TOASTS ======================================================== */

  function toast(message, kind) {
    const box = $('toasts');
    if (!box) return;

    const icon = kind === 'err' ? '⚠️' : (kind === 'ok' ? '✅' : 'ℹ️');
    const node = el('div', {
      class: 'toast toast--' + (kind === 'err' ? 'err' : kind === 'ok' ? 'ok' : 'info'),
      role: 'status'
    }, el('b', { text: icon }), el('span', { text: message }));

    box.appendChild(node);

    setTimeout(function () {
      node.classList.add('is-out');
      setTimeout(() => node.remove(), 220);
    }, kind === 'err' ? 5200 : 3200);
  }

  /* == 13 · NAVIGATION & MENU ============================================ */

  function setView(view) {
    state.view = view;
    renderCurrentView();
    renderSidebar();
    renderBoard();
    renderPrintHead();
  }

  function step(dir) {
    state.cursor = state.view === 'year'
      ? new Date(state.cursor.getFullYear() + dir, 0, 1)
      : addMonths(state.cursor, dir);
    renderAll();
  }

  function goToday() {
    state.cursor = startOfDay(new Date());
    renderAll();
    toast('Aaj: ' + fmtFull(new Date()), 'info');
  }

  function openMenu() {
    $('menuPanel').hidden = false;
    $('menuBtn').setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    $('menuPanel').hidden = true;
    $('menuBtn').setAttribute('aria-expanded', 'false');
  }

  function toggleTheme() {
    state.prefs.theme = state.prefs.theme === 'dark' ? 'light' : 'dark';
    savePrefs();
    applyPrefs();
  }

  function setBoard(board) {
    state.prefs.board = board;
    savePrefs();
    applyPrefs();
  }

  function applySearch(raw) {
    const value = String(raw || '').trim().toLowerCase();
    const had = !!state.query;
    state.query = value;

    $('qClear').hidden = !value;

    if (value && !had) {
      state.viewBeforeSearch = state.view;
      state.view = 'agenda';
    } else if (!value && had && state.viewBeforeSearch) {
      state.view = state.viewBeforeSearch;
      state.viewBeforeSearch = null;
    }

    renderCurrentView();
    renderSidebar();
  }

  /* == 14 · WIRING ======================================================== */

  function wire() {
    // ---- lock screen
    $('lockForm').addEventListener('submit', function (e) {
      e.preventDefault();
      attemptLogin('admin');
    });
    $('viewerBtn').addEventListener('click', () => attemptLogin('viewer'));

    $('pwToggle').addEventListener('click', function () {
      const input = $('pw');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      this.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      input.focus();
    });

    // ---- header
    $('themeBtn').addEventListener('click', toggleTheme);

    $$('.board-switch button').forEach((b) => {
      b.addEventListener('click', () => setBoard(b.dataset.board));
    });

    let searchTimer = null;
    $('q').addEventListener('input', function () {
      const value = this.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applySearch(value), 180);
    });

    $('qClear').addEventListener('click', function () {
      $('q').value = '';
      applySearch('');
      $('q').focus();
    });

    $('menuBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      if ($('menuPanel').hidden) openMenu(); else closeMenu();
    });

    document.addEventListener('click', function (e) {
      if ($('menuPanel').hidden) return;
      const t = e.target;
      if (!(t instanceof Element) || !t.closest('.menu')) closeMenu();
    });

    $('menuPanel').addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      closeMenu();

      switch (btn.dataset.act) {
        case 'publish': openPublishModal(); break;
        case 'sync':   checkForUpdates(true); break;
        case 'history': window.open(GH.history, '_blank', 'noopener'); break;
        case 'print':  renderPrintHead(); window.print(); break;
        case 'ics':    exportICS(); break;
        case 'export': exportBackup(); break;
        case 'import': $('importFile').click(); break;
        case 'reset':  restoreDefaults(); break;
        case 'help':   openHelp(); break;
        case 'logout': signOut(); break;
      }
    });

    $('importFile').addEventListener('change', function () {
      if (this.files && this.files[0]) importBackup(this.files[0]);
      this.value = '';
    });

    // ---- toolbar
    $$('.seg button').forEach((b) => {
      b.addEventListener('click', () => setView(b.dataset.view));
    });

    $('prevBtn').addEventListener('click', () => step(-1));
    $('nextBtn').addEventListener('click', () => step(1));
    $('todayBtn').addEventListener('click', goToday);

    $('jump').addEventListener('change', function () {
      if (!/^\d{4}-\d{2}$/.test(this.value)) return;
      const p = this.value.split('-');
      state.cursor = new Date(+p[0], +p[1] - 1, 1);
      if (state.view === 'year') setView('month'); else renderAll();
    });

    $('addBtn').addEventListener('click', () => openEventModal(null, todayISO()));
    $('boardAddBtn').addEventListener('click', () => openBoardModal(null));

    $('chipsReset').addEventListener('click', function () {
      state.cats = new Set(CAT_KEYS);
      renderChips();
      renderCurrentView();
      renderSidebar();
    });

    // ---- drawer
    $('drawerClose').addEventListener('click', closeDrawer);
    $('drawerScrim').addEventListener('click', closeDrawer);
    $('drawerAdd').addEventListener('click', function () {
      openEventModal(null, state.selected || todayISO());
    });

    // ---- event modal
    $('eventForm').addEventListener('submit', function (e) {
      e.preventDefault();
      saveEvent();
    });
    $('evDelete').addEventListener('click', () => deleteEvent(editingId));
    $('eventScrim').addEventListener('click', closeEventModal);
    $$('[data-close-event]').forEach((b) => b.addEventListener('click', closeEventModal));

    // ---- board modal
    $('boardForm').addEventListener('submit', function (e) {
      e.preventDefault();
      saveBoardItem();
    });
    $('bdDelete').addEventListener('click', () => deleteBoardItem(editingBoardId));
    $('boardScrim').addEventListener('click', closeBoardModal);
    $$('[data-close-board]').forEach((b) => b.addEventListener('click', closeBoardModal));

    // ---- publish modal
    $('pubScrim').addEventListener('click', closePublishModal);
    $$('[data-close-pub]').forEach((b) => b.addEventListener('click', closePublishModal));
    $('pubName').addEventListener('input', rememberPubName);
    $('pubCopyBtn').addEventListener('click', function () {
      const name = rememberPubName();
      copyText(buildPublishJSON(name)).then(function (ok) {
        $('pubCopyState').textContent = ok ? '✓ Copy ho gaya' : 'Copy nahi hua — box se khud copy karein';
        toast(ok ? 'JSON copy ho gaya ✓' : 'Copy nahi hua, neeche box se copy karein.', ok ? 'ok' : 'err');
      });
    });
    $('pubDownloadBtn').addEventListener('click', function () {
      download('calendar.json', buildPublishJSON(rememberPubName()), 'application/json');
      toast('calendar.json download ho gayi ✓', 'ok');
    });
    $('pubVerifyBtn').addEventListener('click', verifyPublished);
    $('pubDiscardBtn').addEventListener('click', discardDraft);

    // ---- help modal
    $('helpScrim').addEventListener('click', closeHelp);
    $$('[data-close-help]').forEach((b) => b.addEventListener('click', closeHelp));

    // ---- keyboard
    document.addEventListener('keydown', onKeyDown);
  }

  function openHelp() {
    lastFocus = document.activeElement;
    $('helpScrim').hidden = false;
    $('helpModal').hidden = false;
    document.body.classList.add('is-modal');
    $('helpModal').querySelector('.btn--primary').focus();
  }

  function closeHelp() {
    if ($('helpModal').hidden) return;
    $('helpModal').hidden = true;
    $('helpScrim').hidden = true;
    unlockScroll();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (!$('menuPanel').hidden) return closeMenu();
      if (!$('helpModal').hidden) return closeHelp();
      if (!$('pubModal').hidden) return closePublishModal();
      if (!$('eventModal').hidden) return closeEventModal();
      if (!$('boardModal').hidden) return closeBoardModal();
      if (!$('drawer').hidden) return closeDrawer();
      return;
    }

    if (!state.role) return;                    // locked
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select';

    if (e.key === '/' && !typing) {
      e.preventDefault();
      $('q').focus();
      return;
    }

    // don't hijack keys while a form is open or the user is typing
    if (typing) return;
    if (!$('eventModal').hidden || !$('boardModal').hidden || !$('pubModal').hidden) return;

    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); step(-1); break;
      case 'ArrowRight': e.preventDefault(); step(1); break;
      case 't': case 'T': goToday(); break;
      case 'm': case 'M': setView('month'); break;
      case 'a': case 'A': setView('agenda'); break;
      case 'y': case 'Y': setView('year'); break;
      case 'd': case 'D': toggleTheme(); break;
      case 'p': case 'P': e.preventDefault(); renderPrintHead(); window.print(); break;
      case 'n': case 'N':
        if (isAdmin()) { e.preventDefault(); openEventModal(null, state.selected || todayISO()); }
        break;
    }
  }

  /* == 15 · BOOT ========================================================== */

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !local) return;   // file:// has no SW
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline mode unavailable */ });
    });
  }

  let sharedReady = Promise.resolve();

  function boot() {
    loadLocal();
    applyPrefs();
    wire();

    // start pulling the shared calendar straight away, while the user is still
    // typing the password
    sharedReady = fetchPublished().then(function (pub) {
      state.published = pub;
      state.offline = !pub;
      return pub;
    });

    let saved = null;
    try { saved = sessionStorage.getItem(KEYS.role); } catch (err) { /* ignore */ }

    if (saved === 'admin' || saved === 'viewer') {
      signIn(saved);                            // same tab, already authenticated
    } else {
      document.body.classList.add('is-locked');
      $('pw').focus();
    }

    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
