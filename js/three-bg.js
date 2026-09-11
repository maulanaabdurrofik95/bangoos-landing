/* Clay pastel scene: objek candy matte lembut di atas background terang.
   Renderer alpha transparan — CSS pastel + blob yang jadi nuansa utama.
   Reduced-motion & mobile density tetap dihormati. */
(function () {
  'use strict';
  var canvas = document.getElementById('bg3d');
  if (!canvas || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) { return; }
  renderer.setClearColor(0x000000, 0); // transparan: biarkan CSS pastel bicara
  var isMobile = window.matchMedia('(max-width: 640px)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(DPR);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe9eef6, 12, 26); // fog terang menyatu dgn bg
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // Cahaya terang merata: clay matte butuh key lembut + ambient kuat
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(4, 6, 6); scene.add(key);
  var fillCoral = new THREE.PointLight(0xff6b6b, 25, 30); fillCoral.position.set(-5, -1, 3); scene.add(fillCoral);
  var fillSky = new THREE.PointLight(0x4d96ff, 25, 30); fillSky.position.set(5, 3, 2); scene.add(fillSky);

  var group = new THREE.Group();
  group.position.x = isMobile ? 0 : 2.6; // teks hero di kiri, objek di kanan
  scene.add(group);

  function clay(color) {
    return new THREE.MeshStandardMaterial({ color: color, roughness: 0.85, metalness: 0.0 });
  }
  // 1. donat clay coral (hero object)
  var torus = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.62, 32, 72), clay(0xff6b6b));
  group.add(torus);
  // 2. bola clay kuning menempel
  var ball = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 32), clay(0xffc93c));
  ball.position.set(1.35, 0.95, 0.4);
  group.add(ball);
  // 3. kubus clay sky melayang
  var cube = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), clay(0x4d96ff));
  cube.position.set(-1.7, -1.0, 0.3);
  cube.rotation.set(0.5, 0.6, 0.2);
  group.add(cube);
  // 4. cincin tipis pastel mengelilingi donat
  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.05, 12, 90),
    new THREE.MeshStandardMaterial({ color: 0x9bb4d6, roughness: 0.6, metalness: 0.1, transparent: true, opacity: 0.7 })
  );
  ring.rotation.x = Math.PI / 2.4;
  group.add(ring);
  // 5. taburan mini candy
  var floaters = new THREE.Group();
  var palette = [0xff6b6b, 0x4d96ff, 0xffc93c, 0x4ed6b4, 0x9b7bff];
  var fGeo = [
    new THREE.SphereGeometry(0.22, 20, 20), new THREE.BoxGeometry(0.28, 0.28, 0.28),
    new THREE.OctahedronGeometry(0.24), new THREE.TorusGeometry(0.2, 0.08, 12, 24)
  ];
  var N = isMobile ? 6 : 12;
  for (var i = 0; i < N; i++) {
    var m = new THREE.Mesh(fGeo[i % fGeo.length], clay(palette[i % palette.length]));
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

    torus.rotation.y = t * 0.25; torus.rotation.x = Math.sin(t * 0.3) * 0.2;
    ball.position.y = 0.95 + Math.sin(t * 0.9) * 0.15;
    cube.rotation.y += 0.006; cube.rotation.x += 0.003;
    ring.rotation.z = t * 0.12;
    floaters.children.forEach(function (fm, i) {
      fm.rotation.x += 0.004 * fm.userData.s; fm.rotation.y += 0.006 * fm.userData.s;
      fm.position.y += Math.sin(t * 0.9 + fm.userData.o) * 0.0016;
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
