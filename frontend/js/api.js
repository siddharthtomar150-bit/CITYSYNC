/**
 * CITYSYNC - API Client (Enterprise SaaS Edition)
 * Clean REST abstraction for all backend endpoints with JWT support.
 */
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('citysync_token') || '';
    this.currentUser = JSON.parse(localStorage.getItem('citysync_user') || 'null');
  }

  setAuth(token, user) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem('citysync_token', token);
    localStorage.setItem('citysync_user', JSON.stringify(user));
  }

  clearAuth() {
    this.token = '';
    this.currentUser = null;
    localStorage.removeItem('citysync_token');
    localStorage.removeItem('citysync_user');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP Error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth & Roles
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email: username, password })
    });
    this.setAuth(data.access_token, data.user);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    this.setAuth(data.access_token, data.user);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (_) {}
    this.clearAuth();
  }

  async switchRole(role) {
    const data = await this.request(`/auth/switch-role/${role}`);
    this.setAuth(data.access_token, data.user);
    return data;
  }

  // Dashboard
  async getKPIs() {
    return await this.request('/dashboard/kpis');
  }

  async getOverview() {
    return await this.request('/dashboard/overview');
  }

  async getLiveWeather() {
    return await this.request('/dashboard/weather');
  }

  // Map & Digital Twin
  async getMapNodes(category = '', status = '') {
    let query = '';
    const params = [];
    if (category) params.push(`category=${category}`);
    if (status) params.push(`status=${status}`);
    if (params.length) query = `?${params.join('&')}`;
    return await this.request(`/map/nodes${query}`);
  }

  async getMapIncidents() {
    return await this.request('/map/incidents');
  }

  async searchDigitalTwin(q) {
    return await this.request(`/map/search?q=${encodeURIComponent(q)}`);
  }

  async getFacilityInspector(nodeId) {
    return await this.request(`/map/facilities/${nodeId}/inspector`);
  }

  // Traffic
  async getTrafficSummary() {
    return await this.request('/traffic/summary');
  }

  async getTrafficTrends() {
    return await this.request('/traffic/trends');
  }

  // Electricity
  async getElectricitySummary() {
    return await this.request('/electricity/summary');
  }

  async getElectricityTrends() {
    return await this.request('/electricity/trends');
  }

  // Water
  async getWaterSummary() {
    return await this.request('/water/summary');
  }

  async getWaterTrends() {
    return await this.request('/water/trends');
  }

  // Incidents
  async getIncidents(status = '', severity = '', category = '') {
    const params = [];
    if (status) params.push(`status=${status}`);
    if (severity) params.push(`severity=${severity}`);
    if (category) params.push(`category=${category}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return await this.request(`/incidents${query}`);
  }

  async createIncident(incidentData) {
    return await this.request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData)
    });
  }

  async updateIncident(id, updateData) {
    return await this.request(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  }

  async resolveIncident(id, notes) {
    return await this.request(`/incidents/${id}/resolve?resolution_notes=${encodeURIComponent(notes)}`, {
      method: 'POST'
    });
  }

  // Anomalies
  async getAnomalies(category = '', severity = '', status = '') {
    const params = [];
    if (category) params.push(`category=${category}`);
    if (severity) params.push(`severity=${severity}`);
    if (status) params.push(`status=${status}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return await this.request(`/anomalies${query}`);
  }

  async updateAnomalyStatus(id, resolutionStatus) {
    return await this.request(`/anomalies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution_status: resolutionStatus })
    });
  }

  async acknowledgeAnomaly(id) {
    return await this.request(`/anomalies/${id}/acknowledge`, {
      method: 'POST'
    });
  }

  // Recommendations
  async getRecommendations(status = '') {
    const query = status ? `?status=${status}` : '';
    return await this.request(`/recommendations${query}`);
  }

  async actionRecommendation(id, status) {
    return await this.request(`/recommendations/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  async convertRecommendationToIncident(id) {
    return await this.request(`/recommendations/${id}/convert-to-incident`, {
      method: 'POST'
    });
  }

  // Machine Learning (Section 12 & 25)
  async getMLModelsInfo() {
    return await this.request('/ml/models/info');
  }

  async predictTraffic(payload) {
    return await this.request('/ml/predict/traffic', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async predictElectricity(payload) {
    return await this.request('/ml/predict/electricity', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async predictWaterAnomaly(payload) {
    return await this.request('/ml/predict/water-anomaly', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async predictMultiSystemAnomaly(payload) {
    return await this.request('/ml/predict/multi-system-anomaly', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async trainML() {
    return await this.request('/ml/train', { method: 'POST' });
  }

  // Simulation & Crisis Demo
  async triggerCrisis() {
    return await this.request('/simulation/crisis', { method: 'POST' });
  }

  async resetSimulation() {
    return await this.request('/simulation/reset', { method: 'POST' });
  }

  async getSimulationStatus() {
    return await this.request('/simulation/status');
  }

  async startSimulation() {
    return await this.request('/simulation/start', { method: 'POST' });
  }

  async stopSimulation() {
    return await this.request('/simulation/stop', { method: 'POST' });
  }

  // Reports
  async getDailySummary() {
    return await this.request('/reports/daily-summary');
  }

  downloadCSV(datasetType) {
    window.location.href = `/api/reports/export-csv?dataset_type=${datasetType}`;
  }
}

const api = new ApiClient();
