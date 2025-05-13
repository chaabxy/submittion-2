export default class WelcomePage {
  async render() {
    return `
      <section class="welcome-container">
        <div class="welcome-content">
          <div class="welcome-header">
            <h1 class="welcome-title">Welcome to StoryShare</h1>
          </div>
          
          <div class="welcome-description">
            <p>Share your stories with the world. Connect with others through your experiences.</p>
            <div class="zigzag-divider"></div>
          </div>
          
          <div class="welcome-features">
            <div class="feature-item">
              <i class="fas fa-map-marker-alt feature-icon"></i>
              <h3>Location Based</h3>
              <p>Share stories from anywhere in the world</p>
            </div>
            <div class="feature-item">
              <i class="fas fa-camera feature-icon"></i>
              <h3>Photo Sharing</h3>
              <p>Add photos to bring your stories to life</p>
            </div>
            <div class="feature-item">
              <i class="fas fa-comments feature-icon"></i>
              <h3>Community</h3>
              <p>Connect with others through comments</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const elements = document.querySelectorAll(
      '.welcome-header, .welcome-description, .welcome-actions, .feature-item',
    );

    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('fade-in');
      }, 100 * index);
    });
  }
}
