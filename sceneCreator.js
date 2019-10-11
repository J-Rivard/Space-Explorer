const path = require('path');
const { shell } = require('electron');
const { FileNavigator } = require('./FileNavigator.js');
const { TexturePack } = require('./TexturePack.js');
const { File } = require('./File.js');

// This block is various THREE objects used to control and display the scene
let camera;
let controls;
let scene;
let renderer;
let raycaster;
let mouse;

// This block consists of the texture loader and the different textures to be loaded
// We want to only do this once on init as it is an expensive process
let loader;
let neptuneMap;
let mercuryMap;
let starsMap;
let sunMap;

let selectedPlanet;
let sun;

// FileNavigator object to assist in moving around
let fn;
let texturePack;

const textures = ['space', 'balls', 'pool', 'faces'];
let textureCount = 1;

// A map of (planet mesh : file object) - needed for click events
const meshes = new Map();
let meshesToDelete = [];
let meshesToCreate = [];

// Right click menus
const fileMenu = document.getElementById('fileMenu');
const folderMenu = document.getElementById('folderMenu');

// Right click menu options
const copy = document.getElementById('copy');
const move = document.getElementById('move');
const paste = document.getElementById('paste');
const mkdir = document.getElementById('mkdir');
const touch = document.getElementById('touch');
const rm = document.getElementById('rm');

// Forms used for input from user
const moveForm = document.getElementById('moveForm');
const mkdirForm = document.getElementById('mkdirForm');
const touchForm = document.getElementById('touchForm');

// Adds events to any DOM elements that needs one
function addEvents() {
  // If ctrl + l is pressed, change to the next texture pack
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'l') {
      texturePack.changeTo(textures[textureCount % textures.length]);
      textureCount += 1;
      initTextures();
      clearScene();
      createObjects(fn.currentFiles);
    }
  });

  fileMenu.addEventListener('mouseleave', () => {
    toggleMenu('', 'file');
  });
  fileMenu.addEventListener('click', () => {
    toggleMenu('', 'file');
  });

  folderMenu.addEventListener('mouseleave', () => {
    toggleMenu('', 'folder');
  });
  folderMenu.addEventListener('click', () => {
    toggleMenu('', 'folder');
  });

  // On `Enter` it will move the selected file to the directory in the form
  moveForm.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      if (fn.move(selectedPlanet, moveForm.value)) {
        deleteObject(selectedPlanet);
      }
      toggleInput('', moveForm);
      toggleMenu('', 'file');
    }
  });

  // On `Enter` it will create a new folder with the name in the form
  mkdirForm.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const dirPath = fn.mkdir(mkdirForm.value);
      const file = new File(mkdirForm.value, dirPath, fn.getStats(dirPath));
      createObject(file, meshes.size);
      toggleInput('', mkdirForm);
    }
  });

  // On `Enter` it will create a new file with the name in the form
  touchForm.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const filePath = fn.touch(touchForm.value);
      const file = new File(touchForm.value, filePath, fn.getStats(filePath));
      createObject(file, meshes.size);
      toggleInput('', touchForm);
    }
  });

  copy.addEventListener('click', () => {
    fn.copy(selectedPlanet.fileName, selectedPlanet.filePath);
  });

  // Brings up the form for user input for move destination
  move.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleInput('show', moveForm);
    moveForm.focus();
  });

  paste.addEventListener('click', () => {
    const pasted = fn.paste();
    // If the paste wasn't successful, there was most likely already something with the same name
    if (pasted) {
      const file = new File(pasted.name, pasted.path, fn.getStats(pasted.path));
      createObject(file, meshes.size);
    }
  });

  // Brings up the form for user input for folder name
  mkdir.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleInput('show', mkdirForm);
    mkdirForm.focus();
  });

  // Brings up the form for user input for file name
  touch.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleInput('show', touchForm);
    touchForm.focus();
  });

  rm.addEventListener('click', () => {
    fn.rm(selectedPlanet);
    deleteObject(selectedPlanet);
  });

  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('resize', onWindowResize, false);
  window.requestAnimationFrame(render);

  document.addEventListener('dblclick', doubleClick, false);
  document.addEventListener('contextmenu', rightClick, false);
  // Hide all forms if a mouse event happens
  document.addEventListener('mousedown', () => {
    toggleInput('', moveForm);
    toggleInput('', mkdirForm);
    toggleInput('', touchForm);
  });
}

