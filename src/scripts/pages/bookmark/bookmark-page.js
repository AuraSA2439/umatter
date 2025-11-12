import {
  generateLoaderAbsoluteTemplate,
  generatePostItemTemplate,
  generatePostsListEmptyTemplate,
  generatePostsListErrorTemplate,
} from '../../templates';
import BookmarkPresenter from './bookmark-presenter';
import Database from '../../data/database';
import Map from '../../utils/map';

export default class BookmarkPage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="posts-list__map__container">
          <div id="map" class="posts-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Post Cerita yang Disukai</h1>

        <div class="posts-list__container">
          <div id="posts-list"></div>
          <div id="posts-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new BookmarkPresenter({
      view: this,
      model: Database,
    });

    await this.#presenter.initialGalleryAndMap();
  }

  populateBookmarkedPosts(message, posts) {
    if (posts.length <= 0) {
      this.populateBookmarkedPostsListEmpty();
      return;
    }

    const html = posts.reduce((accumulator, post) => {
      if (this.#map) {
        const lat = post.lat;
        const lon = post.lon;

        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const coordinate = [lat, lon];
          const markerOptions = { alt: post.title || post.name || post.posterName || '' };
          const popupOptions = { content: post.title || post.description || '' };

          this.#map.addMarker(coordinate, markerOptions, popupOptions);
        } // else: skip adding marker for invalid coords
      }

      // ensure template gets expected props
      const posterName = post.name || post.posterName || 'Unknown';
      const locationObj = post.location || { placeName: null, lat: post.lat, lon: post.lon };

      return accumulator.concat(
        generatePostItemTemplate({
          ...post,
          location: locationObj,
          posterName,
        }),
      );
    }, '');

    document.getElementById('posts-list').innerHTML = `
      <div class="posts-list">${html}</div>
    `;
  }

  populateBookmarkedPostsListEmpty() {
    document.getElementById('posts-list').innerHTML = generatePostsListEmptyTemplate();
  }

  populateBookmarkedPostsError(message) {
    document.getElementById('posts-list').innerHTML = generatePostsListErrorTemplate(message);
  }

  showPostsListLoading() {
    document.getElementById('posts-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hidePostsListLoading() {
    document.getElementById('posts-list-loading-container').innerHTML = '';
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 10,
      locate: true,
    });
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }
}
