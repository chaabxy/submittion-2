import LoginPresenter from './login-presenter';
import * as StoryAPI from '../../../data/api';
import * as AuthModel from '../../../utils/auth';

export default class LoginPage {
  #presenter = null;

  async render() {
    return `
      <section class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1 class="auth-title">Login to Your Account</h1>
          </div>

          <form id="login-form" class="auth-form">
            <div class="form-control">
              <label for="email-input" class="form-label">Email</label>
              <div class="input-group">
                <i class="fas fa-envelope input-icon"></i>
                <input 
                  id="email-input" 
                  type="email" 
                  name="email" 
                  placeholder="example@email.com" 
                  aria-describedby="email-help"
                  required
                >
              </div>
              <div id="email-help" class="form-help">Enter the email address you used to register</div>
            </div>
            
            <div class="form-control">
              <label for="password-input" class="form-label">Password</label>
              <div class="input-group">
                <i class="fas fa-lock input-icon"></i>
                <input 
                  id="password-input" 
                  type="password" 
                  name="password" 
                  placeholder="Enter your password" 
                  aria-describedby="password-help"
                  required
                >
              </div>
              <div id="password-help" class="form-help">Enter your password</div>
            </div>
            
            <div class="form-buttons auth-form-buttons">
              <div id="submit-button-container">
                <button class="btn auth-submit-btn" type="submit" aria-label="Login">Login</button>
              </div>
              <p class="auth-alternate-action">Don't have an account? <a href="#/register">Register</a></p>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({
      view: this,
      model: StoryAPI,
      authModel: AuthModel,
    });

    this.#setupForm();
  }

  #setupForm() {
    document.getElementById('login-form').addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        email: document.getElementById('email-input').value,
        password: document.getElementById('password-input').value,
      };
      await this.#presenter.getLogin(data);
    });
  }

  loginSuccessfully(message) {
    console.log(message);

    location.hash = '/home';
  }

  loginFailed(message) {
    alert(message);
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn auth-submit-btn" type="submit" disabled aria-label="Logging in">
        <i class="fas fa-spinner loader-button"></i> Logging in
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn auth-submit-btn" type="submit" aria-label="Login">Login</button>
    `;
  }
}
