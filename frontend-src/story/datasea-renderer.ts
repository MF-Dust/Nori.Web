import * as THREE from "three";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { TAARenderPass } from "three/addons/postprocessing/TAARenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { DataseaTemporalPass } from "./datasea-temporal-pass";

const GLB = "/datasea/cosmicweb.min.glb";
const NEBULA = "/datasea/nebula_color_live.png";
const HEIGHT = "/datasea/disp_height.png";

const gasVertexShader = `
uniform float uTime, uReveal;
uniform sampler2D uHeight;
varying vec2 vUv; varying vec3 vNormal; varying float vHeight;
void main(){
  vUv=uv; vHeight=texture2D(uHeight,uv).r;
  vec3 p=position + normalize(normal)*(vHeight-.5)*30.0;
  p += normalize(normal)*sin((p.x+p.y)*.019+uTime*.18)*.55*uReveal;
  vNormal=normalize(normalMatrix*normal);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;
const gasFragmentShader = `
uniform float uReveal,uDissolve,uGrade; uniform sampler2D uNebula; uniform vec3 uSH[9]; uniform mat3 uEnvT;
varying vec2 vUv; varying vec3 vNormal; varying float vHeight;
vec3 environment(vec3 normal){vec3 n=uEnvT*normal;return max(uSH[0]+uSH[1]*n.y+uSH[2]*n.z+uSH[3]*n.x+uSH[4]*n.y*n.x+uSH[5]*n.y*n.z+uSH[6]*(3.0*n.z*n.z-1.0)+uSH[7]*n.z*n.x+uSH[8]*(n.x*n.x-n.y*n.y),vec3(0.0));}
void main(){
  if(vHeight < uDissolve-.12) discard;
  vec3 neb=texture2D(uNebula,vUv).rgb;
  float facing=.35+.65*abs(vNormal.z);
  vec3 deep=mix(vec3(.004,.014,.028),vec3(.06,.32,.43),smoothstep(.18,.82,vHeight));
  vec3 color=mix(deep,neb,.58)*(facing+environment(normalize(vNormal))*1.72);
  color=mix(color,color/(color+vec3(1.0)),uGrade);
  gl_FragColor=vec4(color,clamp(uReveal*2.0,0.0,1.0)*.0008);
}`;
const starVertexShader = `varying vec3 vNormal; void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const starFragmentShader = `uniform float uReveal; varying vec3 vNormal; void main(){float light=.5+.5*abs(vNormal.z);gl_FragColor=vec4(vec3(10.0)*light*uReveal,.645);}`;
const moteVertexShader = `uniform float uTime,uFade;attribute vec3 aVelocity,aTint;attribute float aSize;varying vec3 vTint;varying float vFade;void main(){vec3 lo=vec3(-28.,-20.,-70.),sz=vec3(56.,40.,66.);vec3 p=mod(position+aVelocity*uTime-lo,sz)+lo;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(aSize*(180./max(1.,-mv.z)),1.,18.);gl_Position=projectionMatrix*mv;vTint=aTint;vFade=uFade;}`;
const moteFragmentShader = `varying vec3 vTint;varying float vFade;void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;float core=exp(-6.*r),halo=exp(-1.6*r);gl_FragColor=vec4(vTint*(core+halo*.32)*vFade,(core+halo*.18)*vFade);}`;

