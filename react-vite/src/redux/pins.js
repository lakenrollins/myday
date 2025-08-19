import { pinsApi } from '../utils/api';

// Action Types
const SET_PINS = 'pins/SET_PINS';
const ADD_PINS = 'pins/ADD_PINS';
const ADD_PIN = 'pins/ADD_PIN';
const UPDATE_PIN = 'pins/UPDATE_PIN';
const DELETE_PIN = 'pins/DELETE_PIN';
const SET_LOADING = 'pins/SET_LOADING';
const SET_ERROR = 'pins/SET_ERROR';

// Action Creators
export const setPins = (data) => ({
  type: SET_PINS,
  payload: data
});

export const addPins = (data) => ({
  type: ADD_PINS,
  payload: data
});

export const addPin = (pin) => ({
  type: ADD_PIN,
  payload: pin
});

export const updatePin = (pin) => ({
  type: UPDATE_PIN,
  payload: pin
});

export const deletePin = (pinId) => ({
  type: DELETE_PIN,
  payload: pinId
});

export const setLoading = (loading) => ({
  type: SET_LOADING,
  payload: loading
});

export const setError = (error) => ({
  type: SET_ERROR,
  payload: error
});

// Thunks
export const fetchPins = (params = {}) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    const data = await pinsApi.getPins(params);
    
    if (params.page === 1 || !params.page) {
      dispatch(setPins(data));
    } else {
      dispatch(addPins(data));
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching pins:', error);
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createPin = (pinData) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    const newPin = await pinsApi.createPin(pinData);
    dispatch(addPin(newPin));
    
    return newPin;
  } catch (error) {
    dispatch(setError(error.message));
    console.error('Error creating pin:', error);
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const savePin = (pinId, boardId) => async (dispatch) => {
  try {
    const result = await pinsApi.savePin(pinId, boardId);
    
    // Add the saved pin to the store
    if (result.pin) {
      dispatch(addPin(result.pin));
    }
    
    return result;
  } catch (error) {
    console.error('Error saving pin:', error);
    throw error;
  }
};

export const likePin = (pinId) => async (dispatch) => {
  try {
    const result = await pinsApi.likePin(pinId);
    
    // Update the pin's like status in the store
    dispatch(updatePin({
      id: pinId,
      liked: result.liked,
      likes_count: result.likes_count
    }));
    
    return result;
  } catch (error) {
    console.error('Error liking pin:', error);
    throw error;
  }
};

export const searchPins = (query, filters = {}) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    const params = { search: query, ...filters };
    const data = await pinsApi.getPins(params);
    dispatch(setPins(data));
    
    return data;
  } catch (error) {
    dispatch(setError(error.message));
    console.error('Error searching pins:', error);
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Initial State
const initialState = {
  items: [],
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  totalPages: 1,
};

// Reducer
const pinsReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_PINS:
      return {
        ...state,
        items: action.payload.pins || action.payload,
        hasMore: action.payload.has_next !== undefined ? action.payload.has_next : true,
        currentPage: action.payload.page || 1,
        totalPages: action.payload.pages || 1,
      };
      
    case ADD_PINS:
      return {
        ...state,
        items: [...state.items, ...(action.payload.pins || action.payload)],
        hasMore: action.payload.has_next !== undefined ? action.payload.has_next : false,
        currentPage: action.payload.page || state.currentPage + 1,
        totalPages: action.payload.pages || state.totalPages,
      };
      
    case ADD_PIN:
      return {
        ...state,
        items: [action.payload, ...state.items],
      };
      
    case UPDATE_PIN:
      return {
        ...state,
        items: state.items.map(pin =>
          pin.id === action.payload.id ? action.payload : pin
        ),
      };
      
    case DELETE_PIN:
      return {
        ...state,
        items: state.items.filter(pin => pin.id !== action.payload),
      };
      
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
      
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
      
    default:
      return state;
  }
};

export default pinsReducer;