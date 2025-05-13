import { getBookmarkedStories } from '../../utils/auth';
import { generateStoryItemTemplate } from '../../templates';

export default class BookmarkPage {
  async render() {
    return `
      <section class="container">
        <div class="bookmark-container">
          <h1 class="section-title">Bookmarked Stories</h1>
          <div id="bookmarked-stories-container" class="bookmark-content">
            <!-- Stories will be loaded here -->
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.loadBookmarkedStories();
  }

  loadBookmarkedStories() {
    const bookmarkedStories = getBookmarkedStories();
    const container = document.getElementById('bookmarked-stories-container');

    if (!bookmarkedStories || bookmarkedStories.length === 0) {
      container.innerHTML = `
        <div class="bookmark-message">
          <i class="fas fa-bookmark bookmark-icon"></i>
          <h2>No Bookmarked Stories</h2>
          <p>You haven't bookmarked any stories yet. Browse stories and click the bookmark button to save them for later.</p>
          <a href="#/home" class="btn">Browse Stories</a>
        </div>
      `;
      return;
    }

    const html = bookmarkedStories.reduce((accumulator, story) => {
      return accumulator.concat(
        generateStoryItemTemplate({
          ...story,
          name: story.name,
        }),
      );
    }, '');

    container.innerHTML = `
      <div class="stories-list">${html}</div>
    `;
  }
}
