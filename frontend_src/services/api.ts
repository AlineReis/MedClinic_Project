/**
 * API Service Wrapper
 * Centralizes all HTTP requests with error handling and auth headers.
 */

const API_BASE_URL = '/api/v1'; // Update to full URL if backend is on different port

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

const Api = {
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, 'GET');
    },

    async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, 'POST', body);
    },

    async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, 'PUT', body);
    },

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, 'DELETE');
    },

    async request<T>(endpoint: string, method: string, body?: any): Promise<ApiResponse<T>> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem('medclinic_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return { success: true, data };
        } catch (error: any) {
            console.error(`API Error (${method} ${endpoint}):`, error);
            return {
                success: false,
                error: error.message || 'Network error'
            };
        }
    }
};

export default Api;
