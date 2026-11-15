/* Cloud Collabo production authentication. Publishable key is public; secret keys stay server-side. */
(function () {
  'use strict';
  const key = 'pk_live_Y2xlcmsuY2xvdWRjb2xsYWJvLmNvbSQ';
  const button = document.getElementById('sign');
  const frontend = atob(key.substring(key.indexOf('_', 3) + 1)).replace(/\$$/, '');
  let clerk = null, loading = true, pending = false;
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
  function refresh() {
    if (!button) return;
    if (clerk.user) {
      button.textContent = 'My account';
      button.onclick = e => { e.preventDefault(); window.cloudCollaboSignIn(); };
      if (window.cloudCollaboPendingPage) {
        const page = window.cloudCollaboPendingPage;
        window.cloudCollaboPendingPage = null;
        location.hash = page;
      }
    } else {
      button.textContent = 'Sign in';
      button.onclick = e => { e.preventDefault(); window.cloudCollaboSignIn(); };
      if (location.hash && location.hash !== '#home') location.hash = 'home';
    }
  }
  async function initialize() {
    try {
      if (!window.Clerk) throw new Error('Clerk script did not expose window.Clerk');
      clerk = window.Clerk;
      await clerk.load();
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
  function loadScript(src, fallback) {
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.dataset.clerkPublishableKey = key;
    s.src = src;
    s.onload = initialize;
    s.onerror = () => {
      s.remove();
      if (fallback) loadScript(fallback, null);
      else { loading = false; failure('script loading', new Error('Clerk JavaScript could not load from ' + frontend + ' or the CDN')); }
    };
    document.head.appendChild(s);
  }
  loadScript('https://' + frontend + '/npm/@clerk/clerk-js@6/dist/clerk.browser.js',
             'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@6/dist/clerk.browser.js');
})();
