import { postMapper } from '../../data/api-mapper';

export default class PostDetailPresenter {
  #id;
  #view;
  #apiModel;
  #dbModel;

  constructor(id, { view, apiModel, dbModel }) {
    this.#id = id;
    this.#view = view;
    this.#apiModel = apiModel;
    this.#dbModel = dbModel;
  }

  async showPostDetailMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showPostDetailMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async showPostDetail() {
    this.#view.showPostDetailLoading();
    try {
      const response = await this.#apiModel.getPostById(this.#id);

      if (!response.ok) {
        console.error('showPostDetail: response:', response);
        this.#view.populatePostDetailError(response.message);
        return;
      }

      const post = await postMapper(response.data);
      // console.log(post); // for debugging purpose, remove after checking it

      this.#view.populatePostDetailAndInitialMap(response.message, post);
    } catch (error) {
      console.error('showPostDetail: error:', error);
      this.#view.populatePostDetailError(error.message);
    } finally {
      this.#view.hidePostDetailLoading();
    }
  }

  async notifyMe() {
    try {
      const response = await this.#apiModel.sendReportToMeViaNotification(this.#id);
      if (!response.ok) {
        console.error('notifyMe: response:', response);
        return;
      }
      console.log('notifyMe:', response.message);
    } catch (error) {
      console.error('notifyMe: error:', error);
    }
  }

  async savePost() {
    try {
      const post = await this.#apiModel.getPostById(this.#id);
      await this.#dbModel.putPost(post.data);

      this.#view.saveToBookmarkSuccessfully('Success to save to bookmark');
    } catch (error) {
      console.error('savePost: error:', error);
      this.#view.saveToBookmarkFailed(error.message);
    }
  }

  async removePost() {
    try {
      await this.#dbModel.removePost(this.#id);

      this.#view.removeFromBookmarkSuccessfully('Success to remove from bookmark');
    } catch (error) {
      console.error('removePost: error:', error);
      this.#view.removeFromBookmarkFailed(error.message);
    }
  }

  async showSaveButton() {
    if (await this.#isPostSaved()) {
      this.#view.renderRemoveButton();
      return;
    }

    this.#view.renderSaveButton();
  }

  async #isPostSaved() {
    return !!(await this.#dbModel.getPostById(this.#id));
  }
}
