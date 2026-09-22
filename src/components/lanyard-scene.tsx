"use client";

// Rope constraints and the kinematic drag follow Vercel's R3F event-badge approach:
// https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, events, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, useTexture } from "@react-three/drei";
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

type CaptureTarget = { setPointerCapture: (id: number) => void; releasePointerCapture: (id: number) => void };

const WIDTH = 2.65;
const HEIGHT = WIDTH * 1592 / 1107;
const ATTACH = HEIGHT / 2 - 0.16;
const ropeProps = { colliders: false as const, linearDamping: 2, angularDamping: 2, canSleep: true };

function roundedFace() {
  const w = WIDTH / 2, h = HEIGHT / 2, r = .1;
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h); shape.lineTo(w - r, -h); shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r); shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h); shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r); shape.quadraticCurveTo(-w, -h, -w + r, -h);
  const geometry = new THREE.ShapeGeometry(shape);
  const pos = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w) / WIDTH, (pos.getY(i) + h) / HEIGHT);
  return geometry;
}

function makeRibbon() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(33 * 2 * 3), uvs = new Float32Array(33 * 2 * 2), indices = [];
  for (let i = 0; i <= 32; i++) {
    uvs.set([0, i / 32 * 8, 1, i / 32 * 8], i * 4);
    if (i < 32) { const n = i * 2; indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); }
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2)); geometry.setIndex(indices);
  const data = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const value = (x + y) % 4 < 2 ? 50 : 25;
    const edge = x < 2 || x > 29 ? .5 : 1;
    const i = (y * 32 + x) * 4; data.set([value * edge, value * edge, value * edge, 255], i);
  }
  const texture = new THREE.DataTexture(data, 32, 32);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true;
  return { geometry, texture };
}

