export interface FarewellRenderFrame {
  presence: number;
  wash: number;
  rim: number;
  shadow: number;
  cut: boolean;
}

const VERTEX = `#version 300 es
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}`;
const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uModel; uniform vec2 uResolution; uniform vec4 uRect;
uniform float uPresence,uWash,uRim,uShadow,uCut,uHasModel;
out vec4 outColor;
float alphaAt(vec2 uv){if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return 0.;return texture(uModel,uv).a;}
void main(){
 if(uCut>.5){outColor=vec4(0.,0.,0.,1.);return;}
 vec2 pixel=vec2(gl_FragCoord.x,uResolution.y-gl_FragCoord.y);
 vec2 uv=(pixel-uRect.xy)/uRect.zw; vec4 model=vec4(0.);
 if(uHasModel>.5&&all(greaterThanEqual(uv,vec2(0.)))&&all(lessThanEqual(uv,vec2(1.)))) model=texture(uModel,uv)*uPresence;
 vec2 shadowDelta=(pixel-vec2(uRect.x+uRect.z*.5,uRect.y+uRect.w*.94))/vec2(uRect.z*.34,uRect.w*.055);
 float contact=exp(-dot(shadowDelta,shadowDelta)*2.8)*uShadow;
 vec3 background=mix(vec3(1.),vec3(.78,.815,.87),contact*.5);
 vec2 px=vec2(2.)/uRect.zw;
 float edge=model.a*max(0.,alphaAt(uv)-alphaAt(uv+vec2(0.,-px.y*4.)))*uRim;
 vec3 color=mix(model.rgb,vec3(model.a),uWash)+vec3(edge);
 color+=background*(1.-model.a); outColor=vec4(clamp(color,0.,1.),1.);
}`;

/** White-void compositor. It samples the maintained Live2D canvas without owning the model. */
export class FarewellRenderer {
  readonly canvas = document.createElement("canvas");
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private texture: WebGLTexture;
  private disposed = false;
  constructor(private source: () => HTMLCanvasElement | null) {
    const gl = this.canvas.getContext("webgl2", { alpha: false, antialias: false });
    if (!gl) throw new Error("Farewell requires WebGL2");
    this.gl = gl;
    const compile = (type: number, body: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create Farewell shader");
      gl.shaderSource(shader, body); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) || "Farewell shader failed";
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    };
    const program = gl.createProgram();
    if (!program) throw new Error("Unable to create Farewell program");
    let vertex: WebGLShader | undefined, fragment: WebGLShader | undefined;
    try {
      vertex = compile(gl.VERTEX_SHADER, VERTEX);
      fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
      gl.attachShader(program, vertex); gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program) || "Farewell program failed");
    } catch (error) {
      gl.deleteProgram(program);
      throw error;
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }
    const texture = gl.createTexture();
    if (!texture) {
      gl.deleteProgram(program);
      throw new Error("Unable to create Farewell texture");
    }
    this.program = program; this.texture = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.canvas.style.cssText = "width:100%;height:100%;display:block";
  }
  render(frame: FarewellRenderFrame) {
    if (this.disposed) return;
    const gl = this.gl, ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    const source = this.source(), hasModel = Boolean(source?.width && source.height);
    if (source && hasModel) {
      gl.bindTexture(gl.TEXTURE_2D, this.texture); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }
    const uniform = (name: string) => gl.getUniformLocation(this.program, name);
    const modelHeight = height * .9, modelWidth = modelHeight * .5;
    gl.viewport(0, 0, width, height); gl.useProgram(this.program);
    gl.uniform2f(uniform("uResolution"), width, height);
    gl.uniform4f(uniform("uRect"), width * .46 - modelWidth / 2, height * .04, modelWidth, modelHeight);
    gl.uniform1f(uniform("uHasModel"), hasModel ? 1 : 0);
    gl.uniform1f(uniform("uPresence"), frame.presence); gl.uniform1f(uniform("uWash"), frame.wash);
    gl.uniform1f(uniform("uRim"), frame.rim); gl.uniform1f(uniform("uShadow"), frame.shadow);
    gl.uniform1f(uniform("uCut"), frame.cut ? 1 : 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.gl.deleteTexture(this.texture); this.gl.deleteProgram(this.program); this.canvas.remove();
  }
}
