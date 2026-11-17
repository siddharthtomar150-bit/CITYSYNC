/**
 * CITYSYNC - Ultra-Realistic Bengaluru 3D Holographic & Photorealistic Digital Twin
 * Built with Three.js (WebGL)
 * 
 * Features:
 * 1. 120+ Procedural Architectural Buildings with illuminated window textures, HVAC units, antennas, and logos.
 * 2. Iconic Bengaluru Landmarks:
 *    - Vidhana Soudha (Neo-Dravidian Dome, 40-pillar portico, golden Kalasa, Cubbon Park green foliage)
 *    - UB City Twin Towers (Concorde & Canberra, luxury galleria, rooftop Helipad with "H" & blinking FAA beacon)
 *    - Electronic City Elevated Expressway with concrete piers & dual-lane traffic
 *    - Central Silk Board Multi-Level Flyover & Interchange
 *    - Peenya Industrial Zone with HV electrical transformer gantries & transmission towers
 *    - Whitefield ITPL Tech Park with skybridge & tech corporate monoliths
 *    - Ulsoor Lake & Bellandur Lake with dynamic specular water shaders
 * 3. Authentic Bengaluru Transport Simulation:
 *    - BMTC Electric Volvo Buses (blue/cyan livery)
 *    - Namma Bengaluru Auto-Rickshaws (iconic yellow-top / green-body 3-wheelers)
 *    - White/Silver IT Cabs & Sedans
 *    - Emergency Ambulances with flashing red/blue strobe beacons
 *    - Realistic LED headlights with forward volumetric road light cones & red taillight trails
 * 4. Namma Metro Rail System:
 *    - Dual-track elevated viaduct with catenary OHE masts & station platforms
 *    - 6-car Namma Metro Purple Line train with glowing cabin windows & front headlights
 * 5. Smart City Police Quadcopter Surveillance Drones:
 *    - Patrolling drones with spinning rotors, navigation lights & downward searchlight cones
 * 6. Dynamic Atmosphere & 24h Time-of-Day Engine:
 *    - 24-hour interactive time slider (00:00 - 23:59)
 *    - Presets: Cyberpunk Night, Sunset Golden Hour, Midday Tactical, Monsoon Storm (with lightning!)
 * 7. 4 Cinematic Camera Modes: Tactical Orbit, Drone FPV Cam, Metro Driver Cab Cam, Cinematic Flyover Tour.
 * 8. Interactive Landmark Architectural Dossier HUD & AI CCTV Feed.
 * 9. Web Audio API Ambient Smart City Synthesizer (Zero audio files, 100% native).
 */

class Bengaluru3DDigitalTwin {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.isInitialized = false;
    this.animationId = null;

    // Infrastructure & Landmark Objects
    this.nodes = [];
    this.nodeMeshes = [];
    this.landmarkClickables = [];
    this.trafficVehicles = [];
    this.metroTrain = null;
    this.metroProgress = 0;
    this.metroSpline = null;
    this.droneObject = null;
    this.droneProgress = 0;
    this.droneSpline = null;
    this.droneRotors = [];
    this.waterMeshes = [];
    this.buildingWindowMaterials = [];
    this.streetLights = [];
    this.beaconLights = [];
    this.cityMapTexture = null;
    this.showWholeCityMap = true;
    this.buildingMode = 'full';
    this.buildingMeshes = [];

    // Weather & Atmosphere
    this.rainParticles = null;
    this.isRaining = false;
    this.lightningLight = null;
    this.nextLightningTime = 0;
    this.currentEnv = 'night';
    this.currentHeatmap = 'none';
    this.timeOfDayHours = 21.5; // 09:30 PM default

    // Camera Modes: 'orbit', 'drone', 'metro', 'tour'
    this.cameraMode = 'orbit';
    this.tourProgress = 0;
    this.tourSpline = null;
    this.autoRotate = false;

    // Interaction & Audio
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.audioCtx = null;
    this.isAudioEnabled = false;
    this.audioNodes = {};

    // Center coordinates for Bengaluru
    this.centerLat = 12.9716;
    this.centerLng = 77.5946;
    this.scaleFactor = 1400;

