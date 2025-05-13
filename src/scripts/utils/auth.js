import { getActiveRoute } from '../routes/url-parser';
import { ACCESS_TOKEN_KEY } from '../config';

export function getAccessToken() {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (accessToken === 'null' || accessToken === 'undefined') {
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error('getAccessToken: error:', error);
    return null;
  }
}

export function putAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('putAccessToken: error:', error);
    return false;
  }
}

export function removeAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('getLogout: error:', error);
    return false;
  }
}

const unauthenticatedRoutesOnly = ['/login', '/register'];

export function checkUnauthenticatedRouteOnly(page) {
  const url = getActiveRoute();
  const isLogin = !!getAccessToken();

  if (unauthenticatedRoutesOnly.includes(url) && isLogin) {
    location.hash = '/';
    return null;
  }

  return page;
}

export function checkAuthenticatedRoute(page) {
  const isLogin = !!getAccessToken();

  if (!isLogin) {
    location.hash = '/login';
    return null;
  }

  return page;
}

export function getLogout() {
  removeAccessToken();
}

export function getBookmarkedStories() {
  try {
    const bookmarkedStories = localStorage.getItem('bookmarkedStories');
    return bookmarkedStories ? JSON.parse(bookmarkedStories) : [];
  } catch (error) {
    console.error('getBookmarkedStories: error:', error);
    return [];
  }
}

export function addBookmarkedStory(story) {
  try {
    const bookmarkedStories = getBookmarkedStories();
    if (!bookmarkedStories.some((s) => s.id === story.id)) {
      bookmarkedStories.push(story);
      localStorage.setItem('bookmarkedStories', JSON.stringify(bookmarkedStories));
    }
    return true;
  } catch (error) {
    console.error('addBookmarkedStory: error:', error);
    return false;
  }
}

export function removeBookmarkedStory(storyId) {
  try {
    let bookmarkedStories = getBookmarkedStories();
    bookmarkedStories = bookmarkedStories.filter((story) => story.id !== storyId);
    localStorage.setItem('bookmarkedStories', JSON.stringify(bookmarkedStories));
    return true;
  } catch (error) {
    console.error('removeBookmarkedStory: error:', error);
    return false;
  }
}

export function isStoryBookmarked(storyId) {
  try {
    const bookmarkedStories = getBookmarkedStories();
    return bookmarkedStories.some((story) => story.id === storyId);
  } catch (error) {
    console.error('isStoryBookmarked: error:', error);
    return false;
  }
}
