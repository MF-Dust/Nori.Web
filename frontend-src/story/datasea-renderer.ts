import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const GLB = "/datasea/cosmicweb.min.glb";
const NEBULA = "/datasea/nebula_color_live.png";
const HEIGHT = "/datasea/disp_height.png";

const vertexShader = `
uniform float uTime, uReveal, uTravel;
uniform sampler2D uHeight;
varying vec2 vUv; varying float vGlow;
void main(){
  vUv=uv; float h=texture2D(uHeight,uv).r;
  vec3 p=position + normal*(h-.5)*(1.4+uReveal*2.8);
  p.z += sin((p.x+p.y)*.19+uTime*.42)*.16*uReveal;
  vGlow=smoothstep(.18,.82,h)*uReveal;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;
const fragmentShader = `
uniform float uReveal,uDissolve,uGrade; uniform sampler2D uNebula,uHeight;
varying vec2 vUv; varying float vGlow;
void main(){
  float h=texture2D(uHeight,vUv).r;
  if(h < uDissolve-.12) discard;
  vec3 neb=texture2D(uNebula,vUv).rgb;
  vec3 deep=mix(vec3(.004,.014,.028),vec3(.06,.32,.43),vGlow);
  vec3 color=mix(deep,neb,.38+vGlow*.5);
  color=mix(color,color/(color+vec3(1.0)),uGrade);
  gl_FragColor=vec4(color,clamp(uReveal*2.0,0.0,1.0));
}`;

export interface DataseaRenderFrame { time: number; phase: string | null; camera: { x: number; y: number; z: number }; cameraRot: { x: number; y: number; z: number }; fov: number; }
export interface DataseaRenderer { readonly ready: Promise<void>; render(frame: DataseaRenderFrame): void; resize(): void; dispose(): void; }

function loadTexture(loader: THREE.TextureLoader, url: string) {
  return new Promise<THREE.Texture>((resolve, reject) => loader.load(url, resolve, undefined, reject));
}
function disposeObject(root: THREE.Object3D, keepMaterial?: THREE.Material) {
  root.traverse((object) => { if (!(object instanceof THREE.Mesh)) return; object.geometry?.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((entry) => { if (entry !== keepMaterial) entry.dispose(); }); });
}

export function createDataseaRenderer(canvas: HTMLCanvasElement): DataseaRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene(), fog = new THREE.Fog(0x01050b, 10, 240); scene.background = new THREE.Color(0x000205); scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 8000);
  const root = new THREE.Group(); root.rotation.x = Math.PI / 2; scene.add(root);
  const uniforms = { uTime: { value: 0 }, uReveal: { value: 0 }, uTravel: { value: 0 }, uDissolve: { value: 0 }, uGrade: { value: 0 }, uNebula: { value: null as THREE.Texture | null }, uHeight: { value: null as THREE.Texture | null } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const starGeometry = new THREE.BufferGeometry(), positions = new Float32Array(8000 * 3);
  for (let index = 0; index < 8000; index++) { const radius = 18 + (index % 127) * 2.1, angle = index * 2.399963; positions[index * 3] = Math.cos(angle) * radius; positions[index * 3 + 1] = ((index * 47) % 480) - 240; positions[index * 3 + 2] = Math.sin(angle) * radius; }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0x91edff, size: 0.12, transparent: true, opacity: 0 });
  const stars = new THREE.Points(starGeometry, starMaterial); scene.add(stars);
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.4, 0.55); composer.addPass(bloom);
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uGrade: { value: 0 } }, vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}", fragmentShader: "uniform sampler2D tDiffuse;uniform float uGrade;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;c=mix(c,c/(c+vec3(1.)),uGrade);gl_FragColor=vec4(c,1.);}" }); composer.addPass(grade);
  let disposed = false, loadedRoot: THREE.Object3D | null = null, width = 0, height = 0;
  const manager = new THREE.LoadingManager();
  const ready = Promise.allSettled([new GLTFLoader(manager).loadAsync(GLB), loadTexture(new THREE.TextureLoader(manager), NEBULA), loadTexture(new THREE.TextureLoader(manager), HEIGHT)]).then((results) => {
    const [gltfResult, nebulaResult, heightResult] = results;
    if (results.some((result) => result.status === "rejected")) {
      if (gltfResult.status === "fulfilled") disposeObject(gltfResult.value.scene);
      if (nebulaResult.status === "fulfilled") nebulaResult.value.dispose();
      if (heightResult.status === "fulfilled") heightResult.value.dispose();
      const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
      throw failed?.reason ?? new Error("Datasea assets failed to load");
    }
    if (gltfResult.status !== "fulfilled" || nebulaResult.status !== "fulfilled" || heightResult.status !== "fulfilled") throw new Error("Datasea assets failed to load");
    const gltf = gltfResult.value, nebula = nebulaResult.value, heightMap = heightResult.value;
    if (disposed) { disposeObject(gltf.scene); nebula.dispose(); heightMap.dispose(); return; }
    nebula.colorSpace = THREE.SRGBColorSpace; nebula.wrapS = nebula.wrapT = THREE.MirroredRepeatWrapping;
    heightMap.wrapS = heightMap.wrapT = THREE.MirroredRepeatWrapping; uniforms.uNebula.value = nebula; uniforms.uHeight.value = heightMap;
    const modelRoot = gltf.scene; loadedRoot = modelRoot; modelRoot.traverse((object) => { if (object instanceof THREE.Mesh) { const old = Array.isArray(object.material) ? object.material : [object.material]; old.forEach((entry) => entry.dispose()); object.material = material; object.frustumCulled = false; } });
    const box = new THREE.Box3().setFromObject(modelRoot), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    modelRoot.position.sub(center); modelRoot.scale.setScalar(70 / Math.max(size.x, size.y, size.z, 1)); root.add(modelRoot);
  });
  const resize = () => { const nextWidth = Math.max(1, canvas.clientWidth), nextHeight = Math.max(1, canvas.clientHeight); if (nextWidth === width && nextHeight === height) return; width = nextWidth; height = nextHeight; const ratio = Math.min(devicePixelRatio || 1, 2); renderer.setPixelRatio(ratio); renderer.setSize(width, height, false); composer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); };
  const render = (frame: DataseaRenderFrame) => { if (disposed) return; resize(); camera.position.set(frame.camera.x, frame.camera.y, frame.camera.z); camera.rotation.set(frame.cameraRot.x, frame.cameraRot.y, frame.cameraRot.z); camera.fov = frame.fov; camera.updateProjectionMatrix(); const cosmic = frame.phase === "cosmic", convergence = frame.phase === "converge"; uniforms.uTime.value = frame.time; uniforms.uReveal.value = loadedRoot ? Math.min(1, uniforms.uReveal.value + 0.012) : 0; uniforms.uTravel.value = cosmic ? 1 : 0; uniforms.uDissolve.value = cosmic ? Math.max(0, Math.min(0.92, (frame.time % 42) / 46)) : 0; uniforms.uGrade.value = cosmic ? 1 : 0.3; root.rotation.z = frame.time * (cosmic ? 0.025 : 0.004); root.position.z = cosmic ? (frame.time % 42) * 1.8 : 0; stars.rotation.y = frame.time * 0.015; starMaterial.opacity = convergence || cosmic ? 0.75 : 0.12; bloom.strength = cosmic ? 0.38 : convergence ? 0.2 : 0; grade.uniforms.uGrade.value = cosmic ? 1 : 0.35; fog.far = cosmic ? 90 : 240; composer.render(); };
  const dispose = () => { if (disposed) return; disposed = true; if (loadedRoot) disposeObject(loadedRoot, material); root.remove(...root.children); starGeometry.dispose(); starMaterial.dispose(); material.dispose(); uniforms.uNebula.value?.dispose(); uniforms.uHeight.value?.dispose(); composer.dispose(); renderer.dispose(); loadedRoot = null; };
  return { ready, render, resize, dispose };
}
