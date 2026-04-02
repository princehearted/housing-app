// Frontend configuration for API base URL
const getApiBaseUrl = () => {
  // If a global config exists (injected by HTML), use it
  if (typeof window !== 'undefined' && window.API_BASE_URL) {
    return window.API_BASE_URL
  }
  
  // Development: use relative paths (works with same-origin proxy)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return ''
  }
  
  // Production: use Railway backend URL
  return 'https://housing-app-production-0537.up.railway.app'
}

const API_BASE_URL = getApiBaseUrl()

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_BASE_URL, apiCall }
}
