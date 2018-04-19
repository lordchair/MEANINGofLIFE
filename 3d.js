var container;
var camera, scene, renderer, controls, clock, raycaster, mouse;

var origin = new THREE.Vector3();
var up_vec = new THREE.Vector3(0, 1, 0);

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var bg_mesh;
var bg_material;
var bg_texture;

var needs_play = -1;
var active_pane = -1;

var assets_base = 'assets/';

var aspect_ratio = 16/9;
var xsize = window.innerWidth * .9;
var ysize = xsize / aspect_ratio;

var translate_amount = xsize/2;
var translate_speed = xsize/20;

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, radius()*2);
  camera.position.y = 0.01;
  camera.position.y = 100.01;

  scene = new THREE.Scene();

  var light = new THREE.AmbientLight(0xffffff);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({antialias: false});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  CameraControls.install({THREE: THREE});
  controls = new CameraControls(camera, renderer.domElement, -0.25);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.rotateSpeed = 0.08;

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
  //onWindowResize();

  initStaticBackground('earth_night.jpg');
  initVideoPanes();
  initialAnimation();

  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('orientationchange', onWindowResize, false);
  window.addEventListener('mousedown', onMousedown, false);
  window.addEventListener('mouseup', onMouseup, false);
  window.addEventListener('touchstart', onTouchStart, false);
  window.addEventListener('touchstart', onTouchEnd, false);

  animate();
}

function initialAnimation() {
  controls.moveTo(0, 0.01, 0);
  showPane(0);
}

function initStaticBackground(name) {
  var geometry = new THREE.SphereBufferGeometry(radius() * 1.1, 60, 40);

  bg_texture = new THREE.TextureLoader().load(`${assets_base}backgrounds/${name}`)
  bg_texture.minFilter = THREE.LinearFilter;
  bg_texture.format = THREE.RGBFormat;

  var materialProperties = {
    side: THREE.BackSide,
    map: bg_texture
  };

  bg_material = new THREE.MeshBasicMaterial(materialProperties);

  bg_mesh = new THREE.Mesh(geometry, bg_material);

  scene.add(bg_mesh);
}

function nextVideoFactory(i) {
  return function() {
    showPane((i+1) % window.VIDEOS.length);
  };
}

function getVideo(i) {
  if (!window.VIDEOS[i].vidEl) {
    loadVideo(i);
  }
  return window.VIDEOS[i];
}

function loadVideo(i) {
  v = window.VIDEOS[i];

  $video_container = $('#video_container')[0];
  video_filename = v.vidFile;
  console.log('loading ' + video_filename);
  v.$vidEl = $(`
    <video class="video" crossorigin="anonymous" webkit-playsinline playsinline>
      <source src="${video_filename}" type='video/mp4'>
    </video>
  `);
  v.vidEl = v.$vidEl[0];
  v.$vidEl.on('ended', nextVideoFactory(i-1));
  $video_container.append(v.vidEl);

  v.vidTexture = new THREE.VideoTexture(v.vidEl);
  v.vidTexture.minFilter = THREE.LinearFilter;
  v.vidTexture.magFilter = THREE.LinearFilter;
  v.vidTexture.format = THREE.RGBFormat;
  v.translation = 0;

  var parameters = {
    color: 0xffffff,
    map: v.vidTexture
  };

  material = new THREE.MeshBasicMaterial(parameters);
  v.vidMaterial = material;

  v.mesh.material = v.vidMaterial;
}

