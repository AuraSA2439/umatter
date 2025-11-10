import {
  generateLoaderAbsoluteTemplate,
  generateRemovePostButtonTemplate,
  generatePostDetailErrorTemplate,
  generatePostDetailTemplate,
  generateSavePostButtonTemplate,
} from '../../templates';
import { createCarousel } from '../../utils';
import PostDetailPresenter from './post-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import Map from '../../utils/map';
import * as StorySharingAPI from '../../data/api';
import Database from '../../data/database';

export default class PostDetailPage {
  #presenter = null;
  #form = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="post-detail__container">
          <div id="post-detail" class="post-detail"></div>
          <div id="post-detail-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new PostDetailPresenter(parseActivePathname().id, {
      view: this,
      apiModel: StorySharingAPI,
      dbModel: Database,
    });

    // this.#setupForm();

    this.#presenter.showPostDetail();
    // this.#presenter.getCommentsList();
  }

  async populatePostDetailAndInitialMap(message, post) {
    document.getElementById('post-detail').innerHTML = generatePostDetailTemplate({
      photoUrl: post.photoUrl,
      description: post.description,
      location: post.location || null,
      lat: post.lat,
      lon: post.lon,
      posterName: post.name,
      createdAt: post.createdAt,
    });

    // Carousel images
    createCarousel(document.getElementById('images'));

    // Map
    await this.#presenter.showPostDetailMap();
    if (this.#map) {
      const postCoordinate = [post.lat, post.lon];
      const markerOptions = { alt: post.description };
      const popupOptions = { content: post.description };

      this.#map.changeCamera(postCoordinate);
      this.#map.addMarker(postCoordinate, markerOptions, popupOptions);
    }

    // Actions buttons
    this.#presenter.showSaveButton();
    this.addNotifyMeEventListener();
  }

  populatePostDetailError(message) {
    document.getElementById('post-detail').innerHTML = generatePostDetailErrorTemplate(message);
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 15,
    });
  }

  clearForm() {
    this.#form.reset();
  }

  renderSaveButton() {
    document.getElementById('save-actions-container').innerHTML =
      generateSavePostButtonTemplate();

    const saveButton = document.getElementById('post-detail-save');
    saveButton.addEventListener('click', async () => {
      await this.#presenter.savePost();
      await this.#presenter.showSaveButton();

      saveButton.style.backgroundColor = "red";
    });
  }

  saveToBookmarkSuccessfully(message) {
    console.log(message);
  }

  saveToBookmarkFailed(message) {
    alert(message);
  }

  renderRemoveButton() {
    document.getElementById('save-actions-container').innerHTML =
      generateRemovePostButtonTemplate();

    document.getElementById('post-detail-remove').addEventListener('click', async () => {
      await this.#presenter.removePost();
      await this.#presenter.showSaveButton();
    });
  }

  removeFromBookmarkSuccessfully(message) {
    console.log(message);
  }

  removeFromBookmarkFailed(message) {
    alert(message);
  }

  addNotifyMeEventListener() {
    document.getElementById('post-detail-notify-me').addEventListener('click', () => {
      this.#presenter.notifyMe();
    });
  }

  showPostDetailLoading() {
    document.getElementById('post-detail-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hidePostDetailLoading() {
    document.getElementById('post-detail-loading-container').innerHTML = '';
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Tanggapi
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Tanggapi</button>
    `;
  }
}