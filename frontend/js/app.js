/**
 * CITYSYNC - World-Class Enterprise Application Controller
 * Coordinates 13 modular views, real-time telemetry streaming,
 * Facility Inspector Drawer, Incident Management, ML Inferences, and Crisis Demo.
 */
class AppController {
  constructor() {
    this.currentView = 'overview';
    this.kpiData = null;
    this.mlMetadata = null;
    this.selectedFacilityId = null;
    this.inspectorChart = null;
  }

  async init() {
    console.log('CITYSYNC World-Class SaaS Command Center Initializing...');

    // 1. Navigation & Layout
    this.setupNavigation();
    this.setupSidebarToggle();
    this.setupGlobalSearch();
    this.setupNotifications();

    // 2. Auth & Roles
    this.setupRoleSwitcher();
    this.setupAuthModals();

    // 3. Crisis Demo Triggers
    this.setupCrisisDemo();

    // 4. Modals & Forms
    this.setupModals();
    this.setupForms();

    // 5. Real-Time WebSockets
    wsService.connect();
    this.setupWebSocketListeners();

    // 6. Visualizations & Map
    charts.initOverviewTrafficChart('chart-traffic-overview');
    charts.initOverviewElectricityChart('chart-elec-overview');
    charts.initOverviewWaterChart('chart-water-overview');
    cityMap.init();

    // 7. Initial Data Fetch
    await this.refreshAllData();

    // 8. Fallback interval
    setInterval(() => this.pollActiveViewData(), 12000);
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.switchView(view);
      });
    });
  }

  setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeNav) activeNav.classList.add('active');

    const activeSection = document.getElementById(`view-${viewName}`);
    if (activeSection) activeSection.classList.add('active');

    // Update Breadcrumb & Title
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent && activeNav) {
      breadcrumbCurrent.textContent = activeNav.querySelector('span') ? activeNav.querySelector('span').textContent.trim() : viewName;
    }

    // Close any open facility drawer
    this.closeFacilityInspector();

    // View-specific loader triggers
    if (viewName === 'digital-twin') {
      setTimeout(() => {
        if (cityMap.map) cityMap.map.invalidateSize();
        if (typeof threeTwin !== 'undefined' && threeTwin.isInitialized) threeTwin.onWindowResize();
      }, 150);
      cityMap.loadMapData();
    } else if (viewName === 'traffic') {
      this.loadTrafficView();
    } else if (viewName === 'energy') {
      this.loadEnergyView();
    } else if (viewName === 'water') {
      this.loadWaterView();
    } else if (viewName === 'cross-system') {
      this.loadCrossSystemView();
    } else if (viewName === 'predictions') {
      this.loadMLView();
    } else if (viewName === 'anomalies') {
      this.loadAnomaliesView();
    } else if (viewName === 'incidents') {
      this.loadIncidentsView();
    } else if (viewName === 'recommendations') {
      this.loadRecommendationsView();
    } else if (viewName === 'reports') {
      this.loadReportsView();
    } else if (viewName === 'admin') {
      this.loadAdminView();
    } else if (viewName === 'settings') {
      this.loadSettingsView();
    }
  }

  setupGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const resultsDropdown = document.getElementById('global-search-results');
    if (!searchInput || !resultsDropdown) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      if (query.length < 2) {
        resultsDropdown.classList.remove('active');
        return;
      }
      debounceTimer = setTimeout(async () => {
        try {
          const res = await api.searchDigitalTwin(query);
          if ((!res.nodes || res.nodes.length === 0) && (!res.incidents || res.incidents.length === 0)) {
            resultsDropdown.innerHTML = '<div style="padding:10px;font-size:11px;color:#9CA3AF;">No matching city assets or incidents.</div>';
          } else {
            let html = '';
            if (res.nodes && res.nodes.length > 0) {
              html += '<div style="font-size:10px;font-weight:700;color:#06B6D4;padding:6px 12px;background:rgba(6,182,212,0.08);">INFRASTRUCTURE ASSETS</div>';
              html += res.nodes.map(n => `
                <div class="search-item" onclick="app.selectSearchResultNode(${n.lat}, ${n.lng}, '${n.name}', ${n.id})">
                  <div style="font-weight:600;color:#fff;">${n.name} (${n.code})</div>
                  <div style="font-size:10px;color:#9CA3AF;">${n.sector} • ${n.category.toUpperCase()}</div>
                </div>
              `).join('');
            }
            if (res.incidents && res.incidents.length > 0) {
              html += '<div style="font-size:10px;font-weight:700;color:#EF4444;padding:6px 12px;background:rgba(239,68,68,0.08);">MUNICIPAL INCIDENTS</div>';
              html += res.incidents.map(i => `
                <div class="search-item" onclick="app.switchView('incidents')">
                  <div style="font-weight:600;color:#fff;">${i.number}: ${i.title}</div>
                  <div style="font-size:10px;color:#9CA3AF;">Severity: ${i.severity.toUpperCase()} • Status: ${i.status.toUpperCase()}</div>
                </div>
              `).join('');
            }
            resultsDropdown.innerHTML = html;
          }
          resultsDropdown.classList.add('active');
        } catch (err) {
          console.error('Search error:', err);
        }
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
        resultsDropdown.classList.remove('active');
      }
    });
  }

  selectSearchResultNode(lat, lng, name, id) {
    document.getElementById('global-search-results').classList.remove('active');
    this.switchView('digital-twin');
    setTimeout(() => {
      cityMap.searchAndCenter(lat, lng, name);
      this.openFacilityInspector(id);
    }, 200);
  }

  setupNotifications() {
    const btn = document.getElementById('btn-notifications');
    const dropdown = document.getElementById('notifications-dropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  setupRoleSwitcher() {
    const select = document.getElementById('role-select');
    if (!select) return;

    select.addEventListener('change', async (e) => {
      const newRole = e.target.value;
      try {
        const res = await api.switchRole(newRole);
        this.showToast(`Switched Role: ${res.user.full_name} (${res.user.role.toUpperCase()})`, 'info');
        this.updateRolePermissions(res.user.role);
      } catch (err) {
        this.showToast(`Role switch failed: ${err.message}`, 'error');
      }
    });
  }

  updateRolePermissions(role) {
    const roleBadge = document.getElementById('topbar-user-badge');
    if (roleBadge) roleBadge.textContent = role.toUpperCase();
  }

  setupCrisisDemo() {
    const runBtn = document.getElementById('btn-run-crisis');
    const resetBtn = document.getElementById('btn-reset-demo');

    if (runBtn) {
      runBtn.addEventListener('click', async () => {
        try {
          runBtn.disabled = true;
          this.showToast('Initiating 10-Step City Crisis Simulation...', 'warning');
          if (typeof threeTwin !== 'undefined' && threeTwin.isInitialized) {
            threeTwin.triggerCrisisShockwave();
          }
          await api.triggerCrisis();
        } catch (err) {
          this.showToast(`Crisis trigger failed: ${err.message}`, 'error');
          runBtn.disabled = false;
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        try {
          await api.resetSimulation();
          if (runBtn) runBtn.disabled = false;
          this.hideCrisisBanner();
          this.showToast('Demo state reset. All municipal nodes normalized.', 'success');
          await this.refreshAllData();
        } catch (err) {
          this.showToast(`Reset error: ${err.message}`, 'error');
        }
      });
    }
  }

  setupWebSocketListeners() {
    wsService.on('TELEMETRY_UPDATE', (data) => {
      this.handleLiveTelemetry(data);
    });

    wsService.on('CRISIS_STEP_UPDATE', (stepData) => {
      this.showCrisisBanner(stepData);
    });

    wsService.on('CRISIS_RESET', () => {
      this.hideCrisisBanner();
      const runBtn = document.getElementById('btn-run-crisis');
      if (runBtn) runBtn.disabled = false;
    });
  }

  handleLiveTelemetry(data) {
    const nowTime = new Date().toLocaleTimeString();

    if (data.traffic && data.traffic.length > 0) {
      const avgCong = data.traffic.reduce((acc, t) => acc + t.congestion, 0) / data.traffic.length;
      charts.updateTrend('overviewTraffic', nowTime, Math.round(avgCong * 10) / 10);
    }
    if (data.electricity && data.electricity.length > 0) {
      const totalDemand = data.electricity.reduce((acc, e) => acc + e.demand_mw, 0);
      charts.updateTrend('overviewElectricity', nowTime, Math.round(totalDemand * 10) / 10);
    }
    if (data.water && data.water.length > 0) {
      const avgPressure = data.water.reduce((acc, w) => acc + w.pressure_psi, 0) / data.water.length;
      charts.updateTrend('overviewWater', nowTime, Math.round(avgPressure * 10) / 10);
    }

    this.loadKPIs();

    if (this.currentView === 'digital-twin') {
      cityMap.loadMapData();
    }
  }

  showCrisisBanner(stepData) {
    const banner = document.getElementById('crisis-banner');
    if (!banner) return;
    banner.classList.add('active');

    const badge = document.getElementById('crisis-banner-step');
    const title = document.getElementById('crisis-banner-title');
    const desc = document.getElementById('crisis-banner-desc');

    if (badge) badge.textContent = `STEP ${stepData.step}/${stepData.total_steps}`;
    if (title) title.textContent = `[${stepData.system.toUpperCase()}] ${stepData.title}`;
    if (desc) desc.textContent = stepData.description;
  }

  hideCrisisBanner() {
    const banner = document.getElementById('crisis-banner');
    if (banner) banner.classList.remove('active');
  }

  async refreshAllData() {
    await this.loadKPIs();
    await this.loadOverviewFeed();
    await this.loadLiveWeather();
  }

  async loadLiveWeather() {
    try {
      const weather = await api.getLiveWeather();
      const pill = document.getElementById('topbar-weather-text');
      if (pill && weather) {
        pill.textContent = `BLR: ${weather.temperature_c}°C • ${weather.weather_condition}`;
      }
    } catch (err) {
      console.warn('Weather fetch note:', err);
    }
  }

  async loadKPIs() {
    try {
      const kpis = await api.getKPIs();
      this.kpiData = kpis;

      this.updateKPICard('traffic', kpis.traffic_congestion);
      this.updateKPICard('elec', kpis.electricity_consumption);
      this.updateKPICard('water', kpis.water_supply_status);
      this.updateKPICard('incidents', kpis.active_incidents);
      this.updateKPICard('health', kpis.infrastructure_health_score);
      this.updateKPICard('disruptions', kpis.predicted_disruptions);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
    }
  }

  updateKPICard(cardKey, data) {
    const valEl = document.getElementById(`kpi-${cardKey}-val`);
    const compEl = document.getElementById(`kpi-${cardKey}-comp`);
    const dotEl = document.getElementById(`kpi-${cardKey}-dot`);

    if (valEl) valEl.textContent = data.value;
    if (compEl) compEl.textContent = data.previous_period_comparison;
    if (dotEl) {
      dotEl.className = `kpi-status-dot status-${data.status}`;
    }
  }

  async loadOverviewFeed() {
    try {
      const overview = await api.getOverview();
      const feedEl = document.getElementById('live-activity-feed');
      if (feedEl && overview.activity_feed) {
        if (overview.activity_feed.length === 0) {
          feedEl.innerHTML = '<div style="color:#6B7280;padding:12px;">No active anomalies. All municipal systems synchronized.</div>';
          return;
        }
        feedEl.innerHTML = overview.activity_feed.map(item => `
          <div style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:12.5px;font-weight:600;color:#fff;">
                <span class="badge badge-${item.severity}">${item.severity.toUpperCase()}</span>
                ${item.title}
              </div>
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">${item.description}</div>
              <div style="font-size:10px;color:#6B7280;">Sector: ${item.location}</div>
            </div>
            <div style="font-size:10px;color:#6B7280;font-family:var(--font-mono);">
              ${new Date(item.timestamp).toLocaleTimeString()}
            </div>
          </div>
        `).join('');
      }

      // Populate Notification Dropdown
      const notifList = document.getElementById('notifications-list');
      const notifBadge = document.getElementById('notification-badge-count');
      if (notifList && overview.activity_feed) {
        if (notifBadge) notifBadge.textContent = overview.activity_feed.length;
        notifList.innerHTML = overview.activity_feed.map(item => `
          <div style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:11px;">
            <div style="font-weight:600;color:#fff;">${item.title}</div>
            <div style="color:#9CA3AF;">${item.description.substring(0, 70)}...</div>
          </div>
        `).join('');
      }

      // Render Cross-System Cascade Chains
      const cascadeEl = document.getElementById('overview-cascade-container');
      if (cascadeEl && overview.cross_system_cascades) {
        cascadeEl.innerHTML = overview.cross_system_cascades.map(c => `
          <div class="cascade-step ${c.severity === 'critical' ? 'critical' : ''}">
            <div class="cascade-step-header">
              <span style="color:${c.severity === 'critical' ? '#F87171' : '#06B6D4'}">
                ${c.source_system} ➔ ${c.target_system}
              </span>
              <span class="badge badge-${c.severity}">${c.severity.toUpperCase()}</span>
            </div>
            <div class="cascade-step-body">
              <strong>${c.consequence_summary}</strong>
              <div style="margin-top:4px;font-size:11px;color:#9CA3AF;">
                ${c.chain_of_consequences ? c.chain_of_consequences.join('<br>') : ''}
              </div>
              <div style="margin-top:6px;font-size:11px;color:#E5E7EB;background:rgba(0,0,0,0.25);padding:6px;border-radius:4px;">
                💡 <em>Recommended Action:</em> ${c.recommended_action}
              </div>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading overview feed:', err);
    }
  }

  // --- Facility Inspector Drawer on Digital Twin Map ---

  async openFacilityInspector(nodeId) {
    this.selectedFacilityId = nodeId;
    const drawer = document.getElementById('facility-inspector-drawer');
    if (!drawer) return;

    try {
      const data = await api.getFacilityInspector(nodeId);
      document.getElementById('drawer-node-name').textContent = data.name;
      document.getElementById('drawer-node-code').textContent = data.code;
      document.getElementById('drawer-node-sector').textContent = data.sector;
      document.getElementById('drawer-node-status').className = `badge badge-${data.status}`;
      document.getElementById('drawer-node-status').textContent = data.status.toUpperCase();
      document.getElementById('drawer-node-desc').textContent = data.description || 'Monitored municipal facility.';
      document.getElementById('drawer-node-capacity').textContent = data.capacity ? `${data.capacity} ${data.capacity_unit}` : 'Standard Capacity';

      // Telemetry sparkline
      const sparkContainer = document.getElementById('drawer-sparkline-canvas');
      if (sparkContainer && data.telemetry_history && data.telemetry_history.length > 0) {
        const labels = data.telemetry_history.map(d => d.time);
        const values = data.telemetry_history.map(d => d.value);

        if (this.inspectorChart) this.inspectorChart.destroy();
        this.inspectorChart = new Chart(sparkContainer, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: data.telemetry_history[0].metric,
              data: values,
              borderColor: '#06B6D4',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              pointRadius: 2
            }]
          },
          options: charts.getCommonOptions('', data.telemetry_history[0].metric)
        });
      }

      // Recent incidents
      const incList = document.getElementById('drawer-incidents-list');
      if (incList) {
        if (!data.recent_incidents || data.recent_incidents.length === 0) {
          incList.innerHTML = '<div style="font-size:11px;color:#6B7280;">No incidents recorded for this asset.</div>';
        } else {
          incList.innerHTML = data.recent_incidents.map(inc => `
            <div style="background:var(--bg-surface);padding:8px;border-radius:4px;margin-bottom:6px;font-size:11px;">
              <div style="font-weight:600;color:#fff;">${inc.number}: ${inc.title}</div>
              <div style="color:#9CA3AF;">${inc.date} • <span class="badge badge-${inc.status}">${inc.status}</span></div>
            </div>
          `).join('');
        }
      }

      drawer.classList.add('open');
    } catch (err) {
      console.error('Error opening facility inspector:', err);
    }
  }

  closeFacilityInspector() {
    const drawer = document.getElementById('facility-inspector-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  // --- View Loaders ---

  async loadIncidentsView() {
    try {
      const incidents = await api.getIncidents();
      this.incidentsList = incidents;
      this.renderIncidentsTable(incidents);
    } catch (err) {
      console.error('Error loading incidents:', err);
    }
  }

  renderIncidentsTable(incidents) {
    const tbody = document.getElementById('incidents-table-body');
    if (!tbody) return;

    if (incidents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#6B7280;padding:16px;">No incidents matching current criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = incidents.map(inc => `
      <tr>
        <td style="font-family:var(--font-mono);font-weight:700;">${inc.incident_number}</td>
        <td style="font-weight:600;">${inc.title}</td>
        <td><span class="badge badge-${inc.category}">${inc.category.toUpperCase()}</span></td>
        <td><span class="badge badge-${inc.severity}">${inc.severity.toUpperCase()}</span></td>
        <td>${inc.location_name}</td>
        <td>${inc.assigned_department}</td>
        <td><span class="badge badge-${inc.status}">${inc.status.toUpperCase()}</span></td>
        <td>
          <div style="display:flex;gap:4px;">
            ${inc.status !== 'resolved' ? `
              <button class="btn-primary" style="padding:3px 7px;font-size:10.5px;" onclick="app.openResolveModal(${inc.id}, '${inc.incident_number}')">
                Manage
              </button>
            ` : '<span style="color:#10B981;font-size:11px;">✓ Closed</span>'}
            ${inc.node_id ? `
              <button class="btn-secondary" style="padding:3px 7px;font-size:10.5px;" onclick="app.locateOnMap(${inc.node_id})">
                Map
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  filterIncidents(filter) {
    document.querySelectorAll('#view-incidents .filter-btn').forEach(b => b.classList.remove('active'));
    if (window.event && window.event.target) window.event.target.classList.add('active');
    if (!this.incidentsList) return;

    let filtered = this.incidentsList;
    if (filter === 'traffic') filtered = this.incidentsList.filter(i => i.category === 'traffic');
    else if (filter === 'electricity') filtered = this.incidentsList.filter(i => i.category === 'electricity');
    else if (filter === 'water') filtered = this.incidentsList.filter(i => i.category === 'water');
    else if (filter === 'open') filtered = this.incidentsList.filter(i => i.status !== 'resolved');
    else if (filter === 'resolved') filtered = this.incidentsList.filter(i => i.status === 'resolved');

    this.renderIncidentsTable(filtered);
  }

  async loadAnomaliesView() {
    try {
      const anomalies = await api.getAnomalies();
      this.anomaliesList = anomalies;
      this.renderAnomaliesTable(anomalies);
    } catch (err) {
      console.error('Error loading anomalies:', err);
    }
  }

  renderAnomaliesTable(anomalies) {
    const tbody = document.getElementById('anomalies-table-body');
    if (!tbody) return;

    if (anomalies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#6B7280;padding:16px;">No detected anomalies. All assets nominal.</td></tr>';
      return;
    }

    tbody.innerHTML = anomalies.map(a => `
      <tr>
        <td style="font-family:var(--font-mono);font-weight:700;">${a.unique_id || 'ANOM-' + a.id}</td>
        <td style="font-weight:600;">${a.event_type}</td>
        <td><span class="badge badge-${a.category}">${a.category.toUpperCase()}</span></td>
        <td><span class="badge badge-${a.severity}">${a.severity.toUpperCase()}</span></td>
        <td>${a.location_name}</td>
        <td>${a.current_value} (Base: ${a.baseline_value})</td>
        <td><span class="badge badge-medium">${a.detection_method}</span></td>
        <td><span class="badge badge-${a.resolution_status || 'detected'}">${(a.resolution_status || 'detected').toUpperCase()}</span></td>
        <td>
          <div style="display:flex;gap:4px;">
            ${!a.is_acknowledged ? `
              <button class="btn-secondary" style="padding:3px 6px;font-size:10px;" onclick="app.ackAnomaly(${a.id})">
                Ack
              </button>
            ` : '<span style="color:#10B981;font-size:10px;">✓ Ack</span>'}
            ${a.resolution_status !== 'resolved' ? `
              <button class="btn-primary" style="padding:3px 6px;font-size:10px;" onclick="app.resolveAnomaly(${a.id})">
                Resolve
              </button>
            ` : '<span style="color:#10B981;font-size:10px;">Resolved</span>'}
          </div>
        </td>
      </tr>
    `).join('');
  }

  filterAnomalies(filter) {
    document.querySelectorAll('#view-anomalies .filter-btn').forEach(b => b.classList.remove('active'));
    if (window.event && window.event.target) window.event.target.classList.add('active');
    if (!this.anomaliesList) return;

    let filtered = this.anomaliesList;
    if (filter === 'critical') filtered = this.anomaliesList.filter(a => a.severity === 'critical');
    else if (filter === 'warning') filtered = this.anomaliesList.filter(a => a.severity === 'warning');
    else if (filter === 'resolved') filtered = this.anomaliesList.filter(a => a.resolution_status === 'resolved');

    this.renderAnomaliesTable(filtered);
  }

  async ackAnomaly(id) {
    try {
      await api.acknowledgeAnomaly(id);
      this.showToast('Anomaly alert acknowledged.', 'success');
      this.loadAnomaliesView();
    } catch (err) {
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  async resolveAnomaly(id) {
    try {
      await api.updateAnomalyStatus(id, 'resolved');
      this.showToast('Anomaly marked as resolved.', 'success');
      this.loadAnomaliesView();
    } catch (err) {
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  async loadTrafficView() {
    try {
      const summary = await api.getTrafficSummary();
      const trends = await api.getTrafficTrends();

      // Top KPIs
      const badgeStatus = document.getElementById('traffic-network-status-badge');
      if (badgeStatus) badgeStatus.textContent = (summary.network_status || 'Fluid').toUpperCase();

      const badgePeak = document.getElementById('traffic-peak-badge');
      if (badgePeak) badgePeak.textContent = (summary.peak_hour_status || 'Standard Operating Flow').toUpperCase();

      const kpiAvgCong = document.getElementById('traffic-kpi-avg-cong');
      if (kpiAvgCong) kpiAvgCong.textContent = `${summary.average_congestion_pct}%`;

      const kpiFlow = document.getElementById('traffic-kpi-total-flow');
      if (kpiFlow) kpiFlow.textContent = `${summary.total_hourly_vehicle_flow?.toLocaleString()} veh/hr`;

      const kpiBottlenecks = document.getElementById('traffic-kpi-bottlenecks');
      if (kpiBottlenecks) kpiBottlenecks.textContent = summary.segments ? summary.segments.filter(s => s.congestion_level > 75).length : 0;

      const avgSpeed = summary.segments && summary.segments.length ? Math.round(summary.segments.reduce((acc, s) => acc + s.avg_speed_kmh, 0) / summary.segments.length) : 38;
      const kpiSpeed = document.getElementById('traffic-kpi-avg-speed');
      if (kpiSpeed) kpiSpeed.textContent = `${avgSpeed} km/h`;

      // Detail Chart
      charts.initTrafficDetailChart('chart-traffic-detail', trends);

      // Store segments & render table
      this.trafficSegments = summary.segments || [];
      this.renderTrafficTable(this.trafficSegments);
    } catch (err) {
      console.error('Error loading traffic view:', err);
    }
  }

  renderTrafficTable(segments) {
    const tbody = document.getElementById('traffic-corridors-table-body');
    if (!tbody) return;

    if (segments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#6B7280;padding:16px;">No corridors match filter.</td></tr>';
      return;
    }

    tbody.innerHTML = segments.map(seg => {
      const isCong = seg.congestion_level >= 75;
      const color = isCong ? '#EF4444' : (seg.congestion_level > 50 ? '#F59E0B' : '#06B6D4');
      return `
        <tr>
          <td style="font-weight:600;color:#fff;">${seg.name}</td>
          <td>${seg.sector}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;background:rgba(255,255,255,0.06);height:6px;border-radius:3px;overflow:hidden;width:80px;">
                <div style="width:${seg.congestion_level}%;background:${color};height:100%;"></div>
              </div>
              <span style="font-family:var(--font-mono);font-weight:700;color:${color}">${seg.congestion_level}%</span>
            </div>
          </td>
          <td style="font-family:var(--font-mono);">${seg.vehicle_flow} veh/hr</td>
          <td style="font-family:var(--font-mono);">${seg.avg_speed_kmh} km/h</td>
          <td>${seg.road_occupancy_pct}%</td>
          <td><span class="badge badge-${isCong ? 'critical' : 'low'}">${isCong ? 'CONGESTED' : 'NOMINAL'}</span></td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="btn-secondary" style="padding:3px 7px;font-size:10.5px;" onclick="app.locateOnMap(${seg.node_id})">
                Map
              </button>
              <button class="btn-primary" style="padding:3px 7px;font-size:10.5px;" onclick="app.simulateTrafficSurge('${seg.name}')">
                Surge
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterTrafficCorridors(filter) {
    document.querySelectorAll('#view-traffic .filter-btn').forEach(b => b.classList.remove('active'));
    if (window.event && window.event.target) window.event.target.classList.add('active');
    if (!this.trafficSegments) return;

    let filtered = this.trafficSegments;
    if (filter === 'congested') filtered = this.trafficSegments.filter(s => s.congestion_level >= 70);
    else if (filter === 'fluid') filtered = this.trafficSegments.filter(s => s.congestion_level < 50);

    this.renderTrafficTable(filtered);
  }

  async loadEnergyView() {
    try {
      const summary = await api.getElectricitySummary();
      const trends = await api.getElectricityTrends();

      // Top KPIs
      const badgeStatus = document.getElementById('energy-status-badge');
      if (badgeStatus) badgeStatus.textContent = (summary.grid_status || 'Stable').toUpperCase();

      const kpiDemand = document.getElementById('energy-kpi-demand');
      if (kpiDemand) kpiDemand.textContent = `${summary.total_power_demand_mw} MW`;

      const kpiCapacity = document.getElementById('energy-kpi-capacity');
      if (kpiCapacity) kpiCapacity.textContent = `${summary.total_grid_capacity_mw} MW`;

      const kpiLoad = document.getElementById('energy-kpi-load');
      if (kpiLoad) kpiLoad.textContent = `${summary.overall_grid_load_pct}%`;

      const kpiOverloads = document.getElementById('energy-kpi-overloads');
      if (kpiOverloads) kpiOverloads.textContent = summary.active_overload_count || 0;

      // Detail Chart
      charts.initEnergyDetailChart('chart-energy-detail', trends);

      // Store substations & render table
      this.energySubstations = summary.substations || [];
      this.renderEnergyTable(this.energySubstations);
    } catch (err) {
      console.error('Error loading energy view:', err);
    }
  }

  renderEnergyTable(substations) {
    const tbody = document.getElementById('energy-substations-table-body');
    if (!tbody) return;

    if (substations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#6B7280;padding:16px;">No substations match filter.</td></tr>';
      return;
    }

    tbody.innerHTML = substations.map(sub => {
      const isOver = sub.grid_load_pct >= 90;
      const color = isOver ? '#EF4444' : '#EAB308';
      return `
        <tr>
          <td style="font-weight:600;color:#fff;">${sub.name}</td>
          <td>${sub.sector}</td>
          <td style="font-family:var(--font-mono);">${sub.current_demand_mw} / ${sub.capacity_mw} MW</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;background:rgba(255,255,255,0.06);height:6px;border-radius:3px;overflow:hidden;width:70px;">
                <div style="width:${Math.min(100, sub.grid_load_pct)}%;background:${color};height:100%;"></div>
              </div>
              <span style="font-family:var(--font-mono);font-weight:700;color:${color}">${sub.grid_load_pct}%</span>
            </div>
          </td>
          <td style="font-family:var(--font-mono);color:${sub.transformer_temp_c > 75 ? '#EF4444' : '#9CA3AF'}">${sub.transformer_temp_c}°C</td>
          <td style="font-family:var(--font-mono);">${sub.frequency_hz} Hz</td>
          <td><span class="badge badge-${isOver ? 'critical' : 'low'}">${isOver ? 'OVERLOAD' : 'NOMINAL'}</span></td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="btn-secondary" style="padding:3px 7px;font-size:10.5px;" onclick="app.locateOnMap(${sub.node_id})">
                Map
              </button>
              <button class="btn-primary" style="padding:3px 7px;font-size:10.5px;" onclick="app.simulateLoadShedding('${sub.name}')">
                Shed
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterEnergySubstations(filter) {
    document.querySelectorAll('#view-energy .filter-btn').forEach(b => b.classList.remove('active'));
    if (window.event && window.event.target) window.event.target.classList.add('active');
    if (!this.energySubstations) return;

    let filtered = this.energySubstations;
    if (filter === 'overloaded') filtered = this.energySubstations.filter(s => s.grid_load_pct >= 90);
    else if (filter === 'normal') filtered = this.energySubstations.filter(s => s.grid_load_pct < 90);

    this.renderEnergyTable(filtered);
  }

  async loadWaterView() {
    try {
      const summary = await api.getWaterSummary();
      const trends = await api.getWaterTrends();

      // Top KPIs
      const badgeStatus = document.getElementById('water-status-badge');
      if (badgeStatus) badgeStatus.textContent = (summary.water_network_status || 'Normal Pressure').toUpperCase();

      const kpiFlow = document.getElementById('water-kpi-flow');
      if (kpiFlow) kpiFlow.textContent = `${summary.total_water_flow_lps} L/s`;

      const kpiPressure = document.getElementById('water-kpi-pressure');
      if (kpiPressure) kpiPressure.textContent = `${summary.average_pressure_psi} PSI`;

      const kpiLeaks = document.getElementById('water-kpi-leaks');
      if (kpiLeaks) kpiLeaks.textContent = summary.active_leak_alerts_count || 0;

      const avgQ = summary.facilities && summary.facilities.length ? Math.round(summary.facilities.reduce((acc, f) => acc + f.water_quality_index, 0) / summary.facilities.length) : 94;
      const kpiQ = document.getElementById('water-kpi-quality');
      if (kpiQ) kpiQ.textContent = `${avgQ} / 100`;

      // Detail Chart
      charts.initWaterDetailChart('chart-water-detail', trends);

      // Store facilities & render table
      this.waterFacilities = summary.facilities || [];
      this.renderWaterTable(this.waterFacilities);
    } catch (err) {
      console.error('Error loading water view:', err);
    }
  }

  renderWaterTable(facilities) {
    const tbody = document.getElementById('water-facilities-table-body');
    if (!tbody) return;

    if (facilities.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#6B7280;padding:16px;">No facilities match filter.</td></tr>';
      return;
    }

    tbody.innerHTML = facilities.map(fac => {
      const isAlert = fac.pressure_psi < 32 || fac.leak_suspected;
      const color = isAlert ? '#EF4444' : '#3B82F6';
      return `
        <tr>
          <td style="font-weight:600;color:#fff;">${fac.name}</td>
          <td>${fac.sector}</td>
          <td style="font-family:var(--font-mono);font-weight:700;color:${color}">${fac.pressure_psi} PSI</td>
          <td style="font-family:var(--font-mono);">${fac.water_flow_lps} L/s</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;background:rgba(255,255,255,0.06);height:6px;border-radius:3px;overflow:hidden;width:60px;">
                <div style="width:${fac.reservoir_level_pct}%;background:#3B82F6;height:100%;"></div>
              </div>
              <span style="font-family:var(--font-mono);font-size:11px;">${fac.reservoir_level_pct}%</span>
            </div>
          </td>
          <td style="font-family:var(--font-mono);">${fac.water_quality_index}/100</td>
          <td><span class="badge badge-${isAlert ? 'critical' : 'low'}">${isAlert ? 'LEAK ALERT' : 'SECURE'}</span></td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="btn-secondary" style="padding:3px 7px;font-size:10.5px;" onclick="app.locateOnMap(${fac.node_id})">
                Map
              </button>
              <button class="btn-primary" style="padding:3px 7px;font-size:10.5px;" onclick="app.simulatePumpBoost('${fac.name}')">
                Boost
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterWaterFacilities(filter) {
    document.querySelectorAll('#view-water .filter-btn').forEach(b => b.classList.remove('active'));
    if (window.event && window.event.target) window.event.target.classList.add('active');
    if (!this.waterFacilities) return;

    let filtered = this.waterFacilities;
    if (filter === 'alerts') filtered = this.waterFacilities.filter(f => f.pressure_psi < 32 || f.leak_suspected);
    else if (filter === 'normal') filtered = this.waterFacilities.filter(f => f.pressure_psi >= 32 && !f.leak_suspected);

    this.renderWaterTable(filtered);
  }

  async loadCrossSystemView() {
    try {
      const overview = await api.getOverview();
      const container = document.getElementById('cross-system-cards-container');
      if (container && overview.cross_system_cascades) {
        container.innerHTML = overview.cross_system_cascades.map((c, i) => `
          <div class="card" style="border-left:4px solid ${c.severity === 'critical' ? '#EF4444' : '#06B6D4'};margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <h4 style="font-size:14px;color:#fff;">Cascade Chain #${i + 1}: ${c.source_system} ➔ ${c.target_system}</h4>
              <span class="badge badge-${c.severity}">${c.severity.toUpperCase()}</span>
            </div>
            <div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">
              <strong>Initial Trigger:</strong> ${c.source_event} at ${c.source_location}
            </div>
            <div style="background:var(--bg-surface);padding:10px;border-radius:6px;font-size:11.5px;margin-bottom:10px;">
              <div style="font-weight:600;color:#fff;margin-bottom:4px;">Cross-System Consequence Steps:</div>
              <div style="color:#CBD5E1;line-height:1.6;">${c.chain_of_consequences ? c.chain_of_consequences.join('<br>') : ''}</div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(6,182,212,0.08);padding:10px;border-radius:4px;border:1px solid rgba(6,182,212,0.2);">
              <div style="font-size:11.5px;color:#E2E8F0;">
                🎯 <strong>Mitigation:</strong> ${c.recommended_action}
              </div>
              <button class="btn-primary" style="padding:4px 10px;font-size:11px;" onclick="app.showToast('Mitigation authorized for ${c.target_system}', 'success')">
                Authorize Mitigation
              </button>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading cross-system view:', err);
    }
  }

  async triggerScenarioDemo(scenarioNum) {
    if (scenarioNum === 1) {
      this.showToast('Simulating Scenario 1: Electronic City Surge ➔ BWSSB Pumping Cut...', 'warning');
      await api.triggerCrisis();
    } else if (scenarioNum === 2) {
      this.showToast('Simulating Scenario 2: Silk Board Collision ➔ Emergency Delay...', 'warning');
      await api.createIncident({
        title: 'Central Silk Board Heavy Freight Collision',
        category: 'traffic',
        severity: 'critical',
        sector: 'Zone 2 - South & Silk Board Hub',
        location_name: 'Central Silk Board Junction',
        assigned_department: 'traffic',
        description: 'Multi-vehicle collision blocking Silk Board flyover and Hosur Road. Emergency fleet delayed by 48 minutes.'
      });
    } else {
      this.showToast('Simulating Scenario 3: Peak Grid Concurrency ➔ Load Shedding...', 'info');
    }

    setTimeout(() => {
      this.refreshAllData();
      this.loadCrossSystemView();
    }, 600);
  }

  async loadRecommendationsView() {
    try {
      const recs = await api.getRecommendations();
      this.recommendationsList = recs;
      this.renderRecommendationsList(recs);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  }

  renderRecommendationsList(recs) {
    const container = document.getElementById('recommendations-list-container');
    if (!container) return;

    if (recs.length === 0) {
      container.innerHTML = '<div style="color:#6B7280;padding:20px;text-align:center;">No pending recommendations. All systems within nominal thresholds.</div>';
      return;
    }

    container.innerHTML = recs.map(r => `
      <div class="card" style="margin-bottom:14px;border-left:4px solid ${r.priority === 'urgent' ? '#EF4444' : '#06B6D4'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-size:14px;font-weight:700;color:#fff;">${r.title}</div>
          <span class="badge badge-${r.priority}">${r.priority.toUpperCase()}</span>
        </div>
        <div style="font-size:11.5px;color:#9CA3AF;margin-bottom:8px;">
          <strong>Sector:</strong> ${r.sector} | <strong>Assets:</strong> ${r.affected_infrastructure}
        </div>
        <div style="background:var(--bg-surface);padding:10px;border-radius:6px;font-size:11.5px;margin-bottom:12px;">
          <div style="margin-bottom:4px;"><strong>What Happened:</strong> ${r.what_happened}</div>
          <div style="margin-bottom:4px;"><strong>Why It Matters:</strong> ${r.why_it_matters}</div>
          <div><strong>Suggested Action:</strong> <span style="color:#06B6D4">${r.suggested_action}</span></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          ${r.status === 'pending' ? `
            <button class="btn-primary" style="padding:5px 12px;font-size:11px;" onclick="app.applyRecommendation(${r.id})">
              ✓ Authorize & Apply
            </button>
            <button class="btn-secondary" style="padding:5px 12px;font-size:11px;" onclick="app.convertRecommendation(${r.id})">
              ⚠ Convert to Incident
            </button>
            <button class="btn-secondary" style="padding:5px 12px;font-size:11px;" onclick="app.dismissRecommendation(${r.id})">
              Dismiss
            </button>
          ` : `<span style="font-size:11px;color:#10B981;font-weight:600;">Status: ${r.status.toUpperCase()}</span>`}
        </div>
      </div>
    `).join('');
  }

  filterRecommendations(filter) {
    document.querySelectorAll('#view-recommendations .filter-btn').forEach(b => b.classList.remove('active'));
    if (window.event && window.event.target) window.event.target.classList.add('active');
    if (!this.recommendationsList) return;

    let filtered = this.recommendationsList;
    if (filter === 'pending') filtered = this.recommendationsList.filter(r => r.status === 'pending');
    else if (filter === 'applied') filtered = this.recommendationsList.filter(r => r.status === 'applied');

    this.renderRecommendationsList(filtered);
  }

  async convertRecommendation(id) {
    try {
      const res = await api.convertRecommendationToIncident(id);
      this.showToast(res.message, 'success');
      this.loadRecommendationsView();
      this.loadIncidentsView();
    } catch (err) {
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  async loadMLView() {
    try {
      const meta = await api.getMLModelsInfo();
      this.mlMetadata = meta;

      const trafficModel = meta.models?.traffic;
      const elecModel = meta.models?.electricity;
      const waterIfModel = meta.models?.water_anomaly;
      const multiIfModel = meta.models?.multi_system_anomaly;

      if (trafficModel) {
        const elS = document.getElementById('ml-traffic-samples');
        if (elS) elS.textContent = `${trafficModel.total_samples} samples`;
        const elR2 = document.getElementById('ml-traffic-r2');
        if (elR2) elR2.textContent = trafficModel.metrics?.r2_score;
        const elM = document.getElementById('ml-traffic-mae');
        if (elM) elM.textContent = `${trafficModel.metrics?.mae}%`;
        const elRm = document.getElementById('ml-traffic-rmse');
        if (elRm) elRm.textContent = `${trafficModel.metrics?.rmse}%`;
        charts.initMLTrafficChart('chart-ml-traffic-comparison', trafficModel.sample_comparison || []);
      }

      if (elecModel) {
        const elS = document.getElementById('ml-elec-samples');
        if (elS) elS.textContent = `${elecModel.total_samples} samples`;
        const elR2 = document.getElementById('ml-elec-r2');
        if (elR2) elR2.textContent = elecModel.metrics?.r2_score;
        const elM = document.getElementById('ml-elec-mae');
        if (elM) elM.textContent = `${elecModel.metrics?.mae} MW`;
        const elRm = document.getElementById('ml-elec-rmse');
        if (elRm) elRm.textContent = `${elecModel.metrics?.rmse} MW`;
        charts.initMLElectricityChart('chart-ml-elec-comparison', elecModel.sample_comparison || []);
      }

      if (waterIfModel) {
        const elF1 = document.getElementById('ml-water-if-f1');
        if (elF1) elF1.textContent = waterIfModel.metrics?.f1_score;
        const elP = document.getElementById('ml-water-if-p');
        if (elP) elP.textContent = waterIfModel.metrics?.precision;
        const elR = document.getElementById('ml-water-if-r');
        if (elR) elR.textContent = waterIfModel.metrics?.recall;
      }

      if (multiIfModel) {
        const elF1 = document.getElementById('ml-multi-if-f1');
        if (elF1) elF1.textContent = multiIfModel.metrics?.f1_score;
        const elP = document.getElementById('ml-multi-if-p');
        if (elP) elP.textContent = multiIfModel.metrics?.precision;
        const elR = document.getElementById('ml-multi-if-r');
        if (elR) elR.textContent = multiIfModel.metrics?.recall;
      }
    } catch (err) {
      console.error('Error loading ML info:', err);
    }
  }

  async loadReportsView() {
    try {
      const summary = await api.getDailySummary();
      const previewEl = document.getElementById('daily-report-preview');
      if (previewEl) {
        previewEl.innerHTML = `
          <div style="background:var(--bg-surface);padding:18px;border-radius:6px;border:1px solid var(--border-color);font-size:12.5px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h4 style="color:#06B6D4;font-size:15px;font-weight:700;">${summary.report_title}</h4>
              <span class="badge badge-low">BENGALURU MUNICIPAL COMPLIANT</span>
            </div>
            <div style="color:#9CA3AF;margin-bottom:14px;font-size:11px;">
              Generated At: ${new Date(summary.generated_at).toLocaleString()} • Operational Zone: Bruhat Bengaluru Mahanagara Palike (BBMP)
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:14px;">
              <div style="background:rgba(255,255,255,0.02);padding:10px;border-radius:4px;border:1px solid rgba(255,255,255,0.06);">
                <span style="color:#9CA3AF;font-size:11px;">Avg Traffic Congestion</span>
                <div style="font-size:18px;font-weight:800;color:#06B6D4;">${summary.key_metrics.average_traffic_congestion_pct}%</div>
              </div>
              <div style="background:rgba(255,255,255,0.02);padding:10px;border-radius:4px;border:1px solid rgba(255,255,255,0.06);">
                <span style="color:#9CA3AF;font-size:11px;">Avg Power Demand</span>
                <div style="font-size:18px;font-weight:800;color:#EAB308;">${summary.key_metrics.average_power_demand_mw} MW</div>
              </div>
              <div style="background:rgba(255,255,255,0.02);padding:10px;border-radius:4px;border:1px solid rgba(255,255,255,0.06);">
                <span style="color:#9CA3AF;font-size:11px;">Avg Mains Pressure</span>
                <div style="font-size:18px;font-weight:800;color:#3B82F6;">${summary.key_metrics.average_water_pressure_psi} PSI</div>
              </div>
              <div style="background:rgba(255,255,255,0.02);padding:10px;border-radius:4px;border:1px solid rgba(255,255,255,0.06);">
                <span style="color:#9CA3AF;font-size:11px;">Active Incidents</span>
                <div style="font-size:18px;font-weight:800;color:#EF4444;">${summary.key_metrics.active_incidents_count}</div>
              </div>
            </div>
            <div style="background:rgba(6,182,212,0.06);border-left:3px solid #06B6D4;padding:12px;border-radius:4px;font-size:12px;line-height:1.5;color:#E2E8F0;">
              <strong>Executive Verdict:</strong> ${summary.executive_verdict}
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error loading reports preview:', err);
    }
  }

  async loadAdminView() {
    try {
      const users = await api.request('/admin/users');
      const tbody = document.getElementById('admin-users-table-body');
      if (tbody && users) {
        tbody.innerHTML = users.map(u => `
          <tr>
            <td style="font-weight:600;color:#fff;">${u.full_name}</td>
            <td>${u.email}</td>
            <td><span class="badge badge-medium">${u.role.toUpperCase()}</span></td>
            <td>${u.department || 'Bruhat Bengaluru Administration'}</td>
            <td>${u.is_active ? '<span style="color:#10B981;font-size:11px;">✓ Active</span>' : '<span style="color:#6B7280;">Inactive</span>'}</td>
          </tr>
        `).join('');
      }

      const simStatus = await api.getSimulationStatus();
      const badge = document.getElementById('admin-sim-status-badge');
      const btn = document.getElementById('admin-btn-toggle-sim');
      if (badge && btn) {
        if (simStatus.is_running) {
          badge.className = 'badge badge-low';
          badge.textContent = `RUNNING (${simStatus.total_cycles_run} CYCLES)`;
          btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Simulation';
        } else {
          badge.className = 'badge badge-high';
          badge.textContent = 'PAUSED';
          btn.innerHTML = '<i class="fa-solid fa-play"></i> Resume Simulation';
        }
      }
    } catch (err) {
      console.error('Error loading admin users:', err);
    }
  }

  async toggleSimulationEngine() {
    try {
      const simStatus = await api.getSimulationStatus();
      if (simStatus.is_running) {
        await api.stopSimulation();
        this.showToast('Background simulation paused.', 'info');
      } else {
        await api.startSimulation();
        this.showToast('Background simulation started.', 'success');
      }
      this.loadAdminView();
    } catch (err) {
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  async injectSimulatedAnomaly() {
    try {
      await api.triggerCrisis();
      this.showToast('Simulated event injected! Inspect Digital Twin or Anomalies view.', 'warning');
      this.refreshAllData();
    } catch (err) {
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  async loadSettingsView() {
    try {
      const health = await api.request('/admin/system-health');
      const container = document.getElementById('settings-diagnostics-container');
      if (container) {
        container.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;font-size:12px;">
            <div style="background:var(--bg-surface);padding:14px;border-radius:6px;border:1px solid var(--border-color);">
              <div style="color:#9CA3AF;font-size:11px;">Database Storage Engine</div>
              <div style="font-weight:700;color:#10B981;margin-top:4px;font-size:14px;">${health.database}</div>
              <div style="color:#6B7280;font-size:10px;margin-top:2px;">Foreign keys active & indexed</div>
            </div>
            <div style="background:var(--bg-surface);padding:14px;border-radius:6px;border:1px solid var(--border-color);">
              <div style="color:#9CA3AF;font-size:11px;">Python &amp; Runtime</div>
              <div style="font-weight:700;color:#fff;margin-top:4px;font-size:14px;">FastAPI (Python ${health.python_version.split(' ')[0]})</div>
              <div style="color:#6B7280;font-size:10px;margin-top:2px;">Async event loop &amp; WebSockets</div>
            </div>
            <div style="background:var(--bg-surface);padding:14px;border-radius:6px;border:1px solid var(--border-color);">
              <div style="color:#9CA3AF;font-size:11px;">4 ML Trained Models</div>
              <div style="font-weight:700;color:#06B6D4;margin-top:4px;font-size:14px;">RF &amp; Isolation Forest Loaded</div>
              <div style="color:#6B7280;font-size:10px;margin-top:2px;">2016 samples trained</div>
            </div>
            <div style="background:var(--bg-surface);padding:14px;border-radius:6px;border:1px solid var(--border-color);">
              <div style="color:#9CA3AF;font-size:11px;">Background Simulation Telemetry</div>
              <div style="font-weight:700;color:#FBBF24;margin-top:4px;font-size:14px;">Cycle #${health.simulation_engine.cycles_run}</div>
              <div style="color:#6B7280;font-size:10px;margin-top:2px;">Cadence: ${health.simulation_engine.interval_seconds}s per step</div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error loading settings diagnostics:', err);
    }
  }

  locateOnMap(nodeId) {
    this.switchView('digital-twin');
    setTimeout(async () => {
      try {
        const data = await api.getFacilityInspector(nodeId);
        if (data && cityMap.map) {
          cityMap.map.setView([data.latitude, data.longitude], 15, { animate: true });
          this.openFacilityInspector(nodeId);
          this.showToast(`Centered on ${data.name}`, 'info');
        }
      } catch (e) {
        console.error(e);
      }
    }, 200);
  }

  simulateTrafficSurge(name) {
    this.showToast(`Traffic surge simulated on ${name}! Congestion spiked to 92%.`, 'warning');
    setTimeout(() => this.loadTrafficView(), 400);
  }

  simulateLoadShedding(name) {
    this.showToast(`Load-shedding active for ${name}. Grid demand reduced by 15 MW.`, 'success');
    setTimeout(() => this.loadEnergyView(), 400);
  }

  simulatePumpBoost(name) {
    this.showToast(`Auxiliary booster activated at ${name}. Pressure stabilized.`, 'success');
    setTimeout(() => this.loadWaterView(), 400);
  }

  async resetDemoState() {
    try {
      await api.resetSimulation();
      this.showToast('Bengaluru digital twin baseline restored.', 'success');
      this.refreshAllData();
      if (this.currentView === 'settings') this.loadSettingsView();
    } catch (err) {
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  // --- Modals & Forms ---

  setupModals() {
    const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-cancel');
    modalCloseButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    const createIncBtn = document.getElementById('btn-open-create-incident');
    if (createIncBtn) {
      createIncBtn.addEventListener('click', () => {
        document.getElementById('modal-create-incident').classList.add('active');
      });
    }

    const drawerCloseBtn = document.getElementById('btn-close-drawer');
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', () => this.closeFacilityInspector());
    }
  }

  setupAuthModals() {
    const loginBtn = document.getElementById('btn-open-login-modal');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        document.getElementById('modal-auth').classList.add('active');
      });
    }

    const authForm = document.getElementById('form-user-login');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('auth-input-username').value;
        const p = document.getElementById('auth-input-password').value;
        try {
          const res = await api.login(u, p);
          this.showToast(`Logged in as: ${res.user.full_name}`, 'success');
          document.getElementById('modal-auth').classList.remove('active');
          this.updateRolePermissions(res.user.role);
        } catch (err) {
          this.showToast(`Login failed: ${err.message}`, 'error');
        }
      });
    }
  }

  setupForms() {
    // Incident Creation
    const createForm = document.getElementById('form-create-incident');
    if (createForm) {
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          title: document.getElementById('inc-form-title').value,
          category: document.getElementById('inc-form-category').value,
          severity: document.getElementById('inc-form-severity').value,
          sector: document.getElementById('inc-form-sector').value,
          location_name: document.getElementById('inc-form-location').value,
          assigned_department: document.getElementById('inc-form-dept').value,
          description: document.getElementById('inc-form-desc').value
        };
        try {
          await api.createIncident(payload);
          this.showToast('Incident registered successfully!', 'success');
          document.getElementById('modal-create-incident').classList.remove('active');
          createForm.reset();
          this.loadIncidentsView();
        } catch (err) {
          this.showToast(`Incident creation error: ${err.message}`, 'error');
        }
      });
    }

    // Traffic ML Predictor Form
    const mlTrafficForm = document.getElementById('form-ml-traffic-predict');
    if (mlTrafficForm) {
      mlTrafficForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          hour_of_day: parseInt(document.getElementById('ml-input-hour').value),
          day_of_week: parseInt(document.getElementById('ml-input-dow').value),
          is_weekend: parseInt(document.getElementById('ml-input-dow').value) >= 5 ? 1 : 0,
          is_rush_hour: [7, 8, 9, 17, 18, 19].includes(parseInt(document.getElementById('ml-input-hour').value)) ? 1 : 0,
          prev_hour_congestion: parseFloat(document.getElementById('ml-input-prev-cong').value),
          rolling_3h_congestion: parseFloat(document.getElementById('ml-input-roll-cong').value),
          weather_impact_score: parseFloat(document.getElementById('ml-input-weather').value),
          vehicle_flow: parseFloat(document.getElementById('ml-input-flow').value)
        };
        try {
          const res = await api.predictTraffic(payload);
          document.getElementById('ml-traffic-pred-result').innerHTML = `
            <div style="background:var(--bg-surface);padding:12px;border-radius:6px;border:1px solid var(--accent-cyan);margin-top:10px;">
              <div style="font-size:11px;color:#9CA3AF;">Predicted Congestion (Random Forest):</div>
              <div style="font-size:22px;font-weight:800;color:#06B6D4;font-family:var(--font-mono);">
                ${res.predicted_congestion_pct}%
              </div>
              <div style="font-size:11px;color:#6B7280;margin-top:2px;">
                90% Confidence Interval: [${res.lower_bound_90pct}% – ${res.upper_bound_90pct}%] (±${res.uncertainty_std}%)
              </div>
            </div>
          `;
        } catch (err) {
          this.showToast(`Prediction failed: ${err.message}`, 'error');
        }
      });
    }

    // Electricity Demand ML Predictor Form
    const mlElecForm = document.getElementById('form-ml-elec-predict');
    if (mlElecForm) {
      mlElecForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          hour_of_day: parseInt(document.getElementById('ml-elec-hour').value),
          day_of_week: parseInt(document.getElementById('ml-elec-dow').value),
          is_weekend: parseInt(document.getElementById('ml-elec-dow').value) >= 5 ? 1 : 0,
          ambient_temp_c: parseFloat(document.getElementById('ml-elec-temp').value),
          is_industrial_shift: 1,
          prev_hour_mw: parseFloat(document.getElementById('ml-elec-prev-mw').value),
          rolling_3h_mw: parseFloat(document.getElementById('ml-elec-prev-mw').value) * 0.96,
          transformer_temp_c: parseFloat(document.getElementById('ml-elec-trans-temp').value)
        };
        try {
          const res = await api.predictElectricity(payload);
          const isOver = res.is_overload_warning;
          document.getElementById('ml-elec-pred-result').innerHTML = `
            <div style="background:var(--bg-surface);padding:12px;border-radius:6px;border:1px solid ${isOver ? '#EF4444' : '#EAB308'};margin-top:10px;">
              <div style="font-size:11px;color:#9CA3AF;">Predicted Grid Power Demand (Random Forest):</div>
              <div style="font-size:22px;font-weight:800;color:${isOver ? '#EF4444' : '#EAB308'};font-family:var(--font-mono);">
                ${res.predicted_demand_mw} MW ${isOver ? '<span class="badge badge-critical" style="font-size:11px;vertical-align:middle;">OVERLOAD RISK</span>' : ''}
              </div>
              <div style="font-size:11px;color:#6B7280;margin-top:2px;">
                90% Confidence Interval: [${res.lower_bound_90pct} MW – ${res.upper_bound_90pct} MW] (±${res.uncertainty_std} MW)
              </div>
            </div>
          `;
        } catch (err) {
          this.showToast(`Forecast failed: ${err.message}`, 'error');
        }
      });
    }
  }

  openResolveModal(id, incidentNumber) {
    const modal = document.getElementById('modal-resolve-incident');
    document.getElementById('resolve-incident-id').value = id;
    document.getElementById('resolve-incident-title').textContent = `Manage / Resolve: ${incidentNumber}`;
    modal.classList.add('active');
  }

  async confirmResolveIncident() {
    const id = document.getElementById('resolve-incident-id').value;
    const notes = document.getElementById('resolve-incident-notes').value || 'Resolved via Command Center';
    const statusVal = document.getElementById('resolve-incident-status-select').value;

    try {
      if (statusVal === 'resolved') {
        await api.resolveIncident(id, notes);
      } else {
        await api.updateIncident(id, { status: statusVal, investigation_notes: notes });
      }
      this.showToast(`Incident updated to ${statusVal.toUpperCase()}.`, 'success');
      document.getElementById('modal-resolve-incident').classList.remove('active');
      this.loadIncidentsView();
      this.loadKPIs();
    } catch (err) {
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  async applyRecommendation(id) {
    try {
      await api.actionRecommendation(id, 'applied');
      this.showToast('Recommendation authorized & applied.', 'success');
      this.loadRecommendationsView();
    } catch (err) {
      this.showToast(`Action error: ${err.message}`, 'error');
    }
  }

  async dismissRecommendation(id) {
    try {
      await api.actionRecommendation(id, 'dismissed');
      this.showToast('Recommendation dismissed.', 'info');
      this.loadRecommendationsView();
    } catch (err) {
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  pollActiveViewData() {
    if (this.currentView === 'overview') this.refreshAllData();
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '10px 18px';
    toast.style.borderRadius = '6px';
    toast.style.fontSize = '12px';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
    toast.style.transition = 'all 0.3s ease';

    if (type === 'error') {
      toast.style.background = '#EF4444';
      toast.style.color = '#fff';
    } else if (type === 'success') {
      toast.style.background = '#10B981';
      toast.style.color = '#fff';
    } else if (type === 'warning') {
      toast.style.background = '#F59E0B';
      toast.style.color = '#000';
    } else {
      toast.style.background = '#18223C';
      toast.style.color = '#06B6D4';
      toast.style.border = '1px solid #06B6D4';
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

const app = new AppController();
document.addEventListener('DOMContentLoaded', () => app.init());

// ============================================================================
// DUBAI DIGITAL TWIN & INTEGRATED OPERATIONS CENTER (IOC) CONTROLLER
// Reference: Image 1 (Dubai Digital Twin) & Image 2 (Curved Command Wall)
// ============================================================================

window.currentCity = 'bengaluru';
window.isIOCWallActive = false;

window.switchCityTwin = function(cityName) {
  const dubaiContainer = document.getElementById('dubai-digital-twin-container');
  const btnTopDubai = document.getElementById('btn-top-dubai');
  const btnTopBlr = document.getElementById('btn-top-bengaluru');
  const btnDubaiSelf = document.getElementById('btn-dubai-self');
  const btnDubaiBlr = document.getElementById('btn-dubai-to-blr');

  if (cityName === 'dubai') {
    window.currentCity = 'dubai';
    if (dubaiContainer) {
      dubaiContainer.style.display = 'block';
      if (window.dubaiTwin && !window.dubaiTwin.isInitialized) {
        window.dubaiTwin.init();
      } else if (window.dubaiTwin) {
        window.dubaiTwin.onWindowResize();
      }
    }
    if (btnTopDubai) btnTopDubai.classList.add('active');
    if (btnTopBlr) btnTopBlr.classList.remove('active');
    if (btnDubaiSelf) btnDubaiSelf.classList.add('active');
    if (btnDubaiBlr) btnDubaiBlr.classList.remove('active');
    if (typeof app !== 'undefined' && app.showToast) {
      app.showToast('🇦🇪 Switched to Dubai Digital Twin (Urban Mobility & Smart City Intelligence)', 'info');
    }
  } else {
    window.currentCity = 'bengaluru';
    if (dubaiContainer) {
      dubaiContainer.style.display = 'none';
    }
    // Also exit IOC wall if open
    if (window.isIOCWallActive) {
      window.toggleIOCCommandWall(false);
    }
    if (btnTopDubai) btnTopDubai.classList.remove('active');
    if (btnTopBlr) btnTopBlr.classList.add('active');
    if (btnDubaiSelf) btnDubaiSelf.classList.remove('active');
    if (btnDubaiBlr) btnDubaiBlr.classList.add('active');
    if (typeof app !== 'undefined' && app.showToast) {
      app.showToast('🇮🇳 Switched to Bengaluru Smart City Intelligence Platform', 'info');
    }
  }
};

window.toggleIOCCommandWall = function(forceState) {
  const dubaiContainer = document.getElementById('dubai-digital-twin-container');
  const cockpitBar = document.getElementById('ioc-cockpit-bar');
  const silhouette = document.getElementById('ioc-operator-silhouette');

  if (typeof forceState === 'boolean') {
    window.isIOCWallActive = forceState;
  } else {
    window.isIOCWallActive = !window.isIOCWallActive;
  }

  // Ensure Dubai container is visible in IOC Wall Mode
  if (window.isIOCWallActive) {
    if (dubaiContainer) {
      dubaiContainer.style.display = 'block';
      dubaiContainer.classList.add('ioc-video-wall');
      if (window.dubaiTwin && !window.dubaiTwin.isInitialized) {
        window.dubaiTwin.init();
      } else if (window.dubaiTwin) {
        window.dubaiTwin.onWindowResize();
      }
    }
    if (cockpitBar) cockpitBar.style.display = 'flex';
    if (silhouette) silhouette.style.display = 'flex';
    if (typeof app !== 'undefined' && app.showToast) {
      app.showToast('🖥️ IOC Curved Multi-Screen Panoramic Video Wall Engaged', 'success');
    }
  } else {
    if (dubaiContainer) {
      dubaiContainer.classList.remove('ioc-video-wall');
      if (window.currentCity === 'bengaluru') {
        dubaiContainer.style.display = 'none';
      }
    }
    if (cockpitBar) cockpitBar.style.display = 'none';
    if (silhouette) silhouette.style.display = 'none';
    if (typeof app !== 'undefined' && app.showToast) {
      app.showToast('Standard Viewport Restored', 'info');
    }
  }
};

window.setDubaiNav = function(el, sectionKey) {
  document.querySelectorAll('.dubai-nav-rail .dubai-nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');

  const focusBox = document.getElementById('dubai-copilot-focus');
  if (focusBox) {
    const focusMap = {
      overview: 'Reduce congestion on Sheikh Zayed Road by optimizing signal timing and rerouting traffic.',
      mobility: 'Autonomous vehicle corridor active on Al Khail Road. Speed regulation steady at 80 km/h.',
      transport: 'Dubai Metro Red & Green line capacity synchronized with Dubai Tram & Water Taxi feeder loops.',
      infra: 'Structural telemetry healthy across Dubai Frame, Infinity Bridge, and Canal Bridges.',
      env: 'Urban heat island mitigation active: Sea breeze channeled via coastline ventilation corridors.',
      buildings: 'BIM energy optimization across Downtown Burj District and Business Bay high-rises.',
      energy: 'DEWA Solar Park integration: 240 MW dispatched to central district cooling plants.',
      safety: 'Civil Defense Drone patrols active along Jumeirah Beach and Dubai Marina waterways.',
      economy: 'Commercial logistics flow running at 99.4% schedule compliance across JAFZA corridors.',
      citizen: 'Smart Dubai 24/7 Citizen response app: 99.1% positive satisfaction rating.',
      ai: 'Multimodal LLM predictive reasoning generating real-time traffic signal phase optimizations.'
    };
    focusBox.textContent = focusMap[sectionKey] || focusMap.overview;
  }
};

window.approveDubaiAction = function() {
  const btn = document.getElementById('btn-approve-dubai-action');
  const trafficPercent = document.getElementById('dubai-traffic-percent');
  const insightText = document.getElementById('dubai-insight-text');

  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing Dispatch...';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Action Approved & Dispatched';
      btn.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';

      if (trafficPercent) {
        trafficPercent.textContent = '64%';
        const fillCircle = document.querySelector('.radial-meter-fill');
        if (fillCircle) {
          // 64% fill: 263.89 * (1 - 0.64) = 94.99
          fillCircle.style.strokeDashoffset = '95';
        }
      }

      if (insightText) {
        insightText.innerHTML = '<strong style="color:#10B981;">Dispatched:</strong> Red Line headway decreased to 2.8 min. Congestion dropping on Sheikh Zayed Road corridor.';
      }

      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast('✅ Transit Dispatch Approved: Dubai Metro frequency increased by 15%', 'success');
      }
    }, 900);
  }
};

window.showDubaiAiRecModal = function() {
  if (typeof app !== 'undefined' && app.showToast) {
    app.showToast('🤖 Agentic AI: 4 Strategic Optimizations Active (Signal Retiming, Red Line headway, Feeder bus reroute, Parking guidance)', 'info');
  }
};

window.showDubaiAllAlerts = function() {
  if (typeof app !== 'undefined' && app.showToast) {
    app.showToast('🚨 Dubai Operations Center: 6 Traffic Incidents under active management by Dubai Police & RTA.', 'warning');
  }
};

// Dubai Real-Time Clock
function updateDubaiClock() {
  const clockEl = document.getElementById('dubai-clock-time');
  if (!clockEl) return;
  const now = new Date();
  const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
  const formatted = now.toLocaleDateString('en-US', options);
  clockEl.innerHTML = `${formatted} GST`;
}
setInterval(updateDubaiClock, 1000);
updateDubaiClock();

// How It Works / Project Guide Modal Handlers
window.openHowItWorksModal = function() {
  const modal = document.getElementById('modal-how-it-works');
  if (modal) modal.style.display = 'flex';
};

window.closeHowItWorksModal = function() {
  const modal = document.getElementById('modal-how-it-works');
  if (modal) modal.style.display = 'none';
};


