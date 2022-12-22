import { Application } from '../../common/engine/Application.js';
import { FirstPersonController } from '../../common/engine/FirstPersonController.js';

import { GLTFLoader } from './GLTFLoader.js';
import { Renderer } from './Renderer.js';


class App extends Application {

    async start() {
        this.loader = new GLTFLoader();
        await this.loader.load('../../common/models/scena/projekt.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera_Orientation');
        this.cube = await this.loader.loadNode('Cube');

        this.controller = new FirstPersonController(this.cube, this.gl.canvas);

        /*this.camera = new Node({
            position: [1, 1, 10]
        });
        this.camera.camera = new PerspectiveCamera();

        this.scene.addNode(this.camera);*/

        // Find first camera.
        /*this.camera = null;
        this.scene.traverse(node => {
            if (node instanceof Camera) {
                this.camera = node;
            }
        });

        this.camera.aspect = this.aspect;
        this.camera.updateProjection();
        this.renderer.prepare(this.scene);*/
        

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
    }

    update() {
            this.time = performance.now();
            const dt = (this.time - this.startTime) * 0.001;
            this.startTime = this.time;
    
            this.controller.update(dt);
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
