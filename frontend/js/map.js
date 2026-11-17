/**
 * CITYSYNC - Leaflet.js City Digital Twin Map Controller
 * Visualizes geo-referenced infrastructure markers, active incidents,
 * status-coded severity, and hooks into the slide-out Facility Inspector Drawer.
 */
class CityMapController {
  constructor() {
    this.map = null;
    this.markersGroup = null;
    this.incidentsGroup = null;
    this.currentCategory = 'all';
    this.nodes = [];
  }

  init() {
    const mapElement = document.getElementById('leaflet-map');
    if (!mapElement) return;

    this.map = L.map('leaflet-map', {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 19
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
    this.incidentsGroup = L.layerGroup().addTo(this.map);

    this.loadMapData();
  }

  switchMode(mode) {
    const mapEl = document.getElementById('leaflet-map');
    const threeEl = document.getElementById('three-container');
    const btn2d = document.getElementById('btn-mode-2d');
    const btn3d = document.getElementById('btn-mode-3d');

    if (mode === '3d') {
      if (mapEl) mapEl.style.display = 'none';
      if (threeEl) threeEl.style.display = 'block';
      if (btn2d) btn2d.classList.remove('active');
      if (btn3d) btn3d.classList.add('active');

      if (typeof threeTwin !== 'undefined') {
        if (!threeTwin.isInitialized) {
          threeTwin.init('three-container');
        }
        threeTwin.updateNodes(this.nodes);
        threeTwin.onWindowResize();
      }
      if (window.app) window.app.showToast('Activated Bengaluru 3D Holographic Digital Twin Mode', 'info');
    } else {
      if (threeEl) threeEl.style.display = 'none';
      if (mapEl) mapEl.style.display = 'block';
      if (btn3d) btn3d.classList.remove('active');
      if (btn2d) btn2d.classList.add('active');
      if (this.map) {
        this.map.invalidateSize();
      }
      if (window.app) window.app.showToast('Returned to 2D Tactical GIS Map Mode', 'info');
    }
  }

  async loadMapData() {
    if (!this.map) return;
    try {
      this.nodes = await api.getMapNodes(this.currentCategory);
      const incidents = await api.getMapIncidents();
      this.renderMarkers(this.nodes);
      this.renderIncidents(incidents);
      if (typeof threeTwin !== 'undefined' && threeTwin.isInitialized) {
        threeTwin.updateNodes(this.nodes);
      }
    } catch (err) {
      console.error('Error loading map telemetry:', err);
    }
  }

  setFilter(category) {
    this.currentCategory = category;
    this.loadMapData();
  }

  getMarkerColor(status, category) {
    if (status === 'critical') return '#EF4444';
    if (status === 'warning') return '#F59E0B';
    if (category === 'traffic') return '#06B6D4';
    if (category === 'electricity') return '#EAB308';
    if (category === 'water') return '#3B82F6';
    return '#8B5CF6';
  }

  searchAndCenter(lat, lng, name) {
    if (!this.map) return;
    this.map.setView([lat, lng], 15, { animate: true });
    app.showToast(`Centered map on: ${name}`, 'info');
  }

  renderMarkers(nodes) {
    this.markersGroup.clearLayers();

    nodes.forEach(node => {
      const color = this.getMarkerColor(node.status, node.category);
      const isCritical = node.status === 'critical';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 ${isCritical ? '16px #EF4444' : '8px ' + color};
            animation: ${isCritical ? 'pulse-ring 1s infinite' : 'none'};
            color: #000;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
          ">
            ${node.category[0].toUpperCase()}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([node.latitude, node.longitude], { icon: customIcon });

      // Click on marker opens the Facility Inspector Drawer
      marker.on('click', () => {
        app.openFacilityInspector(node.id);
      });

      // Quick hover tooltip
      marker.bindTooltip(`<strong>${node.name}</strong><br><span style="text-transform:uppercase;color:${color}">${node.status}</span>`, {
        direction: 'top',
        className: 'custom-leaflet-tooltip'
      });

      this.markersGroup.addLayer(marker);
    });
  }

  renderIncidents(incidents) {
    this.incidentsGroup.clearLayers();

    incidents.forEach(inc => {
      const incIcon = L.divIcon({
        className: 'incident-map-pin',
        html: `
          <div style="
            background: #EF4444;
            color: #fff;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: 2px solid #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 16px rgba(239, 68, 68, 0.9);
            animation: pulse-ring 1.2s infinite;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
          ">
            ⚠
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: incIcon });
      const popup = `
        <div style="font-family:'Inter',sans-serif;color:#111;min-width:220px;">
          <div style="color:#DC2626;font-size:10px;font-weight:800;letter-spacing:0.5px;">ACTIVE INCIDENT: ${inc.incident_number}</div>
          <h4 style="margin:4px 0;font-size:13px;color:#111;">${inc.title}</h4>
          <div style="font-size:11px;color:#4B5563;margin-bottom:6px;">${inc.description}</div>
          <div style="font-size:11px;"><strong>Severity:</strong> <span style="color:#DC2626;font-weight:700;">${inc.severity.toUpperCase()}</span></div>
          <div style="font-size:11px;"><strong>Status:</strong> ${inc.status.toUpperCase()}</div>
          <div style="font-size:11px;"><strong>Department:</strong> ${inc.assigned_department}</div>
        </div>
      `;
      marker.bindPopup(popup);
      this.incidentsGroup.addLayer(marker);
    });
  }
}

const cityMap = new CityMapController();
