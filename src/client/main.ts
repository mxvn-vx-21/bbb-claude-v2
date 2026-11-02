import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mouse = { x: 0, y: 0, px: innerWidth / 2, py: innerHeight / 2 };

/* ---------- 3D scene: glass "bytes" ---------- */
const canvas = document.getElementById("scene") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 9;

const glass = (color: number) =>
  new THREE.MeshPhysicalMaterial({ color, transmission: 1, roughness: 0.08, thickness: 1.2, ior: 1.45, iridescence: 0.6 });
const hero = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), glass(0xffb81c));
const group = new THREE.Group();
group.add(hero);

const bits: { m: THREE.Mesh; r: number; a: number; s: number; y: number }[] = [];
const palette = [0xff5c8a, 0x7cf2e0, 0xffb81c, 0xb9a2ff];
for (let i = 0; i < 14; i++) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), glass(palette[i % 4]));
  bits.push({ m, r: 2.2 + Math.random() * 1.6, a: Math.random() * 6.28, s: 0.1 + Math.random() * 0.3, y: (Math.random() - 0.5) * 3 });
  group.add(m);
}
scene.add(group);

function layout() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  const wide = innerWidth > 800;
  group.position.set(wide ? 3.2 : 0, wide ? 0 : 2.6, 0);
  group.scale.setScalar(wide ? 1 : 0.7);
}
addEventListener("resize", layout); layout();

let spin = 0, burst = 0;
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  spin *= 0.94; burst *= 0.92;
  const speed = reduce ? 0 : 1;
  hero.rotation.x += (mouse.y * 0.6 - hero.rotation.x) * 0.05 + 0.003 * speed;
  hero.rotation.y += (mouse.x * 0.8 - hero.rotation.y) * 0.05 + 0.004 * speed + spin;
  hero.scale.setScalar(1 + burst * 0.25);
  for (const b of bits) {
    const ang = b.a + t * b.s * speed + spin * 4;
    const r = b.r + burst * 2;
    b.m.position.set(Math.cos(ang) * r, b.y + Math.sin(t + b.a) * 0.2 * speed, Math.sin(ang) * r);
    b.m.rotation.x += 0.01; b.m.rotation.y += 0.013;
  }
  renderer.render(scene, camera);
});

/* ---------- Cursor ---------- */
const dot = document.querySelector<HTMLElement>(".cursor-dot")!;
const ring = document.querySelector<HTMLElement>(".cursor-ring")!;
addEventListener("pointermove", (e) => {
  mouse.px = e.clientX; mouse.py = e.clientY;
  mouse.x = (e.clientX / innerWidth - 0.5) * 2; mouse.y = (e.clientY / innerHeight - 0.5) * 2;
  dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  ring.classList.toggle("hot", !!(e.target as HTMLElement).closest("button, input, .tilt"));
});
let rx = mouse.px, ry = mouse.py;
(function follow() {
  rx += (mouse.px - rx) * 0.15; ry += (mouse.py - ry) * 0.15;
  ring.style.transform = `translate(${rx}px, ${ry}px)`;
  requestAnimationFrame(follow);
})();

/* ---------- Glass card tilt ---------- */
document.querySelectorAll<HTMLElement>(".tilt").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(8px)`;
  });
  el.addEventListener("pointerleave", () => (el.style.transform = ""));
});

/* ---------- Click reactions ---------- */
addEventListener("pointerdown", (e) => {
  spin = 0.12; burst = 1;
  if (reduce) return;
  const wave = document.createElement("div");
  wave.className = "wave"; wave.style.left = e.clientX + "px"; wave.style.top = e.clientY + "px";
  document.body.append(wave); setTimeout(() => wave.remove(), 700);
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("span");
    p.className = "pop"; p.textContent = Math.random() > 0.5 ? "1" : "0";
    p.style.left = e.clientX + "px"; p.style.top = e.clientY + "px";
    document.body.append(p);
    const a = (i / 12) * Math.PI * 2, d = 50 + Math.random() * 70;
    p.animate(
      [{ transform: "translate(0,0) scale(1)", opacity: 1 },
       { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 30}px) scale(.3)`, opacity: 0 }],
      { duration: 700 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.3,1)" }
    ).finished.then(() => p.remove());
  }
});

/* ---------- Waitlist ---------- */
const form = document.getElementById("signup") as HTMLFormElement;
const msg = document.getElementById("msg")!;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = (form.elements.namedItem("email") as HTMLInputElement).value;
  msg.className = ""; msg.textContent = "Saving…";
  try {
    const res = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error);
    msg.className = "ok"; msg.textContent = "You’re on the list. We’ll email you at launch."; form.reset();
  } catch (err) {
    msg.className = "err"; msg.textContent = (err as Error).message || "Something went wrong. Try again.";
  }
});
