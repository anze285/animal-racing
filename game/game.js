import { Application } from '../../common/engine/Application.js';
import { FirstPersonController } from '../../common/engine/FirstPersonController.js';

import { GLTFLoader } from './GLTFLoader.js';
import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';


class App extends Application {

    async start() {
        this.collision = false;
        this.loader = new GLTFLoader();
        await this.loader.load('../../common/models/scena/road.gltf');
        
        //Overlay
        this.set_up_overlay();
        this.load_audio();

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
        this.controller.update(dt, this.speedNode, this.timeNode, this.collision, this.lapNode, this.stats, this.finishTimeNode, this.lap1Node, this.lap2Node);
        this.collision = this.physics.update(dt);
        this.car_audio.volume = Math.max(Math.min(this.controller.speed * 0.05, 1), 0.05);
        if(this.controller.sound_on){
            this.car_audio.play();
            this.ambient_audio.play();
            this.controller.sound_on = false;
        }
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

    set_up_overlay(){
        this.timeElement = document.querySelector("#time");
        this.speedElement = document.querySelector("#speed");
        this.lapElement = document.querySelector("#lap");
        this.stats = document.querySelector("#overlay2");
        this.finishTimeElement = document.querySelector("#finishTime");
        this.lap1Element = document.querySelector("#lap1time");
        this.lap2Element = document.querySelector("#lap2time");
        this.lap1Node = document.createTextNode("");
        this.lap2Node = document.createTextNode("");
        this.timeNode = document.createTextNode("0s");
        this.finishTimeNode = document.createTextNode("0s");
        this.speedNode = document.createTextNode("0");
        this.lapNode = document.createTextNode("1/2");
        this.lap1Element.appendChild(this.lap1Node);
        this.lap2Element.appendChild(this.lap2Node);
        this.finishTimeElement.appendChild(this.finishTimeNode);
        this.timeElement.appendChild(this.timeNode);
        this.speedElement.appendChild(this.speedNode);
        this.lapElement.appendChild(this.lapNode);
    }

    load_audio(){
        this.car_audio = new Audio('../../common/audio/acceleration-sound.wav');
        this.car_audio.loop = true;
        this.ambient_audio = new Audio('../../common/audio/ambient_sound.wav');
        this.ambient_audio.volume = 0.5;
        this.ambient_audio.loop = true;
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();