function initVideoPanes() {
  var i, j, ox, oy, geometry;

  var angle = 0;
  var angle_increment = 2 * Math.PI / window.VIDEOS.length;

  for (var i = 0; i < window.VIDEOS.length; i++) {
    window.VIDEOS[i] = Object.assign({
      name: 'Intro',
      picFile: 'assets/01_intro_thumb.jpg',
      vidFile: 'assets/01_intro.mp4',
      vidEl: false,
      vidTexture: false,
      vidMaterial: false,
      vidTexture: false,
      transition: 0,
      angle: false,
      mesh: false,
      initialPosition: new THREE.Vector3()
    }, window.VIDEOS[i]);
    v = window.VIDEOS[i];
    v.picTexture = new THREE.TextureLoader().load(v.picFile);
    v.picTexture.minFilter = THREE.LinearFilter
    v.picTexture.format = THREE.RGBFormat

    geometry = new THREE.BoxGeometry(xsize, ysize, 1);
    v.picMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: v.picTexture
    });

    v.mesh = new THREE.Mesh(geometry, v.picMaterial);

    v.mesh.scale.x = v.mesh.scale.y = v.mesh.scale.z = 1;

    v.initialPosition.y = v.mesh.position.y = 0;
    v.initialPosition.x = v.mesh.position.x = -radius() * Math.sin(angle);
    v.initialPosition.z = v.mesh.position.z = radius() * Math.cos(angle);
    v.mesh.position.z;

    v.angle = -(angle + Math.PI);
    angle += angle_increment;

    scene.add(v.mesh);

    v.mesh.lookAt(origin);
  }
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  xsize = window.innerWidth * .9;
  ysize = xsize / aspect_ratio;

  translate_amount = xsize/2;
  translate_speed = xsize/20;

  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function showPane(i) {
  if (i >= window.VIDEOS.length) {
    console.warn(`tried to showPane(${i})`);
    i = 0;
  }

  v = getVideo(i);

  controls.rotateTo(v.angle, Math.PI/2, true);

  if (active_pane == i) {
    if (v.vidEl.paused) {
      v.vidEl.play();
    } else {
      v.vidEl.pause();
    }
    return;
  }

  movement = radius() / 3;

  if (active_pane >= 0) {
    a = window.VIDEOS[active_pane];
    z_dist = Math.sqrt((a.mesh.position.x - a.initialPosition.x)**2 + (a.mesh.position.z - a.initialPosition.z)**2);
    a.translation -= z_dist;
    a.vidEl.pause();
  }

  active_pane = i % window.VIDEOS.length;
  v.translation += movement;
  needs_play = active_pane;
}

var touch_start = {x: 0, y: 0, time: 0};
function onTouchStart(e) {
  e.clientX = e.touches[0].clientX;
  e.clientY = e.touches[0].clientY;
  onMousedown(e);
}

function onMousedown(e) {
  touch_start.x = e.clientX;
  touch_start.y = e.clientY;
  touch_start.time = new Date().getTime();
  window.clickTimeout = setTimeout(handleClick.bind(e), 2000);
}

function onTouchEnd(e) {
  e.clientX = e.touches[0].clientX;
  e.clientY = e.touches[0].clientY;
  onMouseup(e);
}

function onMouseup(e) {
  var now = new Date().getTime();
  var touchTime = now - touch_start.time;
  var dragDistance = Math.sqrt((e.clientX - touch_start.x)^2 + (e.clientY - touch_start.y)^2);
  window.clearTimeout(window.clickTimeout);
  if (touchTime > 500 && dragDistance < 10) {
    //hold
    e.preventDefault();
    handleClick(e);
  }
  if (dragDistance < 10) {
    //tap
    e.preventDefault();
    handleClick(e);
  }
}

function handleClick(e) {
  mouse.x = (e.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(e.clientY / renderer.domElement.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  meshes = window.VIDEOS.map(v => v.mesh);

  var intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    var match_idx = meshes.indexOf(intersects[0].object);
    showPane(match_idx);
  }
  touch_start = {x: 0, y: 0, time: 0};
}

function animate(new_time) {
  var delta = clock.getDelta();

  if (needs_play >= 0) {
    window.VIDEOS[needs_play].vidEl.play();
    needs_play = -1;
  }

  for (var i = 0; i < window.VIDEOS.length; i++) {
    var v = window.VIDEOS[i];
    if (v.translation > 0) {
      v.mesh.translateZ(translate_speed);
      v.translation = Math.max(0, v.translation - translate_speed);
    } else if (v.translation < 0) {
      v.mesh.translateZ(-translate_speed);
      v.translation = Math.min(0, v.translation + translate_speed);
    }
  }

  var needsUpdate = controls.update(Math.min(10, delta));

  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

function radius() {
  if (window.VIDEOS.length) {
    rad = xsize / (2 * Math.sin(Math.PI / window.VIDEOS.length));
  } else {
    rad = 0
  }
  return Math.max(rad, 300);
}