// Main entry point for initializing all needed files and assets
function init() {
  // Setup the camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 500;
  // Setup raycaster and mouse for events
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Create a file navigator object to keep track of where we are and to
  // perform file operations
  fn = new FileNavigator();
  texturePack = new TexturePack('space');

  initTextures();
  initControls();
  initLights();
  initRenderer();
  createObjects(fn.currentFiles);

  render();
}

// Sets up the texture maps - this should be a 1 time operation
function initTextures() {
  loader = new THREE.TextureLoader();
  neptuneMap = loader.load(texturePack.fileTexture);
  mercuryMap = loader.load(texturePack.folderTexture);
  starsMap = loader.load(texturePack.backgroundTexture);
  sunMap = loader.load(texturePack.backTexture);

  scene.background = starsMap;
}

// Sets up the mouse controls for moving around in 3d space
function initControls() {
  controls = new THREE.TrackballControls(camera);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 1.5;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.keys = [65, 83, 68];
  controls.addEventListener('change', render);
}

function initLights() {
  const light = new THREE.AmbientLight(0xffdcb5);
  scene.add(light);
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

// Clears all planets from the scene
function clearScene() {
  // Clear the map so we don't waste space
  meshes.clear();
  // Must iterate backwards when deleting scene children
  for (let i = scene.children.length - 1; i >= 0; i -= 1) {
    // Only remove mesh objects so we dont delete the camera/lights
    if (scene.children[i].type === 'Mesh') {
      scene.remove(scene.children[i]);
    }
  }
}

// Deletes a single instance of a planet from meshes map and the scene
function deleteObject(file) {
  for (let i = scene.children.length - 1; i >= 0; i -= 1) {
    if (file === meshes.get(scene.children[i])) {
      meshesToDelete.push(scene.children[i]);
      break;
    }
  }
}

// Creates planets based on the current directory
function createObjects(files) {
  clearScene();
  const prevDirectory = fn.updateDirectory(fn.cwd, undefined, false);
  createSun(prevDirectory);

  const size = files.length;
  for (let i = 0; i < size; i += 1) {
    // If it is a hidden file, keep it that way
    if (files[i][0] === '.') continue;

    // Create a File object with the name, path, and stats
    const filePath = path.join(fn.cwd, files[i]);
    const file = new File(files[i], filePath, fn.getStats(filePath));
    createObject(file, size);
  }
}

// Creates a singular object based off of the file and the # of files
// The more files, the more spread out
function createObject(file, size) {
  // Which texture used is determined by if its a file or directory
  const map = file.stats.isDirectory ? mercuryMap : neptuneMap;
  // The size is a log of the files size, or 2 if the size is 0
  const radius = Math.max(Math.log(file.stats.size), 2);

  const geometry = new THREE.SphereBufferGeometry(radius, 32, 32);
  const material = new THREE.MeshLambertMaterial({ map });
  const mesh = new THREE.Mesh(geometry, material);

  // Set the scale initially to 0 so we can animate it up to 1
  mesh.scale.x = 0.01;
  mesh.scale.y = 0.01;
  mesh.scale.z = 0.01;

  mesh.position.x = generateRandom(size);
  mesh.position.y = generateRandom(size);
  mesh.position.z = generateRandom(size);

  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);
  // Add our planet and file to the map
  meshes.set(mesh, file);
  meshesToCreate.push(mesh);
}

// Creates a sun with the previous working directory as it's destination
function createSun(pwd) {
  const geometry = new THREE.SphereBufferGeometry(75, 32, 32);
  const material = new THREE.MeshLambertMaterial({ map: sunMap });
  const mesh = new THREE.Mesh(geometry, material);

  const file = new File(pwd, pwd, { isDirectory: true });
  sun = mesh;
  scene.add(mesh);
  meshes.set(mesh, file);
}

// Used to keep track of mouse location
function onMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  controls.handleResize();
  render();
}

