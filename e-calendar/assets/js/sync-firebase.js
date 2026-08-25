/* ==========================================================================
   Firebase sync bridge
   --------------------------------------------------------------------------
   app.js is a plain classic script; the Firebase SDK ships as ES modules. This
   file is the only ES module in the project and its whole job is to expose a
   tiny, boring API on window.ECAL_SYNC that app.js can call:

       ECAL_SYNC.ready              -> Promise<{ok, reason}>
       ECAL_SYNC.signInAdmin(pw)    -> Promise<{ok, reason}>
       ECAL_SYNC.signOutAdmin()     -> Promise
       ECAL_SYNC.subscribe(fn)      -> live calendar, fn(data|null)
       ECAL_SYNC.write(payload)     -> Promise<{ok, reason}>

   Everything is wrapped in try/catch and every failure resolves (never throws)
   with a reason string, because app.js must keep working — falling back to the
   published GitHub file — if Firebase is unreachable, blocked, or misconfigured.
   ========================================================================== */

const SDK = 'https://www.gstatic.com/firebasejs/12.17.1/';
const DOC_PATH = ['calendar', 'main'];

const settings = window.ECAL_FIREBASE || null;

/* one shared "what happened" record, so the UI can explain itself */
const status = {
  ok: false,
  reason: 'starting',
  adminEmail: settings && settings.adminEmail ? String(settings.adminEmail) : '',
  signedIn: false
};

let db = null;
let auth = null;
let docRef = null;
let fs = null;                 // firestore module namespace
let listeners = [];
let lastData = null;
let unsubscribe = null;

function fail(reason) {
  status.ok = false;
  status.reason = reason;
  return { ok: false, reason: reason };
}

function looksConfigured() {
  if (!settings || settings.enabled === false) return 'not-configured';
  const c = settings.config;
  if (!c || !c.apiKey || !c.projectId) return 'not-configured';
  if (/^(YOUR|PASTE|xxx)/i.test(c.apiKey)) return 'not-configured';
  if (!settings.adminEmail || settings.adminEmail.indexOf('@') < 0) return 'no-admin-email';
  return null;
}

async function start() {
  const bad = looksConfigured();
  if (bad) return fail(bad);

  let appMod, authMod, fsMod;
  try {
    [appMod, authMod, fsMod] = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js')
    ]);
  } catch (err) {
    // no internet, CDN blocked, or an ad-blocker ate it
    return fail('sdk-load-failed');
  }

  try {
    const app = appMod.initializeApp(settings.config);
    fs = fsMod;
    db = fsMod.getFirestore(app);
    auth = authMod.getAuth(app);
    docRef = fsMod.doc(db, DOC_PATH[0], DOC_PATH[1]);

    /* Session-only sign-in: closing the tab signs the admin out, which matches
       how the lock screen already behaves and is kinder on shared devices. */
    try {
      await authMod.setPersistence(auth, authMod.browserSessionPersistence);
    } catch (err) { /* not fatal, fall back to the default */ }

    authMod.onAuthStateChanged(auth, function (user) {
      status.signedIn = !!(user && user.email);
      status.signedInEmail = user && user.email ? user.email : '';
    });

    status.authMod = authMod;
    status.ok = true;
    status.reason = 'ok';
    return { ok: true, reason: 'ok' };
  } catch (err) {
    return fail('init-failed:' + (err && err.code ? err.code : 'unknown'));
  }
}

const ready = start();

/* ---- live reads ---------------------------------------------------------- */

function emit(data) {
  lastData = data;
  listeners.forEach(function (fn) {
    try { fn(data); } catch (err) { /* a broken listener must not kill sync */ }
  });
}

function attach() {
  if (unsubscribe || !docRef) return;

  unsubscribe = fs.onSnapshot(docRef,
    function (snap) {
      emit(snap && snap.exists() ? snap.data() : null);
    },
    function (err) {
      // permission-denied here means the read rule is wrong
      status.readError = err && err.code ? err.code : 'unknown';
      emit(lastData);
    }
  );
}

/* ---- the API app.js talks to --------------------------------------------- */

window.ECAL_SYNC = {
  ready: ready,
  status: status,

  isReady: function () { return status.ok === true; },

  subscribe: function (fn) {
    if (typeof fn !== 'function') return;
    listeners.push(fn);
    if (lastData !== null) { try { fn(lastData); } catch (err) { /* ignore */ } }
    attach();
  },

  /* Password goes straight to Google and is verified there. It is never stored
     in this project and never compared against anything in the page. */
  signInAdmin: async function (password) {
    const r = await ready;
    if (!r.ok) return fail(r.reason);

    try {
      await status.authMod.signInWithEmailAndPassword(auth, status.adminEmail, String(password));
      status.signedIn = true;
      return { ok: true, reason: 'ok' };
    } catch (err) {
      const code = err && err.code ? String(err.code) : 'unknown';
      let reason = 'auth-failed';
      if (code.indexOf('wrong-password') > -1 ||
          code.indexOf('invalid-credential') > -1 ||
          code.indexOf('invalid-login') > -1) reason = 'wrong-password';
      else if (code.indexOf('user-not-found') > -1) reason = 'no-such-user';
      else if (code.indexOf('too-many-requests') > -1) reason = 'too-many-tries';
      else if (code.indexOf('network') > -1) reason = 'no-network';
      else if (code.indexOf('api-key') > -1 ||
               code.indexOf('invalid-api-key') > -1) reason = 'bad-api-key';
      else if (code.indexOf('operation-not-allowed') > -1) reason = 'email-login-off';
      status.lastAuthError = code;
      return { ok: false, reason: reason, code: code };
    }
  },

  signOutAdmin: async function () {
    try {
      if (auth && status.authMod) await status.authMod.signOut(auth);
    } catch (err) { /* ignore */ }
    status.signedIn = false;
  },

  /* Save the whole calendar. One document, so a save is atomic — no chance of
     events landing without their board themes. ~15 KB against a 1 MB limit. */
  write: async function (payload) {
    const r = await ready;
    if (!r.ok) return fail(r.reason);
    if (!status.signedIn) return { ok: false, reason: 'not-signed-in' };

    try {
      await fs.setDoc(docRef, payload);
      return { ok: true, reason: 'ok' };
    } catch (err) {
      const code = err && err.code ? String(err.code) : 'unknown';
      let reason = 'write-failed';
      if (code.indexOf('permission-denied') > -1) reason = 'not-allowed';
      else if (code.indexOf('unavailable') > -1) reason = 'no-network';
      status.lastWriteError = code;
      return { ok: false, reason: reason, code: code };
    }
  }
};

/* app.js may already be waiting */
ready.then(function () {
  window.dispatchEvent(new CustomEvent('ecal-sync-ready', { detail: { ok: status.ok, reason: status.reason } }));
});
