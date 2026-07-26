// APIPoints i18n Engine v1.0
// Runtime internationalization for vanilla HTML pages
(function() {
  'use strict';

  const SUPPORTED = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ];

  const COOKIE_NAME = 'ap_lang';
  const COOKIE_DAYS = 365;
  let currentLocale = null;
  let currentStrings = null;

  // --- Cookie helpers ---
  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  function getCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '=([^;]*)');
    return v ? decodeURIComponent(v[2]) : null;
  }

  // --- Language detection ---
  function detectLanguage() {
    // 1. Check cookie first
    const saved = getCookie(COOKIE_NAME);
    if (saved && SUPPORTED.find(s => s.code === saved)) return saved;

    // 2. Check browser language
    const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase().split('-')[0];
    if (SUPPORTED.find(s => s.code === browserLang)) return browserLang;

    // 3. Default to English
    return 'en';
  }

  // --- Load locale file ---
  async function loadLocale(code) {
    if (code === 'en') {
      // English is inline on the page — load from locale file too for consistency
      try {
        const res = await fetch('/locales/en.json');
        if (res.ok) return await res.json();
      } catch(e) {}
      // Fallback: return empty — page text is already English
      return {};
    }
    try {
      const res = await fetch('/locales/' + code + '.json');
      if (res.ok) return await res.json();
    } catch(e) {}
    return null;
  }

  // --- Resolve nested key ---
  function resolve(obj, path) {
    if (!obj) return null;
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return null;
      cur = cur[p];
    }
    return cur;
  }

  // --- Apply translations to DOM ---
  function applyTranslations(strings) {
    if (!strings) return;

    // data-i18n elements — set textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = resolve(strings, key);
      if (val != null) el.textContent = String(val);
    });

    // data-i18n-html elements — set innerHTML
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = resolve(strings, key);
      if (val != null) el.innerHTML = String(val);
    });

    // data-i18n-placeholder elements — set placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = resolve(strings, key);
      if (val != null) el.placeholder = String(val);
    });

    // data-i18n-title elements — set title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = resolve(strings, key);
      if (val != null) el.title = String(val);
    });

    // data-i18n-content elements — set content (for meta tags etc.)
    document.querySelectorAll('[data-i18n-content]').forEach(el => {
      const key = el.getAttribute('data-i18n-content');
      const val = resolve(strings, key);
      if (val != null) el.setAttribute('content', String(val));
    });

    // Update <html lang> and dir
    const lang = strings.meta?.lang || 'en';
    const dir = strings.meta?.dir || 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;

    // RTL support
    if (dir === 'rtl') {
      document.body.classList.add('rtl');
      document.documentElement.style.direction = 'rtl';
    } else {
      document.body.classList.remove('rtl');
      document.documentElement.style.direction = '';
    }

    // Update page title if data-i18n-title is on <title>
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) {
      const key = titleEl.getAttribute('data-i18n');
      const val = resolve(strings, key);
      if (val) titleEl.textContent = String(val);
    }
  }

  // --- Render language switcher ---
  function renderSwitcher() {
    const container = document.getElementById('i18n-switcher');
    if (!container) return;

    const current = SUPPORTED.find(s => s.code === currentLocale) || SUPPORTED[0];

    let html = '<div class="i18n-dropdown" style="position:relative;display:inline-block;">';
    html += '<button class="i18n-trigger" onclick="window.__i18nToggle()" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#ccc;font-size:13px;cursor:pointer;transition:all 0.2s;">';
    html += '<span>' + current.flag + '</span>';
    html += '<span style="font-size:11px;">' + current.name + '</span>';
    html += '<span style="font-size:10px;opacity:0.5;">▼</span>';
    html += '</button>';
    html += '<div class="i18n-menu" id="i18n-menu" style="display:none;position:absolute;top:100%;right:0;margin-top:4px;background:#1a1a1a;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:6px;min-width:160px;z-index:9999;box-shadow:0 12px 32px rgba(0,0,0,0.6);">';

    SUPPORTED.forEach(s => {
      const isActive = s.code === currentLocale;
      html += '<button onclick="window.__i18nSet(\'' + s.code + '\')" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;border:none;border-radius:6px;background:' + (isActive ? 'rgba(163,230,53,0.12)' : 'transparent') + ';color:' + (isActive ? '#a3e635' : '#ccc') + ';font-size:13px;cursor:pointer;text-align:left;transition:background 0.15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.06)\'" onmouseout="this.style.background=\'' + (isActive ? 'rgba(163,230,53,0.12)' : 'transparent') + '\'">';
      html += '<span>' + s.flag + '</span>';
      html += '<span>' + s.name + '</span>';
      if (isActive) html += '<span style="margin-left:auto;color:#a3e635;">✓</span>';
      html += '</button>';
    });

    html += '</div></div>';
    container.innerHTML = html;
  }

  // --- Toggle dropdown ---
  window.__i18nToggle = function() {
    const menu = document.getElementById('i18n-menu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  };

  // --- Close dropdown on outside click ---
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.i18n-dropdown')) {
      const menu = document.getElementById('i18n-menu');
      if (menu) menu.style.display = 'none';
    }
  });

  // --- Set language ---
  window.__i18nSet = async function(code) {
    const strings = await loadLocale(code);
    if (strings === null) {
      console.warn('[i18n] Failed to load locale:', code);
      return;
    }
    currentLocale = code;
    currentStrings = strings;
    setCookie(COOKIE_NAME, code, COOKIE_DAYS);
    applyTranslations(strings);
    renderSwitcher();
    // Close menu
    const menu = document.getElementById('i18n-menu');
    if (menu) menu.style.display = 'none';
  };

  // --- Initialize ---
  window.__i18nInit = async function() {
    currentLocale = detectLanguage();
    if (currentLocale !== 'en') {
      const strings = await loadLocale(currentLocale);
      if (strings) {
        currentStrings = strings;
        applyTranslations(strings);
      }
    }
    renderSwitcher();
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Small delay to let page render first
      setTimeout(window.__i18nInit, 50);
    });
  } else {
    setTimeout(window.__i18nInit, 50);
  }

})();
