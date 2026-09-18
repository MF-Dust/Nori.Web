import * as THREE from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";

const vertex = "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}";
const reproject = `
uniform sampler2D currentFrame, historyFrame;
uniform mat4 inverseViewProjection, previousViewProjection;
uniform vec3 cameraPosition;
uniform float historyWeight, focusDistance;
varying vec2 vUv;
void main(){
  vec3 current=texture2D(currentFrame,vUv).rgb;
  vec2 clipXY=vUv*2.0-1.0;
  vec4 farPoint=inverseViewProjection*vec4(clipXY,1.0,1.0);
  vec3 ray=normalize(farPoint.xyz/farPoint.w-cameraPosition);
  vec4 oldClip=previousViewProjection*vec4(cameraPosition+ray*focusDistance,1.0);
  vec2 oldUv=oldClip.xy/max(oldClip.w,0.0001)*0.5+0.5;
  bool valid=oldClip.w>0.0&&all(greaterThan(oldUv,vec2(0.0)))&&all(lessThan(oldUv,vec2(1.0)));
  vec3 history=valid?texture2D(historyFrame,oldUv).rgb:current;
  gl_FragColor=vec4(mix(current,history,valid?historyWeight:0.0),1.0);
}`;
const copy = "uniform sampler2D source;varying vec2 vUv;void main(){gl_FragColor=texture2D(source,vUv);}";

export class DataseaTemporalPass extends Pass {
  private history = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  private initialized = false;
  private resetRequested = true;
  private previousViewProjection = new THREE.Matrix4();
  private readonly material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: reproject,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      currentFrame: { value: null as THREE.Texture | null },
      historyFrame: { value: this.history.texture },
      inverseViewProjection: { value: new THREE.Matrix4() },
      previousViewProjection: { value: this.previousViewProjection },
      cameraPosition: { value: new THREE.Vector3() },
      historyWeight: { value: 0.9 },
      focusDistance: { value: 300 },
    },
  });
  private readonly copyMaterial = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: copy, depthTest: false, depthWrite: false, uniforms: { source: { value: null as THREE.Texture | null } } });
  private readonly quad = new FullScreenQuad(this.material);
  constructor(private readonly camera: THREE.PerspectiveCamera) { super(); }
  reset() { this.resetRequested = true; }
  setFocusDistance(distance: number) { this.material.uniforms.focusDistance.value = Math.max(1, distance); }
  setSize(width: number, height: number) { this.history.setSize(Math.max(1, width), Math.max(1, height)); this.reset(); }
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    this.camera.updateMatrixWorld();
    const viewProjection = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    const reset = this.resetRequested || !this.initialized;
    this.material.uniforms.currentFrame.value = readBuffer.texture;
    this.material.uniforms.historyFrame.value = this.history.texture;
    this.material.uniforms.inverseViewProjection.value.copy(viewProjection).invert();
    this.material.uniforms.cameraPosition.value.setFromMatrixPosition(this.camera.matrixWorld);
    this.material.uniforms.historyWeight.value = reset ? 0 : 0.9;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.material = this.material;
    this.quad.render(renderer);
    if (!this.renderToScreen) {
      this.copyMaterial.uniforms.source.value = writeBuffer.texture;
      this.quad.material = this.copyMaterial;
      renderer.setRenderTarget(this.history);
      this.quad.render(renderer);
    }
    this.previousViewProjection.copy(viewProjection);
    this.initialized = true;
    this.resetRequested = false;
  }
  dispose() { this.history.dispose(); this.material.dispose(); this.copyMaterial.dispose(); this.quad.dispose(); }
}
