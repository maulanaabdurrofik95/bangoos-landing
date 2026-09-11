/* Bangoos 3D standard: objek nyata (icosahedron wire + core + 2 torus + floaters),
   mouse parallax lerp, scroll depth, DPR cap, pause hidden tab, reduced-motion,
   densitas rendah di mobile. */
(function () {
  'use strict';
  var canvas = document.getElementById('bg3d');
  if (!canvas || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) { return; }
  var isMobile = window.matchMedia('(max-width: 640px)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(DPR);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08090a, 0.055);
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // Key + rim lights: satu aksen cyan (taste: dark void + satu aksen)
  scene.add(new THREE.AmbientLight(0x8899aa, 0.55));
  var key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 6, 6); scene.add(key);
  var rim = new THREE.PointLight(0x22d3ee, 60, 30); rim.position.set(-5, -2, 2); scene.add(rim);

  var group = new THREE.Group();
  group.position.x = isMobile ? 0 : 2.6; // teks hero di kiri, objek di kanan
  scene.add(group);

  var cyan = 0x22d3ee;
  // 1. icosahedron wireframe
  var ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.7, 1),
    new THREE.MeshBasicMaterial({ color: cyan, wireframe: true, transparent: true, opacity: 0.5 })
  );
  group.add(ico);
  // 2. core glow
  var core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 3),
    new THREE.MeshStandardMaterial({ color: 0x0b2b33, emissive: cyan, emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.6 })
  );
  group.add(core);
  // 3-4. dua torus orbit
  var tMat = new THREE.MeshStandardMaterial({ color: 0x9aa4b2, roughness: 0.3, metalness: 0.85, transparent: true, opacity: 0.85 });
  var torus1 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.05, 12, 90), tMat);
  torus1.rotation.x = Math.PI / 2.4; group.add(torus1);
  var torus2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.035, 12, 90), tMat.clone());
  torus2.material.opacity = 0.5; torus2.rotation.x = Math.PI / 1.7; torus2.rotation.y = 0.5; group.add(torus2);
  // 5. geometri melayang
  var floaters = new THREE.Group();
  var fGeo = [
    new THREE.OctahedronGeometry(0.28), new THREE.TetrahedronGeometry(0.32),
    new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.OctahedronGeometry(0.2)
  ];
  var fMat = new THREE.MeshStandardMaterial({ color: 0x1a222c, emissive: cyan, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.7 });
  var N = isMobile ? 6 : 12;
  for (var i = 0; i < N; i++) {
    var m = new THREE.Mesh(fGeo[i % fGeo.length], fMat);
    var a = (i / N) * Math.PI * 2, r = 3.4 + (i % 3) * 0.9;
    m.position.set(Math.cos(a) * r, (i % 2 ? 1 : -1) * (0.6 + (i % 4) * 0.55), Math.sin(a) * r * 0.6 - 1);
    m.rotation.set(a, a * 0.7, 0);
    m.userData = { s: 0.4 + Math.random() * 0.8, o: Math.random() * Math.PI * 2 };
    floaters.add(m);
  }
  scene.add(floaters);

  // mouse parallax (lerp) + scroll depth
  var mx = 0, my = 0, tx = 0, ty = 0, scrollY = 0;
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  window.addEventListener('scroll', function () { scrollY = window.scrollY; }, { passive: true });

  function resize() {
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });
  var clock = new THREE.Clock();

  (function tick() {
    requestAnimationFrame(tick);
    if (!running) return;
    var t = clock.getElapsedTime();
    mx += (tx - mx) * 0.045; my += (ty - my) * 0.045; // lerp parallax
    var hero = canvas.parentElement, depth = 0;
    if (hero) { var r = hero.getBoundingClientRect(); depth = Math.min(1, Math.max(0, -r.top / (r.height || 1))); }

    ico.rotation.y = t * 0.12; ico.rotation.x = t * 0.05;
    core.rotation.y = -t * 0.2; core.position.y = Math.sin(t * 0.8) * 0.1;
    torus1.rotation.z = t * 0.15; torus2.rotation.z = -t * 0.1;
    floaters.children.forEach(function (m, i) {
      m.rotation.x += 0.004 * m.userData.s; m.rotation.y += 0.006 * m.userData.s;
      m.position.y += Math.sin(t * 0.9 + m.userData.o) * 0.0016;
      void i;
    });
    group.rotation.y = mx * 0.35;
    group.rotation.x = my * 0.2 - depth * 0.5;
    group.position.y = -depth * 2.2;
    camera.position.x = mx * 0.7; camera.position.y = -my * 0.5;
    camera.lookAt(group.position.x * 0.6, group.position.y * 0.4, 0);
    renderer.render(scene, camera);
  })();
})();