    // Lighting References
    this.ambientLight = null;
    this.sunLight = null;
    this.cityGlowLight = null;
    this.heatmapMesh = null;
    this.groundGrid = null;
  }

  init(containerId = 'three-container') {
    this.container = document.getElementById(containerId);
    if (!this.container || this.isInitialized) return;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // 1. Scene & Depth Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.0028);

    // 2. Camera Setup (Expansive High-Altitude Overview of Whole Bengaluru)
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 3500);
    this.camera.position.set(0, 480, 560);

    // 3. WebGL Renderer with High-Fidelity Soft Shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2.04;
      this.controls.minDistance = 25;
      this.controls.maxDistance = 850;
      this.controls.target.set(0, 0, 0);
    }

    // 5. Environmental Lighting System
    this.setupEnvironmentalLighting();

    // 6. Terrain, Lakes & Tactical Grid
    this.buildTerrainLakesAndGrid();

    // 7. Arterial Road Network & Street Lamps
    this.buildRoadNetworkAndStreetLamps();

    // 8. 120+ Procedural Textured Skyscraper Blocks
    this.buildDenseCitySkyline();

    // 9. Iconic Handcrafted Bengaluru Landmarks
    this.buildDetailedBengaluruLandmarks();

    // 10. Elevated Namma Metro Viaduct, Stations & Animated Train
    this.buildNammaMetroSystem();

    // 11. Authentic Bengaluru Multi-Vehicle Traffic Simulation
    this.buildAuthenticTrafficSimulation();

    // 12. Smart City Police Quadcopter Drone Patrol
    this.buildPatrolDroneSystem();

    // 13. Monsoon Rain & Atmospheric Particle System
    this.buildRainAndLightningSystem();

    // 14. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('click', (e) => this.onPointerClick(e));

    this.isInitialized = true;
    this.setEnvironment('night');
    this.animate();
  }

  // =========================================================================
  // LIGHTING & ATMOSPHERE
  // =========================================================================

  setupEnvironmentalLighting() {
    this.ambientLight = new THREE.AmbientLight(0x38BDF8, 0.45);
    this.scene.add(this.ambientLight);

    // Primary Sun / Moon Directional Light with Shadows
    this.sunLight = new THREE.DirectionalLight(0x06B6D4, 0.95);
    this.sunLight.position.set(200, 360, 180);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 1000;
    const d = 320;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Warm Secondary Fill Light
    this.cityGlowLight = new THREE.DirectionalLight(0xEAB308, 0.28);
    this.cityGlowLight.position.set(-200, 180, -180);
    this.scene.add(this.cityGlowLight);

    // Lightning Flash Light (Monsoon storm effect)
    this.lightningLight = new THREE.PointLight(0xFFFFFF, 0, 800);
    this.lightningLight.position.set(0, 300, 0);
    this.scene.add(this.lightningLight);
  }

  // =========================================================================
  // TERRAIN, WHOLE CITY MAP, WATER BODIES (LAKES) & TACTICAL GRID
  // =========================================================================

  buildTerrainLakesAndGrid() {
    // Generate the Whole Bengaluru City Map Canvas Texture
    this.cityMapTexture = this.generateWholeCityMapTexture();

    // Holographic Coordinate Grid
    this.groundGrid = new THREE.GridHelper(720, 72, 0x06B6D4, 0x1E293B);
    this.groundGrid.position.y = -0.3;
    this.scene.add(this.groundGrid);

    // Ground Base Plane with Whole Bengaluru City Map Texture
    const groundGeo = new THREE.PlaneGeometry(720, 720, 32, 32);
    const groundMat = new THREE.MeshLambertMaterial({
      map: this.cityMapTexture,
      transparent: true,
      opacity: 0.98
    });
    this.heatmapMesh = new THREE.Mesh(groundGeo, groundMat);
    this.heatmapMesh.rotation.x = -Math.PI / 2;
    this.heatmapMesh.position.y = -0.4;
    this.heatmapMesh.receiveShadow = true;
    this.scene.add(this.heatmapMesh);

    // Tactical Radar Concentric Circles
    [40, 110, 200, 290].forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r, r + 1.2, 72);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x06B6D4 : 0x3B82F6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.22 - (idx * 0.04)
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.12;
      this.scene.add(ring);
    });

    // --- BENGALURU LAKES (Ulsoor Lake & Bellandur Lake) ---
    // 1. Ulsoor Lake (East-Central Bengaluru, near CBD)
    this.createBengaluruLake(70, -25, 38, 26, 'Ulsoor Lake (Halasuru)', '48 Hectares • Historical Vijayanagara Era Reservoir');

    // 2. Bellandur Lake (Southeast Tech Corridor / ORR)
    this.createBengaluruLake(145, 60, 52, 34, 'Bellandur Lake', '360 Hectares • Largest Freshwater Wetland Catchment in Bengaluru');

    // 3. Sankey Tank (Northwest Bengaluru / Sadashivanagar)
    this.createBengaluruLake(-35, -70, 24, 18, 'Sankey Tank Reservoir', 'Built 1882 by Col. Richard Sankey • 15 Hectares');
  }

  // --- High-Resolution 2048x2048 Whole Bengaluru Metropolitan City Map ---
  generateWholeCityMapTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // 1. Base Dark Metropolitan Terrain
    ctx.fillStyle = '#070B16';
    ctx.fillRect(0, 0, 2048, 2048);

    // Subtle 64px Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 2048; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(2048, i); ctx.stroke();
    }

    // 2. BBMP 8 Administrative Zones with tinted translucent fills
    const zones = [
      { name: 'YELAHANKA ZONE (NORTH)', fill: 'rgba(45, 212, 191, 0.05)', stroke: 'rgba(45, 212, 191, 0.4)', pts: [[750, 150], [1480, 150], [1420, 680], [720, 680]] },
      { name: 'DASARAHALLI ZONE (NW)', fill: 'rgba(251, 146, 60, 0.05)', stroke: 'rgba(251, 146, 60, 0.4)', pts: [[320, 480], [720, 480], [740, 850], [300, 850]] },
      { name: 'WEST ZONE (CENTRAL-W)', fill: 'rgba(129, 140, 248, 0.05)', stroke: 'rgba(129, 140, 248, 0.4)', pts: [[600, 850], [1000, 850], [1000, 1200], [550, 1200]] },
      { name: 'EAST ZONE (CBD / INDIRANAGAR)', fill: 'rgba(56, 189, 248, 0.06)', stroke: 'rgba(56, 189, 248, 0.45)', pts: [[1000, 800], [1450, 800], [1450, 1200], [1000, 1200]] },
      { name: 'MAHADEVAPURA (WHITEFIELD / ORR)', fill: 'rgba(244, 114, 182, 0.06)', stroke: 'rgba(244, 114, 182, 0.45)', pts: [[1450, 680], [1980, 680], [1980, 1380], [1450, 1380]] },
      { name: 'SOUTH ZONE (JAYANAGAR / BTM)', fill: 'rgba(52, 211, 153, 0.05)', stroke: 'rgba(52, 211, 153, 0.4)', pts: [[750, 1200], [1220, 1200], [1220, 1600], [750, 1600]] },
      { name: 'BOMMANAHALLI (ELECTRONIC CITY)', fill: 'rgba(251, 191, 36, 0.06)', stroke: 'rgba(251, 191, 36, 0.45)', pts: [[1220, 1240], [1680, 1240], [1680, 1960], [1150, 1960]] },
      { name: 'RR NAGAR (SOUTH-WEST)', fill: 'rgba(167, 139, 250, 0.05)', stroke: 'rgba(167, 139, 250, 0.4)', pts: [[350, 1200], [750, 1200], [750, 1800], [280, 1800]] }
    ];

    zones.forEach(z => {
      ctx.beginPath();
      z.pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();
      ctx.fillStyle = z.fill;
      ctx.fill();
      ctx.strokeStyle = z.stroke;
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 3. Real Natural Water Reservoirs & Lakes
    const lakes = [
      { name: 'Ulsoor Lake', x: 1240, y: 960, rx: 75, ry: 48 },
      { name: 'Bellandur Lake Catchment', x: 1480, y: 1220, rx: 115, ry: 68 },
      { name: 'Varthur Lake', x: 1740, y: 1240, rx: 85, ry: 52 },
      { name: 'Hebbal Lake', x: 1050, y: 680, rx: 70, ry: 42 },
      { name: 'Sankey Tank', x: 920, y: 800, rx: 42, ry: 32 },
      { name: 'Agara Lake', x: 1280, y: 1260, rx: 48, ry: 32 },
      { name: 'Madivala Lake', x: 1160, y: 1280, rx: 58, ry: 40 },
      { name: 'Nagavara Lake', x: 1220, y: 640, rx: 54, ry: 36 },
      { name: 'Yelahanka Lake', x: 1050, y: 440, rx: 65, ry: 42 }
    ];

    lakes.forEach(l => {
      ctx.beginPath();
      ctx.ellipse(l.x, l.y, l.rx, l.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0284C7';
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#BAE6FD';
      ctx.font = 'bold 17px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(l.name, l.x, l.y + 5);
    });

    // 4. Parks & Urban Green Lungs
    const parks = [
      { name: 'Cubbon Park (300 Acres)', x: 1050, y: 980, w: 95, h: 65 },
      { name: 'Lalbagh Botanical Gardens (240 Acres)', x: 1030, y: 1120, w: 90, h: 75 },
      { name: 'Jnana Bharathi Forest Reserve', x: 620, y: 1280, w: 150, h: 110 }
    ];

    parks.forEach(p => {
      ctx.fillStyle = 'rgba(5, 150, 105, 0.45)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(p.x - p.w/2, p.y - p.h/2, p.w, p.h, 12) : ctx.rect(p.x - p.w/2, p.y - p.h/2, p.w, p.h);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6EE7B7';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, p.x, p.y + 5);
    });

    // 5. Complete Arterial Expressway & Ring Road Network
    // Outer Ring Road (ORR) - Complete 60km Circular Beltway
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(1080, 1024, 540, 430, 0, 0, Math.PI * 2);
    ctx.stroke();

    // NICE Peripheral Road Outer Arc (Southwest Bypass)
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(1024, 1024, 790, 0.65 * Math.PI, 1.45 * Math.PI, false);
    ctx.stroke();

    // Major Radial Arterials
    const radials = [
      { pts: [[1150, 1240], [1280, 1450], [1400, 1750], [1480, 1980]], name: 'HOSUR ROAD / ELECTRONIC CITY (NH-44)' },
      { pts: [[1050, 920], [1050, 680], [1050, 420], [1050, 80]], name: 'BELLARY ROAD / AIRPORT EXPRESSWAY (NH-44)' },
      { pts: [[950, 920], [780, 820], [540, 680], [250, 480]], name: 'TUMKUR ROAD / PEENYA (NH-48)' },
      { pts: [[1100, 1000], [1300, 1020], [1550, 1020], [1850, 980]], name: 'OLD AIRPORT ROAD -> WHITEFIELD ITPL' },
      { pts: [[950, 1040], [780, 1150], [580, 1300], [280, 1520]], name: 'MYSORE ROAD / KENGERI (NH-275)' },
      { pts: [[1180, 1140], [1350, 1240], [1580, 1420], [1850, 1650]], name: 'SARJAPUR ROAD' },
      { pts: [[1050, 1120], [1050, 1340], [1050, 1620], [1050, 1980]], name: 'BANNERGHATTA ROAD' },
      { pts: [[980, 1120], [880, 1320], [780, 1600], [680, 1980]], name: 'KANAKAPURA ROAD (NH-209)' },
      { pts: [[1180, 960], [1380, 920], [1620, 880], [1980, 840]], name: 'OLD MADRAS ROAD / KR PURAM (NH-75)' }
    ];

    radials.forEach(r => {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 7;
      ctx.beginPath();
      r.pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.stroke();

      // Centerline yellow dash
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 14]);
      ctx.beginPath();
      r.pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 6. Typography Labels for 25+ Neighborhoods & Major Hubs
    const labels = [
      { text: "KEMPEGOWDA INT'L AIRPORT CORRIDOR (NH-44)", x: 1050, y: 130, col: '#38BDF8', size: 23 },
      { text: "YELAHANKA SATELLITE TOWN", x: 1050, y: 370, col: '#2DD4BF', size: 20 },
      { text: "HEBBAL FLYOVER INTERCHANGE", x: 1050, y: 640, col: '#FBBF24', size: 21 },
      { text: "PEENYA HEAVY INDUSTRIAL ESTATE", x: 520, y: 640, col: '#FB923C', size: 21 },
      { text: "GORAGUNTEPALYA FREIGHT GATEWAY", x: 680, y: 780, col: '#CBD5E1', size: 17 },
      { text: "MALLESHWARAM", x: 860, y: 840, col: '#CBD5E1', size: 17 },
      { text: "RAJAJINAGAR IT COMPLEX", x: 740, y: 920, col: '#CBD5E1', size: 17 },
      { text: "MAJESTIC (KSR RAIL & METRO INTERCHANGE)", x: 880, y: 960, col: '#A78BFA', size: 19 },
      { text: "VIDHANA SOUDHA (STATE LEGISLATURE)", x: 1050, y: 940, col: '#FACC15', size: 21 },
      { text: "MG ROAD / BRIGADE ROAD CBD", x: 1150, y: 990, col: '#38BDF8', size: 19 },
      { text: "INDIRANAGAR 100FT ROAD", x: 1310, y: 980, col: '#CBD5E1', size: 18 },
      { text: "KORAMANGALA TECH STARTUP HUB", x: 1180, y: 1140, col: '#34D399', size: 19 },
      { text: "HSR LAYOUT (SECTORS 1-7)", x: 1290, y: 1220, col: '#CBD5E1', size: 18 },
      { text: "BTM LAYOUT", x: 1080, y: 1220, col: '#CBD5E1', size: 17 },
      { text: "JAYANAGAR RESIDENTIAL HUB", x: 940, y: 1180, col: '#34D399', size: 19 },
      { text: "CENTRAL SILK BOARD MULTI-LEVEL FLYOVER", x: 1150, y: 1260, col: '#EF4444', size: 21 },
      { text: "BELLANDUR ORR TECH CORRIDOR (ECOSPACE)", x: 1540, y: 1160, col: '#F472B6', size: 21 },
      { text: "MARATHAHALLI JUNCTION", x: 1570, y: 1040, col: '#CBD5E1', size: 18 },
      { text: "WHITEFIELD ITPL TECH PARK", x: 1850, y: 960, col: '#F472B6', size: 23 },
      { text: "ELECTRONIC CITY PHASE 1 & 2", x: 1440, y: 1760, col: '#FBBF24', size: 23 },
      { text: "KENGERI SATELLITE TOWN", x: 440, y: 1360, col: '#A78BFA', size: 19 },
      { text: "NICE PERIPHERAL EXPRESSWAY", x: 620, y: 1550, col: '#38BDF8', size: 19 },
      { text: "OUTER RING ROAD (ORR - 60KM LOOP)", x: 1080, y: 1470, col: '#FACC15', size: 20 }
    ];

    labels.forEach(lb => {
      ctx.font = `bold ${lb.size}px 'Inter', sans-serif`;
      const textWidth = ctx.measureText(lb.text).width;
      ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
      ctx.roundRect ? ctx.roundRect(lb.x - textWidth/2 - 8, lb.y - lb.size, textWidth + 16, lb.size + 10, 4) : ctx.fillRect(lb.x - textWidth/2 - 8, lb.y - lb.size, textWidth + 16, lb.size + 10);
      ctx.fill();
      ctx.strokeStyle = lb.col;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = lb.col;
      ctx.textAlign = 'center';
      ctx.fillText(lb.text, lb.x, lb.y);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  toggleWholeCityMap() {
    this.showWholeCityMap = !this.showWholeCityMap;
    if (!this.heatmapMesh) return;
    if (this.showWholeCityMap) {
      this.heatmapMesh.material.map = this.cityMapTexture;
      this.heatmapMesh.material.color.setHex(0xFFFFFF);
      this.heatmapMesh.material.needsUpdate = true;
    } else {
      this.heatmapMesh.material.map = null;
      this.heatmapMesh.material.color.setHex(0x070B14);
      this.heatmapMesh.material.needsUpdate = true;
    }
    const label = document.getElementById('label-ground-map');
    if (label) label.textContent = this.showWholeCityMap ? 'Map: Whole City ON' : 'Map: Tactical Grid';
    if (window.app) window.app.showToast(this.showWholeCityMap ? 'Whole Bengaluru City Map Surface: ACTIVE' : 'Cybernetic Grid Mode: ACTIVE', 'info');
  }

  createBengaluruLake(x, z, radiusX, radiusZ, name, description) {
    const lakeShape = new THREE.Shape();
    lakeShape.absellipse(0, 0, radiusX, radiusZ, 0, Math.PI * 2, false, 0);
    const lakeGeo = new THREE.ShapeGeometry(lakeShape, 32);

    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x0284C7,
      emissive: 0x0369A1,
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });

    const lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
    lakeMesh.rotation.x = -Math.PI / 2;
    lakeMesh.position.set(x, 0.2, z);
    lakeMesh.receiveShadow = true;
    lakeMesh.userData = {
      isLandmark: true,
      name: name,
      category: 'Water Catchment / Ecology',
      specs: description,
      height: 'Depth: 4.8m',
      powerLoad: 'N/A • Protected Eco-Zone',
      waterFlow: 'Catchment Capacity: 3.2 Million m³',
      scadaStatus: 'BWSSB Wetland Sensor Station Active'
    };
    this.scene.add(lakeMesh);
    this.waterMeshes.push(lakeMesh);
    this.landmarkClickables.push(lakeMesh);

    // Lake Shoreline Promenade Neon Ring
    const shorelinePoints = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      shorelinePoints.push(new THREE.Vector3(
        x + Math.cos(theta) * (radiusX + 0.5),
        0.3,
        z + Math.sin(theta) * (radiusZ + 0.5)
      ));
    }
    const shoreGeo = new THREE.BufferGeometry().setFromPoints(shorelinePoints);
    const shoreMat = new THREE.LineBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.5 });
    const shoreLine = new THREE.Line(shoreGeo, shoreMat);
    this.scene.add(shoreLine);
  }

  // =========================================================================
  // ARTERIAL ROAD NETWORK & 3D STREET LAMPS
  // =========================================================================

  buildRoadNetworkAndStreetLamps() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
    const markingMat = new THREE.MeshBasicMaterial({ color: 0xFACC15 });

    // Major Bengaluru Arterials Coordinates
    const arterials = [
      // Outer Ring Road (ORR) Main Arc
      [[-120, 0, 75], [40, 0, 75], [140, 0, 50], [195, 0, -14]],
      // Hosur Road / Electronic City Link
      [[40, 0, 75], [90, 0, 175]],
      // CBD Corridor (MG Road to Silk Board)
      [[22, 0, -60], [22, 0, -10], [40, 0, 75]],
      // Airport Expressway (Hebbal to CBD)
      [[5, 0, -180], [5, 0, -90], [22, 0, -60]],
      // Tumkur Road (Peenya to Goraguntepalya)
      [[-150, 0, -100], [-105, 0, -85], [-30, 0, -50], [22, 0, -60]]
    ];

    arterials.forEach(pts => {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0.25, p[2])));
      // Asphalt Road Deck
      const roadGeo = new THREE.TubeGeometry(curve, 36, 4.2, 4, false);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.scale.set(1, 0.08, 1);
      road.receiveShadow = true;
      this.scene.add(road);

      // Centerline Road Markings
      const lineGeo = new THREE.TubeGeometry(curve, 36, 0.25, 4, false);
      const line = new THREE.Mesh(lineGeo, markingMat);
      line.scale.set(1, 0.12, 1);
      line.position.y = 0.32;
      this.scene.add(line);

      // Add Street Lamps along arterial
      for (let s = 0.1; s <= 0.9; s += 0.15) {
        const pt = curve.getPointAt(s);
        const tan = curve.getTangentAt(s);
        const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        this.createStreetLamp(pt.x + norm.x * 5, pt.z + norm.z * 5);
      }
    });
  }

  createStreetLamp(x, z) {
    const lampGroup = new THREE.Group();
    // Metal pole
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.25, 9, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 4.5;
    lampGroup.add(pole);

    // Lamp arm & head
    const headGeo = new THREE.BoxGeometry(0.8, 0.25, 1.2);
    const head = new THREE.Mesh(headGeo, poleMat);
    head.position.set(0, 9, 0.4);
    lampGroup.add(head);

    // Glowing warm bulb
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xFEF08A });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.8), bulbMat);
    bulb.position.set(0, 8.85, 0.4);
    lampGroup.add(bulb);

    // Downward Volumetric Light Cone
    const coneGeo = new THREE.ConeGeometry(3.5, 9, 12, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xFEF08A,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide
    });
    const lightCone = new THREE.Mesh(coneGeo, coneMat);
    lightCone.position.set(0, 4.5, 0.4);
    lampGroup.add(lightCone);

    lampGroup.position.set(x, 0, z);
    this.scene.add(lampGroup);
    this.streetLights.push({ bulb, lightCone });
  }

  // =========================================================================
  // DENSE CITY SKYLINE (120+ PROCEDURAL TEXTURED BUILDINGS)
  // =========================================================================

  buildDenseCitySkyline() {
    // Generate Procedural Building Window Texture
    const windowTexture = this.generateWindowCanvasTexture();
    const buildingMat = new THREE.MeshStandardMaterial({
      map: windowTexture,
      roughness: 0.35,
      metalness: 0.65
    });
    this.buildingWindowMaterials.push(buildingMat);

    // Urban Clusters across Bengaluru (moderated heights so ground city map & roads remain unobstructed):
    // 1. CBD / MG Road / Richmond Town
    this.generateBuildingCluster(20, -15, 28, 14, 38, buildingMat);

    // 2. Koramangala / Indiranagar Tech Corridor
    this.generateBuildingCluster(65, 35, 22, 12, 30, buildingMat);

    // 3. Bellandur / Marathahalli IT Corridor
    this.generateBuildingCluster(140, 40, 18, 12, 32, buildingMat);

    // 4. Whitefield IT Hub
    this.generateBuildingCluster(195, -15, 16, 12, 34, buildingMat);

    // 5. Electronic City Campus Cluster
    this.generateBuildingCluster(90, 175, 16, 10, 26, buildingMat);

    // 6. Hebbal / Manyata Tech Park Cluster
    this.generateBuildingCluster(5, -95, 14, 10, 28, buildingMat);
  }

  generateWindowCanvasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark glass facade background
    ctx.fillStyle = '#0B1324';
    ctx.fillRect(0, 0, 256, 512);

    // Architectural floor mullions
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;

    const cols = 8;
    const rows = 24;
    const cw = 256 / cols;
    const ch = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rand = Math.random();
        if (rand > 0.55) {
          // Warm glowing office window
          ctx.fillStyle = rand > 0.85 ? '#FEF08A' : '#38BDF8';
          ctx.fillRect(c * cw + 4, r * ch + 4, cw - 8, ch - 8);
        } else {
          // Dark reflective window
          ctx.fillStyle = '#070D18';
          ctx.fillRect(c * cw + 4, r * ch + 4, cw - 8, ch - 8);
        }
        ctx.strokeRect(c * cw, r * ch, cw, ch);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3);
    return tex;
  }

  generateBuildingCluster(centerX, centerZ, count, minHeight, maxHeight, material) {
    const roofDetailsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 55;
      const offsetZ = (Math.random() - 0.5) * 55;
      const x = centerX + offsetX;
      const z = centerZ + offsetZ;

      // Avoid placing buildings right on top of landmarks or water
      if (Math.hypot(x - 22, z - (-18)) < 22) continue; // Vidhana Soudha buffer
      if (Math.hypot(x - 26, z - 2) < 16) continue;     // UB City buffer
      if (Math.hypot(x - 70, z - (-25)) < 28) continue; // Ulsoor Lake buffer
      if (Math.hypot(x - 145, z - 60) < 38) continue;   // Bellandur Lake buffer

      const width = 8 + Math.random() * 7;
      const depth = 8 + Math.random() * 7;
      const height = minHeight + Math.random() * (maxHeight - minHeight);

      const bGeo = new THREE.BoxGeometry(width, height, depth);
      const building = new THREE.Mesh(bGeo, material);
      building.position.set(x, height / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;

      // Metadata for click inspection
      building.userData = {
        isLandmark: true,
        name: `Bengaluru Commercial Tower BLR-${Math.floor(x)}-${Math.floor(z)}`,
        category: 'Commercial & High-Rise Infrastructure',
        specs: `Height: ${Math.floor(height)}m • ${Math.floor(height / 3.5)} Floors • High-Grade Energy Efficiency`,
        height: `${Math.floor(height)}m`,
        powerLoad: `${(height * 0.045).toFixed(2)} MW Active SCADA Feed`,
        waterFlow: `${Math.floor(height * 2.8)} kL/Day BWSSB Supply`,
        scadaStatus: 'Normal Grid Telemetry Online'
      };

      this.scene.add(building);
      this.buildingMeshes.push(building);
      this.landmarkClickables.push(building);

      // Rooftop Equipment (HVAC Chiller units / Water Tanks)
      const hvacGeo = new THREE.BoxGeometry(width * 0.4, 2.2, depth * 0.4);
      const hvac = new THREE.Mesh(hvacGeo, roofDetailsMat);
      hvac.position.set(x, height + 1.1, z);
      this.scene.add(hvac);

      // Rooftop Antenna Mast with Blinking Aviation Red Light for Tall Buildings
      if (height > 45) {
        const antennaGeo = new THREE.CylinderGeometry(0.15, 0.25, 7, 6);
        const antenna = new THREE.Mesh(antennaGeo, roofDetailsMat);
        antenna.position.set(x, height + 3.5, z);
        this.scene.add(antenna);

        const beaconGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(x, height + 7, z);
        this.scene.add(beacon);
        this.beaconLights.push(beacon);
      }
    }
  }

  // =========================================================================
  // ICONIC DETAILED BENGALURU LANDMARKS
  // =========================================================================

  buildDetailedBengaluruLandmarks() {
    // 1. Vidhana Soudha (Neo-Dravidian Architectural Marvel)
    this.buildVidhanaSoudhaComplex(22, -18);

    // 2. UB City Skyscraper Complex & Helipad
    this.buildUBCityTowers(26, 2);

    // 3. Electronic City Elevated Expressway Deck
    this.buildElectronicCityExpressway(90, 175);

    // 4. Central Silk Board Multi-Level Flyover
    this.buildSilkBoardInterchange(40, 75);

    // 5. Peenya Industrial Power Grid Complex
    this.buildPeenyaIndustrialZone(-105, -85);

    // 6. Whitefield ITPL Tech Monolith
    this.buildWhitefieldTechPark(195, -14);
  }

  buildVidhanaSoudhaComplex(x, z) {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xFBBF24,
      emissive: 0xF59E0B,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8
    });

    // Main grand stepped base
    const baseGeo = new THREE.BoxGeometry(42, 5, 24);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 2.5;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Main 3-story legislative hall
    const hallGeo = new THREE.BoxGeometry(36, 12, 20);
    const hall = new THREE.Mesh(hallGeo, stoneMat);
    hall.position.y = 11;
    hall.castShadow = true;
    hall.receiveShadow = true;
    group.add(hall);

    // Grand 40-Pillar Front Portico
    for (let c = -14; c <= 14; c += 2.8) {
      const colGeo = new THREE.CylinderGeometry(0.5, 0.6, 10, 12);
      const col = new THREE.Mesh(colGeo, stoneMat);
      col.position.set(c, 10, 11);
      group.add(col);
    }

    // Majestic Neo-Dravidian Central Dome
    const domeGeo = new THREE.SphereGeometry(6.5, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, goldMat);
    dome.position.y = 17;
    group.add(dome);

    // 4-Tier Gold Kalasa Finial
    const finialGeo = new THREE.ConeGeometry(1.2, 5.5, 16);
    const finial = new THREE.Mesh(finialGeo, goldMat);
    finial.position.y = 25.5;
    group.add(finial);

    // 4 Corner Chhatris
    [[-16, -8], [-16, 8], [16, -8], [16, 8]].forEach(([cx, cz]) => {
      const chhatriPillar = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 6, 8), stoneMat);
      chhatriPillar.position.set(cx, 18, cz);
      const chhatriDome = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), goldMat);
      chhatriDome.position.set(cx, 21.5, cz);
      group.add(chhatriPillar);
      group.add(chhatriDome);
    });

    // Surround with Cubbon Park 3D Trees
    this.createParkTrees(group, 0, 0, 28, 20);

    group.position.set(x, 0, z);
    group.userData = {
      isLandmark: true,
      name: 'Vidhana Soudha (Karnataka Legislature)',
      category: 'Apex State Administrative Seat',
      specs: 'Neo-Dravidian Granite Architecture • Constructed 1956 • Floor Area: 50,000 m²',
      height: '55m (Central Dome)',
      powerLoad: '1.85 MW Dedicated 11kV BESCOM Feeder',
      waterFlow: '120 kL/Day BWSSB Supply',
      scadaStatus: 'Priority Tier-1 Redundant SCADA Online'
    };
    this.scene.add(group);
    this.landmarkClickables.push(group);
  }

  createParkTrees(parentGroup, cx, cz, rangeX, rangeZ) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350F });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.9 });

    for (let i = 0; i < 18; i++) {
      const tx = cx + (Math.random() - 0.5) * rangeX * 2;
      const tz = cz + (Math.random() - 0.5) * rangeZ * 2;
      if (Math.hypot(tx, tz) < 18) continue; // Keep steps clear

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 6), trunkMat);
      trunk.position.y = 1.5;
      tree.add(trunk);

      const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.5, 8), leafMat);
      leaves.position.y = 4.8;
      tree.add(leaves);

      tree.position.set(tx, 0, tz);
      parentGroup.add(tree);
    }
  }

  buildUBCityTowers(x, z) {
    const group = new THREE.Group();
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0284C7,
      emissive: 0x0369A1,
      emissiveIntensity: 0.25,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9
    });

    // Concorde Tower (Tallest - 82m)
    const t1Geo = new THREE.BoxGeometry(10, 82, 10);
    const t1 = new THREE.Mesh(t1Geo, glassMat);
    t1.position.set(0, 41, 0);
    t1.castShadow = true;
    group.add(t1);

    // Rooftop Helipad
    const helipadGeo = new THREE.CylinderGeometry(5.2, 5.2, 1, 32);
    const helipadMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 });
    const helipad = new THREE.Mesh(helipadGeo, helipadMat);
    helipad.position.set(0, 82.5, 0);
    group.add(helipad);

    // Helipad "H" Canvas Texture
    const hCanvas = document.createElement('canvas');
    hCanvas.width = 128;
    hCanvas.height = 128;
    const hCtx = hCanvas.getContext('2d');
    hCtx.fillStyle = '#0284C7';
    hCtx.fillRect(0, 0, 128, 128);
    hCtx.strokeStyle = '#FFFFFF';
    hCtx.lineWidth = 14;
    hCtx.strokeRect(10, 10, 108, 108);
    hCtx.fillStyle = '#FFFFFF';
    hCtx.font = 'bold 64px Inter, sans-serif';
    hCtx.textAlign = 'center';
    hCtx.textBaseline = 'middle';
    hCtx.fillText('H', 64, 64);

    const hTex = new THREE.CanvasTexture(hCanvas);
    const hPlane = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: hTex }));
    hPlane.rotation.x = -Math.PI / 2;
    hPlane.position.set(0, 83.1, 0);
    group.add(hPlane);

    // Red FAA Aviation Warning Beacon
    const beaconGeo = new THREE.SphereGeometry(1, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 85, 0);
    group.add(beacon);
    this.beaconLights.push(beacon);

    // Canberra Tower (Secondary - 64m)
    const t2Geo = new THREE.BoxGeometry(9, 64, 9);
    const t2 = new THREE.Mesh(t2Geo, glassMat);
    t2.position.set(14, 32, 4);
    t2.castShadow = true;
    group.add(t2);

    // Luxury Retail Galleria Podium
    const galleria = new THREE.Mesh(new THREE.BoxGeometry(28, 12, 22), new THREE.MeshStandardMaterial({ color: 0x0F172A }));
    galleria.position.set(7, 6, 2);
    group.add(galleria);

    group.position.set(x, 0, z);
    group.userData = {
      isLandmark: true,
      name: 'UB City (Concorde & Canberra Towers)',
      category: 'Premier CBD Skyscraper & Financial Hub',
      specs: 'Height: 128m (Concorde) • 1 Million sq.ft Commercial Space • Rooftop Heliport Active',
      height: '128m ASL',
      powerLoad: '4.2 MW Peak BESCOM Dual-Feed Substation',
      waterFlow: '240 kL/Day Dedicated Tertiary Treatment',
      scadaStatus: 'Intelligent BMS & Microgrid Active'
    };
    this.scene.add(group);
    this.landmarkClickables.push(group);
  }

  buildElectronicCityExpressway(x, z) {
    const group = new THREE.Group();
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.7 });

    // Elevated Highway Deck (9.98 km real length, 80 units in 3D)
    const deckGeo = new THREE.BoxGeometry(11, 1.4, 85);
    const deck = new THREE.Mesh(deckGeo, roadMat);
    deck.position.set(0, 15, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Concrete Support Pillars
    for (let pz = -36; pz <= 36; pz += 12) {
      const pillarGeo = new THREE.CylinderGeometry(1.4, 1.6, 15, 12);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(0, 7.5, pz);
      pillar.castShadow = true;
      group.add(pillar);
    }

    // Yellow Luminous Lane Divider
    const laneGeo = new THREE.BoxGeometry(0.3, 0.1, 83);
    const laneMat = new THREE.MeshBasicMaterial({ color: 0xFACC15 });
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.position.set(0, 15.75, 0);
    group.add(lane);

    group.position.set(x, 0, z);
    group.userData = {
      isLandmark: true,
      name: 'Electronic City Elevated Expressway (NH-44)',
      category: 'Major Grade-Separated Expressway',
      specs: 'Length: 9.98 km • 4-Lane Access-Controlled Tollway • 70,000 PCU Daily Capacity',
      height: '17m Elevation',
      powerLoad: '0.45 MW LED Streetlight SCADA Grid',
      waterFlow: 'N/A • Stormwater Runoff Harvesters',
      scadaStatus: 'BTP Electronic Toll & ANPR Online'
    };
    this.scene.add(group);
    this.landmarkClickables.push(group);
  }

  buildSilkBoardInterchange(x, z) {
    const group = new THREE.Group();
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });

    // Multi-Level Flyover Ramp Curves
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-30, 0, -25),
      new THREE.Vector3(-12, 10, -8),
      new THREE.Vector3(12, 10, 15),
      new THREE.Vector3(35, 0, 35)
    ]);
    const ramp1 = new THREE.Mesh(new THREE.TubeGeometry(curve1, 32, 3.6, 8, false), roadMat);
    ramp1.castShadow = true;
    group.add(ramp1);

    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(30, 0, -25),
      new THREE.Vector3(10, 16, 0),
      new THREE.Vector3(-25, 0, 30)
    ]);
    const ramp2 = new THREE.Mesh(new THREE.TubeGeometry(curve2, 32, 3.2, 8, false), roadMat);
    ramp2.castShadow = true;
    group.add(ramp2);

    group.position.set(x, 0, z);
    group.userData = {
      isLandmark: true,
      name: 'Central Silk Board Multi-Level Interchange',
      category: 'Critical Traffic Gateway & Transit Hub',
      specs: 'Bengaluru Most Congested Chokepoint • Yellow/Blue Line Metro Interchange Station',
      height: '24m Multi-Tier Elevation',
      powerLoad: '0.85 MW Signal & SCADA Surveillance',
      waterFlow: 'BWSSB South Main Pipeline Conduit',
      scadaStatus: 'High Concurrency Alert Area'
    };
    this.scene.add(group);
    this.landmarkClickables.push(group);
  }

  buildPeenyaIndustrialZone(x, z) {
    const group = new THREE.Group();
    const factoryMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const gantryMat = new THREE.LineBasicMaterial({ color: 0xEAB308, transparent: true, opacity: 0.7 });

    // Industrial warehouses & High-Voltage Grid Gantries
    for (let i = 0; i < 9; i++) {
      const w = 14 + Math.random() * 8;
      const d = 16 + Math.random() * 8;
      const h = 10 + Math.random() * 7;
      const fGeo = new THREE.BoxGeometry(w, h, d);
      const f = new THREE.Mesh(fGeo, factoryMat);
      f.position.set((i % 3) * 20 - 20, h / 2, Math.floor(i / 3) * 20 - 20);
      f.castShadow = true;
      group.add(f);

      // Transformer Wireframe Gantry Cage
      const wire = new THREE.LineSegments(new THREE.WireframeGeometry(fGeo), gantryMat);
      wire.position.copy(f.position);
      group.add(wire);
    }

    group.position.set(x, 0, z);
    group.userData = {
      isLandmark: true,
      name: 'Peenya Industrial Power Substation (220kV)',
      category: 'Heavy Manufacturing & Power Transmission',
      specs: 'One of South Asia Largest Industrial Hubs • 4,500 Manufacturing Units',
      height: '25m Pylons',
      powerLoad: '48.5 MW Heavy Industrial Grid Demand',
      waterFlow: '380 kL/Day Industrial Inflow',
      scadaStatus: 'BESCOM Master SCADA Substation Active'
    };
    this.scene.add(group);
    this.landmarkClickables.push(group);
  }

  buildWhitefieldTechPark(x, z) {
    const group = new THREE.Group();
    const itMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.2,
      metalness: 0.8
    });
    const neonMat = new THREE.LineBasicMaterial({ color: 0x10B981, transparent: true, opacity: 0.8 });

    // Multi-tower IT campus blocks with connecting Skybridge
    for (let i = 0; i < 6; i++) {
      const h = 32 + Math.random() * 26;
      const geo = new THREE.BoxGeometry(12, h, 12);
      const m = new THREE.Mesh(geo, itMat);
      m.position.set((i % 2) * 18 - 9, h / 2, Math.floor(i / 2) * 18 - 18);
      m.castShadow = true;
      group.add(m);

      const wire = new THREE.LineSegments(new THREE.EdgesGeometry(geo), neonMat);
      wire.position.copy(m.position);
      group.add(wire);
    }

    // Skybridge connecting twin towers
    const bridgeGeo = new THREE.BoxGeometry(18, 3.5, 3.5);
    const bridge = new THREE.Mesh(bridgeGeo, itMat);
    bridge.position.set(0, 30, -9);
    group.add(bridge);

    group.position.set(x, 0, z);
    group.userData = {
      isLandmark: true,
      name: 'Whitefield International Tech Park (ITPL)',
      category: 'Flagship Technology Corridor',
      specs: '68-Acre High-Tech Park • 140,000+ Software Professionals • Skybridge Architecture',
      height: '62m',
      powerLoad: '12.4 MW Dedicated Campus Grid',
      waterFlow: '520 kL/Day Reverse Osmosis Recycled',
      scadaStatus: 'Enterprise IoT & Smart Building Active'
    };
    this.scene.add(group);
    this.landmarkClickables.push(group);
  }

  // =========================================================================
  // NAMMA METRO RAIL SYSTEM & ANIMATED 6-CAR TRAIN
  // =========================================================================

  buildNammaMetroSystem() {
    // Metro Elevated Alignment Spline (Majestic -> MG Road -> Indiranagar -> Silk Board)
    const points = [
      new THREE.Vector3(-15, 14, -65), // Majestic Interchange
      new THREE.Vector3(15, 14, -40),  // Vidhana Soudha Station
      new THREE.Vector3(25, 14, -5),   // MG Road Station
      new THREE.Vector3(38, 14, 35),   // Indiranagar / Koramangala
      new THREE.Vector3(45, 14, 75)    // Silk Board Interchange Station
    ];
    this.metroSpline = new THREE.CatmullRomCurve3(points);

    // Concrete Viaduct Track Deck
    const viaductGeo = new THREE.TubeGeometry(this.metroSpline, 48, 1.6, 6, false);
    const viaductMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const viaductMesh = new THREE.Mesh(viaductGeo, viaductMat);
    viaductMesh.castShadow = true;
    viaductMesh.receiveShadow = true;
    this.scene.add(viaductMesh);

    // Viaduct Concrete Support Piers
    for (let s = 0.05; s <= 0.95; s += 0.08) {
      const pt = this.metroSpline.getPointAt(s);
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, pt.y, 8), viaductMat);
      pier.position.set(pt.x, pt.y / 2, pt.z);
      pier.castShadow = true;
      this.scene.add(pier);
    }

    // Metro Stations: MG Road Station Canopy
    const mgStation = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 22), new THREE.MeshStandardMaterial({
      color: 0x6D28D9,
      transparent: true,
      opacity: 0.85
    }));
    mgStation.position.set(25, 16.5, -5);
    this.scene.add(mgStation);

    // 6-Car Namma Metro Purple Line Train
    this.metroTrain = new THREE.Group();
    const trainMat = new THREE.MeshStandardMaterial({ color: 0x7C3AED, roughness: 0.3, metalness: 0.7 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xFEF08A });
    const cabHeadlightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    for (let c = 0; c < 6; c++) {
      const carGroup = new THREE.Group();
      // Stainless steel car body
      const car = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 6.2), trainMat);
      car.castShadow = true;
      carGroup.add(car);

      // Glowing interior windows
      const win = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.9, 5.0), windowMat);
      win.position.y = 0.2;
      carGroup.add(win);

      // Roof Pantograph (on cars 2 and 4)
      if (c === 1 || c === 4) {
        const panto = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.8), new THREE.MeshBasicMaterial({ color: 0xE2E8F0 }));
        panto.position.y = 1.6;
        carGroup.add(panto);
      }

      // Front Driver Cab Headlights on Lead Car
      if (c === 0) {
        const headL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), cabHeadlightMat);
        headL.position.set(-0.7, -0.2, 3.15);
        const headR = headL.clone();
        headR.position.x = 0.7;
        carGroup.add(headL);
        carGroup.add(headR);
      }

      carGroup.position.set(0, 1.5, c * 6.6 - 16.5);
      this.metroTrain.add(carGroup);
    }

    this.scene.add(this.metroTrain);
  }

  // =========================================================================
  // AUTHENTIC BENGALURU MULTI-VEHICLE TRAFFIC SIMULATION
  // =========================================================================

  buildAuthenticTrafficSimulation() {
    const roadSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(38, 1, 75),    // Silk Board
      new THREE.Vector3(90, 1, 175),   // Electronic City
      new THREE.Vector3(135, 1, 50),   // Bellandur ORR
      new THREE.Vector3(195, 1, -14),  // Whitefield
      new THREE.Vector3(22, 1, -10),   // CBD MG Road
      new THREE.Vector3(5, 1, -90),    // Hebbal Flyover
      new THREE.Vector3(-105, 1, -85)  // Peenya
    ]);

    // Spawn 32 authentic Bengaluru vehicles:
    // BMTC Electric Buses, Auto-Rickshaws, Cabs, Ambulances
    for (let i = 0; i < 32; i++) {
      const vGroup = new THREE.Group();
      let vehType = 'car';
      if (i % 6 === 0) vehType = 'bmtc_bus';
      else if (i % 4 === 1) vehType = 'auto_rickshaw';
      else if (i % 15 === 2) vehType = 'ambulance';

      if (vehType === 'bmtc_bus') {
        // BMTC Electric Volvo Bus (Blue/Cyan Livery)
        const busBody = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 2.2, 7.2),
          new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.4 })
        );
        busBody.position.y = 1.1;
        busBody.castShadow = true;
        vGroup.add(busBody);

        // Bus Windows
        const busWin = new THREE.Mesh(
          new THREE.BoxGeometry(2.45, 0.9, 6.0),
          new THREE.MeshBasicMaterial({ color: 0x93C5FD })
        );
        busWin.position.y = 1.4;
        vGroup.add(busWin);

      } else if (vehType === 'auto_rickshaw') {
        // Namma Bengaluru 3-Wheeled Auto (Yellow roof, green body)
        const autoBase = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.9, 2.0),
          new THREE.MeshStandardMaterial({ color: 0x15803D }) // Karnataka Green
        );
        autoBase.position.y = 0.5;
        vGroup.add(autoBase);

        const autoTop = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.7, 1.8),
          new THREE.MeshStandardMaterial({ color: 0xFACC15 }) // Iconic Yellow
        );
        autoTop.position.y = 1.25;
        vGroup.add(autoTop);

      } else if (vehType === 'ambulance') {
        // Emergency 108 Ambulance with Flashing Strobe
        const ambBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 1.4, 3.4),
          new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
        );
        ambBody.position.y = 0.7;
        vGroup.add(ambBody);

        // Dual Red/Blue Flashing Strobe Lightbar
        const strobeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
        strobeL.position.set(-0.4, 1.5, 0);
        const strobeR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), new THREE.MeshBasicMaterial({ color: 0x3B82F6 }));
        strobeR.position.set(0.4, 1.5, 0);
        vGroup.add(strobeL);
        vGroup.add(strobeR);
        vGroup.userData.isAmbulance = true;
        vGroup.userData.strobeL = strobeL;
        vGroup.userData.strobeR = strobeR;

      } else {
        // Standard City Sedan / Cab (White, Silver, Cyan, Gold)
        const colors = [0xFFFFFF, 0x94A3B8, 0x06B6D4, 0xEAB308, 0x334155];
        const carBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.0, 3.0),
          new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.3, metalness: 0.6 })
        );
        carBody.position.y = 0.5;
        carBody.castShadow = true;
        vGroup.add(carBody);
      }

      // Glowing LED Headlights (White)
      const headMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.15), headMat);
      headL.position.set(-0.5, 0.6, 1.55);
      const headR = headL.clone();
      headR.position.x = 0.5;
      vGroup.add(headL);
      vGroup.add(headR);

      // Forward Volumetric Headlight Light Cones
      const headBeamGeo = new THREE.ConeGeometry(1.8, 7, 8, 1, true);
      const headBeamMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.07,
        side: THREE.DoubleSide
      });
      const beamL = new THREE.Mesh(headBeamGeo, headBeamMat);
      beamL.rotation.x = Math.PI / 2;
      beamL.position.set(-0.5, 0.5, 4.8);
      const beamR = beamL.clone();
      beamR.position.x = 0.5;
      vGroup.add(beamL);
      vGroup.add(beamR);

      // Glowing Taillights (Red)
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
      const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.15), tailMat);
      tailL.position.set(-0.5, 0.6, -1.55);
      const tailR = tailL.clone();
      tailR.position.x = 0.5;
      vGroup.add(tailL);
      vGroup.add(tailR);

      this.scene.add(vGroup);
      this.trafficVehicles.push({
        group: vGroup,
        spline: roadSpline,
        progress: (i / 32) + Math.random() * 0.03,
        speed: 0.0010 + Math.random() * 0.0007,
        laneOffset: (i % 2 === 0 ? 1 : -1) * (1.8 + Math.random() * 0.4)
      });
    }
  }

  // =========================================================================
  // SMART CITY POLICE QUADCOPTER DRONE PATROL
  // =========================================================================

  buildPatrolDroneSystem() {
    this.droneObject = new THREE.Group();

    // Carbon fiber central fuselage
    const bodyGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.5, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.droneObject.add(body);

    // 4 Quadcopter Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4].forEach(ang => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 2.8), armMat);
      arm.rotation.y = ang;
      this.droneObject.add(arm);

      // Spinning dual rotor blades
      const rotorGeo = new THREE.BoxGeometry(0.1, 0.05, 1.8);
      const rotorMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4 });
      const rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(Math.cos(ang) * 1.4, 0.3, Math.sin(ang) * 1.4);
      this.droneObject.add(rotor);
      this.droneRotors.push(rotor);
    });

    // Smart City Police Flashing Nav Lights (Green / Red)
    const greenNav = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10B981 }));
    greenNav.position.set(1.4, 0, 0);
    const redNav = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
    redNav.position.set(-1.4, 0, 0);
    this.droneObject.add(greenNav);
    this.droneObject.add(redNav);

    // Downward Tactical Scanning Spotlight Cone
    const coneGeo = new THREE.ConeGeometry(9, 32, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const scanCone = new THREE.Mesh(coneGeo, coneMat);
    scanCone.position.y = -16;
    this.droneObject.add(scanCone);

    // Drone Patrol Flight Path Spline (Circling major hubs)
    this.droneSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(40, 48, 75),    // Silk Board
      new THREE.Vector3(80, 56, 110),   // Towards E-City
      new THREE.Vector3(140, 52, 45),   // Bellandur ORR
      new THREE.Vector3(80, 45, -15),   // Ulsoor Lake
      new THREE.Vector3(22, 50, -18)    // Vidhana Soudha
    ], true);

    this.droneObject.position.set(40, 48, 75);
    this.scene.add(this.droneObject);
  }

  // =========================================================================
  // MONSOON RAIN & ATMOSPHERIC STORM SYSTEM
  // =========================================================================

  buildRainAndLightningSystem() {
    const rainCount = 2800;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 600;
      positions[i + 1] = Math.random() * 240;
      positions[i + 2] = (Math.random() - 0.5) * 600;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x38BDF8,
      size: 1.5,
      transparent: true,
      opacity: 0.7
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  // =========================================================================
  // DYNAMIC 24H TIME-OF-DAY & ENVIRONMENT ENGINE
  // =========================================================================

  setTimeOfDay(hours) {
    this.timeOfDayHours = Math.max(0, Math.min(24, hours));
    if (!this.scene) return;

    // Calculate Sun/Moon position based on 24h arc
    const angle = ((this.timeOfDayHours - 6) / 24) * Math.PI * 2;
    const sunRadius = 400;
    const sunY = Math.sin(angle) * sunRadius;
    const sunX = Math.cos(angle) * sunRadius;

    this.sunLight.position.set(sunX, Math.max(20, sunY), 140);

    const isNight = this.timeOfDayHours < 6 || this.timeOfDayHours > 18.5;
    const isSunset = this.timeOfDayHours >= 17 && this.timeOfDayHours <= 18.5;

    if (isNight) {
      this.scene.background = new THREE.Color(0x060913);
      this.scene.fog.color = new THREE.Color(0x060913);
      this.ambientLight.color.setHex(0x38BDF8);
      this.ambientLight.intensity = 0.42;
      this.sunLight.color.setHex(0x06B6D4);
      this.sunLight.intensity = 0.65;
      this.toggleNightLights(true);
    } else if (isSunset) {
      this.scene.background = new THREE.Color(0x1F1322);
      this.scene.fog.color = new THREE.Color(0x1F1322);
      this.ambientLight.color.setHex(0xF59E0B);
      this.ambientLight.intensity = 0.85;
      this.sunLight.color.setHex(0xF97316);
      this.sunLight.intensity = 1.35;
      this.toggleNightLights(true);
    } else {
      // Crisp daylight
      this.scene.background = new THREE.Color(0x0B1220);
      this.scene.fog.color = new THREE.Color(0x0B1220);
      this.ambientLight.color.setHex(0xFFFFFF);
      this.ambientLight.intensity = 0.95;
      this.sunLight.color.setHex(0xFFFFFF);
      this.sunLight.intensity = 1.6;
      this.toggleNightLights(false);
    }

    const timeDisplay = document.getElementById('label-3d-time');
    if (timeDisplay) {
      const h = Math.floor(this.timeOfDayHours);
      const m = Math.floor((this.timeOfDayHours % 1) * 60);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = (h % 12 || 12).toString().padStart(2, '0');
      const formattedM = m.toString().padStart(2, '0');
      timeDisplay.textContent = `${formattedH}:${formattedM} ${ampm}`;
    }
  }

  toggleNightLights(enable) {
    this.streetLights.forEach(sl => {
      sl.bulb.visible = enable;
      sl.lightCone.visible = enable;
    });
  }

  setEnvironment(mode) {
    this.currentEnv = mode;
    if (!this.scene) return;

    if (mode === 'night') {
      this.setTimeOfDay(22.0);
      if (this.rainParticles) this.rainParticles.visible = false;
      this.isRaining = false;
    } else if (mode === 'sunset') {
      this.setTimeOfDay(17.8);
      if (this.rainParticles) this.rainParticles.visible = false;
      this.isRaining = false;
    } else if (mode === 'day') {
      this.setTimeOfDay(12.5);
      if (this.rainParticles) this.rainParticles.visible = false;
      this.isRaining = false;
    } else if (mode === 'monsoon') {
      this.scene.background = new THREE.Color(0x040810);
      this.scene.fog.color = new THREE.Color(0x040810);
      this.ambientLight.color.setHex(0x38BDF8);
      this.ambientLight.intensity = 0.38;
      this.sunLight.color.setHex(0x0284C7);
      this.sunLight.intensity = 0.55;
      if (this.rainParticles) this.rainParticles.visible = true;
      this.isRaining = true;
      this.toggleNightLights(true);
    }

    if (window.app) window.app.showToast(`Environment mode: ${mode.toUpperCase()}`, 'info');
  }

  setHeatmap(type) {
    this.currentHeatmap = type;
    if (!this.heatmapMesh) return;

    if (type === 'traffic') {
      this.heatmapMesh.material.color.setHex(0xEF4444);
      this.heatmapMesh.material.opacity = 0.35;
    } else if (type === 'energy') {
      this.heatmapMesh.material.color.setHex(0xEAB308);
      this.heatmapMesh.material.opacity = 0.35;
    } else if (type === 'water') {
      this.heatmapMesh.material.color.setHex(0x3B82F6);
      this.heatmapMesh.material.opacity = 0.35;
    } else {
      if (this.showWholeCityMap) {
        this.heatmapMesh.material.color.setHex(0xFFFFFF);
        this.heatmapMesh.material.opacity = 0.98;
      } else {
        this.heatmapMesh.material.color.setHex(0x070B14);
        this.heatmapMesh.material.opacity = 0.96;
      }
    }
  }

  // =========================================================================
  // CAMERA MODES & CINEMATIC FLYOVERS
  // =========================================================================

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'orbit') {
      if (this.controls) this.controls.enabled = true;
      this.resetCamera();
    } else if (mode === 'drone') {
      if (this.controls) this.controls.enabled = false;
      if (window.app) window.app.showToast('Camera locked to Bengaluru Police Patrol Drone FPV View', 'info');
    } else if (mode === 'metro') {
      if (this.controls) this.controls.enabled = false;
      if (window.app) window.app.showToast('Camera locked to Namma Metro Driver Cockpit View', 'info');
    } else if (mode === 'tour') {
      if (this.controls) this.controls.enabled = false;
      this.startCinematicTour();
      if (window.app) window.app.showToast('Starting Bengaluru Panoramic Smart City Cinematic Tour', 'info');
    }

    // Update active button state in HUD
    document.querySelectorAll('.cam-mode-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`btn-cam-${mode}`);
    if (btn) btn.classList.add('active');
  }

  startCinematicTour() {
    this.tourProgress = 0;
    this.tourSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 240, 320),    // High Overview
      new THREE.Vector3(22, 50, 45),     // Vidhana Soudha Close-Up
      new THREE.Vector3(35, 75, 40),     // UB City Heliport swoop
      new THREE.Vector3(70, 30, -10),    // Ulsoor Lake shoreline
      new THREE.Vector3(40, 40, 110),    // Silk Board Interchange
      new THREE.Vector3(145, 45, 90),    // Bellandur Lake & Tech Parks
      new THREE.Vector3(90, 50, 210),    // Electronic City Highway
      new THREE.Vector3(0, 240, 320)     // Return to High Overview
    ], true);
  }

  focusHub(hub) {
    this.setCameraMode('orbit');
    if (!this.controls) return;
    if (hub === 'wholecity') {
      this.resetCamera();
    } else if (hub === 'silkboard') {
      this.animateCameraTo(40, 150, 195, 40, 10, 75);
    } else if (hub === 'ecity') {
      this.animateCameraTo(90, 140, 290, 90, 15, 175);
    } else if (hub === 'cbd') {
      this.animateCameraTo(22, 140, 110, 22, 10, -18);
    } else if (hub === 'whitefield') {
      this.animateCameraTo(195, 140, 105, 195, 15, -14);
    } else if (hub === 'peenya') {
      this.animateCameraTo(-105, 140, 35, -105, 10, -85);
    } else if (hub === 'hebbal') {
      this.animateCameraTo(5, 140, 30, 5, 10, -90);
    } else if (hub === 'bellandur') {
      this.animateCameraTo(145, 130, 175, 145, 0, 60);
    } else if (hub === 'ulsoor') {
      this.animateCameraTo(70, 120, 85, 70, 0, -25);
    } else if (hub === 'majestic') {
      this.animateCameraTo(-15, 130, 45, -15, 10, -65);
    } else if (hub === 'jayanagar') {
      this.animateCameraTo(0, 130, 175, 0, 5, 65);
    }
  }

  resetCamera() {
    this.animateCameraTo(0, 480, 560, 0, 0, 0);
  }

  cycleBuildingMode() {
    if (this.buildingMode === 'full') {
      this.setBuildingMode('ghost');
    } else if (this.buildingMode === 'ghost') {
      this.setBuildingMode('off');
    } else {
      this.setBuildingMode('full');
    }
  }

  setBuildingMode(mode) {
    this.buildingMode = mode;
    this.buildingMeshes.forEach(b => {
      if (mode === 'off') {
        b.visible = false;
      } else if (mode === 'ghost') {
        b.visible = true;
        b.material.transparent = true;
        b.material.opacity = 0.22;
        b.material.wireframe = true;
      } else {
        b.visible = true;
        b.material.transparent = false;
        b.material.opacity = 1.0;
        b.material.wireframe = false;
      }
    });
    const label = document.getElementById('label-buildings');
    if (label) {
      if (mode === 'off') label.textContent = 'Buildings: OFF';
      else if (mode === 'ghost') label.textContent = 'Buildings: Ghost';
      else label.textContent = 'Buildings: 3D';
    }
    if (window.app) window.app.showToast(`Building Display: ${mode.toUpperCase()}`, 'info');
  }

  toggleCommandDock() {
    const dock = document.getElementById('twin-command-dock');
    const toggleIcon = document.getElementById('dock-toggle-icon');
    if (!dock) return;
    const isCollapsed = dock.classList.toggle('collapsed');
    if (toggleIcon) {
      toggleIcon.className = isCollapsed ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
    }
  }

  animateCameraTo(targetCamX, targetCamY, targetCamZ, lookX, lookY, lookZ) {
    const startPos = this.camera.position.clone();
    const targetPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
    const startLook = this.controls.target.clone();
    const targetLook = new THREE.Vector3(lookX, lookY, lookZ);

    let progress = 0;
    const stepAnim = () => {
      progress += 0.04;
      this.camera.position.lerpVectors(startPos, targetPos, progress);
      this.controls.target.lerpVectors(startLook, targetLook, progress);
      if (progress < 1) requestAnimationFrame(stepAnim);
    };
    stepAnim();
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) this.controls.autoRotate = this.autoRotate;
    const btnLabel = document.getElementById('label-3d-rotate');
    if (btnLabel) btnLabel.textContent = this.autoRotate ? 'Stop Rotation' : 'Auto-Rotate 3D';
  }

  // =========================================================================
  // INTERACTIVE DOSSIER HUD & CLICK RAYCASTING
  // =========================================================================

  onPointerClick(event) {
    if (!this.container) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check Infrastructure Nodes First
    const nodeHits = this.raycaster.intersectObjects(this.nodeMeshes, false);
    if (nodeHits.length > 0) {
      const hit = nodeHits.find(i => i.object.userData && i.object.userData.nodeId);
      if (hit && window.app) {
        window.app.openFacilityInspector(hit.object.userData.nodeId);
        window.app.showToast(`Inspecting SCADA Node: ${hit.object.userData.nodeData.name}`, 'info');
        return;
      }
    }

    // 2. Check Landmark & Architectural Building Dossiers
    const landmarkHits = this.raycaster.intersectObjects(this.landmarkClickables, true);
    if (landmarkHits.length > 0) {
      let topHit = landmarkHits[0].object;
      while (topHit && !topHit.userData.isLandmark && topHit.parent) {
        topHit = topHit.parent;
      }
      if (topHit && topHit.userData && topHit.userData.isLandmark) {
        this.openLandmarkDossierModal(topHit.userData);
      }
    }
  }

  openLandmarkDossierModal(data) {
    let modal = document.getElementById('modal-landmark-dossier');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-landmark-dossier';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-card" style="width:580px;max-width:92vw;background:#0A0F1D;border:1px solid #06B6D4;box-shadow:0 12px 36px rgba(0,0,0,0.8);">
          <div class="modal-header">
            <div>
              <div style="font-size:10px;font-family:var(--font-mono);color:#06B6D4;">BENGALURU MUNICIPAL ASSET DOSSIER</div>
              <h3 style="color:#fff;font-size:16px;margin-top:2px;" id="dossier-title">Vidhana Soudha</h3>
            </div>
            <button class="modal-close" onclick="document.getElementById('modal-landmark-dossier').classList.remove('active')">&times;</button>
          </div>
          <div style="padding:16px;font-size:12.5px;color:#CBD5E1;line-height:1.6;">
            <div style="display:inline-block;padding:3px 8px;border-radius:4px;font-family:var(--font-mono);font-size:10.5px;background:rgba(6,182,212,0.15);color:#38BDF8;border:1px solid rgba(6,182,212,0.3);margin-bottom:12px;" id="dossier-category">
              Apex State Administrative Seat
            </div>
            <p id="dossier-specs" style="margin-bottom:14px;color:#94A3B8;"></p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
              <div style="background:#111827;padding:10px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);">
                <div style="font-size:10px;color:#64748B;font-family:var(--font-mono);">ELECTRICAL LOAD (BESCOM)</div>
                <div style="font-size:13px;font-weight:700;color:#FACC15;margin-top:2px;" id="dossier-power">1.85 MW</div>
              </div>
              <div style="background:#111827;padding:10px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);">
                <div style="font-size:10px;color:#64748B;font-family:var(--font-mono);">WATER INFLOW (BWSSB)</div>
                <div style="font-size:13px;font-weight:700;color:#38BDF8;margin-top:2px;" id="dossier-water">120 kL/Day</div>
              </div>
            </div>
            <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);padding:10px;border-radius:6px;color:#10B981;font-family:var(--font-mono);font-size:11px;" id="dossier-scada">
              ● Priority Tier-1 Redundant SCADA Online
            </div>
          </div>
          <div class="modal-footer" style="padding:12px 16px;background:#060A14;display:flex;justify-content:space-between;">
            <button class="btn-secondary" style="font-size:11px;" onclick="threeTwin.openLiveCCTVFeed(document.getElementById('dossier-title').textContent)">
              <i class="fa-solid fa-video"></i> Open Live CCTV
            </button>
            <button class="btn-primary" style="font-size:11px;" onclick="document.getElementById('modal-landmark-dossier').classList.remove('active')">
              Close Dossier
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('dossier-title').textContent = data.name || 'Municipal Infrastructure';
    document.getElementById('dossier-category').textContent = data.category || 'Asset';
    document.getElementById('dossier-specs').textContent = data.specs || '';
    document.getElementById('dossier-power').textContent = data.powerLoad || 'Normal Telemetry';
    document.getElementById('dossier-water').textContent = data.waterFlow || 'Normal Flow';
    document.getElementById('dossier-scada').textContent = `● ${data.scadaStatus || 'SCADA Online'}`;

    modal.classList.add('active');
  }

  // =========================================================================
  // SIMULATED AI TRAFFIC SURVEILLANCE CAMERA (CCTV HUD)
  // =========================================================================

  openLiveCCTVFeed(corridorName = 'Central Silk Board Junction') {
    let cctvModal = document.getElementById('modal-cctv-feed');
    if (!cctvModal) {
      cctvModal = document.createElement('div');
      cctvModal.id = 'modal-cctv-feed';
      cctvModal.className = 'modal-overlay';
      cctvModal.innerHTML = `
        <div class="modal-card" style="width:680px;max-width:95vw;background:#0A0F1D;border:1px solid #06B6D4;">
          <div class="modal-header">
            <div>
              <div style="font-size:10px;font-family:var(--font-mono);color:#06B6D4;">BTP AI OPTICAL TRAFFIC SURVEILLANCE • CAM-BLR-04</div>
              <h3 style="color:#fff;font-size:15px;margin-top:2px;" id="cctv-camera-title">Central Silk Board Junction - Cam 04</h3>
            </div>
            <button class="modal-close" onclick="document.getElementById('modal-cctv-feed').classList.remove('active')">&times;</button>
          </div>
          <div style="position:relative;background:#000;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);height:340px;">
            <canvas id="cctv-canvas" width="640" height="340" style="width:100%;height:100%;"></canvas>
            <div style="position:absolute;top:10px;left:12px;font-family:var(--font-mono);font-size:10px;color:#10B981;background:rgba(0,0,0,0.75);padding:4px 8px;border-radius:4px;">
              ● LIVE • AI OBJECT TRACKING & ANPR ACTIVE
            </div>
            <div style="position:absolute;top:10px;right:12px;font-family:var(--font-mono);font-size:10px;color:#94A3B8;background:rgba(0,0,0,0.75);padding:4px 8px;border-radius:4px;">
              FPS: 30 • 1080p BTP SCADA
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:11.5px;color:#94A3B8;">
            <div>Vehicles in Frame: <strong style="color:#fff;" id="cctv-veh-count">19</strong> | Avg Velocity: <strong style="color:#06B6D4;" id="cctv-avg-spd">36 km/h</strong></div>
            <button class="btn-primary" style="font-size:11px;" onclick="window.app.showToast('AI optical violation snapshot archived with digital signature.', 'success')">
              Capture AI Snapshot
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(cctvModal);
    }

    const titleEl = document.getElementById('cctv-camera-title');
    if (titleEl) titleEl.textContent = `${corridorName} - Optical Feed`;
    cctvModal.classList.add('active');
    this.startCCTVSimulation();
  }

  startCCTVSimulation() {
    const canvas = document.getElementById('cctv-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const renderCCTV = () => {
      if (!document.getElementById('modal-cctv-feed')?.classList.contains('active')) return;
      frame++;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road perspective lines
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(110, 340); ctx.lineTo(270, 70);
      ctx.moveTo(530, 340); ctx.lineTo(370, 70);
      ctx.stroke();

      // Dashed lane divider
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      ctx.setLineDash([14, 14]);
      ctx.beginPath();
      ctx.moveTo(320, 340); ctx.lineTo(320, 70);
      ctx.stroke();
      ctx.setLineDash([]);

      // Simulated Vehicles with Green AI Bounding Boxes & ANPR License Tags
      const vehicles = [
        { x: 210 + Math.sin(frame * 0.04) * 14, y: 170 + (frame % 170), label: 'KA-01-MJ-4021', type: 'CAR', spd: 42 },
        { x: 390 + Math.cos(frame * 0.03) * 12, y: 90 + ((frame * 1.1) % 250), label: 'BMTC-EV-0912', type: 'BUS', spd: 26 },
        { x: 250, y: 70 + ((frame * 0.9) % 220), label: 'KA-05-AA-1120', type: 'SUV', spd: 48 },
        { x: 310 + Math.sin(frame * 0.06) * 8, y: 140 + ((frame * 0.7) % 190), label: 'KA-04-E-8831', type: 'AUTO', spd: 32 }
      ];

      vehicles.forEach(v => {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(v.x - 18, v.y - 12, 36, 24);
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(v.x - 22, v.y - 16, 44, 32);
        ctx.fillStyle = '#10B981';
        ctx.font = '9px monospace';
        ctx.fillText(`[${v.type}: ${v.spd} km/h • ${v.label}]`, v.x - 22, v.y - 19);
      });

      // Scanline beam
      ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.fillRect(0, (frame * 2.5) % canvas.height, canvas.width, 4);

      requestAnimationFrame(renderCCTV);
    };
    renderCCTV();
  }

  // =========================================================================
  // WEB AUDIO API AMBIENT SOUND SYNTHESIZER
  // =========================================================================

  toggleAmbientAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.audioCtx = new AudioContext();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isAudioEnabled = !this.isAudioEnabled;
    const btn = document.getElementById('btn-3d-audio');

    if (this.isAudioEnabled) {
      // 1. Low frequency city hum
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, this.audioCtx.currentTime); // Low 55Hz city grid hum
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      this.audioNodes.hum = { osc, gain };

      if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-high" style="color:var(--accent-emerald);"></i> Audio: ON';
      if (window.app) window.app.showToast('Ambient Smart City Audio Synthesizer: ACTIVE', 'success');
    } else {
      if (this.audioNodes.hum) {
        this.audioNodes.hum.osc.stop();
        delete this.audioNodes.hum;
      }
      if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Audio: OFF';
      if (window.app) window.app.showToast('Ambient Smart City Audio: MUTED', 'info');
    }
  }

  // =========================================================================
  // CRISIS SHOCKWAVE SIMULATION
  // =========================================================================

  triggerCrisisShockwave() {
    const shockGeo = new THREE.SphereGeometry(4, 32, 32);
    const shockMat = new THREE.MeshBasicMaterial({ color: 0xEF4444, transparent: true, opacity: 0.9, wireframe: true });
    const shockSphere = new THREE.Mesh(shockGeo, shockMat);
    shockSphere.position.set(40, 10, 75);
    this.scene.add(shockSphere);

    let scale = 1;
    const expandAnim = () => {
      scale += 1.1;
      shockSphere.scale.set(scale, scale, scale);
      shockMat.opacity = Math.max(0, 0.9 - (scale / 48));
      if (shockMat.opacity > 0) requestAnimationFrame(expandAnim);
      else this.scene.remove(shockSphere);
    };
    expandAnim();

    // Cascading red propagation beam to Electronic City
    const beamPoints = [new THREE.Vector3(40, 14, 75), new THREE.Vector3(90, 15, 175)];
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
    const beamMat = new THREE.LineBasicMaterial({ color: 0xEF4444, linewidth: 5 });
    const beamLine = new THREE.Line(beamGeo, beamMat);
    this.scene.add(beamLine);

    setTimeout(() => this.scene.remove(beamLine), 5000);
  }

  // =========================================================================
  // INFRASTRUCTURE NODE TELEMETRY HOLOGRAMS
  // =========================================================================

  updateNodes(nodes) {
    this.nodes = nodes;
    this.clearNodes();

    nodes.forEach(node => {
      const x = (node.longitude - this.centerLng) * this.scaleFactor;
      const z = -(node.latitude - this.centerLat) * this.scaleFactor;
      const y = 8;

      const isCritical = node.status === 'critical';
      const isWarning = node.status === 'warning';
      let color = 0x06B6D4;
      if (node.category === 'electricity') color = 0xEAB308;
      if (node.category === 'water') color = 0x3B82F6;
      if (node.category === 'utility') color = 0x8B5CF6;
      if (isCritical) color = 0xEF4444;
      else if (isWarning) color = 0xF59E0B;

      // Holographic Vertical Telemetry Beacon
      const cylGeo = new THREE.CylinderGeometry(1.4, 2.8, 20, 16);
      const cylMat = new THREE.MeshLambertMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: isCritical ? 0.95 : 0.45,
        transparent: true,
        opacity: 0.88
      });
      const beacon = new THREE.Mesh(cylGeo, cylMat);
      beacon.position.set(x, y + 10, z);
      beacon.userData = { nodeId: node.id, nodeData: node };
      this.scene.add(beacon);
      this.nodeMeshes.push(beacon);

      // Radar Pulse Ring on Ground
      const pulseGeo = new THREE.RingGeometry(3.5, 4.4, 32);
      const pulseMat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
      const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
      pulseRing.rotation.x = -Math.PI / 2;
      pulseRing.position.set(x, 0.35, z);
      this.scene.add(pulseRing);
      this.nodeMeshes.push(pulseRing);

      // Floating 3D Text Billboard Sprite
      const sprite = this.createLabelSprite(node.name, color, node.status, node.category);
      sprite.position.set(x, y + 26, z);
      this.scene.add(sprite);
      this.nodeMeshes.push(sprite);
    });
  }

  clearNodes() {
    this.nodeMeshes.forEach(mesh => this.scene.remove(mesh));
    this.nodeMeshes = [];
  }

  createLabelSprite(text, colorHex, status, category) {
    const canvas = document.createElement('canvas');
    canvas.width = 340;
    canvas.height = 76;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(11, 16, 29, 0.94)';
    ctx.roundRect ? ctx.roundRect(0, 0, 340, 76, 8) : ctx.fillRect(0, 0, 340, 76);
    ctx.fill();

    ctx.strokeStyle = status === 'critical' ? '#EF4444' : '#' + colorHex.toString(16).padStart(6, '0');
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(text.length > 25 ? text.substring(0, 23) + '...' : text, 14, 30);

    ctx.fillStyle = status === 'critical' ? '#EF4444' : '#38BDF8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${category.toUpperCase()} • ${status.toUpperCase()}`, 14, 54);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(34, 7.6, 1);
    return sprite;
  }

  // =========================================================================
  // MAIN ANIMATION & RENDER LOOP
  // =========================================================================

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Controls Update in Orbit Mode
    if (this.cameraMode === 'orbit' && this.controls) {
      this.controls.update();
    }

    // 2. Animate Namma Metro Train along viaduct
    if (this.metroTrain && this.metroSpline) {
      this.metroProgress += 0.0016;
      if (this.metroProgress > 1) this.metroProgress = 0;
      const pt = this.metroSpline.getPointAt(this.metroProgress);
      const tangent = this.metroSpline.getTangentAt(this.metroProgress);
      if (pt) {
        this.metroTrain.position.copy(pt);
        this.metroTrain.lookAt(pt.clone().add(tangent));

        // In Metro Driver Cockpit View: lock camera inside front car
        if (this.cameraMode === 'metro') {
          const cabOffset = tangent.clone().multiplyScalar(4).add(new THREE.Vector3(0, 3.2, 0));
          this.camera.position.copy(pt).add(cabOffset);
          this.camera.lookAt(pt.clone().add(tangent.clone().multiplyScalar(40)));
        }
      }
    }

    // 3. Animate 3D Traffic Vehicles along corridors
    this.trafficVehicles.forEach(v => {
      v.progress += v.speed;
      if (v.progress > 1) v.progress = 0;
      const pt = v.spline.getPointAt(v.progress);
      const tan = v.spline.getTangentAt(v.progress);
      if (pt) {
        const normal = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        const lanePt = pt.clone().add(normal.multiplyScalar(v.laneOffset));
        v.group.position.copy(lanePt);
        v.group.position.y = 0.5;
        v.group.lookAt(lanePt.clone().add(tan));

        // Animate ambulance flashing strobe lights
        if (v.group.userData.isAmbulance) {
          const strobe = Math.sin(elapsedTime * 12) > 0;
          v.group.userData.strobeL.material.color.setHex(strobe ? 0xEF4444 : 0x220000);
          v.group.userData.strobeR.material.color.setHex(!strobe ? 0x3B82F6 : 0x001133);
        }
      }
    });

    // 4. Animate Smart City Police Patrol Drone
    if (this.droneObject && this.droneSpline) {
      this.droneProgress += 0.0012;
      if (this.droneProgress > 1) this.droneProgress = 0;
      const dPt = this.droneSpline.getPointAt(this.droneProgress);
      const dTan = this.droneSpline.getTangentAt(this.droneProgress);
      if (dPt) {
        this.droneObject.position.copy(dPt);
        this.droneObject.lookAt(dPt.clone().add(dTan));

        // Spin drone rotors fast
        this.droneRotors.forEach(r => {
          r.rotation.y += 0.45;
        });

        // In Drone FPV View: lock camera right behind and above drone
        if (this.cameraMode === 'drone') {
          const followOffset = dTan.clone().multiplyScalar(-14).add(new THREE.Vector3(0, 6, 0));
          this.camera.position.copy(dPt).add(followOffset);
          this.camera.lookAt(dPt.clone().add(dTan.clone().multiplyScalar(25)));
        }
      }
    }

    // 5. Cinematic Smart City Flyover Tour Camera
    if (this.cameraMode === 'tour' && this.tourSpline) {
      this.tourProgress += 0.0006;
      if (this.tourProgress > 1) this.tourProgress = 0;
      const camPt = this.tourSpline.getPointAt(this.tourProgress);
      const lookPt = this.tourSpline.getPointAt((this.tourProgress + 0.08) % 1);
      if (camPt && lookPt) {
        this.camera.position.copy(camPt);
        this.camera.lookAt(lookPt);
      }
    }

    // 6. Blinking Aviation Warning Beacons
    const beaconFlash = Math.sin(elapsedTime * 4) > 0.3;
    this.beaconLights.forEach(b => {
      b.material.color.setHex(beaconFlash ? 0xEF4444 : 0x330000);
    });

    // 7. Monsoon Rain Simulation & Lightning
    if (this.isRaining && this.rainParticles && this.rainParticles.visible) {
      const positions = this.rainParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 5.5;
        if (positions[i] < 0) positions[i] = 240;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;

      // Random Periodic Lightning Flashes
      if (elapsedTime > this.nextLightningTime) {
        this.lightningLight.intensity = 4.5;
        setTimeout(() => { if (this.lightningLight) this.lightningLight.intensity = 0; }, 80);
        setTimeout(() => { if (this.lightningLight) this.lightningLight.intensity = 3.0; }, 160);
        setTimeout(() => { if (this.lightningLight) this.lightningLight.intensity = 0; }, 240);
        this.nextLightningTime = elapsedTime + 4 + Math.random() * 8;
      }
    }

    // 8. Specular Water Waves Shimmer
    this.waterMeshes.forEach(w => {
      w.material.emissiveIntensity = 0.25 + Math.sin(elapsedTime * 2.5) * 0.1;
    });

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

const threeTwin = new Bengaluru3DDigitalTwin();
