/**
 * This index file links in all other files in this directory.
 */

import { register, unregister } from 'register-service-worker'

// Service worker for caching
// register('./sw.js', {
//     offline() {
//         console.log('No internet connection found. App is running in offline mode.')
//     },
//     error(error) {
//         console.error('Error during service worker registration:', error)
//     }
// })

console.warn("Service worker disabled for development!");
unregister();

window.toggleSidebar = (event) => {
  document.querySelector('body').classList.toggle('showsidebar');
  event.preventDefault();
}