function Band({ impulse, onReady }: { impulse: number; onReady: () => void }) {
  const ribbonMesh = useRef<THREE.Mesh>(null!);
  const fixed = useRef<RapierRigidBody>(null!);
  const first = useRef<RapierRigidBody>(null!), second = useRef<RapierRigidBody>(null!), third = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const [dragged, setDragged] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dragOffset = useRef(new THREE.Vector3());
  const capture = useRef<{ target: CaptureTarget; id: number } | null>(null);
  const { gl, viewport } = useThree();
  const anchorX = viewport.width * .3;
  const source = useTexture("/id-card.png");
  const texture = useMemo(() => { const t = source.clone(); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = gl.capabilities.getMaxAnisotropy(); t.needsUpdate = true; return t; }, [source, gl]);
  const face = useMemo(() => roundedFace(), []);
  const ribbon = useMemo(() => makeRibbon(), []);
  const [curve] = useState(() => new THREE.CatmullRomCurve3(Array.from({ length: 4 }, () => new THREE.Vector3()), false, "chordal"));
  const mathRef = useRef({ point: new THREE.Vector3(), tangent: new THREE.Vector3(), side: new THREE.Vector3(), target: new THREE.Vector3(), direction: new THREE.Vector3(), smooth1: new THREE.Vector3(.08, 2.95, 0), smooth2: new THREE.Vector3(.15, 2.25, 0) });

  useRopeJoint(fixed, first, [[0, 0, 0], [0, 0, 0], .7]);
  useRopeJoint(first, second, [[0, 0, 0], [0, 0, 0], .7]);
  useRopeJoint(second, third, [[0, 0, 0], [0, 0, 0], .7]);
  useSphericalJoint(third, card, [[0, 0, 0], [0, ATTACH, 0]]);

  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => {
    if (impulse) card.current?.applyImpulse({ x: 2.8, y: .7, z: .4 }, true);
  }, [impulse]);
  useEffect(() => {
    const hero = gl.domElement.closest(".intro-section");
    hero?.classList.toggle("is-dragging-badge", dragged);
    gl.domElement.style.setProperty("cursor", dragged ? "grabbing" : hovered ? "grab" : "auto");
    return () => { gl.domElement.style.removeProperty("cursor"); hero?.classList.remove("is-dragging-badge"); };
  }, [dragged, hovered, gl]);
  useEffect(() => {
    const release = () => {
      if (capture.current) {
        capture.current.target.releasePointerCapture(capture.current.id);
        capture.current = null;
      }
      setDragged(false);
    };
    window.addEventListener("pointerup", release); window.addEventListener("pointercancel", release); window.addEventListener("blur", release);
    return () => { window.removeEventListener("pointerup", release); window.removeEventListener("pointercancel", release); window.removeEventListener("blur", release); };
  }, []);
  useEffect(() => () => { texture.dispose(); face.dispose(); ribbon.geometry.dispose(); ribbon.texture.dispose(); }, [texture, face, ribbon]);

  useFrame((state, delta) => {
    const math = mathRef.current;
    if (!card.current || !third.current || !first.current || !second.current || !fixed.current) return;
    if (dragged) {
      // Match the reference's perspective drag: depth varies with the pointer,
      // allowing the spherical joint to produce pitch and twist on release.
      math.target.set(state.pointer.x, state.pointer.y, .5).unproject(state.camera);
      math.direction.copy(math.target).sub(state.camera.position).normalize();
      math.target.addScaledVector(math.direction, state.camera.position.length()).sub(dragOffset.current);
      [card, first, second, third].forEach((ref) => ref.current.wakeUp());
      card.current.setNextKinematicTranslation(math.target);
    }
    math.smooth1.lerp(first.current.translation(), 1 - Math.exp(-24 * delta));
    math.smooth2.lerp(second.current.translation(), 1 - Math.exp(-24 * delta));
    curve.points[0].copy(third.current.translation()); curve.points[1].copy(math.smooth2);
    curve.points[2].copy(math.smooth1); curve.points[3].copy(fixed.current.translation());
    const positions = ribbonMesh.current.geometry.attributes.position;
    for (let i = 0; i <= 32; i++) {
      curve.getPoint(i / 32, math.point); curve.getTangent(i / 32, math.tangent);
      math.side.set(math.tangent.y, -math.tangent.x, 0).normalize().multiplyScalar(.29);
      positions.setXYZ(i * 2, math.point.x - math.side.x, math.point.y - math.side.y, math.point.z + .085);
      positions.setXYZ(i * 2 + 1, math.point.x + math.side.x, math.point.y + math.side.y, math.point.z + .085);
    }
    positions.needsUpdate = true; ribbonMesh.current.geometry.computeVertexNormals();
    if (!dragged && !card.current.isSleeping()) {
      const velocity = card.current.angvel(), rotation = card.current.rotation();
      // Vercel gently biases yaw toward the front, without locking pitch or roll.
      card.current.setAngvel({ x: velocity.x, y: velocity.y - rotation.y * .25 * Math.min(delta * 60, 2), z: velocity.z }, false);
    }
  });

  return <>
    <group position={[anchorX, 0, 0]}>
    <RigidBody ref={fixed} position={[0, 3.65, 0]} type="fixed" colliders={false} />
    <RigidBody ref={first} position={[.08, 2.95, 0]} {...ropeProps}><BallCollider args={[.055]} collisionGroups={0} /></RigidBody>
    <RigidBody ref={second} position={[.15, 2.25, 0]} {...ropeProps}><BallCollider args={[.055]} collisionGroups={0} /></RigidBody>
    <RigidBody ref={third} position={[.2, 1.55, 0]} {...ropeProps}><BallCollider args={[.055]} collisionGroups={0} /></RigidBody>
    <RigidBody ref={card} position={[.2, 1.55 - ATTACH, 0]} rotation={[.08, .16, .03]} {...ropeProps} type={dragged ? "kinematicPosition" : "dynamic"} additionalSolverIterations={8}>
      <CuboidCollider args={[WIDTH / 2, HEIGHT / 2, .045]} mass={1.5} collisionGroups={0} />
      <group onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onPointerDown={(event) => {
        event.stopPropagation();
        event.nativeEvent.preventDefault();
        const target = event.target as unknown as CaptureTarget;
        target.setPointerCapture(event.pointerId);
        capture.current = { target, id: event.pointerId };
        dragOffset.current.copy(event.point).sub(card.current.translation());
        setDragged(true);
      }}>
        <RoundedBox args={[WIDTH + .035, HEIGHT + .035, .085]} radius={.1} smoothness={4}>
          <meshPhysicalMaterial color="#202020" roughness={.45} metalness={.35} clearcoat={.45} />
        </RoundedBox>
        <mesh geometry={face} position={[0, 0, .047]}>
          <meshPhysicalMaterial map={texture} roughness={.3} metalness={.12} clearcoat={1} clearcoatRoughness={.12} envMapIntensity={.85} />
        </mesh>
        <mesh geometry={face} position={[0, 0, -.047]} rotation={[0, Math.PI, 0]}><meshPhysicalMaterial map={texture} color="#777777" roughness={.3} metalness={.12} clearcoat={1} clearcoatRoughness={.12} envMapIntensity={.85} /></mesh>
        <RoundedBox args={[.68, .13, .12]} radius={.06} position={[0, ATTACH, .06]}><meshStandardMaterial color="#080808" roughness={.85} /></RoundedBox>
        <mesh position={[0, ATTACH + .13, .095]}><boxGeometry args={[.57, .12, .05]} /><meshStandardMaterial color="#b6b6b6" metalness={.8} roughness={.25} /></mesh>
      </group>
    </RigidBody>
    </group>
    <mesh ref={ribbonMesh} geometry={ribbon.geometry} frustumCulled={false}><meshStandardMaterial map={ribbon.texture} side={THREE.DoubleSide} roughness={1} /></mesh>
  </>;
}

