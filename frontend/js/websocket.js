/**
 * CITYSYNC - Real-Time WebSocket Client
 * Connects to /ws/live to receive live sensor telemetry, anomaly bursts,
 * cross-system cascades, and 10-step Hackathon Crisis Simulation events.
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.listeners = new Map(); // eventType -> Array of callbacks
    this.isConnected = false;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || '127.0.0.1:8000';
    const wsUrl = `${protocol}//${host}/ws/live`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket Connected successfully to CITYSYNC Core Engine.');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateConnectionStatus(true);
      // Optional ping to keep alive
      setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send('ping');
        }
      }, 25000);
    };

    this.ws.onmessage = (event) => {
      try {
        if (event.data === 'pong') return;
        const payload = JSON.parse(event.data);
        this.dispatch(payload.type || 'MESSAGE', payload);
      } catch (err) {
        console.warn('Malformed WS message received:', event.data);
      }
    };

    this.ws.onclose = () => {
      console.warn('WebSocket connection closed.');
      this.isConnected = false;
      this.updateConnectionStatus(false);
      this.attemptReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      this.ws.close();
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
      console.log(`Attempting WS reconnect #${this.reconnectAttempts} in ${Math.round(delay / 1000)}s...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  dispatch(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(cb => cb(data));
    }
    // Also trigger wildcard subscribers
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(cb => cb(data));
    }
  }

  updateConnectionStatus(online) {
    const badge = document.getElementById('ws-connection-indicator');
    if (badge) {
      if (online) {
        badge.innerHTML = `<span class="pulse-dot"></span> LIVE ENGINE SYNC`;
        badge.style.color = 'var(--accent-emerald)';
      } else {
        badge.innerHTML = `<span class="pulse-dot" style="background:#EF4444"></span> RECONNECTING...`;
        badge.style.color = 'var(--accent-rose)';
      }
    }
  }
}

const wsService = new WebSocketService();
