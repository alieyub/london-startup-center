// Hero background: domain-warped navy silk with a red ribbon, drawn with raw WebGL
// (no Three.js — a single full-screen triangle is all this needs).

const vert = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const frag = (octaves) => `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uScroll;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  mat2 r = mat2(0.8,-0.6,0.6,0.8);
  for(int i=0;i<${octaves};i++){ v += a*noise(p); p = r*p*2.02; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.06;

  vec2 q = vec2(fbm(p*1.6 + t), fbm(p*1.6 - t + 4.2));
  vec2 r = vec2(fbm(p*1.4 + 3.0*q + vec2(1.7, 9.2) + t*1.3), fbm(p*1.4 + 3.0*q + vec2(8.3, 2.8) - t));
  float f = fbm(p*1.2 + 2.6*r);

  vec3 deep  = vec3(0.000, 0.045, 0.125);
  vec3 navy  = vec3(0.000, 0.133, 0.325);
  vec3 navy2 = vec3(0.06, 0.20, 0.45);
  vec3 red   = vec3(0.902, 0.200, 0.161);
  vec3 blush = vec3(0.98, 0.83, 0.82);

  vec3 col = mix(deep, navy, smoothstep(0.15, 0.85, f));
  col = mix(col, navy2, smoothstep(0.55, 1.0, length(q)) * 0.55);

  float band = smoothstep(0.035, 0.0, abs(r.x - 0.55 - 0.08*sin(t*3.0)));
  float glowM = exp(-2.4 * length(p - m));
  col += red * band * (0.35 + 0.9*glowM);
  col += red * pow(f, 3.0) * 0.4 * smoothstep(0.2, 1.0, uv.x);
  col += blush * band * glowM * 0.25;
  col += vec3(0.9,0.3,0.25) * glowM * 0.18;

  float vig = smoothstep(1.25, 0.25, length(p * vec2(0.85, 1.1)));
  col *= mix(0.55, 1.0, vig);
  col *= 1.0 - uScroll * 0.6;
  col = mix(col, deep, smoothstep(0.55, 0.0, uv.y) * 0.55);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function initHeroGL(canvas, { reduced = false, onScroll } = {}) {
  const fallback = () => {
    canvas.style.background = 'radial-gradient(circle at 70% 30%, #0a2c63, #00132f 60%)';
  };
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return fallback();

  const small = window.matchMedia('(max-width: 767px)').matches;

  // Without a GPU (SwiftShader / llvmpipe, some VMs and headless browsers) the shader runs on the
  // CPU and would block the main thread — paint a single still frame instead of animating.
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
  const still = reduced || software;
  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  };
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag(small ? 4 : 5));
  if (!vs || !fs) return fallback();
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fallback();
  gl.useProgram(prog);

  // one oversized triangle covering the viewport
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = {
    time: gl.getUniformLocation(prog, 'uTime'),
    res: gl.getUniformLocation(prog, 'uRes'),
    mouse: gl.getUniformLocation(prog, 'uMouse'),
    scroll: gl.getUniformLocation(prog, 'uScroll'),
  };

  // The effect is soft by nature, so render well below CSS resolution and let the browser upscale.
  const scale = small ? 0.45 : 0.6;
  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(u.res, w, h);
  };
  resize();
  window.addEventListener('resize', resize);

  const mouse = { x: 0.65, y: 0.55 };
  const target = { x: 0.65, y: 0.55 };
  window.addEventListener('pointermove', (e) => {
    target.x = e.clientX / window.innerWidth;
    target.y = 1 - e.clientY / window.innerHeight;
  }, { passive: true });

  let scroll = 0;
  onScroll?.((p) => { scroll = p; });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const start = performance.now();
  const draw = (now) => {
    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;
    gl.uniform1f(u.time, still ? 8 : (now - start) / 1000);
    gl.uniform2f(u.mouse, mouse.x, mouse.y);
    gl.uniform1f(u.scroll, scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  if (still) {
    draw(start);
    window.addEventListener('resize', () => draw(start));
    return;
  }
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    draw(now);
  };
  requestAnimationFrame(loop);
}
