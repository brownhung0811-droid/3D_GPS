import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Spot, RegionType, CategoryType, LightMode, ViewMode } from '../types';
import { Compass, ZoomIn, ZoomOut, RotateCcw, ChevronUp, ChevronDown, Layers, Sun, Sunset, Moon, MapPin, CheckCircle2 } from 'lucide-react';

interface TaiwanMap3DProps {
  spots: Spot[];
  collectedSpotIds: Set<string>;
  onSelectSpot: (spot: Spot) => void;
  selectedSpotId?: string;
  selectedRegion: RegionType | 'All';
  selectedCategory: CategoryType | 'All';
  lightMode: LightMode;
  onLightModeChange: (mode: LightMode) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const TaiwanMap3D: React.FC<TaiwanMap3DProps> = ({
  spots,
  collectedSpotIds,
  onSelectSpot,
  selectedSpotId,
  selectedRegion,
  selectedCategory,
  lightMode,
  onLightModeChange,
  viewMode,
  onViewModeChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredSpot, setHoveredSpot] = useState<Spot | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // References to keep Three.js animation and controls state mutable without React re-mount
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const terrainGroupRef = useRef<THREE.Group | null>(null);
  const animatedObjectsRef = useRef<Array<{ mesh: THREE.Object3D; update: (t: number) => void }>>([]);
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(13, 20, 22));
  const targetTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const markerMeshesMapRef = useRef<Map<string, THREE.Group>>(new Map());

  // Filter spots based on active region and category
  const filteredSpots = useMemo(() => {
    return spots.filter((s) => {
      const matchRegion = selectedRegion === 'All' || s.region === selectedRegion;
      const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
      return matchRegion && matchCat;
    });
  }, [spots, selectedRegion, selectedCategory]);

