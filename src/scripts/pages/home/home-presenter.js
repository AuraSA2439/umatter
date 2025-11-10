import { postMapper } from '../../data/api-mapper';

export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
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
}