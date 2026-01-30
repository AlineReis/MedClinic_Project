/**
 * MedClinic API Service
 * Handles all HTTP requests to the backend API
 *
 * IMPORTANTE: O backend está configurado com CORS para http://localhost:3001
 * O frontend deve rodar nessa porta para funcionar corretamente.
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';
const CLINIC_ID = '1'; // Default clinic ID for MVP

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode, code, field = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
  }
}

/**
 * Make an HTTP request to the API
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}/${CLINIC_ID}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for JWT
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      // Backend pode retornar { error: "message" } ou { success: false, error: { ... } }
      const errorMsg = data.error?.message || data.error || data.message || 'Erro na requisição';
      const errorCode = data.error?.code || 'UNKNOWN_ERROR';
      throw new ApiError(
        errorMsg,
        data.error?.statusCode || response.status,
        errorCode,
        data.error?.field
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or other fetch error
    console.error('API Request Error:', error);
    throw new ApiError(
      'Erro de conexão. Verifique se o servidor está rodando.',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * GET request
 */
function get(endpoint, params = {}) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
  const queryString = new URLSearchParams(filteredParams).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return request(url, { method: 'GET' });
}

/**
 * POST request
 */
function post(endpoint, body = {}) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request
 */
function put(endpoint, body = {}) {
  return request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request
 */
function patch(endpoint, body = {}) {
  return request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
function del(endpoint, body = {}) {
  return request(endpoint, {
    method: 'DELETE',
    body: Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export const auth = {
  /**
   * Register a new user (patient self-registration)
   * POST /auth/register
   */
  register: (userData) => post('/auth/register', userData),

  /**
   * Login with email and password
   * POST /auth/login
   * Returns: { success, user: { id, name, email, role } }
   * Sets HttpOnly cookie with JWT token
   */
  login: (email, password) => post('/auth/login', { email, password }),

  /**
   * Get current user's profile
   * GET /auth/profile
   * Returns full user profile including professional_details if applicable
   */
  getProfile: () => get('/auth/profile'),

  /**
   * Logout (clear JWT cookie)
   * POST /auth/logout
   */
  logout: () => post('/auth/logout'),
};

// ============================================
// USER ENDPOINTS
// ============================================

export const users = {
  /**
   * List users with optional filters
   * GET /users?role=&search=&page=&pageSize=
   */
  list: (params = {}) => get('/users', params),

  /**
   * Get user by ID
   * GET /users/:id
   */
  getById: (id) => get(`/users/${id}`),

  /**
   * Update user
   * PUT /users/:id
   */
  update: (id, data) => put(`/users/${id}`, data),

  /**
   * Delete (soft delete) user
   * DELETE /users/:id
   */
  delete: (id) => del(`/users/${id}`),
};

// ============================================
// PROFESSIONAL ENDPOINTS
// ============================================

export const professionals = {
  /**
   * List professionals (public endpoint)
   * GET /professionals?specialty=&name=&page=&pageSize=
   */
  list: (params = {}) => get('/professionals', params),

  /**
   * Get professional availability
   * GET /professionals/:id/availability?startDate=&endDate=
   */
  getAvailability: (professionalId, params = {}) =>
    get(`/professionals/${professionalId}/availability`, params),

  /**
   * Set professional availability
   * POST /professionals/:id/availability
   */
  setAvailability: (professionalId, availabilities) =>
    post(`/professionals/${professionalId}/availability`, { availabilities }),

  /**
   * Get professional commissions
   * GET /professionals/:id/commissions?month=&year=&status=
   */
  getCommissions: (professionalId, params = {}) =>
    get(`/professionals/${professionalId}/commissions`, params),
};

// ============================================
// APPOINTMENT ENDPOINTS
// ============================================

export const appointments = {
  /**
   * List appointments (filtered by user role)
   * GET /appointments?status=&professional_id=&patient_id=&date=&upcoming=&page=&pageSize=
   */
  list: (params = {}) => get('/appointments', params),

  /**
   * Get appointment by ID
   * GET /appointments/:id
   */
  getById: (id) => get(`/appointments/${id}`),

  /**
   * Create new appointment
   * POST /appointments
   * Body: { patient_id, professional_id, date, time, type }
   */
  create: (data) => post('/appointments', data),

  /**
   * Cancel appointment
   * DELETE /appointments/:id
   * Body: { reason? }
   */
  cancel: (id, reason = '') => del(`/appointments/${id}`, reason ? { reason } : {}),

  /**
   * Reschedule appointment
   * POST /appointments/:id/reschedule
   * Body: { new_date, new_time }
   */
  reschedule: (id, newDate, newTime) =>
    post(`/appointments/${id}/reschedule`, { new_date: newDate, new_time: newTime }),

  /**
   * Confirm appointment
   * PATCH /appointments/:id/confirm
   */
  confirm: (id) => patch(`/appointments/${id}/confirm`),
};

// ============================================
// EXAM ENDPOINTS
// ============================================

export const exams = {
  /**
   * List exam catalog
   * GET /exams/catalog
   */
  getCatalog: () => get('/exams/catalog'),

  /**
   * List exam requests
   * GET /exams
   * Returns exams filtered by user context (patient sees own, professional sees requested, etc.)
   */
  list: (params = {}) => get('/exams', params),

  /**
   * Get exam request by ID
   * GET /exams/:id
   */
  getById: (id) => get(`/exams/${id}`),

  /**
   * Create new exam request (professional only)
   * POST /exams
   * Body: { appointment_id, patient_id, exam_catalog_id, clinical_indication }
   */
  create: (data) => post('/exams', data),
};

// ============================================
// PRESCRIPTION ENDPOINTS
// ============================================

export const prescriptions = {
  /**
   * List prescriptions
   * GET /prescriptions
   * Returns prescriptions filtered by user context
   */
  list: (params = {}) => get('/prescriptions', params),

  /**
   * Get prescription by ID
   * GET /prescriptions/:id
   */
  getById: (id) => get(`/prescriptions/${id}`),

  /**
   * Create new prescription (professional only)
   * POST /prescriptions
   * Body: { appointment_id, patient_id, medication_name, dosage, instructions, is_controlled }
   */
  create: (data) => post('/prescriptions', data),
};

// Export utilities
export { ApiError, API_BASE_URL, CLINIC_ID };

// Default export with all services
export default {
  auth,
  users,
  professionals,
  appointments,
  exams,
  prescriptions,
};
