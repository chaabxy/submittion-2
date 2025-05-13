import { map, tileLayer, marker, popup, icon, latLng, layerGroup, control } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MAP_SERVICE_API_KEY } from '../config';

export default class Map {
  #zoom = 5;
  #map = null;
  #markersLayer = null;
  #clickHandler = null;

  static async getPlaceNameByCoordinate(latitude, longitude) {
    try {
      if (
        latitude === undefined ||
        longitude === undefined ||
        isNaN(latitude) ||
        isNaN(longitude)
      ) {
        return 'Unknown location';
      }

      if (!MAP_SERVICE_API_KEY || MAP_SERVICE_API_KEY === 'YOUR_KEY') {
        return `${latitude}, ${longitude}`;
      }

      const url = new URL(`https://api.maptiler.com/geocoding/${longitude},${latitude}.json`);
      url.searchParams.set('key', MAP_SERVICE_API_KEY);
      url.searchParams.set('language', 'en');
      url.searchParams.set('limit', '1');

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const json = await response.json();

      if (!json.features || json.features.length === 0) {
        return `${latitude}, ${longitude}`;
      }

      const place = json.features[0].place_name.split(', ');
      return [place.at(-2), place.at(-1)].filter(Boolean).join(', ') || `${latitude}, ${longitude}`;
    } catch (error) {
      console.error('getPlaceNameByCoordinate: error:', error);
      return `${latitude}, ${longitude}`;
    }
  }

  createIcon(options = {}) {
    return icon({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      ...options,
    });
  }

