/* Cloud Collabo production authentication. Publishable key is public; secret keys stay server-side. */
(function () {
  'use strict';
  const productionKey = 'pk_live_Y2xlcmsuY2xvdWRjb2xsYWJvLmNvbSQ';
  const developmentKey = 'pk_test_c3BsZW5kaWQtZ29ibGluLTk2OTUuY2xlcmsuYWNjb3VudHMuZGV2JA';
  // Production credentials only on the approved production host.
  const key = location.hostname === 'cloudcollabo.com' || location.hostname === 'www.cloudcollabo.com' ? productionKey : developmentKey;
  const button = document.getElementById('sign');
  const frontend = atob(key.substring(key.indexOf('_', 3) + 1)).replace(/\$$/, '');
  let clerk = null, loading = true, pending = false;
  let initialized = false;
  function notice(message) {
    let el = document.getElementById('clerk-auth-notice');
    if (!el) {
      el = document.createElement('div');
      el.id = 'clerk-auth-notice';
      el.setAttribute('role', 'alert');
      el.style.cssText = 'padding:14px 5%;background:#fff3d6;color:#754900;text-align:center;white-space:pre-wrap';
      document.querySelector('header')?.after(el);
    }
    el.textContent = message;
  }
  function failure(stage, error) {
    const detail = error && (error.message || error.errors?.map(e => e.longMessage || e.message).join('; ') || String(error));
    console.error('Cloud Collabo Clerk ' + stage, error);
    notice('Sign-in setup error (' + stage + '): ' + (detail || 'Unknown error') + '. Check Clerk production domain DNS and allowed origins.');
  }
  window.cloudCollaboIsSignedIn = () => !!clerk?.user;
  window.cloudCollaboGetToken = async () => clerk?.session ? await clerk.session.getToken() : null;
  window.cloudCollaboGetToken = async () => clerk?.session ? clerk.session.getToken() : null;
  window.cloudCollaboSignIn = async () => {
    if (!clerk) {
      if (loading) { pending = true; notice('Connecting to secure sign-in…'); }
      else notice('Sign-in is unavailable. Please check the error above or refresh after Clerk DNS verification.');
      return;
    }
    try {
      if (clerk.user) await clerk.openUserProfile();
      else await clerk.openSignIn({ afterSignInUrl: window.location.origin + '/', afterSignUpUrl: window.location.origin + '/' });
    } catch (error) { failure('opening window', error); }
  };
  window.cloudCollaboSignOut = async () => {
    if (!clerk?.user) return;
    try {
      await clerk.signOut();
      window.cloudCollaboPendingPage = null;
      if (location.hash && location.hash !== '#home') location.hash = 'home';
      refresh();
    } catch (error) { failure('signing out', error); }
  };
  let lastUserId = undefined;
  function refresh() {
    const userId = clerk?.user?.id || null;
    if (userId !== lastUserId) {
      lastUserId = userId;
      window.dispatchEvent(new Event('cloudcollabo-auth-changed'));
    }
    if (!button) return;
    window.dispatchEvent(new Event('cloudcollabo-auth-changed'));
    if (clerk.user) {
      button.textContent = 'My account';
      let logout = document.getElementById('sign-out');
      if (!logout) {
        logout = document.createElement('button');
        logout.id = 'sign-out';
        logout.type = 'button';
        logout.textContent = 'Sign out';
        logout.setAttribute('aria-label', 'Sign out of Cloud Collabo');
        button.insertAdjacentElement('afterend', logout);
      }
      logout.hidden = false;
      logout.onclick = e => { e.preventDefault(); window.cloudCollaboSignOut(); };
      button.onclick = e => { e.preventDefault(); window.cloudCollaboSignIn(); };
      if (window.cloudCollaboPendingPage) {
        const page = window.cloudCollaboPendingPage;
        window.cloudCollaboPendingPage = null;
        location.hash = page;
      }
    } else {
      button.textContent = 'Sign in';
      const logout = document.getElementById('sign-out');
      if (logout) logout.hidden = true;
      button.onclick = e => { e.preventDefault(); window.cloudCollaboSignIn(); };
      if (location.hash && location.hash !== '#home') location.hash = 'home';
    }
  }
  async function initialize() {
    if (initialized) return;
    initialized = true;
    try {
      if (!window.Clerk) throw new Error('Clerk script did not expose window.Clerk');
      clerk = window.Clerk;
      // Load the full browser bundle, including Clerk's sign-in/profile UI.
      await clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
      if (typeof clerk.openSignIn !== 'function') {
        throw new Error('Clerk UI components are unavailable; check the browser bundle');
      }
      document.getElementById('clerk-auth-notice')?.remove();
      loading = false;
      refresh();
      clerk.addListener(refresh);
      if (pending) { pending = false; await window.cloudCollaboSignIn(); }
    } catch (error) {
      clerk = null;
      loading = false;
      failure('initialization', error);
    }
  }
  function loadScript(src, onload) {
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.dataset.clerkPublishableKey = key;
    s.src = src;
    s.onload = onload;
    s.onerror = () => {
      s.remove();
      loading = false;
      failure('script loading', new Error('Clerk SDK or UI bundle could not load from ' + frontend));
    };
    document.head.appendChild(s);
  }
  // Clerk Core 3 requires the separate UI bundle before the ClerkJS browser SDK.
  // Load both from the verified production Frontend API (see Clerk JS quickstart).
  loadScript('https://' + frontend + '/npm/@clerk/ui@1/dist/ui.browser.js', () => {
    loadScript('https://' + frontend + '/npm/@clerk/clerk-js@6/dist/clerk.browser.js', initialize);
  });
})();
