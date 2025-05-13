import {
  generateStoryDetailErrorTemplate,
  generateStoryDetailTemplate,
  generateSaveStoryButtonTemplate,
  generateRemoveStoryButtonTemplate,
  generateLoaderAbsoluteTemplate,
} from '../../templates';
import StoryDetailPresenter from './story-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import Map from '../../utils/map';
import * as StoryAPI from '../../data/api';

export default class StoryDetailPage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section class="story-detail-container">
        <div class="container">
          <a href="#/home" class="back-button" aria-label="Back to stories list">
            <i class="fas fa-arrow-left"></i> Back to Stories
          </a>
        </div>
        <div id="story-detail" class="story-detail"></div>
        <div id="story-detail-loading-container" class="story-detail-loading"></div>
      </section>
    `;
  }

  async afterRender() {
    const storyId = parseActivePathname().id;

    if (!storyId) {
      this.populateStoryDetailError('Story ID not found');
      return;
    }

    this.#presenter = new StoryDetailPresenter(storyId, {
      view: this,
      apiModel: StoryAPI,
    });

    this.#presenter.showStoryDetail();
  }

  async populateStoryDetailAndInitialMap(message, story) {
    try {
      if (!story) {
        throw new Error('Story data is missing');
      }

      const location = story.location || { lat: 0, lon: 0, placeName: 'Unknown location' };

      const lat = location.lat !== undefined ? location.lat : 0;
      const lon = location.lon !== undefined ? location.lon : 0;

      document.getElementById('story-detail').innerHTML = generateStoryDetailTemplate({
        name: story.name || 'Unknown',
        description: story.description || 'No description available',
        photoUrl: story.photoUrl,
        location: {
          ...location,
          lat,
          lon,
        },
        createdAt: story.createdAt || new Date().toISOString(),
      });

      await this.initialMap();

      if (this.#map) {
        const storyCoordinate = [lat, lon];

        if ((lat !== 0 || lon !== 0) && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
          const markerOptions = { alt: `${story.name}'s story location` };
          const popupOptions = { content: `${story.name}'s story was shared from here` };

          this.#map.changeCamera(storyCoordinate, 15);
          this.#map.addMarker(storyCoordinate, markerOptions, popupOptions);
        } else {
          console.warn('Story has invalid coordinates:', { lat, lon }, 'using default map view');
        }
      } else {
        console.error('Map not initialized');
      }

      this.#presenter.showSaveButton();
      this.addShareEventListener();
    } catch (error) {
      console.error('Error populating story detail:', error);
      this.populateStoryDetailError('Error displaying story details. Please try again.');
    }
  }

  populateStoryDetailError(message) {
    document.getElementById('story-detail').innerHTML = generateStoryDetailErrorTemplate(message);
  }

  async initialMap() {
    try {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Map element not found');
        return;
      }

      mapElement.style.backgroundColor = '#f0f0f0';

      this.#map = await Map.build('#map', {
        zoom: 15,
      });

      if (!this.#map) {
        console.error('Failed to create map instance');
        mapElement.innerHTML = `
          <div class="map-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Unable to load map. Please check your internet connection.</p>
          </div>
        `;
      } else {
        console.log('Map initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      const mapElement = document.getElementById('map');
      if (mapElement) {
        mapElement.innerHTML = `
          <div class="map-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Unable to load map. Please check your internet connection.</p>
          </div>
        `;
      }
    }
  }

  renderSaveButton() {
    const saveContainer = document.getElementById('save-actions-container');
    if (saveContainer) {
      saveContainer.innerHTML = generateSaveStoryButtonTemplate();

      document.getElementById('story-detail-save')?.addEventListener('click', async () => {
        const storyId = parseActivePathname().id;
        const response = await this.#presenter.toggleBookmark({
          id: storyId,
          name: document.querySelector('.story-detail-title').textContent,
          description: document.querySelector('.story-detail__description').textContent,
          photoUrl: document.querySelector('.story-detail__image').src,
          createdAt: new Date().toISOString(),
          location: {
            lat: document
              .querySelector('.story-detail__location-coordinates')
              .textContent.split('Latitude: ')[1]
              .split('\n')[0],
            lon: document
              .querySelector('.story-detail__location-coordinates')
              .textContent.split('Longitude: ')[1],
          },
        });

        if (response) {
          alert('Story bookmarked successfully!');
        }
      });
    }
  }

  renderRemoveButton() {
    const saveContainer = document.getElementById('save-actions-container');
    if (saveContainer) {
      saveContainer.innerHTML = generateRemoveStoryButtonTemplate();

      document.getElementById('story-detail-remove')?.addEventListener('click', async () => {
        const response = await this.#presenter.toggleBookmark();
        if (!response) {
          alert('Story removed from bookmarks!');
        }
      });
    }
  }

  addShareEventListener() {
    const shareButton = document.getElementById('story-detail-share');
    if (shareButton) {
      shareButton.addEventListener('click', () => {
        if (navigator.share) {
          navigator
            .share({
              title: 'Check out this story on StoryShare',
              text: 'I found an interesting story on StoryShare!',
              url: window.location.href,
            })
            .catch((error) => console.log('Error sharing:', error));
        } else {
          alert('Sharing is not supported in your browser. Copy the URL to share manually.');
        }
      });
    }
  }

  showStoryDetailLoading() {
    const loadingContainer = document.getElementById('story-detail-loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideStoryDetailLoading() {
    const loadingContainer = document.getElementById('story-detail-loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = '';
    }
  }

  showMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
      mapLoadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
      mapLoadingContainer.innerHTML = '';
    }
  }
}
