/* ================================================================
   CyberCA Intelligence Platform — app.js
   Core: Google Auth · Apps Script API · Storage · Voice · Utils
   ================================================================
   SETUP REQUIRED — replace the three values in CONFIG below
   after completing the deployment steps in the guide.
   ================================================================ */

'use strict';

/* ── Configuration ─────────────────────────────────────────────── */
const CONFIG = {
  GOOGLE_CLIENT_ID : 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  APPS_SCRIPT_URL  : 'YOUR_APPS_SCRIPT_WEB_APP_URL',
  ADMIN_EMAIL      : 'YOUR_ADMIN_GMAIL@gmail.com',
  APP_BASE_URL     : 'https://YOUR_GITHUB_USERNAME.github.io/cyberca-platform',
  APP_NAME         : 'CyberCA Intelligence'
};

/* ── Shared state ──────────────────────────────────────────────── */
const State = {
  user    : null,
  isAdmin : false,
  surveys : []
};

/* ================================================================
   GOOGLE AUTHENTICATION
   Uses Google Identity Services — works on GitHub Pages (static)
   ================================================================ */
const Auth = {

  /* Called once per page after the GSI script loads */
  init () {
    if (typeof google === 'undefined') return;
    google.accounts.id.initialize({
      client_id   : CONFIG.GOOGLE_CLIENT_ID,
      callback    : Auth._handleCredential,
      auto_select : false
    });
  },

  /* Render the official Google button into a container div */
  renderButton (containerId) {
    if (typeof google === 'undefined') return;
    const el = document.getElementById(containerId);
    if (!el) return;
    google.accounts.id.renderButton(el, {
      theme          : 'outline',
      size           : 'large',
      width          : Math.min(el.offsetWidth || 320, 400),
      logo_alignment : 'center'
    });
  },

  /* JWT callback — fires after successful Google sign-in */
  _handleCredential (response) {
    const p = Auth._parseJwt(response.credential);
    State.user = {
      email    : p.email,
      name     : p.name,
      picture  : p.picture,
      initials : p.name.split(' ').slice(0,2).map(w => w[0].toUpperCase()).join('')
    };
    State.isAdmin = (p.email === CONFIG.ADMIN_EMAIL);
    Storage.set('cyberca_user', State.user);
    if (typeof Auth.onSignIn === 'function') Auth.onSignIn(State.user, State.isAdmin);
  },

  /* Override per-page to react after sign-in completes */
  onSignIn : null,

  /* Restore a previous session from localStorage */
  restoreSession () {
    const saved = Storage.get('cyberca_user');
    if (saved && saved.email) {
      State.user    = saved;
      State.isAdmin = (saved.email === CONFIG.ADMIN_EMAIL);
      return true;
    }
    return false;
  },

  /* Sign the user out and return to landing page */
  signOut () {
    if (typeof google !== 'undefined') google.accounts.id.disableAutoSelect();
    Storage.remove('cyberca_user');
    State.user = null; State.isAdmin = false;
    window.location.href = 'index.html';
  },

  /* Decode a Google JWT without a library */
  _parseJwt (token) {
    const b64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(decodeURIComponent(
      atob(b64).split('').map(c => '%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
  }
};

/* ================================================================
   APPS SCRIPT API
   All requests go to your deployed Google Apps Script web app.
   While CONFIG.APPS_SCRIPT_URL is not set, calls return demo data.
   ================================================================ */
const API = {

  _configured () { return CONFIG.APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL'; },

  async get (action, params = {}) {
    if (!this._configured()) return this._demo(action, params);
    const url = new URL(CONFIG.APPS_SCRIPT_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const res  = await fetch(url.toString());
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'API error');
    return data;
  },

  async post (action, body = {}) {
    if (!this._configured()) return this._demo(action, body);
    const res  = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method  : 'POST',
      headers : { 'Content-Type' : 'text/plain' },
      body    : JSON.stringify({ action, ...body })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'API error');
    return data;
  },

  /* Demo responses used when Apps Script is not yet configured */
  _demo (action) {
    const surveys = Storage.get('cyberca_surveys') || BUILT_IN_SURVEYS_LIST;
    if (action === 'getSurveys')      return { success:true, surveys };
    if (action === 'getResponses')    return { success:true, responses: [] };
    if (action === 'submitResponse')  return { success:true, message: 'Saved locally (demo mode)' };
    if (action === 'createSurvey')    return { success:true };
    if (action === 'updateSurvey')    return { success:true };
    if (action === 'deleteSurvey')    return { success:true };
    return { success:true };
  },

  getSurveys      : ()       => API.get('getSurveys'),
  getResponses    : (id)     => API.get('getResponses',  { surveyId: id }),
  submitResponse  : (data)   => API.post('submitResponse',  data),
  createSurvey    : (data)   => API.post('createSurvey',    data),
  updateSurvey    : (data)   => API.post('updateSurvey',    data),
  deleteSurvey    : (id)     => API.post('deleteSurvey',    { surveyId: id })
};

/* ================================================================
   LOCAL STORAGE HELPERS
   ================================================================ */
const Storage = {
  set    (key, val)  { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){} },
  get    (key)       { try { return JSON.parse(localStorage.getItem(key)); } catch(e){ return null; } },
  remove (key)       { try { localStorage.removeItem(key); } catch(e){} },

  saveDraft  (sid, uid, answers) { Storage.set(`draft_${sid}_${uid}`, { answers, ts: Date.now() }); },
  loadDraft  (sid, uid)          { return Storage.get(`draft_${sid}_${uid}`); },
  clearDraft (sid, uid)          { Storage.remove(`draft_${sid}_${uid}`); },

  saveResponses (sid, uid, responses) { Storage.set(`resp_${sid}_${uid}`, responses); },
  loadResponses (sid, uid)            { return Storage.get(`resp_${sid}_${uid}`) || []; }
};

/* ================================================================
   SURVEY LINK UTILITIES
   ================================================================ */
const Links = {
  forSurvey (surveyId) {
    return `${CONFIG.APP_BASE_URL}/survey.html?id=${surveyId}`;
  },
  async copy (text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const el = Object.assign(document.createElement('textarea'),
        { value: text, style: 'position:fixed;opacity:0' });
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    }
  },
  whatsappHref (link, title) {
    return `https://wa.me/?text=${encodeURIComponent(`Please fill in this strategic survey — ${title}:\n${link}`)}`;
  },
  generateId () {
    return Array.from({ length: 8 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join('');
  }
};

/* ================================================================
   TOAST NOTIFICATIONS
   ================================================================ */
const Toast = {
  _wrap : null,
  _ensure () {
    if (!this._wrap) {
      this._wrap = Object.assign(document.createElement('div'), { id: 'toast-wrap' });
      document.body.appendChild(this._wrap);
    }
  },
  show (msg, type = '', dur = 3500) {
    this._ensure();
    const icons = { success:'✓', warning:'⚠', error:'✕', '':'ℹ' };
    const t = Object.assign(document.createElement('div'), { className: `toast ${type}` });
    t.innerHTML = `<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
    this._wrap.appendChild(t);
    setTimeout(() => { t.style.animation='toastOut 0.3s ease forwards'; setTimeout(()=>t.remove(), 300); }, dur);
  },
  success : msg => Toast.show(msg, 'success'),
  warning : msg => Toast.show(msg, 'warning'),
  error   : msg => Toast.show(msg, 'error'),
  info    : msg => Toast.show(msg, '')
};

/* ================================================================
   UI HELPERS
   ================================================================ */
const UI = {
  show   (id) { document.getElementById(id)?.classList.remove('hidden'); },
  hide   (id) { document.getElementById(id)?.classList.add('hidden'); },
  toggle (id) { document.getElementById(id)?.classList.toggle('hidden'); },

  updateNavUser (user) {
    const av = document.getElementById('nav-avatar');
    if (!av) return;
    av.innerHTML = user.picture
      ? `<img src="${user.picture}" alt="${user.name}">`
      : user.initials;
    const nm = document.getElementById('nav-user-name');
    if (nm) nm.textContent = user.name.split(' ')[0];
  },

  setLoading (btn, on, label = 'Saving…') {
    if (!btn) return;
    if (on) { btn._orig = btn.innerHTML; btn.disabled = true;  btn.innerHTML = `<span class="spinner"></span> ${label}`; }
    else    { btn.innerHTML = btn._orig || 'Submit'; btn.disabled = false; }
  },

  formatDate (ts) {
    return new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  },

  formatINR (n) {
    const num = parseFloat(String(n).replace(/[^0-9.]/g,'')) || 0;
    return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(num);
  },

  esc (str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; },

  getParam (name) { return new URLSearchParams(window.location.search).get(name); },

  statusBadge (status) {
    const cls = { active:'badge-success', archived:'badge-gray', draft:'badge-warning' };
    return `<span class="badge ${cls[status]||'badge-gray'}">${status}</span>`;
  }
};

/* ================================================================
   VOICE-TO-TEXT ENGINE  (Web Speech API — Chrome / Edge / mobile)
   ================================================================ */
const Voice = {
  _rec       : null,
  _activeInput : null,
  _activeBtn   : null,

  supported () { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },

  _init () {
    if (this._rec) return true;
    if (!this.supported()) return false;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this._rec = new SR();
    Object.assign(this._rec, { continuous: true, interimResults: true, lang: 'en-IN' });

    this._rec.onresult = e => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      if (this._activeInput) { this._activeInput.value = t; this._activeInput.dispatchEvent(new Event('input')); }
    };
    this._rec.onerror = e => {
      this._stop();
      Toast.warning(e.error === 'not-allowed'
        ? 'Microphone access denied — check browser settings.'
        : 'Voice recognition error. Please try again.');
    };
    this._rec.onend = () => {
      if (this._activeBtn) this._activeBtn.classList.remove('active');
      this._activeBtn = null; this._activeInput = null;
    };
    return true;
  },

  _stop () {
    try { this._rec?.stop(); } catch(e) {}
  },

  /* Attach voice toggle to a specific input/textarea + button */
  attach (inputEl, btnEl) {
    if (!btnEl || !inputEl) return;
    btnEl.title = 'Click to speak';
    btnEl.innerHTML = '🎤';
    btnEl.addEventListener('click', e => {
      e.preventDefault();
      if (!this._init()) { Toast.warning('Voice not supported in this browser. Use Chrome or Edge.'); return; }
      if (this._activeBtn === btnEl) {
        this._stop();
      } else {
        if (this._activeBtn) this._stop();
        this._activeInput = inputEl;
        this._activeBtn   = btnEl;
        btnEl.classList.add('active');
        Toast.info('Listening… speak now');
        this._rec.start();
      }
    });
  }
};

/* ================================================================
   SHARED NAV INIT  (called from each page)
   ================================================================ */
function initNav () {
  document.getElementById('sign-out-btn')?.addEventListener('click', Auth.signOut);
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });
  const page = location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

/* Auto-start Toast container */
document.addEventListener('DOMContentLoaded', () => Toast._ensure());
