import * as THREE from 'three';

// One illustration, one relief mesh and one camera. Every place remains on the
// same map: travelling between records never swaps artwork or world geometry.
export async function createWorld(container, data, onSelect, onLost) {
  const places = data.places;
  const WIDTH = 60;
  const HEIGHT = WIDTH / (data.world.aspect || 1.5);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-30, 30, HEIGHT / 2, -HEIGHT / 2, 0.1, 100);
  camera.position.set(0, 0, 55);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  container.append(renderer.domElement);

  let texture;
  try {
    texture = await new THREE.TextureLoader().loadAsync(new URL(data.world.image, document.baseURI).href);
  } catch (error) {
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const depthAt = (u, v) => Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * .65;
  const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT, 160, 108);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) positions.setZ(i, depthAt(uv.getX(i), uv.getY(i)));
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const relief = new THREE.Mesh(geometry, material);
  const world = new THREE.Group();
  world.add(relief);
  scene.add(world);

  const labels = places.map((place, index) => {
    const button = document.createElement('button');
    button.className = 'pin';
    button.dataset.place = place.id;
    button.dataset.kind = place.kind;
    button.setAttribute('aria-label', `${index + 1}. ${place.name}`);
    button.innerHTML = `<span class="pin-number">${String(index + 1).padStart(2, '0')}</span>`;
    const name = document.createElement('span');
    name.className = 'pin-name';
    name.textContent = place.name;
    button.append(name);
    button.onclick = () => onSelect(index);
    document.querySelector('#labels').append(button);
    return { button, place, point: new THREE.Vector3(), x: 0, y: 0 };
  });

  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let stopped = false;
  let lastTime = 0;
  let drag;
  let moved = false;
  let target = { x: 0, y: 0, zoom: 1 };
  const pointer = { x: 0, y: 0 };
  const contacts = new Map();
  let pinchDistance = 0;

  function limits() {
    const halfW = camera.right / target.zoom;
    const halfH = camera.top / target.zoom;
    const edgeX = Math.max(0, WIDTH / 2 - halfW);
    const edgeY = Math.max(0, HEIGHT / 2 - halfH);
    target.x = THREE.MathUtils.clamp(target.x, -edgeX, edgeX);
    target.y = THREE.MathUtils.clamp(target.y, -edgeY, edgeY);
  }
  function home() {
    target = { x: 0, y: 0, zoom: 1 };
    limits();
    labels.forEach(({ button }) => button.classList.remove('selected'));
  }
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    // Contain rather than cover: the overview includes all four image edges on
    // every screen, including portrait phones. The extra 4% keeps pins in reach.
    const halfH = Math.max(HEIGHT / 2, WIDTH / (2 * aspect)) * 1.04;
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
  // Start portrait phones close enough to fill the screen with the town.
  // Reset and the Home key still deliberately return to the complete overview.
  if (container.clientWidth < 700) {
    target.zoom = Math.min(6, Math.max(1, camera.right * 2 / WIDTH, camera.top * 2 / HEIGHT));
    limits();
  }
  camera.zoom = target.zoom;
  camera.updateProjectionMatrix();
  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(container);

  function zoom(factor) {
    target.zoom = THREE.MathUtils.clamp(target.zoom * factor, 1, 6);
    limits();
  }
  const canvas = renderer.domElement;
  canvas.addEventListener('wheel', event => {
    if (document.activeElement !== container) return;
    event.preventDefault();
    zoom(Math.exp(-event.deltaY * .001));
  }, { passive: false });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    document.body.classList.add('world-active');
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
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      const nearest = labels.map((label, index) => ({ index, distance: Math.hypot(label.x - x, label.y - y) }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest?.distance < 26) onSelect(nearest.index);
    }
    const remaining = [...contacts.values()][0];
    drag = remaining ? { x: remaining.x, y: remaining.y, cameraX: target.x, cameraY: target.y } : undefined;
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
    const directions = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, 2], ArrowDown: [0, -2] };
    if (directions[event.key]) {
      event.preventDefault();
      target.x += directions[event.key][0] / target.zoom;
      target.y += directions[event.key][1] / target.zoom;
      limits();
    } else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.3); }
    else if (event.key === '-') { event.preventDefault(); zoom(1 / 1.3); }
    else if (event.key === 'Home') { event.preventDefault(); home(); }
  });

  renderer.setAnimationLoop(ms => {
    const dt = Math.min((ms - lastTime) / 1000, .05);
    lastTime = ms;
    if (stopped || !visible || document.hidden) return;
    const ease = paused ? 1 : 1 - Math.exp(-dt * 7);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, target.x, ease);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, target.y, ease);
    camera.zoom = THREE.MathUtils.lerp(camera.zoom, target.zoom, ease);
    camera.updateProjectionMatrix();
    // Gentle depth responds to the pointer only after zooming. The full overview
    // stays still so it consistently shows the same complete, connected map.
    const depth = target.zoom > 1.05 && !paused;
    world.rotation.y = THREE.MathUtils.lerp(world.rotation.y, depth ? pointer.x * .004 : 0, ease);
    world.rotation.x = THREE.MathUtils.lerp(world.rotation.x, depth ? pointer.y * .003 : 0, ease);
    world.updateMatrixWorld();
    const width = container.clientWidth;
    const height = container.clientHeight;
    const placed = [];
    // Selected and keyboard-focused markers take priority when overview labels
    // overlap. Every individual place stays available in the complete route.
    const ordered = [...labels].sort((a, b) => Number(b.button.classList.contains('selected') || document.activeElement === b.button) - Number(a.button.classList.contains('selected') || document.activeElement === a.button));
    for (const label of ordered) {
      const { button, place, point } = label;
      const [u, top] = place.anchor;
      point.set((u - .5) * WIDTH, (.5 - top) * HEIGHT, depthAt(u, 1 - top) + .025);
      world.localToWorld(point);
      point.project(camera);
      label.x = (point.x * .5 + .5) * width;
      label.y = (-point.y * .5 + .5) * height;
      button.style.left = `${label.x}px`;
      button.style.top = `${label.y}px`;
      const offscreen = label.x < 17 || label.x > width - 17 || label.y < 17 || label.y > height - 17;
      const crowded = camera.zoom < 1.8 && placed.some(other => Math.hypot(other.x - label.x, other.y - label.y) < 33);
      button.hidden = offscreen || crowded;
      if (!button.hidden) placed.push(label);
    }
    container.dataset.zoom = camera.zoom.toFixed(2);
    renderer.render(scene, camera);
  });

  return {
    pause(value) { paused = value; },
    zoom,
    reset: home,
    focus(place) {
      const [u, top] = place.anchor;
      const mobile = container.clientWidth < 700;
      target.zoom = mobile ? 4 : 2.4;
      target.x = (u - .5) * WIDTH + (mobile ? 0 : camera.right / target.zoom * .35);
      target.y = (.5 - top) * HEIGHT - (mobile ? camera.top / target.zoom * .45 : 0);
      limits();
      labels.forEach(label => label.button.classList.toggle('selected', label.place.id === place.id));
    },
  };
}