export default function LanyardScene({ active, impulse, onReady, onUnavailable }: { active: boolean; impulse: number; onReady: () => void; onUnavailable: () => void }) {
  const [eventSource] = useState(() => document.getElementById("home") ?? undefined);

  return <div className="lanyard-canvas" aria-hidden="true">
    <Canvas eventSource={eventSource} events={(state) => ({
      ...events(state),
      // Listen on the hero so empty canvas pixels do not block text or links.
      compute: (event, root) => {
        const rect = root.gl.domElement.getBoundingClientRect();
        root.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
        root.raycaster.setFromCamera(root.pointer, root.camera);
      },
    })} style={{ pointerEvents: "none" }} dpr={[2, 3]} camera={{ position: [0, 0, 13], fov: 30 }} gl={{ alpha: true, antialias: true }} frameloop={active ? "always" : "never"}
      fallback={null} onCreated={({ gl }) => { gl.domElement.addEventListener("webglcontextlost", onUnavailable, { once: true }); }}>
      <ambientLight intensity={1.6} />
      <directionalLight position={[-3, 5, 5]} intensity={1.5} />
      <directionalLight position={[3, 1, 4]} intensity={.7} />
      {/* Studio strips reflect across the clear coat as the physical card turns. */}
      <Environment resolution={512} frames={1}>
        <Lightformer intensity={3} position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[10, .16, 1]} />
        <Lightformer intensity={4} position={[-3, 1, 4]} rotation={[0, 0, Math.PI / 3]} scale={[10, .4, 1]} />
        <Lightformer intensity={2} position={[3, 2, 4]} rotation={[0, 0, -Math.PI / 4]} scale={[8, .25, 1]} />
        <Lightformer intensity={1.5} position={[-5, 0, 3]} rotation={[0, Math.PI / 3, 0]} scale={[4, 6, 1]} />
      </Environment>
      <Suspense fallback={null}><Physics gravity={[0, -25, 0]} timeStep={1 / 60} paused={!active}><Band impulse={impulse} onReady={onReady} /></Physics></Suspense>
    </Canvas>
  </div>;
}
