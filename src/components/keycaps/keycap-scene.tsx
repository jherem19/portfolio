"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { KEYS, type KeyDef } from "./keys";

type Variant = "black" | "white" | "glass" | "blue" | "green";
type Slot = { position: THREE.Vector3; quaternion: THREE.Quaternion; normal: THREE.Vector3; variant: Variant; def: KeyDef };
export type DragState = { active: boolean; dx: number; dy: number; over: boolean };

const RADIUS = 2;
const DEPTH = 0.62;
const TAPER = 0.2;
const PRESS_TRAVEL = 0.2;
const VARIANTS: Variant[] = ["black", "white", "black", "glass", "blue", "black", "white", "green", "black", "glass", "white", "black", "blue"];
const ICON_COLOR: Record<Variant, string> = { black: "#f4f6f3", white: "#1f6fff", glass: "#bfe3ff", blue: "#04142e", green: "#202020" };

// Latitude rings sized so every key keeps roughly the same spacing: [latitude in degrees, key count].
const RINGS: [number, number][] = [[90, 1], [60, 6], [30, 10], [0, 12], [-30, 10], [-60, 6], [-90, 1]];

function buildSlots(): Slot[] {
  const slots: Slot[] = [];
  let index = 0;
  RINGS.forEach(([latitude, count], ring) => {
    const phi = THREE.MathUtils.degToRad(latitude);
    for (let k = 0; k < count; k++) {
      const lambda = ((k + (ring % 2 ? 0.5 : 0)) / count) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(phi) * Math.sin(lambda), Math.sin(phi), Math.cos(phi) * Math.cos(lambda));
      const east = new THREE.Vector3(Math.cos(lambda), 0, -Math.sin(lambda));
      const north = direction.clone().cross(east);
      // Deterministic height variation so the surface reads as loose keys, not a smooth ball.
      const lift = (((index * 37) % 11) / 11) * 0.14;
      slots.push({
        position: direction.clone().multiplyScalar(RADIUS + lift),
        quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, north, direction)),
        normal: direction,
        variant: VARIANTS[(index * 5 + ring) % VARIANTS.length],
        def: KEYS[index % KEYS.length],
      });
      index++;
    }
  });
  return slots;
}

function buildKeyGeometry() {
  const geometry = new RoundedBoxGeometry(1, 1, DEPTH, 5, 0.12);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const scale = 1 - TAPER * ((position.getZ(i) + DEPTH / 2) / DEPTH);
    position.setXY(i, position.getX(i) * scale, position.getY(i) * scale);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function buildLegend(def: KeyDef, color: string, fontFamily: string) {
  const size = 192;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const context = canvas.getContext("2d");
  if (!context) return texture;

  if (def.text) {
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `600 ${def.text.length > 2 ? 70 : 96}px ${fontFamily}`;
    context.fillText(def.text, size / 2, size / 2 + 4);
  } else if (def.svg) {
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 24, 24, size - 48, size - 48);
      texture.needsUpdate = true;
    };
    image.src = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${def.svg}</svg>`)}`;
  }
  return texture;
}

