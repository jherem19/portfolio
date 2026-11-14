// Small raw-WebGL fluted-glass backdrop for the footer card: vertical glass ribs refract a
// drifting mint glow. The glow leans towards the cursor and ripples on click.
const VERTEX = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform vec2 uClick;
uniform float uPulse;
uniform float uRibs;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 ramp(float t, vec3 hot) {
  vec3 c0 = vec3(0.012, 0.035, 0.027);
  vec3 c1 = vec3(0.025, 0.19, 0.135);
  vec3 c2 = vec3(0.08, 0.43, 0.31);
  vec3 c3 = hot;
  vec3 c4 = vec3(0.66, 0.94, 0.82);
  t = clamp(t, 0.0, 1.0);
  if (t < 0.3) return mix(c0, c1, t / 0.3);
  if (t < 0.6) return mix(c1, c2, (t - 0.3) / 0.3);
  if (t < 0.86) return mix(c2, c3, (t - 0.6) / 0.26);
  return mix(c3, c4, (t - 0.86) / 0.14);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;

  // Each rib is a small cylindrical lens: it shows a stretched slice of what lies behind it,
  // which produces the hard step between neighbouring ribs.
  float rib = floor(uv.x * uRibs);
  float along = fract(uv.x * uRibs);
  vec2 sampleAt = vec2((rib + 0.5 + (along - 0.5) * 3.4) / uRibs, uv.y + (along - 0.5) * 0.05);

  // On tall (phone) cards, grow the coordinate space so the light keeps a similar footprint.
  vec2 space = vec2(aspect, 1.0) * max(1.0, 1.1 / aspect);
  vec2 p = sampleAt * space;
  vec2 mouse = uMouse * space;
  vec2 click = uClick * space;

  vec2 fromClick = p - click;
  float clickDistance = length(fromClick);
  float wave = sin(clickDistance * 22.0 - uPulse * 9.0) * exp(-clickDistance * 2.2) * exp(-uPulse * 1.4);
  p += normalize(fromClick + 0.0001) * wave * 0.05;

  float t = uTime;
  // Main light drifts on its own and is pulled towards the cursor while hovering.
  vec2 idle = vec2(0.76 + 0.15 * sin(t * 0.21), 0.34 + 0.1 * sin(t * 0.29)) * space;
  vec2 core = mix(idle, mouse, uHover * 0.75);
  vec2 toCore = (p - core) * vec2(0.7, 1.0);
  float glow = exp(-dot(toCore, toCore) * 2.6);
  vec2 second = vec2(0.18 + 0.1 * sin(t * 0.17 + 2.0), -0.12) * space;
  vec2 toSecond = (p - second) * vec2(0.55, 1.0);
  float under = exp(-dot(toSecond, toSecond) * 2.2);

  float intensity = glow * 0.86 + under * 0.34;
  intensity *= 0.84 + 0.3 * noise(p * 1.4 + vec2(t * 0.06, -t * 0.04));
  intensity *= smoothstep(1.15, 0.3, uv.y);
  intensity = min(intensity + wave * 0.22, 0.9);

  // Shift subtly within the site mint palette as the cursor travels.
  vec3 hot = mix(vec3(0.40, 0.867, 0.702), vec3(0.34, 0.79, 0.64), uMouse.x * uHover);
  vec3 color = ramp(intensity, hot);

  // Glass shading: dark seam where ribs meet, soft roll-off and a thin specular edge.
  color *= 0.84 + 0.16 * smoothstep(0.0, 0.55, along);
  color *= 1.0 - 0.42 * smoothstep(0.045, 0.0, along);
  color += intensity * 0.07 * smoothstep(0.9, 1.0, along);
  gl_FragColor = vec4(color, 1.0);
}`;

export type GradientState = { time: number; mouseX: number; mouseY: number; hover: number; clickX: number; clickY: number; pulse: number };

export function createFooterGradient(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const uRes = uniform("uRes"), uTime = uniform("uTime"), uMouse = uniform("uMouse"), uHover = uniform("uHover"), uClick = uniform("uClick"), uPulse = uniform("uPulse"), uRibs = uniform("uRibs");
  let ribs = 24;

  return {
    resize(width: number, height: number) {
      // Rib edges are hard lines, so render at screen resolution (capped for dense displays).
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(2, Math.round(width * scale));
      canvas.height = Math.max(2, Math.round(height * scale));
      ribs = Math.max(9, Math.round(width / 46));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    render(state: GradientState) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, state.time);
      gl.uniform2f(uMouse, state.mouseX, state.mouseY);
      gl.uniform1f(uHover, state.hover);
      gl.uniform2f(uClick, state.clickX, state.clickY);
      gl.uniform1f(uPulse, state.pulse);
      gl.uniform1f(uRibs, ribs);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