export interface DataseaRenderFrame { time: number; phaseTime?: number; phase: string | null; camera: { x: number; y: number; z: number }; cameraRot: { x: number; y: number; z: number }; fov: number; reveal?: number; dissolve?: number; grade?: number; bloomStrength?: number; starOpacity?: number; fogFar?: number; }
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
  const environmentSH = [.102,.074,.083,-.016,-.013,-.02,.005,.005,.011,.02,.021,.036,-.04,-.031,-.041,-.061,-.044,-.051,-.014,-.011,-.013,.059,.043,.051,.029,.022,.025].reduce<THREE.Vector3[]>((values, value, index) => { if (index % 3 === 0) values.push(new THREE.Vector3()); values.at(-1)!.setComponent(index % 3, value); return values; }, []);
  const uniforms = { uTime: { value: 0 }, uReveal: { value: 0 }, uDissolve: { value: 0 }, uGrade: { value: 0 }, uNebula: { value: null as THREE.Texture | null }, uHeight: { value: null as THREE.Texture | null }, uSH: { value: environmentSH }, uEnvT: { value: new THREE.Matrix3() } };
  const gasMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: gasVertexShader, fragmentShader: gasFragmentShader, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const shellUniforms = { uReveal: uniforms.uReveal };
  const shellMaterial = new THREE.ShaderMaterial({ uniforms: shellUniforms, vertexShader: starVertexShader, fragmentShader: starFragmentShader, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const moteGeometry = new THREE.BufferGeometry(), moteCount = 280, positions = new Float32Array(moteCount * 3), velocities = new Float32Array(moteCount * 3), tints = new Float32Array(moteCount * 3), sizes = new Float32Array(moteCount);
  let randomState = 0x4e4f5249; const random = () => { randomState = Math.imul(randomState ^ randomState >>> 15, 1 | randomState); randomState ^= randomState + Math.imul(randomState ^ randomState >>> 7, 61 | randomState); return ((randomState ^ randomState >>> 14) >>> 0) / 4294967296; };
  for (let index = 0; index < moteCount; index++) { const offset = index * 3; positions[offset] = -28 + random() * 56; positions[offset + 1] = -20 + random() * 40; positions[offset + 2] = -70 + random() * 66; velocities[offset] = (random() - .5) * .28; velocities[offset + 1] = .08 + random() * .24; velocities[offset + 2] = (random() - .5) * .18; const star = index % 7 === 0; tints[offset] = star ? .78 : .22; tints[offset + 1] = star ? .92 : .7; tints[offset + 2] = 1; sizes[index] = star ? 3.4 : 1.4 + random() * 1.8; }
  moteGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3)); moteGeometry.setAttribute("aVelocity", new THREE.BufferAttribute(velocities, 3)); moteGeometry.setAttribute("aTint", new THREE.BufferAttribute(tints, 3)); moteGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const moteUniforms = { uTime: { value: 0 }, uFade: { value: 0 } }, moteMaterial = new THREE.ShaderMaterial({ uniforms: moteUniforms, vertexShader: moteVertexShader, fragmentShader: moteFragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const motes = new THREE.Points(moteGeometry, moteMaterial); scene.add(motes);
  const composer = new EffectComposer(renderer), taa = new TAARenderPass(scene, camera); taa.sampleLevel = 2; taa.unbiased = true; composer.addPass(taa);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.4, 0.55); composer.addPass(bloom);
  const temporal = new DataseaTemporalPass(camera); composer.addPass(temporal);
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uGrade: { value: 0 } }, vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}", fragmentShader: "uniform sampler2D tDiffuse;uniform float uGrade;varying vec2 vUv;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;gl_FragColor=vec4(mix(c,aces(c),uGrade),1.);}" }); composer.addPass(grade);
  const fxaa = new ShaderPass(FXAAShader); composer.addPass(fxaa);
  let disposed = false, loadedRoot: THREE.Object3D | null = null, width = 0, height = 0;
  const manager = new THREE.LoadingManager();
  const gltfLoader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
  const ready = Promise.allSettled([gltfLoader.loadAsync(GLB), loadTexture(new THREE.TextureLoader(manager), NEBULA), loadTexture(new THREE.TextureLoader(manager), HEIGHT)]).then((results) => {
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
    const modelRoot = gltf.scene; loadedRoot = modelRoot; modelRoot.traverse((object) => { if (object instanceof THREE.Mesh) { const old = Array.isArray(object.material) ? object.material : [object.material]; old.forEach((entry) => entry.dispose()); object.material = object.geometry.getAttribute("uv") ? gasMaterial : shellMaterial; object.frustumCulled = false; } });
    const box = new THREE.Box3().setFromObject(modelRoot), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    modelRoot.position.sub(center); modelRoot.scale.setScalar(70 / Math.max(size.x, size.y, size.z, 1)); root.add(modelRoot);
  });
  const resize = () => { const nextWidth = Math.max(1, canvas.clientWidth), nextHeight = Math.max(1, canvas.clientHeight); if (nextWidth === width && nextHeight === height) return; width = nextWidth; height = nextHeight; const ratio = Math.min(devicePixelRatio || 1, 2); renderer.setPixelRatio(ratio); renderer.setSize(width, height, false); composer.setSize(width, height); fxaa.material.uniforms.resolution.value.set(1 / (width * ratio), 1 / (height * ratio)); camera.aspect = width / height; camera.updateProjectionMatrix(); };
  let previousTime = Number.NaN, previousPosition = new THREE.Vector3(Number.POSITIVE_INFINITY, 0, 0), previousQuaternion = new THREE.Quaternion();
  const render = (frame: DataseaRenderFrame) => { if (disposed) return; resize(); camera.position.set(frame.camera.x, frame.camera.y, frame.camera.z); camera.rotation.set(frame.cameraRot.x, frame.cameraRot.y, frame.cameraRot.z); camera.fov = frame.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); uniforms.uEnvT.value.getNormalMatrix(camera.matrixWorldInverse); const cosmic = frame.phase === "cosmic", convergence = frame.phase === "converge", local = frame.phaseTime ?? frame.time; const reveal = frame.reveal ?? (loadedRoot ? Math.min(1, uniforms.uReveal.value + .012) : 0), dissolve = frame.dissolve ?? (cosmic ? Math.max(0, Math.min(.92, local / 46)) : 0), gradeValue = frame.grade ?? (cosmic ? 1 : .35), moteFade = frame.starOpacity ?? (convergence || cosmic ? .75 : .12); uniforms.uTime.value = frame.time; uniforms.uReveal.value = reveal; uniforms.uDissolve.value = dissolve; uniforms.uGrade.value = gradeValue; root.rotation.z = frame.time * (cosmic ? .025 : .004); root.position.z = cosmic ? local * 1.8 : 0; moteUniforms.uTime.value = frame.time; moteUniforms.uFade.value = moteFade * (1 - dissolve); bloom.strength = frame.bloomStrength ?? (cosmic ? .38 : convergence ? .2 : 0); grade.uniforms.uGrade.value = gradeValue; fog.far = frame.fogFar ?? (cosmic ? 90 : 240); const jumped = Number.isFinite(previousTime) && Math.abs(frame.time - previousTime) > .5, stable = camera.position.distanceToSquared(previousPosition) < 1e-10 && 1 - Math.abs(camera.quaternion.dot(previousQuaternion)) < 1e-12; taa.accumulate = !jumped && stable; temporal.enabled = cosmic; temporal.setFocusDistance(Math.max(1, camera.position.distanceTo(root.position))); if (jumped) temporal.reset(); composer.render(); previousTime = frame.time; previousPosition.copy(camera.position); previousQuaternion.copy(camera.quaternion); };
  const dispose = () => { if (disposed) return; disposed = true; if (loadedRoot) disposeObject(loadedRoot, gasMaterial); root.remove(...root.children); scene.remove(motes); moteGeometry.dispose(); moteMaterial.dispose(); gasMaterial.dispose(); shellMaterial.dispose(); uniforms.uNebula.value?.dispose(); uniforms.uHeight.value?.dispose(); composer.dispose(); renderer.dispose(); loadedRoot = null; };
  return { ready, render, resize, dispose };
}
