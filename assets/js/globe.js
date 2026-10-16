/* ARoL Service – 3D hero globe.
   Gold dotted continents (assets/js/land.js), patent markers, light trails
   from Tunisia and orbiting satellites. Three.js is loaded on demand; if it or
   WebGL is unavailable the static SVG globe in the hero stays visible. */
(() => {
  'use strict';

  const canvas = document.querySelector('[data-globe]');
  const LAND = window.AROL_LAND;
  if (!canvas || !LAND) return;

  const hero = canvas.closest('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Patent locations [lat, lon]; EPO = Munich, WIPO = Geneva
  const PATENTS = {
    dz: [28, 3], be: [50.8, 4.5], ca: [56, -100], cn: [35, 104], eg: [26.8, 30.8],
    epo: [48.1, 11.6], fr: [46.5, 2.5], de: [51, 10.4], in: [21, 78], ie: [53.2, -8],
    it: [42.8, 12.5], kw: [29.3, 47.7], ma: [31.8, -7.1], pt: [39.5, -8], qa: [25.3, 51.2],
    sa: [24, 45], za: [-29, 24.7], es: [40.2, -3.7], se: [62, 15], ch: [46.8, 8.2],
    tn: [34, 9.5], tr: [39, 35], ae: [24, 54], gb: [53, -1.5], us: [39, -98], wipo: [46.2, 6.1],
  };
  const HUB = 'tn';

  import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js')
    .then(init)
    .catch(() => { /* keep the SVG fallback */ });

  function init(THREE) {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      return;
    }
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(DPR);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const R = 1.35;
    const stage = new THREE.Group();   // placement in the hero (per breakpoint)
    const tilt = new THREE.Group();    // viewing angle + pointer parallax
    const globe = new THREE.Group();   // spins
    scene.add(stage);
    stage.add(tilt);
    tilt.add(globe);

    const toVec = (lat, lon, r = R) => {
      const p = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180;
      return new THREE.Vector3(Math.cos(p) * Math.sin(l) * r, Math.sin(p) * r, Math.cos(p) * Math.cos(l) * r);
    };

    const glowTexture = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.22, 'rgba(255,238,200,.6)');
      grad.addColorStop(1, 'rgba(255,214,150,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();

    const fresnelVertex = `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`;

    // Dark core: hides the far side and adds a fine gold rim
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.985, 96, 96),
      new THREE.ShaderMaterial({
        vertexShader: fresnelVertex,
        fragmentShader: `
          varying vec3 vN; varying vec3 vV;
          void main() {
            float f = 1.0 - max(dot(vN, vV), 0.0);
            vec3 c = mix(vec3(0.014, 0.024, 0.055), vec3(0.07, 0.15, 0.32), pow(f, 2.4));
            c += vec3(0.85, 0.70, 0.42) * pow(f, 7.0) * 0.6;
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    ));

    // Atmosphere: back faces, brightest at the limb, fading outwards
    stage.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.2, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: fresnelVertex,
        fragmentShader: `
          varying vec3 vN; varying vec3 vV;
          void main() {
            float d = clamp(-dot(vN, vV), 0.0, 1.0);
            float i = clamp(pow(d / 0.55, 3.4), 0.0, 1.0);
            vec3 c = mix(vec3(0.30, 0.48, 0.95), vec3(0.92, 0.74, 0.42), 0.55);
            gl_FragColor = vec4(c, i * 0.42);
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    ));

    // Land dots on the same Fibonacci layout used to build the mask
    {
      const bits = Uint8Array.from(atob(LAND.bits), ch => ch.charCodeAt(0));
      const n = LAND.n;
      const golden = Math.PI * (3 - Math.sqrt(5));
      const pos = [], size = [], shade = [];
      for (let i = 0; i < n; i++) {
        if (!(bits[i >> 3] & (1 << (i & 7)))) continue;
        const y = 1 - ((i + 0.5) * 2) / n;
        const r = Math.sqrt(1 - y * y);
        const t = golden * i;
        pos.push(Math.cos(t) * r * R, y * R, Math.sin(t) * r * R);
        size.push(0.75 + Math.random() * 0.55);
        shade.push(Math.random());
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
      geo.setAttribute('aShade', new THREE.Float32BufferAttribute(shade, 1));
      globe.add(new THREE.Points(geo, new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 15 * DPR } },
        vertexShader: `
          attribute float aSize; attribute float aShade;
          uniform float uScale;
          varying float vShade; varying float vFacing;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vFacing = dot(normalize(normalMatrix * normalize(position)), normalize(-mv.xyz));
            vShade = aShade;
            gl_PointSize = aSize * uScale / -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          varying float vShade; varying float vFacing;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float a = smoothstep(0.5, 0.1, d);
            vec3 gold = mix(vec3(0.62, 0.46, 0.22), vec3(1.0, 0.90, 0.66), vShade);
            gl_FragColor = vec4(gold, a * (0.2 + 0.8 * smoothstep(0.0, 0.5, vFacing)));
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })));
    }

    // Patent markers: bright core, soft glow, expanding ring
    const pulses = [];
    const ringGeo = new THREE.RingGeometry(0.02, 0.025, 48);
    const dotGeo = new THREE.SphereGeometry(0.014, 12, 12);
    for (const [code, [lat, lon]] of Object.entries(PATENTS)) {
      const isHub = code === HUB;
      const p = toVec(lat, lon, R * 1.004);
      const outward = p.clone().multiplyScalar(2);

      const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: isHub ? 0xffffff : 0xfff1cf }));
      dot.position.copy(p);
      if (isHub) dot.scale.setScalar(1.6);
      globe.add(dot);

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture, color: isHub ? 0xffe2a8 : 0xf3d394, blending: THREE.AdditiveBlending,
        transparent: true, depthWrite: false, opacity: isHub ? 1 : 0.75,
      }));
      glow.position.copy(p);
      glow.scale.setScalar(isHub ? 0.22 : 0.12);
      globe.add(glow);

      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color: 0xf6e1a8, transparent: true, opacity: 0.8, side: THREE.DoubleSide,
        depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      ring.position.copy(p);
      ring.lookAt(outward);
      ring.userData = { phase: Math.random(), hub: isHub };
      globe.add(ring);
      pulses.push(ring);
    }

    // Light trails from the hub to every other office
    const shared = { uTime: { value: 0 } };
    const hub = toVec(...PATENTS[HUB], 1);
    for (const [code, [lat, lon]] of Object.entries(PATENTS)) {
      if (code === HUB) continue;
      const end = toVec(lat, lon, 1);
      const angle = hub.angleTo(end);
      if (angle < 0.12) continue;
      const lift = 0.1 + angle * 0.32;
      const pts = [], ts = [];
      const SEG = 72;
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const v = hub.clone().lerp(end, t).normalize().multiplyScalar(R * (1 + Math.sin(Math.PI * t) * lift));
        pts.push(v.x, v.y, v.z);
        ts.push(t);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      geo.setAttribute('aT', new THREE.Float32BufferAttribute(ts, 1));
      globe.add(new THREE.Line(geo, new THREE.ShaderMaterial({
        uniforms: { uTime: shared.uTime, uOffset: { value: Math.random() }, uSpeed: { value: 0.12 + Math.random() * 0.1 } },
        vertexShader: `
          attribute float aT; varying float vT;
          void main() { vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform float uTime; uniform float uOffset; uniform float uSpeed; varying float vT;
          void main() {
            float head = fract(uTime * uSpeed + uOffset) * 1.4 - 0.2;
            float d = head - vT;
            float trail = d >= 0.0 ? exp(-d * 10.0) : 0.0;
            vec3 c = mix(vec3(0.78, 0.62, 0.32), vec3(1.0, 0.95, 0.82), trail);
            gl_FragColor = vec4(c, 0.1 + trail * 0.9);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })));
    }

    // Orbits with travelling satellites
    const orbits = [];
    [[R * 1.48, 1.18, 0.35, 0.16], [R * 1.68, 1.42, -0.5, -0.1]].forEach(([radius, rx, rz, speed]) => {
      const holder = new THREE.Group();
      holder.rotation.set(rx, 0, rz);
      const circle = [];
      for (let i = 0; i <= 160; i++) {
        const a = (i / 160) * Math.PI * 2;
        circle.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(circle, 3));
      holder.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0xd9b871, transparent: true, opacity: 0.22, depthWrite: false,
      })));
      const sat = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture, color: 0xfff0cc, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      }));
      sat.scale.setScalar(0.16);
      holder.add(sat);
      tilt.add(holder);
      orbits.push({ sat, radius, speed, angle: Math.random() * Math.PI * 2 });
    });

    // Gold dust
    {
      const pos = [];
      for (let i = 0; i < 700; i++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(2.2 + Math.random() * 2.6);
        pos.push(v.x, v.y, v.z);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const dust = new THREE.Points(geo, new THREE.PointsMaterial({
        map: glowTexture, color: 0xe8cf95, size: 0.05, sizeAttenuation: true,
        transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      stage.add(dust);
      orbits.dust = dust;
    }

    // Initial view: Europe / Africa / Middle East facing the camera
    const BASE_X = 0.38, BASE_Z = -0.14;
    tilt.rotation.set(BASE_X, 0, BASE_Z);
    globe.rotation.y = (-20 * Math.PI) / 180;

    // Layout per breakpoint
    function layout() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const halfW = halfH * camera.aspect;
      if (w >= 1100) { stage.position.set(halfW * 0.44, -0.04, 0); stage.userData.scale = 1; }
      else if (w >= 760) { stage.position.set(halfW * 0.38, 0.1, 0); stage.userData.scale = 0.82; }
      else { stage.position.set(0, halfH * 0.42, 0); stage.userData.scale = 0.74; }
      if (reduceMotion) stage.scale.setScalar(stage.userData.scale);
    }
    layout();
    new ResizeObserver(() => { layout(); if (!running) render(); }).observe(canvas);

    // Pointer: parallax everywhere in the hero, drag-to-spin on the canvas
    const pointer = { x: 0, y: 0 };
    let dragging = false, lastX = 0, velocity = 0;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (dragging) {
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        globe.rotation.y += dx * 0.006;
        velocity = dx * 0.006;
        if (!running) render();
      }
    });
    canvas.addEventListener('pointerdown', e => {
      dragging = true; lastX = e.clientX; velocity = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('is-dragging');
    });
    const endDrag = () => { dragging = false; canvas.classList.remove('is-dragging'); };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    // Render loop (paused off-screen / in background tabs)
    const clock = new THREE.Clock();
    let running = false, visible = true, raf = 0, elapsed = 0;

    function render() {
      renderer.render(scene, camera);
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      shared.uTime.value = elapsed;

      // entrance: grow in and settle
      const intro = Math.min(elapsed / 2.6, 1);
      const ease = 1 - Math.pow(1 - intro, 3);
      stage.scale.setScalar((stage.userData.scale || 1) * (0.84 + 0.16 * ease));

      if (!dragging) {
        globe.rotation.y += 0.055 * dt + velocity;
        velocity *= 0.94;
      }
      tilt.rotation.x += (BASE_X + pointer.y * 0.1 - tilt.rotation.x) * 0.04;
      tilt.rotation.y += (pointer.x * 0.22 - tilt.rotation.y) * 0.04;

      for (const ring of pulses) {
        const f = (elapsed * (ring.userData.hub ? 0.5 : 0.35) + ring.userData.phase) % 1;
        ring.scale.setScalar(1 + f * (ring.userData.hub ? 4.5 : 2.4));
        ring.material.opacity = (1 - f) * (ring.userData.hub ? 0.9 : 0.5);
      }
      for (const o of orbits) {
        o.angle += o.speed * dt;
        o.sat.position.set(Math.cos(o.angle) * o.radius, Math.sin(o.angle) * o.radius, 0);
      }
      orbits.dust.rotation.y += 0.01 * dt;

      render();
    }

    function start() {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    if (reduceMotion) {
      stage.scale.setScalar(stage.userData.scale || 1);
      for (const ring of pulses) ring.visible = false;
      render();
    } else {
      start();
    }
    requestAnimationFrame(() => hero.classList.add('has-webgl'));
  }
})();
