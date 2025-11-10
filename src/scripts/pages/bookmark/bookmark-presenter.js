import { postMapper } from '../../data/api-mapper';

export default class BookmarkPresenter {
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
    this.#view.showPostsListLoading();

    try {
      await this.showPostsListMap();

      const listOfPosts = await this.#model.getAllPosts();
      const posts = await Promise.all(listOfPosts.map(postMapper));

      const message = 'Berhasil mendapatkan daftar post tersimpan.';
      this.#view.populateBookmarkedPosts(message, posts);
    } catch (error) {
      console.error('initialGalleryAndMap: error:', error);
      this.#view.populateBookmarkedPostsError(error.message);
    } finally {
      this.#view.hidePostsListLoading();
    }
  }
}