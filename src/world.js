import * as THREE from 'three';

// An illustrated relief scene: the original artwork is projected onto a shallow
// mesh, preserving its composition. Camera travel is deliberately constrained;
// a single illustration cannot supply unseen sides of buildings.
export async function createWorld(container, data, onSelect, onLost) {
  const places = data.places;
  let activeScene = 'work';
  let sceneRequest = 0;
  const textures = new Map();
  const pendingTextures = new Map();
  const WIDTH = 60;
  const HEIGHT = 40;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-30, 30, 20, -20, 0.1, 100);
  camera.position.set(0, 0, 55);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  container.append(renderer.domElement);

  let texture;
  try {
    const entry = data.scenes.find(scene => scene.id === activeScene);
    if (!entry) throw new Error('The starting scene is missing');
    texture = await new THREE.TextureLoader().loadAsync(new URL(entry.image, document.baseURI).href);
  } catch (error) {
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  textures.set('work', texture);
  const depthAt = (u, v) => {
    const land = Math.exp(-((u - .77) ** 2 / .095 + (v - .48) ** 2 / .11));
    const cliffs = Math.exp(-((u - .52) ** 2 / .022 + (v - .34) ** 2 / .026));
    return land * 1.6 + cliffs * .6;
  };
  const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT, 160, 108);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) positions.setZ(i, depthAt(uv.getX(i), uv.getY(i)));
  geometry.computeVertexNormals();
  const uniforms = { image: { value: texture }, time: { value: 0 }, waterMotion: { value: 1 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D image; uniform float time; uniform float waterMotion; varying vec2 vUv;
      void main(){
        vec2 p=vUv;
        // Ripples stay in open water, well clear of shore and horizon.
        float water=waterMotion*(1.-smoothstep(.15,.28,p.x))*smoothstep(.02,.15,p.y)*(1.-smoothstep(.58,.68,p.y));
        p.x+=sin(p.y*160.+time*.55)*.00019*water;
        p.y+=sin(p.x*130.-time*.35)*.00014*water;
        gl_FragColor=texture2D(image,p);
        #include <colorspace_fragment>
      }`,
  });
  const relief = new THREE.Mesh(geometry, material);
  const world = new THREE.Group();
  world.add(relief);
  scene.add(world);

  const labels = places.map((place, index) => {
    const button = document.createElement('button');
    button.className = 'pin';
    button.dataset.place = place.id;
    button.setAttribute('aria-label', place.name);
    button.innerHTML = `<span class="pin-number">${String(index + 1).padStart(2, '0')}</span>`;
    const name = document.createElement('span');
    name.className = 'pin-name';
    name.textContent = place.name;
    button.append(name);
    button.onclick = () => onSelect(index);
    document.querySelector('#labels').append(button);
    return { button, place, point: new THREE.Vector3() };
  });

  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let stopped = false;
  let lastTime = 0;
  let time = 0;
  let drag;
  let moved = false;
  let target = { x: 0, y: 0, zoom: 1 };
  const pointer = { x: 0, y: 0 };
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const contacts = new Map();
  let pinchDistance = 0;

  function limits() {
    const halfW = camera.right / target.zoom;
    const halfH = camera.top / target.zoom;
    const edgeX = Math.max(0, WIDTH / 2 - halfW - .08);
    const edgeY = Math.max(0, HEIGHT / 2 - halfH - .08);
    target.x = THREE.MathUtils.clamp(target.x, -edgeX, edgeX);
    target.y = THREE.MathUtils.clamp(target.y, -edgeY, edgeY);
  }
  function home() {
    target = { x: container.clientWidth < 700 ? 8 : 0, y: 0, zoom: 1.015 };
    limits();
  }
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    const halfH = Math.min(HEIGHT / 2, WIDTH / (2 * aspect));
    camera.left = -halfH * aspect;
    camera.right = halfH * aspect;
    camera.top = halfH;
    camera.bottom = -halfH;
    renderer.setSize(width, height);
    limits();
    camera.updateProjectionMatrix();
  }
  resize();
  home();
  camera.position.x = target.x;
  camera.position.y = target.y;
  camera.zoom = target.zoom;
  camera.updateProjectionMatrix();
  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(container);

  function zoom(factor) {
    target.zoom = THREE.MathUtils.clamp(target.zoom * factor, 1.015, 2.8);
    limits();
  }
  const canvas = renderer.domElement;
  canvas.addEventListener('wheel', event => {
    // The page still scrolls normally outside the explicitly focused scene.
    if (document.activeElement !== container) return;
    event.preventDefault();
    zoom(Math.exp(-event.deltaY * .001));
  }, { passive: false });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    container.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    contacts.set(event.pointerId, { x: event.clientX, y: event.clientY });
    drag = { x: event.clientX, y: event.clientY, cameraX: target.x, cameraY: target.y };
    moved = false;
    if (contacts.size === 2) {
      const [a, b] = [...contacts.values()];
      pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
      moved = true;
    }
  });
  canvas.addEventListener('pointermove', event => {
    const rect = container.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointer.y = (event.clientY - rect.top) / rect.height * 2 - 1;
    if (!contacts.has(event.pointerId)) return;
    contacts.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (contacts.size === 2) {
      const [a, b] = [...contacts.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistance > 0) zoom(distance / pinchDistance);
      pinchDistance = distance;
      moved = true;
      return;
    }
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    moved ||= Math.hypot(dx, dy) > 5;
    target.x = drag.cameraX - dx / rect.width * (camera.right - camera.left) / target.zoom;
    target.y = drag.cameraY + dy / rect.height * (camera.top - camera.bottom) / target.zoom;
    limits();
  });
  canvas.addEventListener('pointerup', event => {
    contacts.delete(event.pointerId);
    if (!moved && drag) {
      const rect = container.getBoundingClientRect();
      mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObject(relief)[0];
      if (hit) {
        const candidates = places.map((place, index) => ({ index, scene: place.scene, distance: Math.hypot((hit.uv.x - place.anchor[0]) * 1.5, 1 - hit.uv.y - place.anchor[1]) })).filter(p => p.scene === activeScene);
        candidates.sort((a, b) => a.distance - b.distance);
        if (candidates[0]?.distance < .064) onSelect(candidates[0].index);
      }
    }
    drag = undefined;
    pinchDistance = 0;
  });
  canvas.addEventListener('pointercancel', () => { drag = undefined; contacts.clear(); pinchDistance = 0; });
  canvas.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    stopped = true;
    renderer.setAnimationLoop(null);
    document.querySelector('#labels').hidden = true;
    onLost();
  });
  container.addEventListener('keydown', event => {
    const directions = { ArrowLeft: [-1.6, 0], ArrowRight: [1.6, 0], ArrowUp: [0, 1.6], ArrowDown: [0, -1.6] };
    if (directions[event.key]) {
      event.preventDefault();
      target.x += directions[event.key][0] / target.zoom;
      target.y += directions[event.key][1] / target.zoom;
      limits();
    } else if (event.key === '+' || event.key === '=') zoom(1.15);
    else if (event.key === '-') zoom(1 / 1.15);
    else if (event.key === 'Home') home();
  });

  renderer.setAnimationLoop(ms => {
    const dt = Math.min((ms - lastTime) / 1000, .05);
    lastTime = ms;
    if (stopped || !visible || document.hidden) return;
    if (!paused) time += dt;
    uniforms.time.value = time;
    const ease = paused ? 1 : 1 - Math.exp(-dt * 7);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, target.x, ease);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, target.y, ease);
    camera.zoom = THREE.MathUtils.lerp(camera.zoom, target.zoom, ease);
    camera.updateProjectionMatrix();
    world.rotation.y = THREE.MathUtils.lerp(world.rotation.y, paused ? 0 : pointer.x * .007, ease);
    world.rotation.x = THREE.MathUtils.lerp(world.rotation.x, paused ? 0 : pointer.y * .005, ease);
    world.updateMatrixWorld();
    const width = container.clientWidth;
    const height = container.clientHeight;
    for (const { button, place, point } of labels) {
      const [u, top] = place.anchor;
      point.set((u - .5) * WIDTH, (.5 - top) * HEIGHT, depthAt(u, 1 - top) + .025);
      world.localToWorld(point);
      point.project(camera);
      const x = (point.x * .5 + .5) * width;
      const y = (-point.y * .5 + .5) * height;
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      button.hidden = place.scene !== activeScene || x < 25 || x > width - 25 || y < 80 || y > height - 100;
    }
    renderer.render(scene, camera);
  });

  async function setScene(id) {
    const request = ++sceneRequest;
    const entry = data.scenes.find(s => s.id === id);
    if (!entry) throw new Error('Unknown world scene');
    if (activeScene === id) return;
    if (!textures.has(id)) {
      if (!pendingTextures.has(id)) {
        const loading = new THREE.TextureLoader().loadAsync(new URL(entry.image, document.baseURI).href).then(next => {
          next.colorSpace = THREE.SRGBColorSpace;
          next.anisotropy = texture.anisotropy;
          textures.set(id, next);
        }).finally(() => pendingTextures.delete(id));
        pendingTextures.set(id, loading);
      }
      try { await pendingTextures.get(id); }
      catch (error) {
        if (request !== sceneRequest) return;
        throw error;
      }
    }
    if (request !== sceneRequest) return;
    activeScene = id;
    uniforms.image.value = textures.get(id);
    uniforms.waterMotion.value = id === 'work' ? 1 : 0;
    home();
    camera.position.x = target.x;
    camera.position.y = target.y;
    camera.zoom = target.zoom;
  }

  return {
    setScene,
    pause(value) { paused = value; },
    zoom,
    reset: home,
    focus(place) {
      const [u, top] = place.anchor;
      target.zoom = container.clientWidth < 700 ? 1.5 : 1.85;
      target.x = (u - .5) * WIDTH + (container.clientWidth < 700 ? 0 : camera.right / target.zoom * .33);
      target.y = (.5 - top) * HEIGHT;
      limits();
      labels.forEach(label => label.button.classList.toggle('selected', label.place.id === place.id));
    },
  };
}
