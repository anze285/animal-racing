import { Application } from '../../common/engine/Application.js';
import { FirstPersonController } from '../../common/engine/FirstPersonController.js';

import { GLTFLoader } from './GLTFLoader.js';
import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';


class App extends Application {

    async start() {
        this.loader = new GLTFLoader();
        await this.loader.load('../../common/models/scena/road.gltf');
        //Overlay
        this.timeElement = document.querySelector("#time");
        this.speedElement = document.querySelector("#speed");
        this.timeNode = document.createTextNode("0");
        this.speedNode = document.createTextNode("0");
        this.timeElement.appendChild(this.timeNode);
        this.speedElement.appendChild(this.speedNode);

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera_Orientation');
        this.cube = await this.loader.loadNode('Cube');

        this.controller = new FirstPersonController(this.cube, this.gl.canvas);
        

        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();

        this.startTime = performance.now();
        this.overlayTime = this.startTime;
        this.physics = new Physics(this.scene, this.controller);
    }

    update() {
        this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;
        this.controller.update(dt, this.speedNode, this.timeNode);
        this.physics.update(dt);
    }

    render() {
            this.renderer.render(this.scene, this.camera);
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;

        if (this.camera) {
            this.camera.camera.aspect = aspectRatio;
            this.camera.camera.updateMatrix();
        }
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();
