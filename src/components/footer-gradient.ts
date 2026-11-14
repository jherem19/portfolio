// Small raw-WebGL fluid gradient for the footer card. Domain-warped noise whose palette
// shifts with the cursor's horizontal position, bulges around the cursor and ripples on click.
const VERTEX = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform vec2 uClick;
uniform float uPulse;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0, amplitude = 0.5;
  for (int i = 0; i < 4; i++) { value += amplitude * noise(p); p = p * 2.03 + 17.0; amplitude *= 0.5; }
  return value;
}
vec3 ramp(vec3 a, vec3 b, vec3 c, float t) {
  t = clamp(t, 0.0, 1.0);
  return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, (t - 0.5) * 2.0);
}
vec3 palette(float t, float shift) {
  vec3 cool = ramp(vec3(0.05, 0.16, 0.62), vec3(0.20, 0.71, 1.0), vec3(0.40, 0.87, 0.70), t);
  vec3 violet = ramp(vec3(0.20, 0.10, 0.62), vec3(0.54, 0.36, 1.0), vec3(1.0, 0.48, 0.78), t);
  vec3 warm = ramp(vec3(0.55, 0.16, 0.10), vec3(1.0, 0.48, 0.24), vec3(1.0, 0.77, 0.54), t);
  shift = clamp(shift, 0.0, 1.0);
  return shift < 0.5 ? mix(cool, violet, shift * 2.0) : mix(violet, warm, (shift - 0.5) * 2.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 mouse = vec2(uMouse.x * aspect, uMouse.y);
  vec2 click = vec2(uClick.x * aspect, uClick.y);

  // Lens bulge around the cursor.
  vec2 away = p - mouse;
  float distanceToMouse = length(away);
  p += normalize(away + 0.0001) * uHover * 0.16 * exp(-distanceToMouse * distanceToMouse * 5.0);

  // Ripple travelling out from the last click.
  vec2 fromClick = p - click;
  float clickDistance = length(fromClick);
  float wave = sin(clickDistance * 26.0 - uPulse * 10.0) * exp(-clickDistance * 2.4) * exp(-uPulse * 1.5);
  p += normalize(fromClick + 0.0001) * wave * 0.035;

  float t = uTime * 0.07;
  vec2 q = vec2(fbm(p * 1.2 + vec2(0.0, t)), fbm(p * 1.2 + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p * 1.5 + 3.0 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p * 1.5 + 3.0 * q + vec2(8.3, 2.8) - t));
  float field = fbm(p * 1.3 + 3.2 * r);

  // Dark at the top, glowing towards the bottom, with extra light under the cursor.
  float rise = smoothstep(1.02, -0.12, uv.y);
  float glow = exp(-distanceToMouse * distanceToMouse * 2.4) * uHover;
  float intensity = clamp(rise * rise * (0.3 + 0.9 * field) + glow * 0.6 + wave * 0.5, 0.0, 0.92);

  float shift = mix(0.12 + 0.1 * sin(uTime * 0.11), uMouse.x, uHover);
  vec3 color = palette(field * 0.9 + r.x * 0.45, shift);
  vec3 base = vec3(0.035, 0.04, 0.042);
  vec3 result = mix(base, color, intensity);
  result += pow(intensity, 3.0) * vec3(1.0, 0.93, 0.86) * 0.12;
  gl_FragColor = vec4(result, 1.0);
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
  const uRes = uniform("uRes"), uTime = uniform("uTime"), uMouse = uniform("uMouse"), uHover = uniform("uHover"), uClick = uniform("uClick"), uPulse = uniform("uPulse");

  return {
    resize(width: number, height: number) {
      // The image is smooth, so render well below screen resolution.
      const scale = 0.6;
      canvas.width = Math.max(2, Math.round(width * scale));
      canvas.height = Math.max(2, Math.round(height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    render(state: GradientState) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, state.time);
      gl.uniform2f(uMouse, state.mouseX, state.mouseY);
      gl.uniform1f(uHover, state.hover);
      gl.uniform2f(uClick, state.clickX, state.clickY);
      gl.uniform1f(uPulse, state.pulse);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
