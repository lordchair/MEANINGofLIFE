var container;
var camera, scene, renderer;
var composer;

var mouseX = 0;
var mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var meshes = [], materials = [], textures = [];

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  var xsize = 480;
  var ysize = 204;
  var radius = xsize;

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.x = 0;
  camera.position.z = 0;
  camera.position.y = 0;

  scene = new THREE.Scene();

  var light = new THREE.PointLight(0xffffff);
  light.position.set(0, 0, 1).normalize();
  scene.add(light);

  renderer = new THREE.WebGLRenderer({antialias: false});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  videos = document.querySelectorAll('.video');
  textures = []
  videos.forEach((a_video) => {
    my_texture = new THREE.VideoTexture(a_video);
    my_texture.minFilter = THREE.LinearFilter;
    my_texture.magFilter = THREE.LinearFilter;
    my_texture.format = THREE.RGBFormat;
    textures.push(my_texture);
  });

  var i, j, ox, oy, geometry;

  var angle = 0;
  var angle_increment = 2 * Math.PI / textures.length;

  for (var i = 0; i < textures.length; i++) {
    var parameters = {
      color: 0xffffff,
      map: textures[i]
    };

    geometry = new THREE.BoxGeometry(xsize, ysize, 1);
    material = new THREE.MeshLambertMaterial(parameters);
    materials[i] = material;

    mesh = new THREE.Mesh(geometry, material);

    mesh.position.x = radius * Math.cos(angle);
    mesh.position.z = radius * Math.sin(angle);
    mesh.position.y = 0;

    mesh.lookAt(camera.position);

    console.log(i, mesh.position.x, mesh.position.z, angle / Math.PI, mesh.rotation.y)

    angle += angle_increment;

    mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;

    scene.add(mesh);

    meshes[i] = mesh;
  }




  renderer.autoClear = false;

  document.addEventListener('mousemove', onDocumentMouseMove, false);

  // postprocessing

  var renderModel = new THREE.RenderPass(scene, camera);
  var effectBloom = new THREE.BloomPass(1.3);
  var effectCopy = new THREE.ShaderPass(THREE.CopyShader);

  effectCopy.renderToScreen = true;

  composer = new THREE.EffectComposer(renderer);

  composer.addPass(renderModel);
  composer.addPass(effectBloom);
  composer.addPass(effectCopy);

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.reset();
}

function onDocumentMouseMove(event) {
  mouseX = ( event.clientX - windowHalfX );
  mouseY = ( event.clientY - windowHalfY ) * 0.3;
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 0;

  //camera.lookAt(scene.position);
  camera.rotation.y = mouseX / windowHalfX * Math.PI * 1.5;

  for (var i = 0; i < meshes.length; i++) {
    meshes[i].lookAt(camera.position);
  }

  renderer.clear();
  composer.render();
}

