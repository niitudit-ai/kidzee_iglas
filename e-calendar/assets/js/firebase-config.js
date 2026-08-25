/* ==========================================================================
   FIREBASE SETTINGS — sirf yahi file badalni padti hai
   ==========================================================================

   Ye values Firebase console se aati hain:
     Settings (⚙️) → Project settings → Your apps → SDK setup and configuration
                   → "Config" chuniye

   Inhe public rakhna theek hai. Ye har website mein dikhti hain aur inse koi
   aapka data badal nahi sakta. Asli taala do jagah hai:
     1. Firestore Rules  — likhne ki ijaazat sirf adminEmail wale ko
     2. Aapka password   — Google ke server par check hota hai, is page mein nahi

   ⚠️ Kuch kaam na kare to sabse pehle in 6 lines ko console ki values se
      milaayein — ek akshar ka farak bhi kaafi hai (chhote-bade akshar bhi).

   Firebase hata kar purane tareeke par jaana ho to niche `enabled` ko
   false kar dein — calendar chalti rahegi, bas Publish wapas aa jaayega.
   ========================================================================== */

window.ECAL_FIREBASE = {
  enabled: true,

  /* Jis email ko calendar badalne ki ijaazat hai.
     Ye Firestore Rules mein likhe email se BILKUL same hona chahiye. */
  adminEmail: 'nextudit@gmail.com',

  config: {
    apiKey: 'AIzaSyAgErMgYM_ik8bpPZjNsK8ZwytonncERjA',
    authDomain: 'kidzee-calendar.firebaseapp.com',
    projectId: 'kidzee-calendar',
    storageBucket: 'kidzee-calendar.firebasestorage.app',
    messagingSenderId: '1083482692916',
    appId: '1:1083482692916:web:66685833b0cfb04e5a9961'
  }
};
