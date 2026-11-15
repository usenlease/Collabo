/* Cloud Collabo: Clerk development sign-in integration.
   This uses the selected independent Cloud Collabo Clerk application.
   Production requires a Clerk production publishable key and approved domain.
   No secret keys belong in browser code. */
(function () {
  const publishableKey = 'pk_test_dGFsZW50ZWQtbWF5Zmx5LTIxNzYuY2xlcmsuYWNjb3VudHMuZGV2JA';
  const signButton = document.getElementById('sign');
  let clerk;
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
    if (!clerk) { notice('Registration is initializing. Please try again shortly.'); return; }
    if (clerk.user) { clerk.openUserProfile(); return; }
    clerk.openSignIn({ afterSignInUrl: window.location.origin + '/#home' });
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
          await clerk.load();
          function update() {
            if (clerk.user) {
              signButton.textContent = 'My account';
              signButton.onclick = function (event) { event.preventDefault(); clerk.openUserProfile(); };
            } else {
              signButton.textContent = 'Sign in';
            }
          }
          update();
          clerk.addListener(update);
          // Sign-up is available within Clerk's hosted sign-in modal.
        } catch (error) {
          notice('Secure registration is temporarily unavailable. Please try again later.');
        }
      };
      script.onerror = function () { notice('Secure registration could not load. Please try again later.'); };
      document.head.appendChild(script);
    } catch (error) { notice('Secure registration configuration is unavailable.'); }
  }
  start();
})();
