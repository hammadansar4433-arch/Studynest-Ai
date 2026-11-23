(() => {
  "use strict";

  const lab = document.getElementById("lab3d");
  if (!lab || document.getElementById("sn3d-extra")) return;

  const section = document.createElement("section");
  section.id = "sn3d-extra";
  section.innerHTML = `
    <div class="snx-heading">
      <span class="snx-kicker">STUDYNEST SCIENCE STUDIO</span>
      <h2>Explore more <em>in 3D.</em></h2>
      <p>Four additional interactive models for Physics, Biology and Mathematics. Change the control and watch the model respond.</p>
    </div>
    <div class="snx-layout">
      <div class="snx-stage">
        <div class="snx-stage-label">INTERACTIVE MODEL</div>
        <div id="snx-canvas"></div>
        <div id="snx-load" class="snx-loading">Preparing the 3D engine…</div>
      </div>
      <aside class="snx-panel">
        <label for="snx-project">Choose a project</label>
        <select id="snx-project">
          <option value="wave">🌊 Physics · Wave on a string</option>
          <option value="refraction">💡 Physics · Refraction of light</option>
          <option value="plant">🌱 Biology · Plant cell</option>
          <option value="circle">📐 Maths · Unit circle</option>
        </select>
        <div id="snx-control-wrap">
          <label id="snx-control-label" for="snx-control">Wavelength</label>
          <input id="snx-control" type="range" min="1" max="6" step="0.1" value="3">
          <div class="snx-range"><span id="snx-min">1</span><strong id="snx-value">3</strong><span id="snx-max">6</span></div>
        </div>
        <div class="snx-info">
          <h3 id="snx-title">Wave on a string</h3>
          <p id="snx-description"></p>
          <div id="snx-facts" aria-live="polite"></div>
        </div>
        <p class="snx-tip">Tip: drag the model to rotate it and use the mouse wheel or pinch to zoom.</p>
      </aside>
    </div>
  `;
  lab.appendChild(section);

  const style = document.createElement("style");
  style.textContent = `
    #sn3d-extra{margin-top:30px;padding-top:26px;border-top:1px solid var(--ln)}
    #sn3d-extra .snx-heading{margin-bottom:18px}
    #sn3d-extra .snx-kicker{font-size:11px;letter-spacing:.16em;font-weight:800;color:var(--ac)}
    #sn3d-extra .snx-heading h2{margin:5px 0 8px}
    #sn3d-extra .snx-heading p{color:var(--mu);max-width:65ch;margin:0}
    #sn3d-extra .snx-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(250px,.8fr);gap:14px;align-items:start}
    #sn3d-extra .snx-stage{height:440px;min-height:320px;position:relative;overflow:hidden;border-radius:22px;border:1px solid var(--ln);background:radial-gradient(circle at 50% 35%,#173d37,#07110d)}
    #sn3d-extra #snx-canvas,#sn3d-extra canvas{width:100%;height:100%;display:block}
    #sn3d-extra .snx-stage-label{position:absolute;z-index:2;left:14px;top:12px;color:#bde8da;font-size:10px;letter-spacing:.14em;font-weight:800;pointer-events:none}
    #sn3d-extra .snx-loading{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:#d7f5e9;font-size:14px}
    #sn3d-extra .snx-panel{background:var(--sf);border:1px solid var(--ln);border-radius:20px;padding:18px}
    #sn3d-extra label{display:block;font-size:13px;font-weight:700;margin:8px 0}
    #sn3d-extra select{width:100%;min-width:0;margin-bottom:16px}
    #sn3d-extra input[type=range]{width:100%;accent-color:var(--ac)}
    #sn3d-extra .snx-range{display:flex;justify-content:space-between;color:var(--mu);font-size:12px}
    #sn3d-extra .snx-range strong{color:var(--ac);font-size:14px}
    #sn3d-extra .snx-info{margin-top:18px;padding-top:15px;border-top:1px solid var(--ln)}
    #sn3d-extra .snx-info h3{margin:0 0 7px;font-size:18px}
    #sn3d-extra .snx-info p{color:var(--mu);font-size:13px;margin:0 0 10px}
    #sn3d-extra #snx-facts{font-size:13px;line-height:1.7}
    #sn3d-extra .snx-tip{font-size:11px;color:var(--mu);margin:14px 0 0}
    @media(max-width:760px){#sn3d-extra .snx-layout{grid-template-columns:1fr}#sn3d-extra .snx-stage{height:340px;min-height:280px}}
    @media(prefers-reduced-motion:reduce){#sn3d-extra *{scroll-behavior:auto!important}}
  `;
  document.head.appendChild(style);

  const $ = (id) => document.getElementById(id);
  const host = $("snx-canvas");
  const loading = $("snx-load");
  const picker = $("snx-project");
  const slider = $("snx-control");
  let THREE = null, renderer = null, scene = null, camera = null, group = null;
  let animation = 0, clockStart = 0, tick = null, resizeObserver = null;
  let drag = false, pointer = null, theta = 0.8, phi = 1.05, distance = 15;

  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (window.__sn3dExtraThreePromise) return window.__sn3dExtraThreePromise;
    window.__sn3dExtraThreePromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*="three.min.js"]');
      if (existing) {
        existing.addEventListener("load", () => window.THREE ? resolve(window.THREE) : reject(new Error("Three.js did not initialize.")), { once: true });
        existing.addEventListener("error", () => reject(new Error("The 3D library could not load.")), { once: true });
        if (window.THREE) resolve(window.THREE);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.onload = () => window.THREE ? resolve(window.THREE) : reject(new Error("Three.js did not initialize."));
      script.onerror = () => reject(new Error("The 3D library could not load. Check your internet connection."));
      document.head.appendChild(script);
    });
    return window.__sn3dExtraThreePromise;
  }

  const projects = {
    wave: {
      title: "Wave on a string",
      description: "A transverse wave moves along a stretched string. The particles move up and down while the disturbance travels along the string.",
      control: { label: "Wavelength (λ)", min: 1, max: 6, step: .1, value: 3 },
      build(v, g) {
        const T = THREE, pts = [], positions = new Float32Array(121 * 3);
        for (let i = 0; i <= 120; i++) pts.push(new T.Vector3(-6 + i * .1, 0, 0));
        const geo = new T.BufferGeometry().setFromPoints(pts);
        const line = new T.Line(geo, new T.LineBasicMaterial({ color: 0x5eead4, linewidth: 2 }));
        g.add(line);
        const axis = new T.GridHelper(14, 14, 0x315c54, 0x18352f);
        axis.position.y = -1.35; g.add(axis);
        const bead = new T.Mesh(new T.SphereGeometry(.17, 20, 16), new T.MeshStandardMaterial({ color: 0xf5d9a0, emissive: 0x72501a }));
        g.add(bead);
        return (time) => {
          const a = geo.attributes.position.array, k = 2 * Math.PI / v;
          for (let i = 0; i <= 120; i++) {
            const x = -6 + i * .1;
            a[i * 3] = x;
            a[i * 3 + 1] = .85 * Math.sin(k * x - time * 2.2);
            a[i * 3 + 2] = 0;
          }
          geo.attributes.position.needsUpdate = true;
          const bx = 1.1;
          bead.position.set(bx, .85 * Math.sin(k * bx - time * 2.2), 0);
        };
      },
      facts(v) {
        return `Wavelength λ = ${v.toFixed(1)} units<br>Wave number k = ${(2 * Math.PI / v).toFixed(2)} rad/unit<br>Remember: wave speed = frequency × wavelength.`;
      }
    },
    refraction: {
      title: "Refraction of light",
      description: "See how a light ray changes direction when it passes from air into a material with a different refractive index.",
      control: { label: "Angle of incidence (°)", min: 10, max: 70, step: 1, value: 45 },
      build(angle, g) {
        const T = THREE, n1 = 1, n2 = 1.5, rad = angle * Math.PI / 180;
        const refracted = Math.asin(Math.min(1, n1 / n2 * Math.sin(rad)));
        const plane = new T.Mesh(new T.PlaneGeometry(12, 8), new T.MeshBasicMaterial({ color: 0x164e63, transparent: true, opacity: .22, side: T.DoubleSide }));
        plane.position.y = -2; g.add(plane);
        const interfaceLine = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-6, 0, 0), new T.Vector3(6, 0, 0)]), new T.LineBasicMaterial({ color: 0xf5d9a0 }));
        const normal = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, -4, 0), new T.Vector3(0, 4, 0)]), new T.LineDashedMaterial({ color: 0xe2e8f0, dashSize: .25, gapSize: .18 }));
        normal.computeLineDistances(); g.add(interfaceLine, normal);
        const ray = (a, b, color) => {
          const l = new T.Line(new T.BufferGeometry().setFromPoints([a, b]), new T.LineBasicMaterial({ color }));
          g.add(l);
        };
        ray(new T.Vector3(-4 * Math.sin(rad), 4 * Math.cos(rad), .08), new T.Vector3(0, 0, .08), 0xfbbf24);
        ray(new T.Vector3(0, 0, .1), new T.Vector3(4 * Math.sin(refracted), -4 * Math.cos(refracted), .1), 0x38bdf8);
        const point = new T.Mesh(new T.SphereGeometry(.12, 16, 12), new T.MeshBasicMaterial({ color: 0xffffff }));
        g.add(point);
      },
      facts(v) {
        const r = Math.asin(Math.min(1, Math.sin(v * Math.PI / 180) / 1.5)) * 180 / Math.PI;
        return `Air: n₁ = 1.00 · Material: n₂ = 1.50<br>Incidence angle = ${v.toFixed(0)}°<br>Refraction angle ≈ ${r.toFixed(1)}°<br>Snell's law: n₁ sin θ₁ = n₂ sin θ₂.`;
      }
    },
    plant: {
      title: "Plant cell",
      description: "Explore a simplified plant cell with a cell wall, membrane, nucleus, large central vacuole and chloroplasts.",
      control: { label: "Central vacuole size", min: 1, max: 2.5, step: .1, value: 1.8 },
      build(size, g) {
        const T = THREE;
        const addSphere = (radius, color, pos, scale, opacity = 1) => {
          const m = new T.Mesh(new T.SphereGeometry(radius, 32, 24), new T.MeshStandardMaterial({ color, roughness: .45, transparent: opacity < 1, opacity, side: T.DoubleSide }));
          m.position.set(...pos); m.scale.set(...scale); g.add(m); return m;
        };
        addSphere(1, 0x8bd3a8, [0, 0, 0], [5, 3.1, 1.8], .16);
        addSphere(1, 0x34a875, [0, 0, 0], [4.82, 2.92, 1.68], .12);
        addSphere(1, 0x60a5fa, [.25, -.05, 0], [2.2 * size / 1.8, 1.45 * size / 1.8, 1.15], .48);
        addSphere(.8, 0x9b7be8, [-3, .9, .15], [1.05, 1.05, .8], .95);
        addSphere(.35, 0xf0abfc, [-3.1, .95, .8], [1, 1, .65], .95);
        const chloroplastMat = new T.MeshStandardMaterial({ color: 0x65a30d, roughness: .5 });
        for (let i = 0; i < 7; i++) {
          const a = i * Math.PI * 2 / 7;
          const c = new T.Mesh(new T.SphereGeometry(.42, 20, 14), chloroplastMat);
          c.position.set(3.25 * Math.cos(a), 1.85 * Math.sin(a), .15);
          c.scale.set(1.45, .7, .7); g.add(c);
        }
        const wall = new T.Mesh(new T.BoxGeometry(10.2, 6.4, .08), new T.MeshBasicMaterial({ color: 0x86efac, wireframe: true, transparent: true, opacity: .22 }));
        wall.position.z = 0; g.add(wall);
      },
      facts(v) {
        return `Large central vacuole: ${v.toFixed(1)} model scale<br>Cell wall: support and protection<br>Chloroplasts: photosynthesis<br>Nucleus: stores genetic information.`;
      }
    },
    circle: {
      title: "Unit circle",
      description: "Move the angle around a unit circle and connect the coordinates to cosine and sine.",
      control: { label: "Angle (°)", min: 0, max: 360, step: 1, value: 45 },
      build(degrees, g) {
        const T = THREE, a = degrees * Math.PI / 180;
        const circlePts = [];
        for (let i = 0; i <= 120; i++) {
          const t = i / 120 * Math.PI * 2;
          circlePts.push(new T.Vector3(Math.cos(t) * 3.5, Math.sin(t) * 3.5, 0));
        }
        g.add(new T.Line(new T.BufferGeometry().setFromPoints(circlePts), new T.LineBasicMaterial({ color: 0x5eead4 })));
        const axes = [
          [new T.Vector3(-4.2, 0, 0), new T.Vector3(4.2, 0, 0)],
          [new T.Vector3(0, -4.2, 0), new T.Vector3(0, 4.2, 0)]
        ];
        axes.forEach(p => g.add(new T.Line(new T.BufferGeometry().setFromPoints(p), new T.LineBasicMaterial({ color: 0x94a3b8 }))));
        const x = 3.5 * Math.cos(a), y = 3.5 * Math.sin(a);
        const radius = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, .05), new T.Vector3(x, y, .05)]), new T.LineBasicMaterial({ color: 0xfbbf24 }));
        const projX = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(x, 0, .04), new T.Vector3(x, y, .04)]), new T.LineDashedMaterial({ color: 0x38bdf8, dashSize: .15, gapSize: .1 }));
        projX.computeLineDistances();
        const dot = new T.Mesh(new T.SphereGeometry(.16, 20, 16), new T.MeshStandardMaterial({ color: 0xf5d9a0, emissive: 0x72501a }));
        dot.position.set(x, y, .1); g.add(radius, projX, dot);
      },
      facts(v) {
        const a = v * Math.PI / 180;
        return `cos(${v.toFixed(0)}°) = ${Math.cos(a).toFixed(3)}<br>sin(${v.toFixed(0)}°) = ${Math.sin(a).toFixed(3)}<br>Point on unit circle: (${Math.cos(a).toFixed(3)}, ${Math.sin(a).toFixed(3)}).`;
      }
    }
  };

  function setControl(project) {
    const c = project.control;
    $("snx-control-label").textContent = c.label;
    slider.min = c.min; slider.max = c.max; slider.step = c.step; slider.value = c.value;
    $("snx-min").textContent = c.min;
    $("snx-max").textContent = c.max;
    $("snx-value").textContent = c.value;
  }

  function updateCamera() {
    if (!camera) return;
    const s = Math.sin(phi);
    camera.position.set(distance * s * Math.sin(theta), distance * Math.cos(phi), distance * s * Math.cos(theta));
    camera.lookAt(0, 0, 0);
  }

  function clearGroup() {
    if (!group || !scene) return;
    group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
    scene.remove(group);
    group = null;
  }

  function draw() {
    if (!THREE || !renderer) return;
    const key = picker.value, project = projects[key], value = Number(slider.value);
    clearGroup();
    group = new THREE.Group();
    scene.add(group);
    project.build(value, group);
    $("snx-title").textContent = project.title;
    $("snx-description").textContent = project.description;
    $("snx-facts").innerHTML = project.facts(value);
    $("snx-value").textContent = value;
    theta = .8; phi = 1.05;
    distance = key === "plant" ? 15 : 13;
    updateCamera();
    tick = key === "wave" ? project.buildTick : null;
  }

  function animate(now) {
    animation = requestAnimationFrame(animate);
    if (!renderer || !scene || !camera) return;
    const elapsed = (now - clockStart) / 1000;
    if (picker.value === "wave" && group) {
      const line = group.children.find(o => o.isLine && o.geometry.attributes.position.count === 121);
      if (line) {
        const v = Number(slider.value), a = line.geometry.attributes.position.array, k = 2 * Math.PI / v;
        for (let i = 0; i <= 120; i++) {
          const x = -6 + i * .1;
          a[i * 3] = x; a[i * 3 + 1] = .85 * Math.sin(k * x - elapsed * 2.2); a[i * 3 + 2] = 0;
        }
        line.geometry.attributes.position.needsUpdate = true;
        const bead = group.children.find(o => o.isMesh && o.geometry.type === "SphereGeometry");
        if (bead) bead.position.set(1.1, .85 * Math.sin(k * 1.1 - elapsed * 2.2), 0);
      }
    }
    updateCamera();
    renderer.render(scene, camera);
  }

  function initialize(T) {
    THREE = T;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    host.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07110d);
    camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, .75));
    const light = new THREE.DirectionalLight(0xffffff, 1.15);
    light.position.set(6, 9, 8); scene.add(light);
    const fill = new THREE.DirectionalLight(0x8bd3ff, .35);
    fill.position.set(-7, -3, -5); scene.add(fill);

    const resize = () => {
      if (!renderer) return;
      const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    loading.remove();
    setControl(projects[picker.value]);
    draw();
    clockStart = performance.now();
    animation = requestAnimationFrame(animate);

    renderer.domElement.addEventListener("pointerdown", e => {
      drag = true; pointer = [e.clientX, e.clientY];
      renderer.domElement.setPointerCapture(e.pointerId);
    });
    renderer.domElement.addEventListener("pointermove", e => {
      if (!drag || !pointer) return;
      theta -= (e.clientX - pointer[0]) * .008;
      phi = Math.max(.15, Math.min(Math.PI - .15, phi - (e.clientY - pointer[1]) * .008));
      pointer = [e.clientX, e.clientY];
    });
    const endDrag = () => { drag = false; pointer = null; };
    renderer.domElement.addEventListener("pointerup", endDrag);
    renderer.domElement.addEventListener("pointercancel", endDrag);
    renderer.domElement.addEventListener("wheel", e => {
      e.preventDefault();
      distance = Math.max(6, Math.min(30, distance * Math.exp(e.deltaY * .001)));
    }, { passive: false });
  }

  picker.addEventListener("change", () => {
    if (!THREE) return;
    setControl(projects[picker.value]);
    draw();
  });
  slider.addEventListener("input", () => {
    $("snx-value").textContent = slider.value;
    if (THREE) draw();
  });

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    observer.disconnect();
    loadThree().then(initialize).catch(error => {
      loading.textContent = error.message || "The 3D projects could not load.";
    });
  }, { rootMargin: "250px" });
  observer.observe(section);

  window.addEventListener("pagehide", () => {
    if (animation) cancelAnimationFrame(animation);
    if (resizeObserver) resizeObserver.disconnect();
    if (renderer) renderer.dispose();
  }, { once: true });
})();
