import '../styles/base.css';
import '../styles/buttons.css';
import '../styles/forms.css';
import '../styles/header.css';
import '../styles/footer.css';
import '../styles/home.css';
import '../styles/story-item.css';
import '../styles/story-detail.css';
import '../styles/new-story.css';
import '../styles/maps.css';
import '../styles/auth.css';
import '../styles/bookmart.css';
import '../styles/loader.css';
import '../styles/welcome.css';
import '../styles/notification.css';
import '../styles/responsive.css';
import 'tiny-slider/dist/tiny-slider.css';
import 'leaflet/dist/leaflet.css';
import App from './pages/app';
import { registerServiceWorker } from './utils';
import Camera from './utils/camera';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.getElementById('main-content'),
    drawerButton: document.getElementById('drawer-button'),
    drawerNavigation: document.getElementById('navigation-drawer'),
  });
  await app.renderPage();

  await registerServiceWorker();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();

    // Stop all active media
    Camera.stopAllStreams();
  });
});
