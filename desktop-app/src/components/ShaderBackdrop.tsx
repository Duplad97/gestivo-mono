import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

const vertexShaderSource = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
varying vec2 vUv;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 point) {
  vec2 index = floor(point);
  vec2 fraction = fract(point);
  vec2 smooth = fraction * fraction * (3.0 - 2.0 * fraction);

  float a = hash(index);
  float b = hash(index + vec2(1.0, 0.0));
  float c = hash(index + vec2(0.0, 1.0));
  float d = hash(index + vec2(1.0, 1.0));

  return mix(mix(a, b, smooth.x), mix(c, d, smooth.x), smooth.y);
}

float fbm(vec2 point) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int index = 0; index < 5; index++) {
    value += amplitude * noise(point);
    point *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float time = u_time * 0.08;
  vec2 warp = vec2(
    fbm(uv * 1.1 + vec2(time, -time)),
    fbm(uv * 1.4 + vec2(-time * 1.4, time * 0.6))
  );

  float aurora = fbm(uv * 2.2 + warp * 1.8 + vec2(0.0, time));
  float streak = smoothstep(0.22, 0.92, aurora + uv.y * 0.45 + 0.1);
  float glow = exp(-length(uv - vec2(-0.35, 0.15)) * 2.8);
  float halo = exp(-length(uv - vec2(0.5, -0.25)) * 3.6);

  vec3 base = vec3(0.025, 0.035, 0.07);
  vec3 cyan = vec3(0.18, 0.72, 0.95) * streak;
  vec3 amber = vec3(1.0, 0.58, 0.26) * glow * 0.75;
  vec3 magenta = vec3(0.53, 0.29, 0.92) * halo * 0.6;

  vec3 color = base + cyan + amber + magenta;
  color += 0.04 * sin(vec3(0.0, 1.4, 2.8) + u_time * 0.35 + uv.xyx * 3.0);

  gl_FragColor = vec4(color, 1.0);
}
`;

const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error('Could not create shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
};

const createProgram = (gl: WebGLRenderingContext): WebGLProgram => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();

  if (!program) {
    throw new Error('Could not create WebGL program.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown program link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
};

export const ShaderBackdrop = (): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      return;
    }

    const program = createProgram(gl);
    const buffer = gl.createBuffer();

    if (!buffer) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');

    let animationFrameId = 0;

    const resize = (): void => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const width = Math.floor(window.innerWidth * devicePixelRatio);
      const height = Math.floor(window.innerHeight * devicePixelRatio);

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      gl.viewport(0, 0, width, height);
    };

    const render = (time: number): void => {
      resize();

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time * 0.001);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="shader-backdrop" aria-hidden="true" />;
};