  // Set up Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(13, 20, 22);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera dipping below horizon
    controls.minDistance = 5;
    controls.maxDistance = 55;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbbe1fa, 0x1b262c, 0.8);
    hemiLight.position.set(0, 30, 0);
    hemiLight.name = 'hemiLight';
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    dirLight.position.set(15, 25, 12);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 70;
      const d = 16;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0004;
    }
    dirLight.name = 'dirLight';
    scene.add(dirLight);

    // Secondary rim fill
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    rimLight.position.set(-15, 12, -15);
    rimLight.name = 'rimLight';
    scene.add(rimLight);

    // 5. Ocean Base & Stylized Grid
    const oceanGeo = new THREE.CylinderGeometry(24, 24, 1.2, 64);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.25,
      metalness: 0.15,
      flatShading: true,
    });
    oceanMat.name = 'oceanMat';
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = -0.6;
    oceanMesh.receiveShadow = !isSoftwareGl;
    scene.add(oceanMesh);

    // Topographic water contour rings
    const ringGroup = new THREE.Group();
    [8, 14, 20].forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r, r + 0.08, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12 - idx * 0.03,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.02;
      ringGroup.add(ringMesh);
    });
    scene.add(ringGroup);

    // 6. Build Procedural Taiwan 3D Island & Mountains
    const terrainGroup = new THREE.Group();
    terrainGroupRef.current = terrainGroup;
    scene.add(terrainGroup);

    // Custom 2D shape of Taiwan (rotated & proportioned to match geography)
    // Longitude scaled on X, Latitude inverted on Z
    const taiwanShape = new THREE.Shape();
    // Points starting north (Keelung/Yehliu) down eastern coast to Hengchun, back up western plain
    const pts: [number, number][] = [
      [1.1, -8.8], // Keelung / North cape
      [2.2, -7.6], // Yilan coast
      [2.3, -5.2], // Su\'ao / Qingshui
      [1.8, -2.4], // Hualien
      [1.4, 0.8],  // Fengbin / Taitung coast
      [0.9, 3.8],  // Sanxiantai / Chenggong
      [0.2, 6.8],  // Taitung city
      [-0.4, 9.4], // Dawu
      [-0.8, 11.2], // Hengchun / Eluanbi South point
      [-1.4, 11.0], // Baishawan
      [-1.8, 9.5],  // Checheng
      [-2.3, 7.2],  // Fangliao
      [-3.1, 4.8],  // Kaohsiung harbor
      [-3.4, 2.2],  // Tainan Anping
      [-3.2, 0.0],  // Chiayi Budai
      [-2.8, -1.8], // Yunlin Mailiao
      [-2.3, -3.8], // Changhua Lukang
      [-1.6, -5.8], // Taichung Gaomei
      [-0.8, -7.5], // Miaoli
      [0.2, -8.6],  // Taoyuan / Guanyin
      [0.8, -9.2],  // New Taipei / Tamsui
    ];

    taiwanShape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      taiwanShape.lineTo(pts[i][0], pts[i][1]);
    }
    taiwanShape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 2,
      depth: 0.45,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.18,
      bevelOffset: 0,
      bevelSegments: 3,
    };

    const islandGeo = new THREE.ExtrudeGeometry(taiwanShape, extrudeSettings);
    islandGeo.rotateX(Math.PI / 2); // Lay flat on X-Z plane

    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Emerald green
      roughness: 0.65,
      metalness: 0.08,
      flatShading: true,
    });
    islandMat.name = 'islandMat';

    const islandMesh = new THREE.Mesh(islandGeo, islandMat);
    islandMesh.position.y = 0;
    islandMesh.castShadow = !isSoftwareGl;
    islandMesh.receiveShadow = !isSoftwareGl;
    terrainGroup.add(islandMesh);

    // Central Mountain Range (Spine of Taiwan)
    // Create organic procedural faceted mountain peaks along the central spine
    const mountainSpineGroup = new THREE.Group();
    const mountainCoords: Array<[number, number, number, number]> = [
      // [x, z, height, radius]
      [0.6, -6.5, 1.4, 1.5],  // Xueshan range
      [0.8, -4.5, 1.8, 1.8],  // Central range north
      [0.4, -2.5, 2.2, 2.0],  // Hehuanshan / Qilai
      [-0.2, -0.5, 2.5, 2.2], // Yushan Main Peak area
      [-0.4, 1.8, 2.0, 1.9],  // Alishan & Southern range
      [-0.5, 4.2, 1.5, 1.6],  // Dawushan north
      [-0.6, 6.8, 1.2, 1.4],  // Dawushan south
      [-0.7, 8.8, 0.8, 1.1],  // Hengchun hills
    ];

    mountainCoords.forEach(([mx, mz, mh, mr]) => {
      const coneGeo = new THREE.ConeGeometry(mr, mh, 5);
      coneGeo.computeVertexNormals();
      const mountainMat = new THREE.MeshStandardMaterial({
        color: 0x15803d, // Deep forest mountain green
        roughness: 0.8,
        metalness: 0.05,
        flatShading: true,
      });
      mountainMat.name = 'mountainMat';
      const peakMesh = new THREE.Mesh(coneGeo, mountainMat);
      peakMesh.position.set(mx, 0.4 + mh / 2, mz);
      peakMesh.rotation.y = Math.random() * Math.PI;
      peakMesh.castShadow = !isSoftwareGl;
      peakMesh.receiveShadow = !isSoftwareGl;
      mountainSpineGroup.add(peakMesh);

      // White snow/cloud tip for highest central peaks
      if (mh > 1.9) {
        const snowGeo = new THREE.ConeGeometry(mr * 0.35, mh * 0.28, 5);
        const snowMat = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.4,
          flatShading: true,
        });
        const snowMesh = new THREE.Mesh(snowGeo, snowMat);
        snowMesh.position.set(mx, 0.4 + mh * 0.86, mz);
        snowMesh.rotation.y = peakMesh.rotation.y;
        mountainSpineGroup.add(snowMesh);
      }
    });
    terrainGroup.add(mountainSpineGroup);

    // Offshore Islands:
    // 1. Penghu Archipelago (West)
    const penghuGroup = new THREE.Group();
    const penghuIslands = [
      [-6.8, -0.8, 1.0, 0.6],
      [-7.2, 0.4, 0.8, 0.5],
      [-6.5, 1.2, 0.9, 0.55],
      [-7.6, 2.2, 0.6, 0.4], // Qimei
    ];
    penghuIslands.forEach(([px, pz, rx, rz]) => {
      const pGeo = new THREE.CylinderGeometry(rx, rx + 0.1, 0.35, 7);
      const pMesh = new THREE.Mesh(pGeo, islandMat);
      pMesh.position.set(px, 0.18, pz);
      pMesh.scale.set(1, 1, rz / rx);
      penghuGroup.add(pMesh);
    });
    terrainGroup.add(penghuGroup);

    // 2. Green Island (綠島 - Southeast)
    const greenIsleGeo = new THREE.ConeGeometry(0.7, 0.8, 6);
    const greenIsleMesh = new THREE.Mesh(greenIsleGeo, islandMat);
    greenIsleMesh.position.set(4.2, 0.4, 6.2);
    terrainGroup.add(greenIsleMesh);

    // 3. Orchid Island (蘭嶼 - Far Southeast)
    const orchidIsleGeo = new THREE.ConeGeometry(0.85, 1.1, 6);
    const orchidIsleMesh = new THREE.Mesh(orchidIsleGeo, islandMat);
    orchidIsleMesh.position.set(4.8, 0.55, 9.8);
    terrainGroup.add(orchidIsleMesh);

    // 4. Kinmen (金門 - Far West)
    const kinmenGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.35, 6);
    const kinmenMesh = new THREE.Mesh(kinmenGeo, islandMat);
    kinmenMesh.position.set(-8.2, 0.18, -2.5);
    kinmenMesh.scale.set(1.4, 1, 0.7);
    terrainGroup.add(kinmenMesh);

    // 5. Matsu (馬祖 - Far Northwest)
    const matsuGeo = new THREE.CylinderGeometry(0.65, 0.75, 0.35, 5);
    const matsuMesh = new THREE.Mesh(matsuGeo, islandMat);
    matsuMesh.position.set(-6.5, 0.18, -9.5);
    terrainGroup.add(matsuMesh);

    // 7. Group for landmark markers
    const markersGroup = new THREE.Group();
    markersGroupRef.current = markersGroup;
    scene.add(markersGroup);

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId = 0;
    let clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smoothly move camera towards target if animating
      if (cameraRef.current && targetCamPosRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.05);
      }
      if (controlsRef.current && targetTargetPosRef.current) {
        controlsRef.current.target.lerp(targetTargetPosRef.current, 0.05);
        controlsRef.current.update();
      }

      // Update animated 3D components (ferris wheels, umbrellas, flags)
      animatedObjectsRef.current.forEach((item) => {
        item.update(time);
      });

      // Subtle wave pulse on water ring
      ringGroup.rotation.y = time * 0.02;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update lighting and skybox atmosphere when lightMode changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const ambientLight = scene.getObjectByName('ambientLight') as THREE.AmbientLight;
    const hemiLight = scene.getObjectByName('hemiLight') as THREE.HemisphereLight;
    const dirLight = scene.getObjectByName('dirLight') as THREE.DirectionalLight;
    const rimLight = scene.getObjectByName('rimLight') as THREE.DirectionalLight;

    if (lightMode === 'day') {
      scene.background = new THREE.Color(0xdbeafe); // Soft sky blue
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.015);
      if (ambientLight) ambientLight.color.setHex(0xffffff), (ambientLight.intensity = 0.95);
      if (hemiLight) {
        hemiLight.color.setHex(0x93c5fd);
        hemiLight.groundColor.setHex(0xdcfce7);
        hemiLight.intensity = 0.8;
      }
      if (dirLight) {
        dirLight.color.setHex(0xfff7ed);
        dirLight.intensity = 1.6;
        dirLight.position.set(15, 25, 12);
      }
      if (rimLight) rimLight.color.setHex(0xbfdbfe), (rimLight.intensity = 0.5);
    } else if (lightMode === 'sunset') {
      scene.background = new THREE.Color(0x451a03); // Deep sunset amber dusk
      scene.fog = new THREE.FogExp2(0x451a03, 0.018);
      if (ambientLight) ambientLight.color.setHex(0xfef3c7), (ambientLight.intensity = 0.6);
      if (hemiLight) {
        hemiLight.color.setHex(0xfb923c);
        hemiLight.groundColor.setHex(0x78350f);
        hemiLight.intensity = 0.9;
      }
      if (dirLight) {
        dirLight.color.setHex(0xf59e0b); // Warm golden sun
        dirLight.intensity = 2.2;
        dirLight.position.set(22, 10, 16);
      }
      if (rimLight) rimLight.color.setHex(0xec4899), (rimLight.intensity = 0.9);
    } else {
      // Night mode
      scene.background = new THREE.Color(0x030712); // Midnight navy
      scene.fog = new THREE.FogExp2(0x030712, 0.022);
      if (ambientLight) ambientLight.color.setHex(0x1e293b), (ambientLight.intensity = 0.4);
      if (hemiLight) {
        hemiLight.color.setHex(0x38bdf8);
        hemiLight.groundColor.setHex(0x0f172a);
        hemiLight.intensity = 0.45;
      }
      if (dirLight) {
        dirLight.color.setHex(0x60a5fa); // Cool moonlight
        dirLight.intensity = 0.8;
        dirLight.position.set(10, 22, -10);
      }
      if (rimLight) rimLight.color.setHex(0xa855f7), (rimLight.intensity = 0.7);
    }
  }, [lightMode]);

  // Update camera when viewMode toggles between 3D and 2D
  useEffect(() => {
    if (viewMode === '2D') {
      targetCamPosRef.current = new THREE.Vector3(0, 36, 0.01);
      targetTargetPosRef.current = new THREE.Vector3(0, 0, 0);
    } else {
      targetCamPosRef.current = new THREE.Vector3(13, 20, 22);
      targetTargetPosRef.current = new THREE.Vector3(0, 0, 0);
    }
  }, [viewMode]);

  // Build and render 3D Procedural Landmark Models for filtered spots
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    if (!markersGroup) return;

    // Clear old markers
    while (markersGroup.children.length > 0) {
      markersGroup.remove(markersGroup.children[0]);
    }
    animatedObjectsRef.current = [];
    markerMeshesMapRef.current.clear();

    // Factory functions for the 5 Low-Poly 3D Landmark Models
    filteredSpots.forEach((spot) => {
      const isCollected = collectedSpotIds.has(spot.id);
      const isSelected = selectedSpotId === spot.id;

      const spotGroup = new THREE.Group();
      spotGroup.position.set(spot.pos3D[0], spot.pos3D[1], spot.pos3D[2]);
      spotGroup.userData = { spot };

      // Pin base disc / pedestal
      const baseGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.12, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: isCollected ? 0xb91c1c : 0xffffff, // 朱紅 or pearl white
        roughness: 0.3,
        metalness: 0.2,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.06;
      spotGroup.add(baseMesh);

      // Model container
      const modelContainer = new THREE.Group();
      modelContainer.position.y = 0.15;

      switch (spot.category) {
        case 'Landmark': {
          // 1. 休閒樂園 (Landmark): 彩色摩天輪 (Ferris Wheel)
          const wheelGroup = new THREE.Group();
          // Support A-frame legs
          const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2);
          const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.3 });
          const legLeft = new THREE.Mesh(legGeo, legMat);
          legLeft.position.set(-0.25, 0.6, 0);
          legLeft.rotation.z = 0.25;
          const legRight = new THREE.Mesh(legGeo, legMat);
          legRight.position.set(0.25, 0.6, 0);
          legRight.rotation.z = -0.25;
          wheelGroup.add(legLeft, legRight);

          // Wheel hub and rim
          const rotatingPart = new THREE.Group();
          rotatingPart.position.set(0, 1.1, 0);

          const hubGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12);
          hubGeo.rotateX(Math.PI / 2);
          const hubMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2 });
          const hubMesh = new THREE.Mesh(hubGeo, hubMat);
          rotatingPart.add(hubMesh);

          const rimGeo = new THREE.TorusGeometry(0.7, 0.035, 8, 24);
          const rimMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
          const rimMesh = new THREE.Mesh(rimGeo, rimMat);
          rotatingPart.add(rimMesh);

          // Spokes and 6 colored gondolas
          const gondolaColors = [0xef4444, 0xf59e0b, 0x10b981, 0x06b6d4, 0x8b5cf6, 0xec4899];
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            // Spoke
            const spokeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7);
            const spokeMesh = new THREE.Mesh(spokeGeo, legMat);
            spokeMesh.position.set(Math.cos(angle) * 0.35, Math.sin(angle) * 0.35, 0);
            spokeMesh.rotation.z = angle - Math.PI / 2;
            rotatingPart.add(spokeMesh);

            // Gondola cabin
            const cabinGeo = new THREE.BoxGeometry(0.16, 0.18, 0.14);
            const cabinMat = new THREE.MeshStandardMaterial({ color: gondolaColors[i], roughness: 0.25 });
            const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
            cabinMesh.position.set(Math.cos(angle) * 0.7, Math.sin(angle) * 0.7, 0);
            rotatingPart.add(cabinMesh);
          }

          wheelGroup.add(rotatingPart);
          wheelGroup.scale.set(0.65, 0.65, 0.65);
          modelContainer.add(wheelGroup);

          animatedObjectsRef.current.push({
            mesh: rotatingPart,
            update: (t) => {
              rotatingPart.rotation.z = t * 0.8;
            },
          });
          break;
        }

        case 'Nature': {
          // 2. 壯麗自然 (Nature): 三角錐山 (Triangular Mountain Peak)
          // Left side bright emerald green, right side dark forest green
          const mountainGroup = new THREE.Group();
          const pGeom = new THREE.BufferGeometry();
          // 3-sided pyramid vertices: Apex, Left, Right, Back
          const apex = [0, 1.4, 0];
          const leftPt = [-0.6, 0, 0.3];
          const rightPt = [0.6, 0, 0.3];
          const backPt = [0, 0, -0.6];

          // Left face (bright emerald green)
          const leftFaceGeo = new THREE.BufferGeometry();
          const leftVertices = new Float32Array([...apex, ...leftPt, ...backPt]);
          leftFaceGeo.setAttribute('position', new THREE.BufferAttribute(leftVertices, 3));
          leftFaceGeo.computeVertexNormals();
          const leftMat = new THREE.MeshStandardMaterial({
            color: 0x34d399, // Bright emerald green
            roughness: 0.4,
            flatShading: true,
          });
          const leftFace = new THREE.Mesh(leftFaceGeo, leftMat);

          // Right face (dark forest green)
          const rightFaceGeo = new THREE.BufferGeometry();
          const rightVertices = new Float32Array([...apex, ...backPt, ...rightPt]);
          rightFaceGeo.setAttribute('position', new THREE.BufferAttribute(rightVertices, 3));
          rightFaceGeo.computeVertexNormals();
          const rightMat = new THREE.MeshStandardMaterial({
            color: 0x065f46, // Dark forest green
            roughness: 0.5,
            flatShading: true,
          });
          const rightFace = new THREE.Mesh(rightFaceGeo, rightMat);

          // Front face
          const frontFaceGeo = new THREE.BufferGeometry();
          const frontVertices = new Float32Array([...apex, ...rightPt, ...leftPt]);
          frontFaceGeo.setAttribute('position', new THREE.BufferAttribute(frontVertices, 3));
          frontFaceGeo.computeVertexNormals();
          const frontMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            roughness: 0.45,
            flatShading: true,
          });
          const frontFace = new THREE.Mesh(frontFaceGeo, frontMat);

          mountainGroup.add(leftFace, rightFace, frontFace);

          // White snow cap on tip
          const snowCapGeo = new THREE.ConeGeometry(0.24, 0.4, 4);
          const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
          const snowCap = new THREE.Mesh(snowCapGeo, snowCapMat);
          snowCap.position.y = 1.15;
          mountainGroup.add(snowCap);

          mountainGroup.scale.set(0.65, 0.65, 0.65);
          modelContainer.add(mountainGroup);
          break;
        }

        case 'Culture': {
          // 3. 人文古蹟 (Culture): 美濃紙傘 (Meinong Paper Painted Umbrella)
          const umbrellaGroup = new THREE.Group();
          // Canopy cone (open paper umbrella)
          const canopyGeo = new THREE.ConeGeometry(0.75, 0.35, 16, 1, true);
          canopyGeo.rotateX(Math.PI);
          const canopyMat = new THREE.MeshStandardMaterial({
            color: 0xfffaf0, // Ivory white paper base
            roughness: 0.35,
            side: THREE.DoubleSide,
          });
          const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
          canopyMesh.position.y = 0.75;
          umbrellaGroup.add(canopyMesh);

          // Red & gold auspicious painted decorative ring on umbrella
          const decRingGeo = new THREE.TorusGeometry(0.48, 0.03, 8, 16);
          decRingGeo.rotateX(Math.PI / 2);
          const decRingMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
          const decRing = new THREE.Mesh(decRingGeo, decRingMat);
          decRing.position.y = 0.82;
          umbrellaGroup.add(decRing);

          // Wooden handle & tip
          const shaftGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9);
          const shaftMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
          const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
          shaftMesh.position.y = 0.5;
          umbrellaGroup.add(shaftMesh);

          // Finial on top
          const finialGeo = new THREE.SphereGeometry(0.06, 8, 8);
          const finialMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
          const finialMesh = new THREE.Mesh(finialGeo, finialMat);
          finialMesh.position.y = 0.95;
          umbrellaGroup.add(finialMesh);

          // Tilted angle
          umbrellaGroup.rotation.z = 0.35;
          umbrellaGroup.rotation.x = 0.2;
          umbrellaGroup.scale.set(0.68, 0.68, 0.68);
          modelContainer.add(umbrellaGroup);

          animatedObjectsRef.current.push({
            mesh: umbrellaGroup,
            update: (t) => {
              umbrellaGroup.rotation.y = t * 0.4;
            },
          });
          break;
        }

        case 'Food': {
          // 4. 夜市美食 (Food): 黃色玉米 (Yellow Roasted Corn)
          const cornGroup = new THREE.Group();
          // Textured golden-yellow corn cob
          const cobGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.85, 12);
          const cobMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15, // Golden yellow
            roughness: 0.4,
            metalness: 0.1,
          });
          const cobMesh = new THREE.Mesh(cobGeo, cobMat);
          cobMesh.position.y = 0.58;
          cornGroup.add(cobMesh);

          // Corn kernel ring bumps
          for (let k = 0; k < 4; k++) {
            const kRingGeo = new THREE.TorusGeometry(0.21, 0.035, 6, 12);
            kRingGeo.rotateX(Math.PI / 2);
            const kRingMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35 });
            const kRing = new THREE.Mesh(kRingGeo, kRingMat);
            kRing.position.y = 0.35 + k * 0.16;
            cornGroup.add(kRing);
          }

          // Green husk leaves wrapping bottom
          const huskGeo = new THREE.ConeGeometry(0.28, 0.45, 6, 1, true);
          const huskMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.5, side: THREE.DoubleSide });
          const huskMesh = new THREE.Mesh(huskGeo, huskMat);
          huskMesh.position.y = 0.28;
          cornGroup.add(huskMesh);

          // Wooden skewer
          const skewerGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4);
          const skewerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
          const skewerMesh = new THREE.Mesh(skewerGeo, skewerMat);
          skewerMesh.position.y = 0.08;
          cornGroup.add(skewerMesh);

          cornGroup.rotation.z = 0.2;
          cornGroup.scale.set(0.68, 0.68, 0.68);
          modelContainer.add(cornGroup);
          break;
        }

        case 'Coast': {
          // 5. 海岸海島 (Coast): 椰子樹 (Coconut Palm Tree)
          const palmGroup = new THREE.Group();
          // Segmented curved trunk
          const trunkGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.9, 8);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
          const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
          trunkMesh.position.set(0.06, 0.45, 0);
          trunkMesh.rotation.z = -0.15;
          palmGroup.add(trunkMesh);

          // Fronds (palm leaves) radiating outward
          const leafGroup = new THREE.Group();
          leafGroup.position.set(0.12, 0.9, 0);

          for (let f = 0; f < 5; f++) {
            const angle = (f * Math.PI * 2) / 5;
            const frondGeo = new THREE.BoxGeometry(0.65, 0.03, 0.16);
            const frondMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 });
            const frondMesh = new THREE.Mesh(frondGeo, frondMat);
            frondMesh.position.set(Math.cos(angle) * 0.3, -0.05, Math.sin(angle) * 0.3);
            frondMesh.rotation.y = angle;
            frondMesh.rotation.z = 0.3; // drooping downwards
            leafGroup.add(frondMesh);
          }

          // Coconuts cluster
          for (let c = 0; c < 3; c++) {
            const cGeo = new THREE.SphereGeometry(0.07, 8, 8);
            const cMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
            const cMesh = new THREE.Mesh(cGeo, cMat);
            const ca = (c * Math.PI * 2) / 3;
            cMesh.position.set(Math.cos(ca) * 0.08, -0.08, Math.sin(ca) * 0.08);
            leafGroup.add(cMesh);
          }

          palmGroup.add(leafGroup);
          palmGroup.scale.set(0.72, 0.72, 0.72);
          modelContainer.add(palmGroup);

          animatedObjectsRef.current.push({
            mesh: leafGroup,
            update: (t) => {
              leafGroup.rotation.z = Math.sin(t * 1.5) * 0.06;
            },
          });
          break;
        }
      }

      // If collected, place a golden star / ruby stamp badge indicator above landmark
      if (isCollected) {
        const badgeGeo = new THREE.SphereGeometry(0.14, 12, 12);
        const badgeMat = new THREE.MeshStandardMaterial({
          color: 0xef4444, // Vermilion seal red
          emissive: 0x991b1b,
          emissiveIntensity: 0.6,
          roughness: 0.2,
        });
        const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
        badgeMesh.position.y = 1.35;
        modelContainer.add(badgeMesh);
      }

      // If currently selected, elevate slightly and highlight
      if (isSelected) {
        modelContainer.position.y = 0.35;
        const ringHlGeo = new THREE.RingGeometry(0.42, 0.52, 24);
        const ringHlMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
        const ringHlMesh = new THREE.Mesh(ringHlGeo, ringHlMat);
        ringHlMesh.rotation.x = -Math.PI / 2;
        ringHlMesh.position.y = 0.04;
        spotGroup.add(ringHlMesh);
      }

      spotGroup.add(modelContainer);
      markersGroup.add(spotGroup);
      markerMeshesMapRef.current.set(spot.id, spotGroup);
    });
  }, [filteredSpots, collectedSpotIds, selectedSpotId]);

  // Raycasting for Mouse Hover and Click
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      setMousePos({ x: e.clientX, y: e.clientY });

      if (!cameraRef.current || !markersGroupRef.current) return;
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(markersGroupRef.current.children, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.spot && obj.parent !== markersGroupRef.current) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.spot) {
          setHoveredSpot(obj.userData.spot);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredSpot(null);
      container.style.cursor = 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraRef.current || !markersGroupRef.current) return;
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(markersGroupRef.current.children, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.spot && obj.parent !== markersGroupRef.current) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.spot) {
          const clickedSpot = obj.userData.spot as Spot;
          onSelectSpot(clickedSpot);
        }
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('click', handleClick);
    };
  }, [onSelectSpot]);

  // Onscreen Camera Navigation controls
  const handleMoveNorth = () => {
    if (!controlsRef.current) return;
    targetTargetPosRef.current.z -= 2.5;
    targetCamPosRef.current.z -= 2.5;
  };

  const handleMoveSouth = () => {
    if (!controlsRef.current) return;
    targetTargetPosRef.current.z += 2.5;
    targetCamPosRef.current.z += 2.5;
  };

  const handleZoomIn = () => {
    if (!cameraRef.current) return;
    const dir = new THREE.Vector3().subVectors(targetTargetPosRef.current, targetCamPosRef.current).normalize();
    targetCamPosRef.current.addScaledVector(dir, 4);
  };

  const handleZoomOut = () => {
    if (!cameraRef.current) return;
    const dir = new THREE.Vector3().subVectors(targetTargetPosRef.current, targetCamPosRef.current).normalize();
    targetCamPosRef.current.addScaledVector(dir, -4);
  };

  const handleResetCamera = () => {
    if (viewMode === '2D') {
      targetCamPosRef.current = new THREE.Vector3(0, 36, 0.01);
      targetTargetPosRef.current = new THREE.Vector3(0, 0, 0);
    } else {
      targetCamPosRef.current = new THREE.Vector3(13, 20, 22);
      targetTargetPosRef.current = new THREE.Vector3(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-900">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Hover Spot Inspection Card */}
      {hoveredSpot && (
        <div
          className="fixed pointer-events-none z-30 transition-opacity duration-150 transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y - 12}px` }}
        >
          <div className="bg-slate-900/90 text-white text-xs px-3.5 py-2 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-sm min-w-[160px]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-sm text-amber-300">{hoveredSpot.name}</span>
              {collectedSpotIds.has(hoveredSpot.id) ? (
                <span className="text-[10px] text-rose-400 font-medium">已收集</span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">未蓋章</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-[11px]">
              <span>{hoveredSpot.county}</span>
              <span aria-hidden="true">·</span>
              <span>{hoveredSpot.categoryZh}</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-mono">★ {hoveredSpot.rating}</span>
            </div>
          </div>
        </div>
      )}

      {/* Onscreen Navigation Control Buttons (Compass & Pan/Zoom) */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-1.5 z-20 bg-slate-900/85 p-1.5 rounded-xl border border-slate-700/60 shadow-lg backdrop-blur-sm">
        <button
          onClick={handleMoveNorth}
          title="向北移動"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleMoveSouth}
          title="向南移動"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <div className="w-5 h-[1px] bg-slate-700/70 my-0.5" />
        <button
          onClick={handleZoomIn}
          title="放大視角"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="縮小視角"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-5 h-[1px] bg-slate-700/70 my-0.5" />
        <button
          onClick={handleResetCamera}
          title="復位視角"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange(viewMode === '3D' ? '2D' : '3D')}
          title="切換 3D 透視 / 2D 俯視"
          className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors mt-0.5 ${
            viewMode === '3D' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          {viewMode}
        </button>
      </div>

      {/* 3D Legend & Categories Guide (Top Left corner) */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/85 px-3 py-2.5 rounded-xl border border-slate-700/60 shadow-md backdrop-blur-sm text-xs text-slate-300 hidden md:block">
        <div className="font-semibold text-slate-200 text-xs mb-1.5 flex items-center gap-1.5">
          <span>3D 地標模型圖例</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>休閒樂園 · 彩色摩天輪</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>壯麗自然 · 三角錐山</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span>人文古蹟 · 美濃紙傘</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span>夜市美食 · 黃色玉米</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span>海岸海島 · 椰子樹</span>
          </div>
        </div>
      </div>
    </div>
  );
};