function animate() {
  requestAnimationFrame(animate);

  rotateAnimation(meshes);
  meshesToCreate = createAnimation(meshesToCreate);
  meshesToDelete = deleteAnimation(meshesToDelete);

  render();
  controls.update();
}

function render() {
  renderer.render(scene, camera);
}

// Rotates everything currently in the map
function rotateAnimation(meshMap) {
  meshMap.forEach((file, mesh) => {
    mesh.rotation.x += Math.random() / 1000;
    mesh.rotation.y += Math.random() / 100;
    mesh.updateMatrix();
  });
}

// Expands the planet until it is full size
// Returns the array of new planets to be made
function createAnimation(createArray) {
  createArray.forEach((mesh) => {
    if (mesh.scale.x < 1) {
      mesh.scale.x += 0.025;
      mesh.scale.y += 0.025;
      mesh.scale.z += 0.025;
    } else {
      createArray = createArray.filter(item => item !== mesh);
    }
  });
  return createArray;
}

// Shrinks the planets queued to be deleted until they are of size 0
// Then they are truly deleted. Returns the new array
function deleteAnimation(deleteArray) {
  deleteArray.forEach((mesh) => {
    if (mesh.scale.x > 0) {
      mesh.scale.x -= 0.025;
      mesh.scale.y -= 0.025;
      mesh.scale.z -= 0.025;
    } else {
      scene.remove(mesh);
      meshes.delete(mesh);
      deleteArray = deleteArray.filter(item => item !== mesh);
    }
  });
  return deleteArray;
}

// Generate random number based on size of file
function generateRandom(size) {
  let num = Math.random() * (size * 5) + 100;
  num *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
  return num;
}

// Used to get the first object intersected
// This is triggered by an event
function getIntersectingObject() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    return meshes.get(intersect.object);
  }

  return undefined;
}

function doubleClick() {
  const selectedFile = getIntersectingObject();
  // If there was no intersected file, return
  if (!selectedFile) return;

  if (selectedFile.stats.isDirectory) {
    fn.moveTo(selectedFile.filePath);
    createObjects(fn.currentFiles);
  } else {
    shell.openItem(selectedFile.filePath);
  }

  render();
}

function rightClick(event) {
  const selectedFile = getIntersectingObject();
  if (selectedFile === meshes.get(sun)) return;
  // If there was no intersected file, return
  if (!selectedFile) {
    setPosition({ left: event.pageX, top: event.pageY }, 'folder');
    return;
  }

  setPosition({ left: event.pageX, top: event.pageY }, 'file');
  selectedPlanet = selectedFile;

  updateStats(selectedFile);
}

// Used to hide/show the right click menu
const toggleMenu = (command, menuType) => {
  if (menuType === 'file') {
    fileMenu.style.display = command === 'show' ? 'block' : 'none';
  } else {
    folderMenu.style.display = command === 'show' ? 'block' : 'none';
  }
};

// Used to hide/show input forms and clear its contents
const toggleInput = (command, form) => {
  form.value = '';
  form.style.display = command === 'show' ? 'block' : 'none';
};

// Used to set the position of the right click menu based on mouse pos.
const setPosition = ({ top, left }, menuType) => {
  if (menuType === 'file') {
    fileMenu.style.left = `${left}px`;
    fileMenu.style.top = `${top}px`;
  } else {
    folderMenu.style.left = `${left}px`;
    folderMenu.style.top = `${top}px`;
  }
  toggleMenu('show', menuType);
};

// Updates the HTML in top left describing right clicked file
// Parameter is a File object
function updateStats(file) {
  const statList = document.getElementById('statList');
  statList.innerHTML = '';

  const fileName = document.createElement('li');
  fileName.innerText = file.fileName;
  statList.appendChild(fileName);

  const size = document.createElement('li');
  size.innerText = `${file.stats.size} KB`;
  statList.appendChild(size);

  const dates = file.formatDates();

  const created = document.createElement('li');
  created.innerText = `Created at: ${dates.createdDate}`;
  statList.appendChild(created);

  const modified = document.createElement('li');
  modified.innerText = `Last modified: ${dates.modifiedDate}`;
  statList.appendChild(modified);
}

addEvents();
init();
animate();
