/**
 * CITYSYNC - DUBAI 3D DIGITAL TWIN WEBGL ENGINE
 * Reference: Reference Image 1 (Urban Mobility & Smart City Intelligence)
 * High-fidelity procedural 3D model of Dubai featuring:
 * - Burj Khalifa (828m stepped spire with aviation beacon)
 * - Palm Jumeirah (archipelago, trunk, fronds & crescent)
 * - Burj Al Arab (sail architecture on offshore island)
 * - Dubai Frame (golden monumental portal)
 * - Sheikh Zayed Road (12-lane glowing congestion heat ribbons)
 * - Dubai Metro Red Line (elevated viaduct with animated driverless train)
 * - Arabian Gulf water shader & coastal geography
 * - 3D floating location HUD pins matching reference image
 */

class Dubai3DDigitalTwin {
  constructor(containerId = 'dubai-three-viewport') {
    this.containerId = containerId;
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animId = null;

    // Animated components
    this.trafficParticles = [];
    this.metroTrain = null;
    this.metroPathProgress = 0;
    this.metroSpeed = 0.0008;
    this.beaconLight = null;
    this.time = 0;
    this.landmarks = [];
    this.locationPins = [];

    // Interactive settings
    this.autoRotate = true;
    this.isInitialized = false;
  }

  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`Dubai twin container #${this.containerId} not found.`);
      return;
    }

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.0012);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 6000);
    // Elevated panoramic view matching Image 1 vantage point
    this.camera.position.set(-320, 280, 480);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.05; // Do not go below ground
      this.controls.minDistance = 60;
      this.controls.maxDistance = 1400;
      this.controls.target.set(40, 20, 0); // Focus near Downtown & SZR
      this.controls.autoRotate = this.autoRotate;
      this.controls.autoRotateSpeed = 0.35;
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Geography: Arabian Gulf Ocean & Coastline
    this.createOceanAndTerrain();

    // 7. World-Famous Landmarks
    this.buildBurjKhalifa();
    this.buildBurjAlArab();
    this.buildPalmJumeirah();
    this.buildDubaiFrame();

    // 8. Urban Districts (Downtown, Business Bay, Marina, Al Quoz, Deira)
    this.buildUrbanDistricts();

    // 9. Sheikh Zayed Road & Glowing Traffic Ribbons
    this.buildSheikhZayedRoadTraffic();

    // 10. Dubai Metro Red Line Elevated Viaduct & Animated Train
    this.buildDubaiMetroRedLine();

    // 11. Location Pins matching Reference Image
    this.setupLocationPins();

    // Window resize handler
    window.addEventListener('resize', () => this.onWindowResize());

    this.isInitialized = true;
    this.animate();
  }

  setupLighting() {
    // Ambient light with futuristic dark-blue city fill
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    this.scene.add(ambientLight);

    // Desert sun / directional key light
    const sunLight = new THREE.DirectionalLight(0xfff3d6, 1.8);
    sunLight.position.set(400, 600, 300);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 50;
    sunLight.shadow.camera.far = 1500;
    const d = 500;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Cyan accent light reflecting off the Arabian Gulf & glass towers
    const coastalGlow = new THREE.PointLight(0x06b6d4, 2.5, 900);
    coastalGlow.position.set(-250, 100, 0);
    this.scene.add(coastalGlow);

    // Burj Khalifa vertical uplighting
    const burjGlow = new THREE.PointLight(0x38bdf8, 3.5, 400);
    burjGlow.position.set(120, 20, -60);
    this.scene.add(burjGlow);

    // Flashing red aviation warning beacon on top of Burj Khalifa
    this.beaconLight = new THREE.PointLight(0xef4444, 4.0, 150);
    this.beaconLight.position.set(120, 275, -60);
    this.scene.add(this.beaconLight);
  }

  createOceanAndTerrain() {
    // 1. Arabian Gulf Water Surface
    const waterGeo = new THREE.PlaneGeometry(1600, 2000, 48, 48);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x052a42,
      roughness: 0.15,
      metalness: 0.85,
      flatShading: false
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-500, -0.2, 0);
    water.receiveShadow = true;
    this.scene.add(water);

    // 2. Dubai Mainland Ground (Desert / Urban Platform)
    const landGeo = new THREE.PlaneGeometry(1600, 2000, 32, 32);
    const landMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.9,
      metalness: 0.2
    });
    const land = new THREE.Mesh(landGeo, landMat);
    land.rotation.x = -Math.PI / 2;
    land.position.set(300, 0, 0);
    land.receiveShadow = true;
    this.scene.add(land);

    // Subtle tactical coordinate grid on mainland
    const grid = new THREE.GridHelper(1400, 70, 0x0ea5e9, 0x1e293b);
    grid.position.set(300, 0.1, 0);
    this.scene.add(grid);
  }

  buildBurjKhalifa() {
    // Burj Khalifa: World's tallest building (stepped tapering Y-shape)
    const burjGroup = new THREE.Group();
    const bx = 120, bz = -60;

    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x24364f,
      metalness: 0.9,
      roughness: 0.18,
      emissive: 0x072840,
      emissiveIntensity: 0.3
    });

    const tierCount = 12;
    let currentY = 0;
    let currentRadius = 14;

    for (let i = 0; i < tierCount; i++) {
      const height = 18 - i * 0.8;
      const topRadius = currentRadius * 0.82;
      const tierGeo = new THREE.CylinderGeometry(topRadius, currentRadius, height, 6);
      const tierMesh = new THREE.Mesh(tierGeo, towerMat);
      tierMesh.position.y = currentY + height / 2;
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      burjGroup.add(tierMesh);

      // Glowing ledge ring around each setback tier
      const ringGeo = new THREE.TorusGeometry(currentRadius * 0.98, 0.4, 4, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = currentY + height;
      burjGroup.add(ringMesh);

      currentY += height;
      currentRadius = topRadius;
    }

    // Needle Spire on top (up to ~270 units)
    const spireGeo = new THREE.ConeGeometry(1.2, 55, 8);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.y = currentY + 27.5;
    burjGroup.add(spire);

    // Glowing beacon orb at the summit
    const beaconGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = currentY + 55;
    burjGroup.add(beacon);

    burjGroup.position.set(bx, 0, bz);
    this.scene.add(burjGroup);

    this.landmarks.push({
      name: 'BURJ KHALIFA',
      pos: new THREE.Vector3(bx, currentY + 40, bz),
      type: 'landmark'
    });
  }

  buildBurjAlArab() {
    // Burj Al Arab: Located on an offshore island off Jumeirah beach
    const arabsGroup = new THREE.Group();
    const ax = -190, az = -110;

    // Artificial island base
    const islandGeo = new THREE.CylinderGeometry(24, 28, 4, 16);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = 2;
    arabsGroup.add(island);

    // Curved sail dhow architecture (created with shaped box and curving crossbar)
    const sailMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25
    });

    const mastGeo = new THREE.CylinderGeometry(2, 3, 90, 8);
    const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({ color: 0x475569 }));
    mast.position.set(0, 47, 0);
    arabsGroup.add(mast);

    // Sweeping parabolic sail
    const sailGeo = new THREE.BoxGeometry(4, 80, 26);
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(-6, 46, 0);
    sail.rotation.z = 0.08;
    arabsGroup.add(sail);

    // Circular cantilevered Helipad near top
    const helipadGeo = new THREE.CylinderGeometry(6, 6, 1.2, 16);
    const helipadMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const helipad = new THREE.Mesh(helipadGeo, helipadMat);
    helipad.position.set(7, 78, 0);
    arabsGroup.add(helipad);

    // Bridge connecting island to Jumeirah mainland
    const bridgeGeo = new THREE.BoxGeometry(70, 2, 6);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(38, 2, 0);
    arabsGroup.add(bridge);

    arabsGroup.position.set(ax, 0, az);
    this.scene.add(arabsGroup);

    this.landmarks.push({
      name: 'BURJ AL ARAB',
      pos: new THREE.Vector3(ax, 85, az),
      type: 'landmark'
    });
  }

  buildPalmJumeirah() {
    // Palm Jumeirah: World-famous palm-shaped artificial archipelago in Arabian Gulf
    const palmGroup = new THREE.Group();
    const px = -280, pz = 120;

    const palmSandMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.2
    });

    const palmNeonMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: false
    });

    // 1. Central Trunk
    const trunkGeo = new THREE.BoxGeometry(14, 1.2, 90);
    const trunk = new THREE.Mesh(trunkGeo, palmSandMat);
    trunk.position.set(0, 0.6, 0);
    palmGroup.add(trunk);

    // Glowing trunk spine road
    const spineGeo = new THREE.BoxGeometry(2, 1.4, 90);
    const spine = new THREE.Mesh(spineGeo, palmNeonMat);
    spine.position.set(0, 0.7, 0);
    palmGroup.add(spine);

    // 2. 16 Palm Fronds (8 on left, 8 on right)
    for (let i = 0; i < 8; i++) {
      const zOffset = -35 + i * 10;
      const frondLength = 38 - Math.abs(i - 4) * 4;

      // Left frond
      const leftFrondGeo = new THREE.BoxGeometry(frondLength, 1.0, 4);
      const leftFrond = new THREE.Mesh(leftFrondGeo, palmSandMat);
      leftFrond.position.set(-frondLength / 2 - 4, 0.6, zOffset);
      leftFrond.rotation.y = -0.15;
      palmGroup.add(leftFrond);

      // Right frond
      const rightFrondGeo = new THREE.BoxGeometry(frondLength, 1.0, 4);
      const rightFrond = new THREE.Mesh(rightFrondGeo, palmSandMat);
      rightFrond.position.set(frondLength / 2 + 4, 0.6, zOffset);
      rightFrond.rotation.y = 0.15;
      palmGroup.add(rightFrond);

      // Luxury residential villas on fronds (small boxes)
      for (let v = 0; v < 3; v++) {
        const villaGeo = new THREE.BoxGeometry(2.5, 2.2, 2);
        const villaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
        const vl = new THREE.Mesh(villaGeo, villaMat);
        vl.position.set(-10 - v * 8, 1.6, zOffset);
        palmGroup.add(vl);

        const vr = new THREE.Mesh(villaGeo, villaMat);
        vr.position.set(10 + v * 8, 1.6, zOffset);
        palmGroup.add(vr);
      }
    }

    // 3. Outer Protective Crescent Breakwater
    const crescentGeo = new THREE.RingGeometry(62, 70, 32, 1, Math.PI * 0.15, Math.PI * 0.7);
    const crescent = new THREE.Mesh(crescentGeo, palmSandMat);
    crescent.rotation.x = -Math.PI / 2;
    crescent.position.set(0, 0.8, -45);
    palmGroup.add(crescent);

    // Atlantis The Palm hotel on the apex of the crescent
    const atlantisGeo = new THREE.BoxGeometry(18, 14, 6);
    const atlantisMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const atlantis = new THREE.Mesh(atlantisGeo, atlantisMat);
    atlantis.position.set(0, 7.5, -95);
    palmGroup.add(atlantis);

    palmGroup.position.set(px, 0, pz);
    this.scene.add(palmGroup);

    this.landmarks.push({
      name: 'PALM JUMEIRAH',
      pos: new THREE.Vector3(px, 25, pz - 20),
      type: 'district'
    });
  }

  buildDubaiFrame() {
    // Dubai Frame: 150m tall rectangular golden portal in Zabeel Park
    const frameGroup = new THREE.Group();
    const fx = 280, fz = -160;

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x78350f,
      emissiveIntensity: 0.4
    });

    const towerHeight = 70;
    const towerWidth = 6;
    const bridgeSpan = 45;

    // Left tower
    const leftCol = new THREE.Mesh(new THREE.BoxGeometry(towerWidth, towerHeight, towerWidth), goldMat);
    leftCol.position.set(-bridgeSpan / 2, towerHeight / 2, 0);
    frameGroup.add(leftCol);

    // Right tower
    const rightCol = new THREE.Mesh(new THREE.BoxGeometry(towerWidth, towerHeight, towerWidth), goldMat);
    rightCol.position.set(bridgeSpan / 2, towerHeight / 2, 0);
    frameGroup.add(rightCol);

    // Top Sky Bridge (Viewing bridge)
    const topBridge = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan + towerWidth, towerWidth, towerWidth * 1.5), goldMat);
    topBridge.position.set(0, towerHeight, 0);
    frameGroup.add(topBridge);

    // Bottom walkway
    const botWalk = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan + towerWidth, 4, towerWidth * 1.5), goldMat);
    botWalk.position.set(0, 2, 0);
    frameGroup.add(botWalk);

    frameGroup.position.set(fx, 0, fz);
    this.scene.add(frameGroup);

    this.landmarks.push({
      name: 'DUBAI FRAME',
      pos: new THREE.Vector3(fx, towerHeight + 10, fz),
      type: 'landmark'
    });
  }

  buildUrbanDistricts() {
    // Generate Dubai urban high-rise clusters:
    // Downtown Dubai, Business Bay, Dubai Marina, Al Quoz, and Deira
    const districts = [
      { name: 'DOWNTOWN DUBAI', cx: 100, cz: -40, count: 45, maxH: 140, color: 0x1e3a8a },
      { name: 'BUSINESS BAY', cx: 160, cz: 20, count: 50, maxH: 110, color: 0x0284c7 },
      { name: 'DUBAI MARINA', cx: -150, cz: 280, count: 60, maxH: 130, color: 0x0d9488 },
      { name: 'JUMEIRAH', cx: -60, cz: 60, count: 30, maxH: 35, color: 0x334155 },
      { name: 'AL QUOZ INDUSTRIAL AREA', cx: 140, cz: 180, count: 35, maxH: 25, color: 0x475569 },
      { name: 'DEIRA', cx: 340, cz: -140, count: 40, maxH: 55, color: 0x334155 },
      { name: 'DUBAI INT\'L AIRPORT', cx: 420, cz: -80, count: 20, maxH: 20, color: 0x1e293b }
    ];

    const buildingBoxMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.25
    });

    const windowGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    districts.forEach(dist => {
      for (let i = 0; i < dist.count; i++) {
        const spread = dist.maxH > 60 ? 70 : 90;
        const x = dist.cx + (Math.random() - 0.5) * spread;
        const z = dist.cz + (Math.random() - 0.5) * spread;

        // Skip buildings near Burj Khalifa position
        if (Math.hypot(x - 120, z - (-60)) < 25) continue;

        const h = 15 + Math.random() * dist.maxH;
        const w = 8 + Math.random() * 12;
        const d = 8 + Math.random() * 12;

        const bGeo = new THREE.BoxGeometry(w, h, d);
        const bMesh = new THREE.Mesh(bGeo, buildingBoxMat);
        bMesh.position.set(x, h / 2, z);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        this.scene.add(bMesh);

        // Lit rooftop beacon/accent for high-rises
        if (h > 65) {
          const capGeo = new THREE.BoxGeometry(w * 0.8, 2, d * 0.8);
          const cap = new THREE.Mesh(capGeo, windowGlowMat);
          cap.position.set(x, h + 1, z);
          this.scene.add(cap);
        }
      }

      this.landmarks.push({
        name: dist.name,
        pos: new THREE.Vector3(dist.cx, dist.maxH * 0.7 + 15, dist.cz),
        type: 'district'
      });
    });
  }

  buildSheikhZayedRoadTraffic() {
    // Sheikh Zayed Road (E11): Massive multi-lane expressway spanning Dubai
    // Key spine running through Dubai Marina, Business Bay, Downtown to Deira
    const szrWaypoints = [
      new THREE.Vector3(-220, 1.2, 400),
      new THREE.Vector3(-150, 1.2, 280),
      new THREE.Vector3(-30, 1.2, 170),
      new THREE.Vector3(60, 1.2, 70),
      new THREE.Vector3(120, 1.2, -30),
      new THREE.Vector3(200, 1.2, -100),
      new THREE.Vector3(290, 1.2, -180),
      new THREE.Vector3(380, 1.2, -260)
    ];

    const szrCurve = new THREE.CatmullRomCurve3(szrWaypoints);
    this.szrCurve = szrCurve;

    // Highway Asphalt Ribbon
    const szrGeo = new THREE.TubeGeometry(szrCurve, 120, 9, 8, false);
    const szrMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1
    });
    const szrMesh = new THREE.Mesh(szrGeo, szrMat);
    this.scene.add(szrMesh);

    // Glowing Traffic Congestion Stream (Red/Orange ribbons matching Image 1)
    // 72% High Congestion simulation
    const particleCount = 280;
    const pGeo = new THREE.SphereGeometry(1.4, 6, 6);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const point = szrCurve.getPointAt(t);

      // Congestion coloring based on location (Downtown & SZR interchange = High/Red)
      let pColor = 0x10b981; // Green / Free flow
      if (t > 0.35 && t < 0.75) {
        // Heavy bottleneck near Downtown / Business Bay (Matching Image 1)
        pColor = Math.random() > 0.4 ? 0xef4444 : 0xf97316; // Red & Orange
      } else if (Math.random() > 0.5) {
        pColor = 0xfbbf24; // Amber / Moderate
      }

      const pMat = new THREE.MeshBasicMaterial({ color: pColor });
      const pMesh = new THREE.Mesh(pGeo, pMat);

      // Lane offset left & right of center curve
      const tangent = szrCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const laneOffset = (Math.random() - 0.5) * 14;

      pMesh.position.copy(point).add(normal.clone().multiplyScalar(laneOffset));
      pMesh.position.y += 2.0;

      this.scene.add(pMesh);
      this.trafficParticles.push({
        mesh: pMesh,
        t: t,
        speed: (0.0003 + Math.random() * 0.0004) * (pColor === 0xef4444 ? 0.35 : 1.0),
        normal: normal,
        laneOffset: laneOffset
      });
    }

    // Glowing interchange flyover at Financial Centre / Downtown
    const interchangeGeo = new THREE.TorusGeometry(32, 2.5, 6, 24);
    const interchangeMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const interchange = new THREE.Mesh(interchangeGeo, interchangeMat);
    interchange.rotation.x = Math.PI / 2;
    interchange.position.set(130, 8, -25);
    this.scene.add(interchange);
  }

  buildDubaiMetroRedLine() {
    // Dubai Metro Red Line: Elevated viaduct parallel to SZR
    // High-tech driverless metro system
    const metroWaypoints = [
      new THREE.Vector3(-215, 8, 395),
      new THREE.Vector3(-145, 8, 275),
      new THREE.Vector3(-25, 8, 165),
      new THREE.Vector3(65, 8, 65),
      new THREE.Vector3(125, 8, -35),
      new THREE.Vector3(205, 8, -105),
      new THREE.Vector3(295, 8, -185),
      new THREE.Vector3(385, 8, -265)
    ];

    this.metroCurve = new THREE.CatmullRomCurve3(metroWaypoints);

    // Elevated concrete track viaduct
    const metroGeo = new THREE.TubeGeometry(this.metroCurve, 100, 2.2, 6, false);
    const metroMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.6,
      roughness: 0.3
    });
    const metroTrack = new THREE.Mesh(metroGeo, metroMat);
    this.scene.add(metroTrack);

    // Elevated Concrete Support Pillars
    for (let i = 0; i <= 24; i++) {
      const pt = this.metroCurve.getPointAt(i / 24);
      const pillarGeo = new THREE.CylinderGeometry(1.6, 2.0, pt.y, 8);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pt.x, pt.y / 2, pt.z);
      this.scene.add(pillar);
    }

    // Dubai Metro 5-Car Driverless Train
    const trainGroup = new THREE.Group();
    const carMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.1
    });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    for (let c = 0; c < 5; c++) {
      const carGeo = new THREE.BoxGeometry(3.2, 3.2, 10);
      const car = new THREE.Mesh(carGeo, carMat);
      car.position.z = c * 11;
      trainGroup.add(car);

      // Cyan illuminated side windows
      const winGeo = new THREE.BoxGeometry(3.3, 1.2, 7);
      const win = new THREE.Mesh(winGeo, windowMat);
      win.position.z = c * 11;
      win.position.y = 0.4;
      trainGroup.add(win);
    }

    // Front headlight
    const headlight = new THREE.PointLight(0x38bdf8, 3.0, 45);
    headlight.position.set(0, 0, -2);
    trainGroup.add(headlight);

    this.metroTrain = trainGroup;
    this.scene.add(this.metroTrain);

    // Metro Stations pins
    const stations = [
      { name: 'DMCC METRO', t: 0.12 },
      { name: 'MALL OF THE EMIRATES', t: 0.36 },
      { name: 'BURJ KHALIFA / DUBAI MALL (M)', t: 0.58 },
      { name: 'WORLD TRADE CENTRE (M)', t: 0.74 }
    ];

    stations.forEach(st => {
      const pt = this.metroCurve.getPointAt(st.t);
      this.landmarks.push({
        name: st.name,
        pos: new THREE.Vector3(pt.x, pt.y + 14, pt.z),
        type: 'metro'
      });
    });
  }

  setupLocationPins() {
    // 3D location badges are projected to DOM overlay elements
    const overlay = document.getElementById('dubai-labels-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    this.landmarks.forEach((lm, idx) => {
      const el = document.createElement('div');
      el.className = 'hud-location-badge';
      el.id = `dubai-badge-${idx}`;
      
      const isMetro = lm.type === 'metro';
      el.innerHTML = isMetro ? `<span style="color:#38bdf8;font-weight:900;">(M)</span> ${lm.name}` : lm.name;
      
      overlay.appendChild(el);
      this.locationPins.push({
        element: el,
        pos: lm.pos
      });
    });
  }

  updateLocationPins() {
    if (!this.camera || this.locationPins.length === 0) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const tempV = new THREE.Vector3();

    this.locationPins.forEach(pin => {
      tempV.copy(pin.pos);
      tempV.project(this.camera);

      // Check if pin is in front of camera
      const isBehind = tempV.z > 1.0;
      if (isBehind) {
        pin.element.style.display = 'none';
        return;
      }

      const x = (tempV.x * 0.5 + 0.5) * width;
      const y = (-(tempV.y * 0.5) + 0.5) * height;

      // Distance scaling
      const dist = this.camera.position.distanceTo(pin.pos);
      if (dist > 950 || dist < 40) {
        pin.element.style.display = 'none';
      } else {
        pin.element.style.display = 'block';
        pin.element.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
        const scale = THREE.MathUtils.clamp(1.0 - (dist - 150) / 900, 0.7, 1.0);
        pin.element.style.fontSize = `${9 * scale}px`;
      }
    });
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());
    this.time += 0.016;

    if (this.controls) {
      this.controls.update();
    }

    // 1. Animate SZR Traffic Flow Ribbons
    if (this.szrCurve && this.trafficParticles.length > 0) {
      this.trafficParticles.forEach(p => {
        p.t += p.speed;
        if (p.t > 1.0) p.t = 0.0;
        const pt = this.szrCurve.getPointAt(p.t);
        const norm = p.normal;
        p.mesh.position.copy(pt).add(norm.clone().multiplyScalar(p.laneOffset));
        p.mesh.position.y = 3.2;
      });
    }

    // 2. Animate Dubai Metro Red Line Train along elevated viaduct
    if (this.metroTrain && this.metroCurve) {
      this.metroPathProgress += this.metroSpeed;
      if (this.metroPathProgress > 1.0) this.metroPathProgress = 0.0;

      const trainPos = this.metroCurve.getPointAt(this.metroPathProgress);
      const trainLook = this.metroCurve.getPointAt(Math.min(this.metroPathProgress + 0.01, 1.0));
      this.metroTrain.position.copy(trainPos);
      this.metroTrain.lookAt(trainLook);
    }

    // 3. Pulse Burj Khalifa summit beacon
    if (this.beaconLight) {
      this.beaconLight.intensity = 2.0 + Math.sin(this.time * 6) * 2.5;
    }

    // 4. Update 3D Floating HUD Badges
    this.updateLocationPins();

    this.renderer.render(this.scene, this.camera);
  }

  setCameraPreset(preset) {
    if (!this.controls) return;
    switch (preset) {
      case 'burj':
        this.camera.position.set(120, 200, 180);
        this.controls.target.set(120, 100, -60);
        break;
      case 'palm':
        this.camera.position.set(-280, 220, 360);
        this.controls.target.set(-280, 10, 100);
        break;
      case 'szr':
        this.camera.position.set(40, 70, 220);
        this.controls.target.set(120, 20, -30);
        break;
      case 'overview':
      default:
        this.camera.position.set(-320, 280, 480);
        this.controls.target.set(40, 20, 0);
        break;
    }
    this.controls.update();
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
    return this.autoRotate;
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}

// Global instance for browser execution
window.dubaiTwin = new Dubai3DDigitalTwin();
