// API utility functions for Pinterest clone

const BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:8000/api'
);

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new ApiError(
      data.message || 'Something went wrong',
      response.status,
      data
    );
  }
  
  return data;
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  // Get CSRF token from localStorage
  const csrfToken = window.localStorage.getItem("X-CSRFToken");
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error('API Request failed:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, { message: error.message });
  }
};

// Auth API
export const authApi = {
  getCurrentUser: () => apiRequest('/auth/me'),
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  }),
  signup: (userData) => apiRequest('/auth/signup', {
    method: 'POST',
    body: userData,
  }),
  logout: () => apiRequest('/auth/logout', { method: 'DELETE' }),
};

// Pins API
export const pinsApi = {
  getPins: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/pins?${searchParams}`);
  },
  getPin: (id) => apiRequest(`/pins/${id}`),
  createPin: (pinData) => apiRequest('/pins', {
    method: 'POST',
    body: pinData,
  }),
  updatePin: (id, pinData) => apiRequest(`/pins/${id}`, {
    method: 'PUT',
    body: pinData,
  }),
  deletePin: (id) => apiRequest(`/pins/${id}`, { method: 'DELETE' }),
  likePin: (id) => apiRequest(`/pins/${id}/like`, { method: 'POST' }),
  savePin: (id, boardId) => apiRequest(`/pins/${id}/save`, {
    method: 'POST',
    body: { board_id: boardId },
  }),
  getUserPins: (userId, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/pins/user/${userId}?${searchParams}`);
  },
  getLikedPins: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/pins/liked?${searchParams}`);
  },
  getUserLikedPins: (userId, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/pins/user/${userId}/liked?${searchParams}`);
  },
  // TODO: Implement related pins endpoint in backend
  getRelatedPins: () => {
    // const searchParams = new URLSearchParams(params);
    // return apiRequest(`/pins/${id}/related?${searchParams}`);
    return Promise.resolve([]); // Return empty array for now
  },
};

// Boards API
export const boardsApi = {
  getUserBoards: () => apiRequest('/boards'),
  getBoard: (id) => apiRequest(`/boards/${id}`),
  createBoard: (boardData) => apiRequest('/boards', {
    method: 'POST',
    body: boardData,
  }),
  updateBoard: (id, boardData) => apiRequest(`/boards/${id}`, {
    method: 'PUT',
    body: boardData,
  }),
  deleteBoard: (id) => apiRequest(`/boards/${id}`, { method: 'DELETE' }),
  getBoardPins: (id, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/boards/${id}/pins?${searchParams}`);
  },
  followBoard: (id) => apiRequest(`/boards/${id}/follow`, { method: 'POST' }),
  getUserBoardsPublic: (userId) => apiRequest(`/boards/user/${userId}`),
  getFollowedBoards: () => apiRequest('/boards/following'),
};

// Users API
export const usersApi = {
  getUsers: () => apiRequest('/users'),
  getUser: (id) => apiRequest(`/users/${id}`),
  updateUser: (id, userData) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: userData,
  }),
  followUser: (id) => apiRequest(`/users/${id}/follow`, { method: 'POST' }),
  unfollowUser: (id) => apiRequest(`/users/${id}/follow`, { method: 'POST' }),
  getFollowStatus: (id) => apiRequest(`/users/${id}/follow-status`),
  getUserFollowers: (id, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/users/${id}/followers?${searchParams}`);
  },
  getUserFollowing: (id, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/users/${id}/following?${searchParams}`);
  },
  searchUsers: (query, params = {}) => {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return apiRequest(`/users/search?${searchParams}`);
  },
  getUserPins: (id, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/users/${id}/pins?${searchParams}`);
  },
  getUserBoards: (id) => apiRequest(`/users/${id}/boards`),
  getUserFeed: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/users/feed?${searchParams}`);
  },
};

// Comments API
export const commentsApi = {
  getPinComments: (pinId) => apiRequest(`/comments/pin/${pinId}`),
  createComment: (commentData) => apiRequest('/comments', {
    method: 'POST',
    body: commentData,
  }),
  updateComment: (id, commentData) => apiRequest(`/comments/${id}`, {
    method: 'PUT',
    body: commentData,
  }),
  deleteComment: (id) => apiRequest(`/comments/${id}`, { method: 'DELETE' }),
};

export { ApiError };