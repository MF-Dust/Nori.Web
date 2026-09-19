import {
  CULT_VERTEX,
  CULT_FRAGMENT,
  CULT_POST_FRAGMENT,
} from "./cult-shaders.js";
/** Two-pass fullscreen cult scene. All GL allocations belong to this renderer. */
export function createCultRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    premultipliedAlpha: false,
  });
  if (!gl) throw new Error("Cult scene requires WebGL2");
  const shaders: WebGLShader[] = [],
    programs: WebGLProgram[] = [];
  const texture = gl.createTexture(),
    framebuffer = gl.createFramebuffer(),
    vao = gl.createVertexArray();
  let disposed = false,
    width = 0,
    height = 0;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    shaders.forEach((shader) => gl.deleteShader(shader));
    programs.forEach((program) => gl.deleteProgram(program));
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteVertexArray(vao);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
  function shader(type: number, source: string) {
    const item = gl!.createShader(type);
    if (!item) throw new Error("Cannot create scene shader");
    shaders.push(item);
    gl!.shaderSource(item, source);
    gl!.compileShader(item);
    if (!gl!.getShaderParameter(item, gl!.COMPILE_STATUS))
      throw new Error(gl!.getShaderInfoLog(item) ?? "Scene shader failed");
    return item;
  }
  function program(fragment: string) {
    const item = gl!.createProgram();
    if (!item) throw new Error("Cannot create scene program");
    programs.push(item);
    gl!.attachShader(item, shader(gl!.VERTEX_SHADER, CULT_VERTEX));
    gl!.attachShader(item, shader(gl!.FRAGMENT_SHADER, fragment));
    gl!.linkProgram(item);
    if (!gl!.getProgramParameter(item, gl!.LINK_STATUS))
      throw new Error(gl!.getProgramInfoLog(item) ?? "Scene program failed");
    return {
      item,
      progress: gl!.getUniformLocation(item, "u_p"),
      resolution: gl!.getUniformLocation(item, "u_res"),
      texture: gl!.getUniformLocation(item, "u_tex"),
    };
  }
  try {
    if (!texture || !framebuffer || !vao)
      throw new Error("Cannot allocate scene framebuffer");
    const scene = program(CULT_FRAGMENT),
      post = program(CULT_POST_FRAGMENT);
    gl.bindVertexArray(vao);
    return {
      render(progress: number) {
        if (disposed) return;
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.max(1, Math.floor(canvas.clientWidth * ratio)),
          h = Math.max(1, Math.floor(canvas.clientHeight * ratio));
        if (w !== width || h !== height) {
          width = canvas.width = w;
          height = canvas.height = h;
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA8,
            w,
            h,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
          );
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0,
          );
          if (
            gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
            gl.FRAMEBUFFER_COMPLETE
          )
            throw new Error("Scene framebuffer incomplete");
        }
        gl.viewport(0, 0, width, height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.useProgram(scene.item);
        gl.uniform1f(scene.progress, progress);
        gl.uniform2f(scene.resolution, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(post.item);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(post.texture, 0);
        gl.uniform1f(post.progress, progress);
        gl.uniform2f(post.resolution, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