function Cluster({ takeDrag, still, onKey }: { takeDrag: () => DragState; still: boolean; onKey: (index: number, strong: boolean) => void }) {
  const group = useRef<THREE.Group>(null!);
  const caps = useRef<(THREE.Group | null)[]>([]);
  const hovered = useRef(-1);
  const press = useRef<Float32Array>(new Float32Array(64));
  const kick = useRef<Float32Array>(new Float32Array(64));
  const spin = useRef({ yaw: 0.18, pitch: 0, intro: 0 });

  const slots = useMemo(() => buildSlots(), []);
  const geometry = useMemo(() => buildKeyGeometry(), []);
  const legendGeometry = useMemo(() => new THREE.PlaneGeometry(0.56, 0.56), []);
  const materials = useMemo<Record<Variant, THREE.MeshPhysicalMaterial>>(() => ({
    black: new THREE.MeshPhysicalMaterial({ color: "#0d0f0e", roughness: 0.34, metalness: 0.1, clearcoat: 0.9, clearcoatRoughness: 0.25 }),
    white: new THREE.MeshPhysicalMaterial({ color: "#e6e8e5", roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#a9d4ff", roughness: 0.06, clearcoat: 1, transparent: true, opacity: 0.42, envMapIntensity: 1.6 }),
    blue: new THREE.MeshPhysicalMaterial({ color: "#2378ff", roughness: 0.36, clearcoat: 0.7, clearcoatRoughness: 0.2 }),
    green: new THREE.MeshPhysicalMaterial({ color: "#d1d1d1", roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  }), []);
  const legends = useMemo(() => {
    const fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
    return slots.map((slot) => buildLegend(slot.def, ICON_COLOR[slot.variant], fontFamily));
  }, [slots]);

  useEffect(() => () => {
    geometry.dispose();
    legendGeometry.dispose();
    Object.values(materials).forEach((material) => material.dispose());
    legends.forEach((texture) => texture.dispose());
  }, [geometry, legendGeometry, materials, legends]);

  useEffect(() => {
    group.current.rotation.set(0.42, -0.55, 0.08);
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const pointer = takeDrag();

    if (pointer.active) {
      spin.current.yaw = pointer.dx * 0.5;
      spin.current.pitch = pointer.dy * 0.5;
      group.current.rotateOnWorldAxis(Y_AXIS, pointer.dx * 0.008);
      group.current.rotateOnWorldAxis(X_AXIS, pointer.dy * 0.008);
    } else {
      // Ease back to a slow idle turn; slow down further while the cursor explores the keys.
      const idle = still ? 0 : pointer.over ? 0.035 : 0.18;
      spin.current.yaw += (idle - spin.current.yaw) * Math.min(1, delta * 2.2);
      spin.current.pitch += (0 - spin.current.pitch) * Math.min(1, delta * 2.2);
      group.current.rotateOnWorldAxis(Y_AXIS, spin.current.yaw * delta);
      group.current.rotateOnWorldAxis(X_AXIS, spin.current.pitch * delta);
    }

    spin.current.intro = Math.min(1, spin.current.intro + delta * 1.1);
    const eased = 1 - Math.pow(1 - spin.current.intro, 3);
    group.current.scale.setScalar(0.72 + eased * 0.28);

    for (let i = 0; i < slots.length; i++) {
      kick.current[i] = Math.max(0, kick.current[i] - delta * 5);
      const target = Math.max(hovered.current === i ? 1 : 0, kick.current[i] * 1.5);
      press.current[i] += (target - press.current[i]) * Math.min(1, delta * (target > press.current[i] ? 26 : 9));
      const cap = caps.current[i];
      if (cap) cap.position.z = -press.current[i] * PRESS_TRAVEL - (1 - eased) * 0.9;
    }
  });

  const over = (index: number) => (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (hovered.current === index) return;
    hovered.current = index;
    onKey(index, false);
  };
  const out = (index: number) => () => {
    if (hovered.current === index) hovered.current = -1;
  };
  const down = (index: number) => (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    kick.current[index] = 1;
    onKey(index, true);
  };

  return (
    <group ref={group}>
      <mesh onPointerOver={(event) => event.stopPropagation()}>
        <sphereGeometry args={[RADIUS - 0.42, 32, 32]} />
        <meshStandardMaterial color="#050607" roughness={0.9} />
      </mesh>
      {slots.map((slot, index) => (
        <group key={index} position={slot.position} quaternion={slot.quaternion}>
          <group ref={(node) => { caps.current[index] = node; }}>
            <mesh geometry={geometry} material={materials[slot.variant]} onPointerOver={over(index)} onPointerOut={out(index)} onPointerDown={down(index)} />
            <mesh geometry={legendGeometry} position={[0, 0, DEPTH / 2 + 0.004]} raycast={() => null}>
              <meshBasicMaterial map={legends[index]} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

export default function KeycapScene({ active, still, takeDrag, onKey, onReady, onUnavailable }: {
  active: boolean;
  still: boolean;
  takeDrag: () => DragState;
  onKey: (index: number, strong: boolean) => void;
  onReady: () => void;
  onUnavailable: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10.8], fov: 30 }}
      dpr={[1, 2]}
      fallback={null}
      frameloop={active ? "always" : "never"}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onUnavailable, { once: true });
        onReady();
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[-4, 6, 6]} intensity={1.8} />
      <directionalLight position={[5, -3, 3]} intensity={0.9} color="#3d8bff" />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={3.2} position={[0, 5, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 5, 1]} />
        <Lightformer intensity={2.2} position={[-5, 1, 3]} rotation={[0, Math.PI / 3, 0]} scale={[4, 7, 1]} />
        <Lightformer intensity={2.6} position={[5, -2, 2]} rotation={[0, -Math.PI / 3, 0]} scale={[3, 6, 1]} color="#2f7dff" />
        <Lightformer intensity={1.4} position={[0, -5, 1]} rotation={[-Math.PI / 2, 0, 0]} scale={[8, 4, 1]} color="#1a4fd0" />
      </Environment>
      <Cluster onKey={onKey} still={still} takeDrag={takeDrag} />
    </Canvas>
  );
}
