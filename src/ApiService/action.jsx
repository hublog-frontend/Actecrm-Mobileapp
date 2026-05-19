import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RootNavigation from './RootNavigation';

// Replace with your actual API URL. Since React Native doesn't use import.meta.env by default,
// you might want to use a constant or a library like react-native-config.
const BASE_URL = 'https://switch-smirk-doozy.ngrok-free.dev';
// const BASE_URL = 'https://actecrm.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async config => {
    try {
      let AccessToken = await AsyncStorage.getItem('AccessToken');
      if (AccessToken) {
        // Clean up quotes if they were accidentally stored via JSON.stringify
        if (AccessToken.startsWith('"') && AccessToken.endsWith('"')) {
          AccessToken = AccessToken.slice(1, -1);
        }
        config.headers.Authorization = `Bearer ${AccessToken}`;
      }
    } catch (e) {
      console.error('Error fetching token', e);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token expiration (401 errors)
api.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    if (error.response) {
      // If token is expired or invalid
      if (error.response.status === 401 || error.response.status === 403) {
        console.log('Session expired, navigating to login...');
        await AsyncStorage.removeItem('AccessToken'); // Clear the expired token
        RootNavigation.navigate('Login'); // Use our RootNavigation helper
      }
    }
    return Promise.reject(error);
  },
);

// Example Login API
export const LoginApi = async payload => {
  try {
    const response = await api.post('/api/login', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// Lead APIs
export const getLeads = async payload => {
  try {
    const response = await api.post('/api/getLeads', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const leadPayment = async payload => {
  try {
    const response = await api.post('/api/createPayment', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const assignLead = async payload => {
  try {
    const response = await api.put('/api/assignLead', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getLeadFollowUps = async payload => {
  try {
    const response = await api.post('/api/getLeadFollowUps', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateFollowUp = async payload => {
  try {
    const response = await api.put('/api/updateFollowUp', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllDownlineUsers = async user_id => {
  try {
    const response = await api.get(`/api/getAllDownlines?user_id=${user_id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getUserDownline = async user_id => {
  try {
    const response = await api.get(`/api/getUsersDownline?user_id=${user_id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getUserPermissions = async payload => {
  try {
    const response = await api.post('/api/getUserPermissions', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// Lead Source (Lead Type) API
export const getLeadType = async payload => {
  try {
    const response = await api.get('/api/getLeadType', { params: payload });
    return response;
  } catch (error) {
    throw error;
  }
};

// Technologies (Course) APIs
export const createTechnology = async payload => {
  try {
    const response = await api.post('/api/addTechnologies', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getTechnologies = async payload => {
  try {
    const response = await api.post(
      '/api/getTechnologies',
      payload ? payload : {},
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// Region APIs
export const getRegions = async payload => {
  try {
    const response = await api.get('/api/getRegion', { params: payload });
    return response;
  } catch (error) {
    throw error;
  }
};

// Branch APIs
export const getBranches = async payload => {
  try {
    const response = await api.get('/api/getBranches', { params: payload });
    return response;
  } catch (error) {
    throw error;
  }
};

// Area APIs
export const getAreas = async payload => {
  try {
    const response = await api.post('/api/getAreas', payload ? payload : {});
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllAreas = async payload => {
  try {
    const response = await api.get('/api/getAreas', { params: payload });
    return response;
  } catch (error) {
    throw error;
  }
};

export const createArea = async payload => {
  try {
    const response = await api.post('/api/insertArea', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

//Lead Status
export const getLeadStatus = async payload => {
  try {
    const response = await api.get('/api/getStatus', { params: payload });
    return response;
  } catch (error) {
    throw error;
  }
};

// Lead addition/mutation APIs
export const createLead = async payload => {
  try {
    const response = await api.post('/api/insertLead', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateLead = async payload => {
  try {
    const response = await api.put('/api/updateLead', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

//global search
export const globalFilter = async value => {
  try {
    const response = await api.get(`/api/globalFilter?filter=${value}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export default api;
