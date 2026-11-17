/**
 * CITYSYNC - Bengaluru 3D Holographic Digital Twin Engine
 * Built with Three.js (WebGL)
 * Visualizes real geo-referenced infrastructure nodes (12.9716° N, 77.5946° E),
 * 3D architectural extrusions, dynamic infrastructure networks (BTP, BESCOM, BWSSB),
 * particle telemetry streams, raycasting click inspection, and cascading crisis shockwaves.
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
    this.nodes = [];
    this.nodeMeshes = [];
    this.networkLines = [];
    this.particleSystems = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.autoRotate = false;
    this.clock = new THREE.Clock();

    // Geo-to-3D projection scaling for Bengaluru
    this.centerLat = 12.9716;
    this.centerLng = 77.5946;
    this.scaleFactor = 1400; // coordinate expansion for 3D depth
  }

  init(containerId = 'three-container') {
    this.container = document.getElementById(containerId);
    if (!this.container || this.isInitialized) return;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 560;

    // 1. Scene & Cyberpunk Command Center Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070B14);
    this.scene.fog = new THREE.FogExp2(0x070B14, 0.0035);

    // 2. Camera Setup (Elevated Tactical 45-degree angle)
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    this.camera.position.set(0, 240, 320);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.maxPolarAngle = Math.PI / 2.05; // prevent going below ground
      this.controls.minDistance = 60;
      this.controls.maxDistance = 650;
      this.controls.target.set(0, 0, 0);
    }

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x38BDF8, 0.6);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06B6D4, 0.9);
    dirLight1.position.set(150, 300, 150);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xEAB308, 0.4);
    dirLight2.position.set(-150, 150, -150);
    this.scene.add(dirLight2);

    // 6. Cybernetic Ground Plane & Holographic Grid
    this.buildCyberGrid();

    // 7. 3D Bengaluru Cityscape Extrusions (Towers & Corridors)
    this.buildCityArchitecture();

    // 8. Dynamic Infrastructure Arterials (Power, Water, Traffic)
    this.buildInfrastructureNetworks();

    // 9. Event Listeners (Resize & Raycaster Clicks)
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('click', (e) => this.onPointerClick(e));

    this.isInitialized = true;
    this.animate();
  }

  // --- Cybernetic Holographic Terrain & Grid ---
  buildCyberGrid() {
    // Primary coordinate grid
    const gridHelper = new THREE.GridHelper(600, 60, 0x06B6D4, 0x1E293B);
    gridHelper.position.y = -0.5;
    this.scene.add(gridHelper);

    // Radar scan concentric circles on ground
    const circleGeo = new THREE.RingGeometry(20, 20.8, 64);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const ring1 = new THREE.Mesh(circleGeo, circleMat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0.1;
    this.scene.add(ring1);

    const ring2 = ring1.clone();
    ring2.geometry = new THREE.RingGeometry(80, 81.2, 64);
    ring2.material = new THREE.MeshBasicMaterial({ color: 0x3B82F6, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
    this.scene.add(ring2);

    const ring3 = ring1.clone();
    ring3.geometry = new THREE.RingGeometry(160, 161.8, 64);
    ring3.material = new THREE.MeshBasicMaterial({ color: 0x8B5CF6, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
    this.scene.add(ring3);
  }

  // --- 3D Bengaluru Architectural Buildings & Landmarks ---
  buildCityArchitecture() {
    const buildingMat = new THREE.MeshLambertMaterial({
      color: 0x0F172A,
      transparent: true,
      opacity: 0.85,
      wireframe: false
    });

    const edgeMat = new THREE.LineBasicMaterial({ color: 0x06B6D4, transparent: true, opacity: 0.4 });

    // Seed clusters representing key Bangalore tech hubs:
    // 1. Central CBD / MG Road (x: 20, z: -5)
    this.createBuildingCluster(20, -5, 18, 45, 85, buildingMat, edgeMat, 0x06B6D4);

    // 2. Electronic City (x: 90, z: 175)
    this.createBuildingCluster(90, 175, 24, 25, 45, buildingMat, edgeMat, 0xEAB308);

    // 3. Whitefield ITPL (x: 195, z: -14)
    this.createBuildingCluster(195, -14, 20, 30, 60, buildingMat, edgeMat, 0x10B981);

    // 4. Peenya Industrial Zone (x: -105, z: -85)
    this.createBuildingCluster(-105, -85, 22, 18, 30, buildingMat, edgeMat, 0xF59E0B);

    // 5. Hebbal / Manyata Tech Park (x: 5, z: -90)
    this.createBuildingCluster(5, -90, 16, 35, 70, buildingMat, edgeMat, 0x3B82F6);
  }

  createBuildingCluster(centerX, centerZ, count, minHeight, maxHeight, mat, edgeMat, accentColor) {
    for (let i = 0; i < count; i++) {
      const w = 6 + Math.random() * 8;
      const d = 6 + Math.random() * 8;
      const h = minHeight + Math.random() * (maxHeight - minHeight);

      const offsetX = (Math.random() - 0.5) * 35;
      const offsetZ = (Math.random() - 0.5) * 35;

      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(centerX + offsetX, h / 2, centerZ + offsetZ);
      this.scene.add(mesh);

      // Neon glowing edges for architectural definition
      const edges = new THREE.EdgesGeometry(geo);
      const customEdgeMat = edgeMat.clone();
      customEdgeMat.color.setHex(accentColor);
      customEdgeMat.opacity = 0.5;
      const line = new THREE.LineSegments(edges, customEdgeMat);
      line.position.copy(mesh.position);
      this.scene.add(line);
    }
  }

  // --- Dynamic 3D Infrastructure Networks & Flow Particles ---
  buildInfrastructureNetworks() {
    // 1. Traffic Spine: Outer Ring Road & Hosur Elevated (Silk Board <-> E-City <-> Bellandur <-> Whitefield)
    const trafficPoints = [
      new THREE.Vector3(40, 1, 75),    // Silk Board
      new THREE.Vector3(90, 1, 175),   // Electronic City
      new THREE.Vector3(135, 1, 50),   // Bellandur ORR
      new THREE.Vector3(195, 1, -14),  // Whitefield ITPL
      new THREE.Vector3(5, 1, -90),    // Hebbal
      new THREE.Vector3(20, 1, -5)     // CBD
    ];
    this.createSplineNetwork(trafficPoints, 0x06B6D4, 0.4, 'traffic');

    // 2. High-Voltage Power Transmission Lines: Peenya -> Anand Rao -> Koramangala -> E-City -> Whitefield
    const powerPoints = [
      new THREE.Vector3(-105, 18, -85), // Peenya 220kV
      new THREE.Vector3(-25, 22, -15),  // Anand Rao 66kV
      new THREE.Vector3(32, 18, 65),    // Koramangala 66kV
      new THREE.Vector3(90, 20, 175),   // E-City 220kV
      new THREE.Vector3(195, 20, -14)   // Whitefield 220kV
    ];
    this.createSplineNetwork(powerPoints, 0xEAB308, 0.7, 'power', true);

    // 3. BWSSB Water Trunk Pipeline: Cauvery Stage IV -> High Grounds -> TG Halli
    const waterPoints = [
      new THREE.Vector3(-15, 0.5, 105), // Cauvery Stage IV
      new THREE.Vector3(-15, 0.5, -24), // High Grounds Reservoir
      new THREE.Vector3(-350, 0.5, 10), // TG Halli Reservoir
      new THREE.Vector3(105, 0.5, 52)   // Bellandur Water
    ];
    this.createSplineNetwork(waterPoints, 0x3B82F6, 0.5, 'water');
  }

  createSplineNetwork(points, colorHex, opacity, type, elevated = false) {
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const material = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: opacity,
      linewidth: 2
    });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.networkLines.push({ line, curve, type });

    // Animated particle stream traveling along infrastructure network
    const particleGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const particle = new THREE.Mesh(particleGeo, particleMat);
    this.scene.add(particle);
    this.particleSystems.push({ mesh: particle, curve: curve, progress: Math.random(), speed: 0.003 + Math.random() * 0.003 });
  }

  // --- Geo-Referenced Infrastructure Node Holograms ---
  updateNodes(nodes) {
    this.nodes = nodes;
    this.clearNodes();

    nodes.forEach(node => {
      // Project lat/lng relative to center
      const x = (node.longitude - this.centerLng) * this.scaleFactor;
      const z = -(node.latitude - this.centerLat) * this.scaleFactor;
      const y = 8; // pedestal elevation

      const isCritical = node.status === 'critical';
      const isWarning = node.status === 'warning';
      let color = 0x06B6D4;
      if (node.category === 'electricity') color = 0xEAB308;
      if (node.category === 'water') color = 0x3B82F6;
      if (node.category === 'utility') color = 0x8B5CF6;
      if (isCritical) color = 0xEF4444;
      else if (isWarning) color = 0xF59E0B;

      // 1. Holographic vertical beacon cylinder
      const cylGeo = new THREE.CylinderGeometry(1.4, 2.8, 16, 16);
      const cylMat = new THREE.MeshLambertMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: isCritical ? 0.9 : 0.4,
        transparent: true,
        opacity: 0.85
      });
      const beacon = new THREE.Mesh(cylGeo, cylMat);
      beacon.position.set(x, y + 8, z);
      beacon.userData = { nodeId: node.id, nodeData: node };
      this.scene.add(beacon);
      this.nodeMeshes.push(beacon);

      // 2. Pulsing Radar ground rings
      const pulseGeo = new THREE.RingGeometry(3, 3.8, 32);
      const pulseMat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
      pulseRing.rotation.x = -Math.PI / 2;
      pulseRing.position.set(x, 0.2, z);
      this.scene.add(pulseRing);

      // 3. Floating 3D Text Billboard Sprite
      const sprite = this.createLabelSprite(node.name, color, node.status);
      sprite.position.set(x, y + 22, z);
      this.scene.add(sprite);

      this.nodeMeshes.push(pulseRing);
      this.nodeMeshes.push(sprite);
    });
  }

  clearNodes() {
    this.nodeMeshes.forEach(mesh => this.scene.remove(mesh));
    this.nodeMeshes = [];
  }

  createLabelSprite(text, colorHex, status) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');

    // Background tag
    ctx.fillStyle = 'rgba(13, 19, 34, 0.92)';
    ctx.roundRect ? ctx.roundRect(0, 0, 320, 70, 8) : ctx.fillRect(0, 0, 320, 70);
    ctx.fill();

    // Border
    ctx.strokeStyle = status === 'critical' ? '#EF4444' : '#' + colorHex.toString(16).padStart(6, '0');
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Text label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(text.length > 24 ? text.substring(0, 22) + '...' : text, 14, 30);

    // Sub-text status
    ctx.fillStyle = status === 'critical' ? '#EF4444' : '#94A3B8';
    ctx.font = '13px monospace';
    ctx.fillText(`STATUS: ${status.toUpperCase()}`, 14, 52);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(30, 6.5, 1);
    return sprite;
  }

  // --- Interaction & Raycasting ---
  onPointerClick(event) {
    if (!this.container) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodeMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects.find(i => i.object.userData && i.object.userData.nodeId);
      if (hit && window.app) {
        const nodeId = hit.object.userData.nodeId;
        window.app.openFacilityInspector(nodeId);
        window.app.showToast(`Inspecting: ${hit.object.userData.nodeData.name}`, 'info');
      }
    }
  }

  // --- Camera Focus & Preset Angles ---
  focusHub(hub) {
    if (!this.controls) return;
    if (hub === 'silkboard') {
      this.animateCameraTo(40, 100, 160, 40, 0, 75);
    } else if (hub === 'ecity') {
      this.animateCameraTo(90, 80, 260, 90, 0, 175);
    } else if (hub === 'cbd') {
      this.animateCameraTo(20, 90, 75, 20, 0, -5);
    }
  }

  resetCamera() {
    this.animateCameraTo(0, 240, 320, 0, 0, 0);
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
      if (progress < 1) {
        requestAnimationFrame(stepAnim);
      }
    };
    stepAnim();
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) this.controls.autoRotate = this.autoRotate;
    const btnLabel = document.getElementById('label-3d-rotate');
    if (btnLabel) btnLabel.textContent = this.autoRotate ? 'Stop Rotation' : 'Auto-Rotate 3D';
  }

  // --- 3D Crisis Shockwave & Propagation Beam ---
  triggerCrisisShockwave() {
    // 1. Shockwave sphere at Silk Board (40, 0, 75)
    const shockGeo = new THREE.SphereGeometry(4, 32, 32);
    const shockMat = new THREE.MeshBasicMaterial({ color: 0xEF4444, transparent: true, opacity: 0.8, wireframe: true });
    const shockSphere = new THREE.Mesh(shockGeo, shockMat);
    shockSphere.position.set(40, 8, 75);
    this.scene.add(shockSphere);

    // Expand shockwave
    let scale = 1;
    const expandAnim = () => {
      scale += 0.8;
      shockSphere.scale.set(scale, scale, scale);
      shockMat.opacity = Math.max(0, 0.8 - (scale / 45));
      if (shockMat.opacity > 0) {
        requestAnimationFrame(expandAnim);
      } else {
        this.scene.remove(shockSphere);
      }
    };
    expandAnim();

    // 2. Cascade Laser beam from Silk Board (40, 75) to E-City (90, 175)
    const beamPoints = [new THREE.Vector3(40, 12, 75), new THREE.Vector3(90, 14, 175)];
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
    const beamMat = new THREE.LineBasicMaterial({ color: 0xEF4444, linewidth: 4 });
    const beamLine = new THREE.Line(beamGeo, beamMat);
    this.scene.add(beamLine);

    setTimeout(() => this.scene.remove(beamLine), 4000);
  }

  // --- Main Animation Loop ---
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    if (this.controls) this.controls.update();

    // Animate flow packets along infrastructure lines
    this.particleSystems.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;
      const point = p.curve.getPointAt(p.progress);
      if (point) p.mesh.position.copy(point);
    });

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 560;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

const threeTwin = new Bengaluru3DDigitalTwin();
