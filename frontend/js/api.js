const getBaseUrl = () => {
  const { hostname, protocol, port } = window.location;
  
  // Default to port 3000 (our backend server)
  const DEFAULT_PORT = '3000';
  
  // If we're on a standard local setup (localhost/127.0.0.1)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const apiPort = (port === '3000' || port === '5000') ? port : DEFAULT_PORT;
    return `${protocol}//${hostname}:${apiPort}/api`;
  }
  
  // If we're accessing via file protocol (direct .html open)
  if (protocol === 'file:') {
    return `http://localhost:${DEFAULT_PORT}/api`;
  }
  
  // If we're on a local network (e.g. 192.168.x.x)
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return `${protocol}//${hostname}:${port || DEFAULT_PORT}/api`;
  }

  // Production or other cases - use Railway backend
  return 'https://housing-app-production-0537.up.railway.app/api';
};

const API_BASE_URL = getBaseUrl();

const API = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  clearToken: () => localStorage.removeItem('token'),
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('user'),

  request: async (endpoint, options = {}) => {
    const token = API.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // Auth Methods
  auth: {
    login: async (email, password) => {
      const data = await API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) API.setToken(data.token);
      if (data.user) API.setUser(data.user);
      return data;
    },
    register: async (userData) => {
      return await API.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },
    me: async () => {
      const data = await API.request('/auth/me');
      if (data.user) API.setUser(data.user);
      return data;
    }
  },

  // Property Methods
  properties: {
    listVerified: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/properties?${query}`);
    },
    getById: (id) => API.request(`/property/${id}`),
    create: (data) => API.request('/property/create', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Landlord Methods
  landlord: {
    getProperties: () => API.request('/my-properties'),
    createUnitType: (data) => API.request('/unit-type/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    createUnit: (data) => API.request('/unit/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    uploadPropertyPhotos: async (propertyId, files) => {
      const formData = new FormData();
      for (const file of files) formData.append('photos', file);
      formData.append('property_id', propertyId);

      const res = await fetch(`${API_BASE_URL}/upload/property-photos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API.getToken()}` },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      return await res.json();
    },
    uploadPropertyDocuments: async (propertyId, files, documentType = 'floor_plan') => {
      // Backend expects a single file under the `document` field.
      const results = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('property_id', propertyId);
        formData.append('document_type', documentType);

        const res = await fetch(`${API_BASE_URL}/upload/property-document`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${API.getToken()}` },
          body: formData
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Document upload failed');
        }

        results.push(await res.json());
      }
      return results;
    },
    // Backwards-compatible helper (single photo)
    uploadPhoto: async (propertyId, file) => API.landlord.uploadPropertyPhotos(propertyId, [file])
  },
  
  // Tenant Methods
  tenant: {
    getInterests: () => API.request('/interest/my')
  },

  // Admin Methods
  admin: {
    getQueue: () => API.request('/admin/queue'),
    searchUsers: (q) => API.request(`/admin/search-users?q=${encodeURIComponent(q)}`),
    verifyProperty: (propertyId, decision, notes) => API.request('/admin/verify-property', {
      method: 'POST',
      body: JSON.stringify({ property_id: propertyId, decision, notes })
    }),
    verifyTenant: (tenantId, decision, notes) => API.request('/admin/verify-tenant', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId, decision, notes })
    }),
    reviewLandlordDoc: (docId, decision, notes) => API.request('/admin/review-landlord-document', {
      method: 'POST',
      body: JSON.stringify({ document_id: docId, decision, notes })
    }),
    reviewPropertyDoc: (docId, decision, notes) => API.request('/admin/review-property-document', {
      method: 'POST',
      body: JSON.stringify({ document_id: docId, decision, notes })
    }),
    masterOverrideProperty: (propertyId, decision, notes) => API.request('/admin/master-override-property', {
      method: 'POST',
      body: JSON.stringify({ property_id: propertyId, decision, notes })
    }),
    getAdmins: () => API.request('/admin/admins'),
    toggleAdminStatus: (adminId, isActive) => API.request('/admin/toggle-status', {
      method: 'POST',
      body: JSON.stringify({ admin_id: adminId, is_active: isActive })
    }),
    createAdmin: (data) => API.request('/admin/create-admin', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    promoteToAdmin: (appUserId, role) => API.request('/admin/promote-user', {
      method: 'POST',
      body: JSON.stringify({ app_user_id: appUserId, role })
    }),
    getDeletionRequests: () => API.request('/admin/deletion-requests'),
    approveDeletion: (userId) => API.request('/admin/approve-deletion', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
  },

  // Helper for Role Redirection
  redirectByRole: (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Role mapping from backend response
    if (user.role === 'master_admin' || user.role === 'admin') {
      window.location.href = 'master-admin.html';
    } else if (user.landlord_id) {
      window.location.href = 'landlord-dashboard.html';
    } else if (user.tenant_id) {
      window.location.href = 'tenant-dashboard.html';
    } else {
      window.location.href = 'services.html';
    }
  }
};

window.API = API;
