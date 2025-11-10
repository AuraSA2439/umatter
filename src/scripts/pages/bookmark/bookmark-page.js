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
        <h1 class="section-title">Daftar Post Cerita Tersimpan</h1>

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
        const coordinate = [post.location.latitude, post.location.longitude];
        const markerOptions = { alt: post.title };
        const popupOptions = { content: post.title };

        this.#map.addMarker(coordinate, markerOptions, popupOptions);
      }

      return accumulator.concat(
        generatePostItemTemplate({
          ...post,
          placeNameLocation: post.location.placeName,
          posterName: post.poster.name,
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
