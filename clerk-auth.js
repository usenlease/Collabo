/* Cloud Collabo: Clerk development sign-in integration.
   This uses the selected independent Cloud Collabo Clerk application.
   Production requires a Clerk production publishable key and approved domain.
   No secret keys belong in browser code. */
(function () {
  const publishableKey = 'pk_test_dGFsZW50ZWQtbWF5Zmx5LTIxNzYuY2xlcmsuYWNjb3VudHMuZGV2JA';
  const signButton = document.getElementById('sign');
  let clerk;
  let loading = true;
  let pendingOpen = false;
  window.cloudCollaboIsSignedIn = function () { return Boolean(clerk && clerk.user); };
  function notice(message) {
    let el = document.getElementById('clerk-auth-notice');
    if (!el) {
      el = document.createElement('div');
      el.id = 'clerk-auth-notice';
      el.setAttribute('role', 'status');
      el.style.cssText = 'padding:12px 5%;background:#fff3d6;color:#754900;text-align:center';
      document.querySelector('header').after(el);
    }
    el.textContent = message;
  }
  window.cloudCollaboSignIn = async function () {
    try {
      if (!clerk) { pendingOpen = true; notice(loading ? 'Loading secure sign-in. Please wait a moment.' : 'Sign-in is unavailable. Please refresh and try again.'); return; }
      if (clerk.user) { await clerk.openUserProfile(); return; }
      await clerk.openSignIn();
    } catch (error) {
      console.error('Cloud Collabo sign-in error:', error);
      notice('Sign-in failed to open: ' + (error?.message || 'Clerk authentication error'));
    }
  };
  async function start() {
    try {
      const host = atob(publishableKey.slice(8)).replace(/\$$/, '');
      const script = document.createElement('script');
      script.crossOrigin = 'anonymous';
      script.dataset.clerkPublishableKey = publishableKey;
      script.src = 'https://' + host + '/npm/@clerk/clerk-js@6/dist/clerk.browser.js';
      script.onload = async function () {
        try {
          clerk = window.Clerk;
          if (!clerk) throw new Error('Clerk SDK did not initialize');
          await clerk.load({ loadUi: true });
          loading = false;
          if (pendingOpen) { pendingOpen = false; await window.cloudCollaboSignIn(); }
          function update() {
            if (clerk.user && window.cloudCollaboPendingPage) {
              const page = window.cloudCollaboPendingPage;
              window.cloudCollaboPendingPage = null;
              location.hash = page;
            }
            if (clerk.user) {
              signButton.textContent = 'My account';
              signButton.onclick = function (event) { event.preventDefault(); clerk.openUserProfile(); };
            } else {
              signButton.textContent = 'Sign in';
              if (location.hash && location.hash !== '#home') { location.hash = 'home'; }
            }
          }
          update();
          clerk.addListener(update);
          // Sign-up is available within Clerk's hosted sign-in modal.
        } catch (error) {
          loading = false;
          console.error('Clerk initialization failed:', error);
          notice('Clerk initialization failed: ' + (error?.message || 'Unknown error'));
        }
      };
      script.onerror = function () { loading = false; notice('Clerk sign-in script failed to load. Check the Clerk publishable key and permitted domains.'); };
      document.head.appendChild(script);
    } catch (error) { loading = false; notice('Secure registration configuration is unavailable.'); }
  }
  start();
})();
