const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Standard fetch wrapper with auth header and error handling
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('digent_admin_token');

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/login')) {
        // Token expired or invalid
        localStorage.removeItem('digent_admin_token');
        localStorage.removeItem('digent_admin_user');
        window.location.href = '/login';
      }

      const errorMessage =
        (data && data.message) ||
        `Request failed with status ${response.status} (${response.statusText})`;
      return {
        success: false,
        status: response.status,
        message: errorMessage,
      };
    }

    return data || { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Network communication error with backend server.',
    };
  }
}

export const adminApi = {
  // Auth
  login: (email, password) =>
    request('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  changePassword: (currentPassword, newPassword) =>
    request('/api/admin/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getMe: () => request('/api/admin/auth/me', { method: 'GET' }),

  logout: () => request('/api/admin/auth/logout', { method: 'POST' }),

  // Push Stats & Analytics
  getStats: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/admin/push/stats${query}`, { method: 'GET' });
  },

  // Users Directory
  getUsers: ({ page = 1, limit = 15, search = '', hasToken = '' }) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (hasToken !== '') params.append('hasToken', hasToken);
    return request(`/api/admin/push/users?${params.toString()}`, { method: 'GET' });
  },

  // Devices
  getDevices: ({ page = 1, limit = 20, platform = '', isActive = '', search = '' }) => {
    const params = new URLSearchParams({ page, limit });
    if (platform && platform !== 'all') params.append('platform', platform);
    if (isActive !== '') params.append('isActive', isActive);
    if (search) params.append('search', search);
    return request(`/api/admin/push/devices?${params.toString()}`, { method: 'GET' });
  },

  toggleDevice: (id) =>
    request(`/api/admin/push/devices/${id}/toggle`, {
      method: 'PATCH',
    }),

  // Test Push
  sendTest: (payload) =>
    request('/api/admin/push/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Create Campaign
  sendCampaign: (payload) =>
    request('/api/admin/push/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Campaigns History
  getCampaigns: ({ page = 1, limit = 15, search = '', status = '', recipientType = '', startDate = '', endDate = '' }) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    if (recipientType && recipientType !== 'all') params.append('recipientType', recipientType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return request(`/api/admin/push/campaigns?${params.toString()}`, { method: 'GET' });
  },

  getCampaignById: (id) =>
    request(`/api/admin/push/campaigns/${id}`, { method: 'GET' }),

  cancelCampaign: (id) =>
    request(`/api/admin/push/campaigns/${id}/cancel`, { method: 'POST' }),

  checkReceipts: (id) =>
    request(`/api/admin/push/campaigns/${id}/check-receipts`, { method: 'POST' }),

  // Audit Logs
  getAuditLogs: ({ page = 1, limit = 20, action = '' }) => {
    const params = new URLSearchParams({ page, limit });
    if (action && action !== 'all') params.append('action', action);
    return request(`/api/admin/push/audit-logs?${params.toString()}`, { method: 'GET' });
  },
};
