var container;
var camera, scene, renderer, controls, clock, raycaster, mouse;

var origin = new THREE.Vector3();
var up_vec = new THREE.Vector3(0, 1, 0);

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var video_els = [];
var meshes = [];
var materials = [];
var textures = [];

var bg_mesh;
var bg_material;
var bg_texture;

var angles = [];
var translations = [];

var needs_play = -1;
var active_pane = -1;

var assets_base = 'assets/';
var num_videos = 11;

var aspect_ratio = 16/9;
var xsize = window.innerWidth * .9;
var ysize = xsize / aspect_ratio;
var radius = xsize / (2 * Math.sin(Math.PI / num_videos));

var translate_amount = xsize/2;
var translate_speed = xsize/20;

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, radius*2);
  camera.position.y = 0.01;

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

  initVideoBackground('earth.mp4');
  initVideoContent('serious');

  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('click', onClick, false);
  window.addEventListener('touchstart', onTouchStart, false);
  window.addEventListener('touchstart', onTouchEnd, false);

  animate();
}

function initVideoBackground(name) {
  $videoBG_container = $('#video_background')[0];
  var video_element = $(`
    <video id="video_bg" loop autoplay muted webkit-playsinline playsinline crossorigin="anonymous" style="display:none">
      <source src="${assets_base}background/${name}">
    </video>
  `)[0];
  $videoBG_container.append(video_element);

  var geometry = new THREE.SphereBufferGeometry(radius * 1.1, 60, 40);

  var bg_video = document.getElementById('video_bg');

  bg_texture = new THREE.VideoTexture(bg_video);
  bg_texture.minFilter = THREE.LinearFilter;
  bg_texture.format = THREE.RGBFormat;

  bg_material = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    map: bg_texture
  });

  bg_mesh = new THREE.Mesh(geometry, bg_material);

  scene.add(bg_mesh);
}

function nextVideoFactory(i) {
  return function() {
    showPane((i+1) % num_videos);
  };
}

function initVideoContent(category) {
  $video_container = $('#video_container')[0];
  for (var i = 1; i <= num_videos; i++) {
    video_filename = `${assets_base}content/${category}/${i}.mp4`;
    console.log(video_filename);
    $myEl = $(`
      <video class="video" crossorigin="anonymous" webkit-playsinline playsinline style="display:none">
        <source src="${video_filename}" type='video/mp4'>
      </video>
    `);
    $myEl.on('ended', nextVideoFactory(i-1));
    $video_container.append($myEl[0]);
  }

  videos = document.querySelectorAll('.video');
  textures = []
  videos.forEach((a_video) => {
    my_texture = new THREE.VideoTexture(a_video);
    my_texture.minFilter = THREE.LinearFilter;
    my_texture.magFilter = THREE.LinearFilter;
    my_texture.format = THREE.RGBFormat;
    textures.push(my_texture);
    video_els.push(a_video);
    translations.push(0);
  });

  var i, j, ox, oy, geometry;

  var angle = 0;
  var angle_increment = 2 * Math.PI / num_videos;

  for (var i = 0; i < num_videos; i++) {
    var parameters = {
      color: 0xffffff,
      map: textures[i]
    };

    geometry = new THREE.BoxGeometry(xsize, ysize, 1);
    material = new THREE.MeshBasicMaterial(parameters);
    materials[i] = material;

    mesh = new THREE.Mesh(geometry, material);

    mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;

    mesh.position.y = 0;
    mesh.position.x = -radius * Math.sin(angle);
    mesh.position.z = radius * Math.cos(angle);

    //console.log(i, mesh.position.x, mesh.position.z, angle / Math.PI, mesh.rotation.y)

    angles[i] = -(angle + Math.PI);
    angle += angle_increment;

    scene.add(mesh);

    mesh.lookAt(origin);

    meshes[i] = mesh;
  }
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  xsize = window.innerWidth * .9;
  ysize = xsize / aspect_ratio;
  radius = xsize / (2 * Math.sin(Math.PI / num_videos));

  translate_amount = xsize/2;
  translate_speed = xsize/20;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function showPane(i) {
  if (i >= video_els.length) {
    console.warn(`tried to showPane(${i})`);
    i = 0;
  }

  var targetAngle = angles[i];
  controls.rotateTo(targetAngle, Math.PI/2, true);

  if (active_pane == i) {
    if (video_els[i].paused) {
      video_els[i].play();
    } else {
      video_els[i].pause();
    }
    return;
  }

  if (active_pane >= 0) {
    translations[active_pane] -= translate_amount;
    video_els[active_pane].pause();
  }

  active_pane = i % video_els.length;
  translations[active_pane] += translate_amount;
  needs_play = active_pane;
}

var touch_start = {x: 0, y: 0};
function onTouchStart(e) {
  touch_start.x = e.touches[0].clientX;
  touch_start.y = e.touches[0].clientY;
}

function onTouchEnd(e) {
  if (Math.sqrt((e.touches[0].clientX - touch_start.x)^2 + (e.touches[0].clientY - touch_start.y)^2) < 10) {
    e.clientX = e.touches[0].clientX;
    e.clientY = e.touches[0].clientY;
    onClick(e);
  }
}

function onClick(e) {
  e.preventDefault();

  mouse.x = ((e.clientX || e.touches[0].clientX) / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -((e.clientY || e.touches[0].clientY) / renderer.domElement.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    var match_idx = meshes.indexOf(intersects[0].object);
    showPane(match_idx);
  }

  // Parse all the faces
  //for ( var i in intersects ) {
  //  intersects[ i ].face.material[ 0 ].color.setHex( Math.random() * 0xffffff | 0x80000000 );
  //}
}

function animate(new_time) {
  var delta = clock.getDelta();

  if (needs_play >= 0) {
    video_els[needs_play].play();
    needs_play = -1;
  }

  for (var i = 0; i < num_videos; i++) {
    if (translations[i] > 0) {
      meshes[i].translateZ(translate_speed);
      translations[i] = Math.max(0, translations[i] - translate_speed);
    } else if (translations[i] < 0) {
      meshes[i].translateZ(-translate_speed);
      translations[i] = Math.min(0, translations[i] + translate_speed);
    }
  }

  var needsUpdate = controls.update(Math.min(10, delta));

  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

