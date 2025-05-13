import { getAccessToken } from '../utils/auth';
import { BASE_URL } from '../config';

const ENDPOINTS = {
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  MY_USER_INFO: `${BASE_URL}/users/me`,
  STORIES_LIST: `${BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${BASE_URL}/stories/${id}`,
  STORE_NEW_STORY: `${BASE_URL}/stories`,
  STORY_COMMENTS_LIST: (storyId) => `${BASE_URL}/stories/${storyId}/comments`,
  STORE_NEW_STORY_COMMENT: (storyId) => `${BASE_URL}/stories/${storyId}/comments`,
};

export async function getRegistered({ name, email, password }) {
  const data = JSON.stringify({ name, email, password });

  const fetchResponse = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getLogin({ email, password }) {
  const data = JSON.stringify({ email, password });

  const fetchResponse = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getMyUserInfo() {
  const accessToken = getAccessToken();

  const fetchResponse = await fetch(ENDPOINTS.MY_USER_INFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getAllStories() {
  const accessToken = getAccessToken();

  const fetchResponse = await fetch(`${ENDPOINTS.STORIES_LIST}?location=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await fetchResponse.json();

  if (json.listStory && Array.isArray(json.listStory)) {
    json.listStory = json.listStory.map((story) => {
      if (!story.location && (story.lat !== undefined || story.lon !== undefined)) {
        story.location = {
          lat: story.lat,
          lon: story.lon,
        };
      } else if (!story.location) {
        story.location = { lat: 0, lon: 0 };
      }
      return story;
    });
  }

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getStoryById(id) {
  const accessToken = getAccessToken();

  try {
    const fetchResponse = await fetch(ENDPOINTS.STORY_DETAIL(id), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!fetchResponse.ok) {
      return {
        ok: false,
        message: `API error: ${fetchResponse.status} ${fetchResponse.statusText}`,
      };
    }

    const json = await fetchResponse.json();

    if (json.story) {
      if (!json.story.location && (json.story.lat !== undefined || json.story.lon !== undefined)) {
        json.story.location = {
          lat: json.story.lat,
          lon: json.story.lon,
        };
      }
    }

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    return {
      ok: false,
      message: error.message || 'Error fetching story details',
    };
  }
}

export async function storeNewStory({ description, photo, lat, lon }) {
  const accessToken = getAccessToken();

  const formData = new FormData();
  formData.set('description', description);
  formData.set('lat', lat);
  formData.set('lon', lon);
  formData.append('photo', photo);

  const fetchResponse = await fetch(ENDPOINTS.STORE_NEW_STORY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getAllCommentsByStoryId(storyId) {
  const accessToken = getAccessToken();

  const fetchResponse = await fetch(ENDPOINTS.STORY_COMMENTS_LIST(storyId), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function storeNewCommentByStoryId(storyId, { body }) {
  const accessToken = getAccessToken();
  const data = JSON.stringify({ body });

  const fetchResponse = await fetch(ENDPOINTS.STORE_NEW_STORY_COMMENT(storyId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

async function storyMapper(story) {
  const { storyMapper } = await import('./api-mapper.js');
  return storyMapper(story);
}

export { storyMapper };
