import { postMapper } from '../../data/api-mapper';

export default class HomePresenter {
  #view;
  #model;
  #dbModel;

  constructor({ view, model, dbModel }) {
    this.#view = view;
    this.#model = model;
    this.#dbModel = dbModel;
  }

  async showPostsListMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showPostsListMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async initialGalleryAndMap() {
    this.#view.showLoading();
    try {
      await this.showPostsListMap();

      const response = await this.#model.getAllPosts();

      if (!response.ok) {
        console.error('initialGalleryAndMap: response:', response);
        this.#view.populatePostsListError(response.message);
        return;
      }
      const mappedStories = await Promise.all(
        (response.listStory || []).map((story) => postMapper(story))
      );
      this.#view.populatePostsList(response.message, { listStory: mappedStories });
    } catch (error) {
      console.error('initialGalleryAndMap: error:', error);
      this.#view.populatePostsListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }

  async savePost(id) {
    try {
      const post = await this.#model.getPostById(id);
      await this.#dbModel.putPost(post.story);

      this.#view.saveToBookmarkSuccessfully('Success to save to bookmark');
    } catch (error) {
      console.error('savePost: error:', error);
      this.#view.saveToBookmarkFailed(error.message);
    }
  }

  async removePost(id) {
    try {
      await this.#dbModel.removePost(id);
      this.#view.removeFromBookmarkSuccessfully('Success to remove from bookmark');
    } catch (error) {
      console.error('removePost: error:', error);
      this.#view.removeFromBookmarkFailed(error.message);
    }
  }

  async showSaveButton(id) {
    const container = document.getElementById(`save-actions-container-${id}`);
    if (!container) return;

    const isSaved = await this.isPostSaved(id);

    if (isSaved) {
      container.innerHTML = `
        <button id="remove-${id}" class="btn btn-transparent" aria-label="Buang postingan">
          <i class="fas fa-heart" aria-hidden="true"></i>
        </button>
      `;
      document
        .getElementById(`remove-${id}`)
        .addEventListener('click', async () => {
          await this.removePost(id);
          await this.showSaveButton(id);
        });
    } else {
      container.innerHTML = `
        <button id="save-${id}" class="btn btn-transparent" aria-label="Simpan postingan">
          <i class="far fa-heart" aria-hidden="true"></i>
        </button>
      `;
      document
        .getElementById(`save-${id}`)
        .addEventListener('click', async () => {
          await this.savePost(id);
          await this.showSaveButton(id);
        });
    }
  }

  async isPostSaved(id) {
    return !!(await this.#dbModel.getPostById(id));
  }
}