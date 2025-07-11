import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

let models_directory = '/models/';
let textures_directory = '/textures/';

export function loadOBJ(file_obj, callback) 
{
    const loader = new OBJLoader();

    loader.load(
        models_directory + file_obj,
        (obj) => {
            callback(obj);
        }
    );
}

export function loadTexture(file_texture, callback) 
{
    let textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        textures_directory + file_texture,
        (texture) => {
            callback(texture);
        }
    );
}

export function loadGLBModel(file_glb, callback) {
  let loader = new GLTFLoader();
  loader.load(
    models_directory + file_glb,
    (gltf) => {
      callback(gltf.scene);
    }
  );
}
