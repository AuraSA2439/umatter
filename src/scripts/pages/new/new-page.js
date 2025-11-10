import NewPresenter from './new-presenter';
import { convertBase64ToBlob } from '../../utils';
import * as StorySharingAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';
import Map from '../../utils/map';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenDocumentations = [];
  #map = null;

  async render() {
    return `
      <section aria-labelledby="new-post-heading">
        <div class="new-post__header">
          <div class="container">
            <h1 id="new-post-heading" class="new-post__header__title">Buat Post Baru</h1>
            <p class="new-post__header__description" id="new-post-desc">
              Ayo post cerita baru yang kamu miliki!<br>
            </p>
          </div>
        </div>
      </section>
  
      <section class="container" aria-describedby="new-post-desc">
        <div class="new-form__container">
          <form id="new-form" class="new-form" aria-label="Formulir Post Baru">

            <!-- FOTO / GAMBAR -->
            <fieldset class="form-control">
              <legend id="documentations-label" class="new-form__documentations__title">Foto / Gambar</legend>

              <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <label for="documentations-input" class="btn btn-outline">Ambil Gambar</label>
                  
                  <input
                    id="documentations-input"
                    name="documentations"
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    aria-labelledby="documentations-label"
                  >

                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button" aria-controls="camera-container">
                    Buka Kamera
                  </button>
                </div>

                <div id="camera-container" class="new-form__camera__container" aria-live="polite">
                  <video id="camera-video" class="new-form__camera__video" aria-label="Pratinjau kamera">
                    Video stream not available.
                  </video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas" aria-hidden="true"></canvas>

                  <div class="new-form__camera__tools">
                    <label for="camera-select">Pilih Kamera</label>
                    <select id="camera-select"></select>
                    <div class="new-form__camera__tools_buttons">
                      <button id="camera-take-button" class="btn" type="button">
                        Ambil Gambar
                      </button>
                    </div>
                  </div>
                </div>

                <ul id="documentations-taken-list" class="new-form__documentations__outputs" aria-live="polite"></ul>
              </div>
            </fieldset>

            <!-- DESKRIPSI -->
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Deskripsi</label>
              <div class="new-form__description__container">
                <textarea
                  id="description-input"
                  name="description"
                  placeholder="Tambahkan caption untuk foto mu atau ceritakan apa yang terjadi..."
                  aria-describedby="description-info"
                ></textarea>
                <small id="description-info">Deskripsikan foto atau ceritamu dengan jelas.</small>
              </div>
            </div>

            <!-- LOKASI -->
            <fieldset class="form-control">
              <legend id="location-label" class="new-form__location__title">Lokasi</legend>
              <p id="location-more-info">Bagikan tempat yang relevan dari cerita kamu...</p>
  
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map" role="application" aria-label="Peta lokasi"></div>
                  <div id="map-loading-container" aria-live="assertive"></div>
                </div>

                <div class="new-form__location__lat-lng">
                  <label for="lat-input">Latitude</label>
                  <input id="lat-input" type="text" name="lat" value="-6.175389" disabled aria-labelledby="location-label">
                  
                  <label for="lon-input">Longitude</label>
                  <input id="lon-input" type="text" name="lon" value="106.827139" disabled aria-labelledby="location-label">
                </div>
              </div>
            </fieldset>

            <!-- TOMBOL -->
            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Buat Laporan</button>
              </span>
              <a class="btn btn-outline" href="#/" aria-label="Batalkan pembuatan post dan kembali ke halaman utama">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({
      view: this,
      model: StorySharingAPI,
    });
    this.#takenDocumentations = [];

    this.#presenter.showNewFormMap();
    this.#setupForm();
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        description: this.#form.elements.namedItem('description').value,
        photo: this.#takenDocumentations[0]?.blob,
        lat: parseFloat(this.#form.elements.namedItem('lat').value),
        lon: parseFloat(this.#form.elements.namedItem('lon').value),
      };
      await this.#presenter.postNewStory(data);
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const insertingPicturesPromises = Object.values(event.target.files).map(async (file) => {
        return await this.#addTakenPicture(file);
      });
      await Promise.all(insertingPicturesPromises);

      await this.#populateTakenPictures();
    });

    document.getElementById('documentations-input').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations-input').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document
      .getElementById('open-documentations-camera-button')
      .addEventListener('click', async (event) => {
        cameraContainer.classList.toggle('open');
        this.#isCameraOpen = cameraContainer.classList.contains('open');

        if (this.#isCameraOpen) {
          event.currentTarget.textContent = 'Tutup Kamera';
          this.#setupCamera();
          await this.#camera.launch();

          return;
        }

        event.currentTarget.textContent = 'Buka Kamera';
        this.#camera.stop();
      });
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 15,
      locate: true,
    });

    const centerCoordinate = this.#map.getCenter();
    const draggableMarker = this.#map.addMarker(
      [centerCoordinate.latitude, centerCoordinate.longitude],
      { draggable: 'true' },
    );
    draggableMarker.addEventListener('move', (event) => {
      const coordinate = event.target.getLatLng();
      this.#updateLatLngInput(coordinate.lat, coordinate.lng);
    });
    this.#map.addMapEventListener('click', (event) => {
      draggableMarker.setLatLng(event.latlng);
      event.sourceTarget.flyTo(event.latlng);
    });
  }

  #updateLatLngInput(lat, lon) {
    const latInput = this.#form?.elements.namedItem('lat');
    const lonInput = this.#form?.elements.namedItem('lon');
    if (!latInput || !lonInput) return;
    
    latInput.value = lat.toFixed(6);
    lonInput.value = lon.toFixed(6);
  }

  #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const image = await this.#camera.takePicture();
      await this.#addTakenPicture(image);
      await this.#populateTakenPictures();
    });
  }

  async #addTakenPicture(image) {
    let blob = image;
    if (typeof image === 'string') {
      blob = await convertBase64ToBlob(image, 'image/png');
    }

    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob,
    };
    this.#takenDocumentations = [...this.#takenDocumentations, newDocumentation];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations.reduce((accumulator, picture, currentIndex) => {
      const imageUrl = URL.createObjectURL(picture.blob);
      return accumulator.concat(`
        <li class="new-form__documentations__outputs-item">
          <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn" aria-label="Hapus dokumentasi ke-${currentIndex + 1}">
            <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}">
          </button>
        </li>
      `);
    }, '');

    document.getElementById('documentations-taken-list').innerHTML = html;

    document.querySelectorAll('button[data-deletepictureid]').forEach((button) =>
      button.addEventListener('click', (event) => {
        const pictureId = event.currentTarget.dataset.deletepictureid;
        const deleted = this.#removePicture(pictureId);
        if (!deleted) console.log(`Picture with id ${pictureId} was not found`);
        this.#populateTakenPictures();
      }),
    );
  }

  #removePicture(id) {
    const selectedPicture = this.#takenDocumentations.find((p) => p.id == id);
    if (!selectedPicture) return null;
    this.#takenDocumentations = this.#takenDocumentations.filter((p) => p.id != selectedPicture.id);
    return selectedPicture;
  }

  storeSuccessfully(message) {
    console.log(message);
    this.clearForm();
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
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
        <i class="fas fa-spinner loader-button" aria-hidden="true"></i> Buat Post
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Buat Post</button>
    `;
  }
}