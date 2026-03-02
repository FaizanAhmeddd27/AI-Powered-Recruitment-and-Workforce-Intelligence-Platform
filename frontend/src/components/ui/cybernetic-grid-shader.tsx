import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "@/context/ThemeContext";

export default function CyberneticGridShader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const isDark = theme === "dark";

    const fragmentShader = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform float isDark;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
        vec2 mouse = (iMouse - 0.5 * iResolution.xy) / iResolution.y;
        float t = iTime * 0.2;
        float mouseDist = length(uv - mouse);

        float warp = sin(mouseDist * 20.0 - t * 4.0) * 0.1;
        warp *= smoothstep(0.4, 0.0, mouseDist);
        uv += warp;

        vec2 gridUv = abs(fract(uv * 10.0) - 0.5);
        float line = pow(1.0 - min(gridUv.x, gridUv.y), 50.0);

        vec3 gridColor = isDark > 0.5
          ? vec3(0.92, 0.82, 0.55)
          : vec3(0.43, 0.25, 0.15);

        vec3 color = gridColor * line * (0.5 + sin(t * 2.0) * 0.2);

        float energy = sin(uv.x * 20.0 + t * 5.0) * sin(uv.y * 20.0 + t * 3.0);
        energy = smoothstep(0.8, 1.0, energy);

        vec3 energyColor = isDark > 0.5
          ? vec3(1.0, 0.6, 0.2)
          : vec3(0.6, 0.3, 0.1);
        color += energyColor * energy * line;

        float glow = smoothstep(0.15, 0.0, mouseDist);
        vec3 glowColor = isDark > 0.5 ? vec3(1.0, 0.9, 0.7) : vec3(0.5, 0.3, 0.1);
        color += glowColor * glow * 0.4;

        color += random(uv + t * 0.1) * 0.03;

        float bgAlpha = isDark > 0.5 ? 0.0 : 0.0;
        gl_FragColor = vec4(color, max(line * 0.8, energy * 0.5) + glow * 0.3);
      }
    `;

    const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2) },
      isDark: { value: isDark ? 1.0 : 0.0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    };
    window.addEventListener("resize", onResize);
    onResize();

    const onMouseMove = (e: MouseEvent) => {
      uniforms.iMouse.value.set(e.clientX, container.clientHeight - e.clientY);
    };
    window.addEventListener("mousemove", onMouseMove);

    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.setAnimationLoop(null);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30"
      aria-hidden="true"
    />
  );
}