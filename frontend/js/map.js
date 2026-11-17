/**
 * CITYSYNC - Leaflet.js City Digital Twin Map Controller
 * Visualizes geo-referenced infrastructure markers, active incidents,
 * status-coded severity, BBMP 8 administrative zones, and seamless 2D/3D/Split modes.
 */
class CityMapController {
  constructor() {
    this.map = null;
    this.markersGroup = null;
    this.incidentsGroup = null;
    this.zonesGroup = null;
    this.currentCategory = 'all';
    this.currentMode = '2d';
    this.showBBMPZones = true;
    this.nodes = [];

    // BBMP 8 Administrative Zones Polygon Approximations
    this.bbmpZones = [
      {
        name: "East Zone",
        color: "#38BDF8",
        desc: "Indiranagar, Halasuru, Pulakeshinagar, CV Raman Nagar",
        coords: [
          [12.9850, 77.6100], [13.0100, 77.6300], [12.9900, 77.6700],
          [12.9600, 77.6500], [12.9650, 77.6100]
        ]
      },
      {
        name: "West Zone",
        color: "#818CF8",
        desc: "Malleshwaram, Rajajinagar, Gandhinagar, Chamarajpet",
        coords: [
          [13.0200, 77.5500], [13.0100, 77.5850], [12.9550, 77.5750],
          [12.9500, 77.5400], [12.9900, 77.5350]
        ]
      },
      {
        name: "South Zone",
        color: "#34D399",
        desc: "Jayanagar, Basavanagudi, Padmanabhanagar, BTM Layout",
        coords: [
          [12.9450, 77.5600], [12.9400, 77.6150], [12.8900, 77.6100],
          [12.8850, 77.5600], [12.9150, 77.5450]
        ]
      },
      {
        name: "Mahadevapura Zone",
        color: "#F472B6",
        desc: "Whitefield, Bellandur, Marathahalli, KR Puram, ORR",
        coords: [
          [13.0200, 77.6700], [13.0100, 77.7600], [12.9200, 77.7600],
          [12.9150, 77.6700], [12.9600, 77.6600]
        ]
      },
      {
        name: "Bommanahalli Zone",
        color: "#FBBF24",
        desc: "Electronic City, HSR Layout, Bommanahalli, Begur",
        coords: [
          [12.9150, 77.6200], [12.9200, 77.6800], [12.8250, 77.6900],
          [12.8250, 77.6300], [12.8800, 77.6150]
        ]
      },
      {
        name: "Rajarajeshwari Nagar (RR Nagar)",
        color: "#A78BFA",
        desc: "RR Nagar, Kengeri, Nayandahalli, Bangalore University",
        coords: [
          [12.9500, 77.4900], [12.9600, 77.5400], [12.8900, 77.5450],
          [12.8800, 77.4800], [12.9200, 77.4700]
        ]
      },
      {
        name: "Dasarahalli Zone",
        color: "#FB923C",
        desc: "Peenya Industrial Area, T Dasarahalli, Bagalagunte",
        coords: [
          [13.0700, 77.4900], [13.0600, 77.5400], [13.0100, 77.5350],
          [13.0100, 77.4850], [13.0450, 77.4750]
        ]
      },
      {
        name: "Yelahanka Zone",
        color: "#2DD4BF",
        desc: "Hebbal, Yelahanka Satellite Town, Vidyaranyapura, Airport corridor",
        coords: [
          [13.1300, 77.5500], [13.1300, 77.6400], [13.0300, 77.6300],
          [13.0300, 77.5500], [13.0800, 77.5350]
        ]
      }
    ];

    // Escape key listener for fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const wrapper = document.querySelector('.map-wrapper');
        if (wrapper && wrapper.classList.contains('fullscreen')) {
          this.toggleFullscreen();
        }
      }
    });
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

    this.zonesGroup = L.layerGroup().addTo(this.map);
    this.markersGroup = L.layerGroup().addTo(this.map);
    this.incidentsGroup = L.layerGroup().addTo(this.map);

    this.renderBBMPZones();
    this.loadMapData();
  }

  renderBBMPZones() {
    if (!this.zonesGroup) return;
    this.zonesGroup.clearLayers();
    if (!this.showBBMPZones) return;

    this.bbmpZones.forEach(zone => {
      const polygon = L.polygon(zone.coords, {
        color: zone.color,
        weight: 1.8,
        dashArray: '5, 5',
        fillColor: zone.color,
        fillOpacity: 0.08
      });

      polygon.bindTooltip(
        `<div style="font-family:'Inter',sans-serif;font-size:11px;">
          <strong style="color:${zone.color};">${zone.name.toUpperCase()}</strong><br>
          <span style="font-size:10px;color:#94A3B8;">${zone.desc}</span>
        </div>`,
        { sticky: true, className: 'custom-leaflet-tooltip' }
      );

      this.zonesGroup.addLayer(polygon);
    });
  }

  toggleBBMPZones() {
    this.showBBMPZones = !this.showBBMPZones;
    this.renderBBMPZones();
    const btn = document.getElementById('btn-toggle-bbmp');
    if (btn) {
      btn.style.color = this.showBBMPZones ? 'var(--accent-cyan)' : '#94A3B8';
    }
    if (window.app) {
      window.app.showToast(this.showBBMPZones ? 'BBMP Administrative 8 Zones: VISIBLE' : 'BBMP Zones: HIDDEN', 'info');
    }
  }

  toggleFullscreen() {
    const wrapper = document.querySelector('.map-wrapper');
    const btn = document.getElementById('btn-fullscreen-toggle');
    if (!wrapper) return;

    const isFullscreen = wrapper.classList.toggle('fullscreen');
    if (btn) {
      btn.innerHTML = isFullscreen ? '<i class="fa-solid fa-compress"></i> Exit' : '<i class="fa-solid fa-expand"></i> Fullscreen';
    }

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
      if (typeof threeTwin !== 'undefined' && threeTwin.isInitialized) {
        threeTwin.onWindowResize();
      }
    }, 150);

    if (window.app) {
      window.app.showToast(isFullscreen ? 'Map Maximized to Whole Screen (Press Esc to restore)' : 'Restored Normal Map View', 'info');
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    const mapEl = document.getElementById('leaflet-map');
    const threeEl = document.getElementById('three-container');
    const btn2d = document.getElementById('btn-mode-2d');
    const btn3d = document.getElementById('btn-mode-3d');
    const btnSplit = document.getElementById('btn-mode-split');
    const camRibbon = document.getElementById('twin-camera-ribbon');

    [btn2d, btn3d, btnSplit].forEach(b => { if (b) b.classList.remove('active'); });

    if (mode === '3d') {
      if (mapEl) {
        mapEl.style.display = 'none';
        mapEl.style.width = '100%';
      }
      if (threeEl) {
        threeEl.style.display = 'block';
        threeEl.style.width = '100%';
        threeEl.style.left = '0';
      }
      if (btn3d) btn3d.classList.add('active');
      if (camRibbon) camRibbon.style.display = 'flex';

      if (typeof threeTwin !== 'undefined') {
        if (!threeTwin.isInitialized) threeTwin.init('three-container');
        threeTwin.updateNodes(this.nodes);
        threeTwin.onWindowResize();
      }
      if (window.app) window.app.showToast('Full 3D Bengaluru Digital Twin Mode Active', 'info');

    } else if (mode === 'split') {
      // Split Screen: 50% 2D GIS Map + 50% 3D Digital Twin Synchronized
      if (mapEl) {
        mapEl.style.display = 'block';
        mapEl.style.width = '50%';
        mapEl.style.position = 'absolute';
        mapEl.style.top = '0';
        mapEl.style.left = '0';
        mapEl.style.height = '100%';
      }
      if (threeEl) {
        threeEl.style.display = 'block';
        threeEl.style.width = '50%';
        threeEl.style.position = 'absolute';
        threeEl.style.top = '0';
        threeEl.style.left = '50%';
        threeEl.style.height = '100%';
      }
      if (btnSplit) btnSplit.classList.add('active');
      if (camRibbon) camRibbon.style.display = 'flex';

      if (typeof threeTwin !== 'undefined') {
        if (!threeTwin.isInitialized) threeTwin.init('three-container');
        threeTwin.updateNodes(this.nodes);
        threeTwin.onWindowResize();
      }
      if (this.map) {
        setTimeout(() => this.map.invalidateSize(), 100);
      }
      if (window.app) window.app.showToast('Dual Split-Screen Mode Active: 2D GIS & 3D Twin Synced', 'info');

    } else {
      // Standard 2D Tactical GIS Map
      if (threeEl) {
        threeEl.style.display = 'none';
      }
      if (mapEl) {
        mapEl.style.display = 'block';
        mapEl.style.width = '100%';
        mapEl.style.position = 'relative';
        mapEl.style.left = '0';
        mapEl.style.height = '100%';
      }
      if (btn2d) btn2d.classList.add('active');
      if (camRibbon) camRibbon.style.display = 'none';

      if (this.map) {
        setTimeout(() => this.map.invalidateSize(), 100);
      }
      if (window.app) window.app.showToast('Returned to 2D Tactical GIS Map Mode', 'info');
    }
  }

  jumpToZone(zoneKey) {
    if (!zoneKey) return;
    const zoneTargets = {
      wholecity: { lat: 12.9716, lng: 77.5946, zoom: 11, hub: 'wholecity', name: 'Whole Greater Bengaluru (Panoramic Overview)' },
      cbd: { lat: 12.9716, lng: 77.5946, zoom: 15, hub: 'cbd', name: 'Vidhana Soudha & CBD' },
      silkboard: { lat: 12.9176, lng: 77.6238, zoom: 15, hub: 'silkboard', name: 'Central Silk Board Interchange' },
      ecity: { lat: 12.8399, lng: 77.6770, zoom: 14, hub: 'ecity', name: 'Electronic City Tech Hub' },
      whitefield: { lat: 12.9698, lng: 77.7499, zoom: 14, hub: 'whitefield', name: 'Whitefield ITPL' },
      bellandur: { lat: 12.9260, lng: 77.6762, zoom: 14, hub: 'bellandur', name: 'Bellandur Lake & Tech Parks' },
      peenya: { lat: 13.0285, lng: 77.5186, zoom: 14, hub: 'peenya', name: 'Peenya Industrial Complex' },
      hebbal: { lat: 13.0358, lng: 77.5970, zoom: 14, hub: 'hebbal', name: 'Hebbal Flyover & Airport Gateway' },
      ulsoor: { lat: 12.9818, lng: 77.6200, zoom: 15, hub: 'ulsoor', name: 'Ulsoor Lake & Halasuru' },
      majestic: { lat: 12.9767, lng: 77.5713, zoom: 15, hub: 'majestic', name: 'Majestic KSR Rail & Metro' },
      jayanagar: { lat: 12.9250, lng: 77.5938, zoom: 14, hub: 'jayanagar', name: 'Jayanagar & Lalbagh' }
    };

    const target = zoneTargets[zoneKey];
    if (!target) return;

    if (this.map) {
      this.map.flyTo([target.lat, target.lng], target.zoom, { duration: 1.2 });
    }
    if (typeof threeTwin !== 'undefined' && threeTwin.isInitialized) {
      threeTwin.focusHub(target.hub);
    }
    if (window.app) window.app.showToast(`Navigated to: ${target.name}`, 'info');
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
    if (window.app) window.app.showToast(`Centered map on: ${name}`, 'info');
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

      // Click opens inspector & syncs 3D twin
      marker.on('click', () => {
        if (window.app) window.app.openFacilityInspector(node.id);
        if (typeof threeTwin !== 'undefined' && threeTwin.isInitialized) {
          const x = (node.longitude - threeTwin.centerLng) * threeTwin.scaleFactor;
          const z = -(node.latitude - threeTwin.centerLat) * threeTwin.scaleFactor;
          threeTwin.animateCameraTo(x, 120, z + 90, x, 0, z);
        }
      });

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
