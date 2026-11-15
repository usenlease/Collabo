// Cloud Collabo authentication integration.
// Set window.CLOUD_COLLABO_CLERK_PUBLISHABLE_KEY in clerk-config.js (public key only).
// Do NOT place Clerk secret keys in any browser file.
const key = window.CLOUD_COLLABO_CLERK_PUBLISHABLE_KEY;
const status = document.getElementById('clerk-auth-status');
const signButton = document.getElementById('sign');
const userButton = document.getElementById('clerk-user-button');
const modal = document.getElementById('clerk-modal');
const form = document.getElementById('clerk-auth-form');
document.getElementById('clerk-close').onclick = () => { modal.hidden = true; form.replaceChildren(); };
modal.addEventListener('click', (event) => { if (event.target === modal) { modal.hidden = true; form.replaceChildren(); } });
const notify = (message) => { status.textContent = message; status.hidden = !message; };
let clerk = null;
window.openCloudCollaboSignIn = () => {
  if (!clerk) { notify('Secure registration is being configured. Please check back shortly.'); return; }
  if (clerk.user) { location.hash = 'post'; return; }
  form.replaceChildren();
  modal.hidden = false;
  clerk.mountSignIn(form, { routing: 'virtual', signUpUrl: undefined });
};
if (!key || !/^pk_(test|live)_/.test(key)) {
  notify('Secure sign-in is being configured. The public demonstration remains available.');
} else {
  try {
    // Clerk publishable keys encode the frontend API domain as base64 after the prefix.
    const encoded = key.split('_').slice(2).join('_');
    const decoded = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const host = decoded.replace(/\$$/, '');
    if (!/^[a-z0-9.-]+$/i.test(host) || !host.includes('.')) throw new Error('Invalid Clerk frontend domain');
    const script = document.createElement('script');
    script.crossOrigin = 'anonymous';
    script.dataset.clerkPublishableKey = key;
    script.src = 'https://' + host + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
    script.onload = async () => {
      try {
        clerk = window.Clerk;
        if (!clerk) throw new Error('Clerk failed to load');
        await clerk.load();
        const render = () => {
          if (clerk.user) {
            signButton.textContent = 'My Collabos';
            clerk.mountUserButton(userButton, { afterSignOutUrl: '/' });
          } else {
            signButton.textContent = 'Sign in';
            userButton.replaceChildren();
          }
        };
        clerk.addListener(render);
        render();
        notify('');
      } catch (error) {
        console.error('Clerk initialization failed', error);
        notify('Secure sign-in is temporarily unavailable.');
      }
    };
    script.onerror = () => notify('Unable to load secure sign-in. Please try again later.');
    document.head.append(script);
  } catch (error) {
    console.error('Clerk configuration error', error);
    notify('Secure sign-in is not configured correctly.');
  }
}