  changeCamera(coordinate, zoomLevel = null) {
    if (!this.#map) {
      console.error('Map not initialized');
      return;
    }

    try {
      if (!coordinate || !Array.isArray(coordinate) || coordinate.length !== 2) {
        console.error('Invalid coordinates:', coordinate);
        return;
      }

      const lat = Number.parseFloat(coordinate[0]);
      const lng = Number.parseFloat(coordinate[1]);

      if (isNaN(lat) || isNaN(lng)) {
        console.error('Coordinates are not valid numbers:', coordinate);
        this.#map.setView(latLng([-6.2, 106.816666]), zoomLevel || this.#zoom);
        return;
      }

      if (lat === 0 && lng === 0) {
        console.log('Using default coordinates as fallback');
        this.#map.setView(latLng([-6.2, 106.816666]), zoomLevel || this.#zoom);
        return;
      }

      console.log('Changing camera to:', [lat, lng], 'zoom:', zoomLevel || this.#zoom);

      if (!zoomLevel) {
        this.#map.setView(latLng([lat, lng]), this.#zoom);
        return;
      }

      this.#map.setView(latLng([lat, lng]), zoomLevel);
    } catch (error) {
      console.error('Error changing camera:', error);
      if (this.#map) {
        this.#map.setView(latLng([-6.2, 106.816666]), zoomLevel || this.#zoom);
      }
    }
  }

  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    if (!this.#map || !this.#markersLayer) {
      console.error('Map or markers layer not initialized');
      return null;
    }

    if (typeof markerOptions !== 'object') {
      throw new Error('markerOptions must be an object');
    }

    try {
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        console.error('Invalid coordinates:', coordinates);
        return null;
      }

      const lat = Number.parseFloat(coordinates[0]);
      const lng = Number.parseFloat(coordinates[1]);

      if (isNaN(lat) || isNaN(lng)) {
        console.error('Coordinates are not valid numbers:', coordinates);
        return null;
      }

      if (lat === 0 && lng === 0) {
        console.warn('Skipping marker at 0,0 coordinates');
        return null;
      }

      console.log('Adding marker at coordinates:', [lat, lng]);

      const newMarker = marker([lat, lng], {
        icon: this.createIcon(),
        ...markerOptions,
      });

      if (popupOptions) {
        if (typeof popupOptions !== 'object') {
          throw new Error('popupOptions must be an object');
        }
        if (!('content' in popupOptions)) {
          throw new Error('popupOptions must include `content` property.');
        }
        const newPopup = popup().setContent(popupOptions.content);
        newMarker.bindPopup(newPopup);
        newMarker.openPopup();
      } else {
        const defaultContent = `
          <div class="default-popup">
            <strong>Location</strong>
            <p>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}</p>
          </div>
        `;
        const defaultPopup = popup().setContent(defaultContent);
        newMarker.bindPopup(defaultPopup);
      }

      this.#markersLayer.addLayer(newMarker);
      return newMarker;
    } catch (error) {
      console.error('Error adding marker:', error);
      return null;
    }
  }

  clearMarkers() {
    if (this.#markersLayer) {
      this.#markersLayer.clearLayers();
    }
  }

  addClickEvent(handler) {
    if (!this.#map) {
      console.error('Map not initialized');
      return;
    }

    if (this.#clickHandler) {
      this.#map.off('click', this.#clickHandler);
    }

    this.#clickHandler = handler;
    this.#map.on('click', handler);
  }

  static isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }

  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject('Geolocation API unsupported');
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  static async build(selector, options = {}) {
    try {
      const mapElement = document.querySelector(selector);
      if (!mapElement) {
        console.error(`Map element with selector "${selector}" not found`);
        return null;
      }

      if (typeof map !== 'function') {
        console.error('Leaflet map function not available');
        return null;
      }

      if ('center' in options && options.center) {
        return new Map(selector, options);
      }

      const defaultCoordinate = [-6.2, 106.816666];

      if ('locate' in options && options.locate) {
        try {
          const position = await Map.getCurrentPosition();
          const coordinate = [position.coords.latitude, position.coords.longitude];

          return new Map(selector, {
            ...options,
            center: coordinate,
          });
        } catch (error) {
          console.error('build: error:', error);

          return new Map(selector, {
            ...options,
            center: defaultCoordinate,
          });
        }
      }

      return new Map(selector, {
        ...options,
        center: defaultCoordinate,
      });
    } catch (error) {
      console.error('Error building map:', error);
      return null;
    }
  }

  constructor(selector, options = {}) {
    try {
      this.#zoom = options.zoom ?? this.#zoom;

      const mapElement = document.querySelector(selector);
      if (!mapElement) {
        console.error(`Map element with selector "${selector}" not found`);
        return;
      }

      this.#map = map(mapElement, {
        zoom: this.#zoom,
        scrollWheelZoom: true,
        ...options,
      });

      this.#markersLayer = layerGroup().addTo(this.#map);

      const osmTile = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      }).addTo(this.#map);

      const cartoDBTile = tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        },
      );

      const esriWorldImageryTile = tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        },
      );

      const openTopoMapTile = tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        maxZoom: 17,
      });

      if (MAP_SERVICE_API_KEY && MAP_SERVICE_API_KEY !== 'YOUR_KEY') {
        const watercolorTile = tileLayer(
          'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}',
          {
            attribution:
              'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: 'abcd',
            minZoom: 1,
            maxZoom: 16,
            ext: 'jpg',
          },
        );

        const tonerTile = tileLayer(
          'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}',
          {
            attribution:
              'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: 'abcd',
            minZoom: 0,
            maxZoom: 20,
            ext: 'png',
          },
        );

        const baseMaps = {
          'OpenStreetMap': osmTile,
          'CartoDB Light': cartoDBTile,
          'Satellite': esriWorldImageryTile,
          'Topographic': openTopoMapTile,
          'Watercolor': watercolorTile,
          'Toner': tonerTile,
        };

        control.layers(baseMaps).addTo(this.#map);
      } else {
        const baseMaps = {
          'OpenStreetMap': osmTile,
          'CartoDB Light': cartoDBTile,
          'Satellite': esriWorldImageryTile,
          'Topographic': openTopoMapTile,
        };

        control.layers(baseMaps).addTo(this.#map);
      }

      control.scale({ imperial: false }).addTo(this.#map);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  getCenter() {
    if (!this.#map) {
      console.error('Map not initialized');
      return { latitude: 0, longitude: 0 };
    }

    try {
      const center = this.#map.getCenter();
      return {
        latitude: center.lat,
        longitude: center.lng,
      };
    } catch (error) {
      console.error('Error getting map center:', error);
      return { latitude: 0, longitude: 0 };
    }
  }
}
