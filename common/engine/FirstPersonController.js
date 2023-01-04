import { quat, vec3, mat4 } from '../../lib/gl-matrix-module.js';

export class FirstPersonController {

    constructor(node, domElement) {
        this.node = node;
        this.domElement = domElement;
        this.timeOverlay = false;

        this.keys = {};

        this.pitch = 0;
        this.yaw = 0;

        this.checkpoints =  [false, false, false, false];

        this.velocity = [0, 0, 0];
        this.acceleration = 10;
        this.maxSpeed = 9;
        this.decay = 0.9;
        this.pointerSensitivity = 0.002;
        this.speed = 0;
        this.lap = 1;
        
        // 0 = w; 1 = s
        this.zadnja = 0;

        this.initHandlers();
    }

    initHandlers() {
        //this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);

        /*element.addEventListener('click', e => element.requestPointerLock());
        doc.addEventListener('pointerlockchange', e => {
            if (doc.pointerLockElement === element) {
                doc.addEventListener('pointermove', this.pointermoveHandler);
            } else {
                doc.removeEventListener('pointermove', this.pointermoveHandler);
            }
        });*/
    }

    update(dt, speedNode, timeNode, collision, lapNode) {
        // Calculate forward and right vectors.
        const cos = Math.cos(this.yaw);
        const sin = Math.sin(this.yaw);
        const right = [-sin, 0, -cos];
        const forward = [cos, 0, -sin];
        const twopi = Math.PI * 2;

        // Map user input to the acceleration vector.
        const acc = vec3.create();
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
            this.zadnja = 1;
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
            this.zadnja = 0;
        }
        if (this.keys['KeyD'] && !this.zadnja && this.speed > 0.8) {
            this.yaw += this.maxSpeed * this.pointerSensitivity;
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
        }
        if (this.keys['KeyA'] && !this.zadnja && this.speed > 0.8) {
            this.yaw -= this.maxSpeed * this.pointerSensitivity;
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
        }
        if (this.keys['KeyA'] && this.zadnja && this.speed > 0.8) {
            this.yaw += this.maxSpeed * this.pointerSensitivity;
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
        }
        if (this.keys['KeyD'] && this.zadnja && this.speed > 0.8) {
            this.yaw -= this.maxSpeed * this.pointerSensitivity;
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
        }

        // Update velocity based on acceleration.
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

        // If there is no user input, apply decay.
        if (!this.keys['KeyW'] && !this.keys['KeyS']) {
            this.decayF(dt);
        }
        
        if(collision){
            this.decayF(dt);
        }


        // Limit speed to prevent accelerating to infinity and beyond.
        this.speed = vec3.length(this.velocity);

        if (this.speed > this.maxSpeed) {
            vec3.scale(this.velocity, this.velocity, this.maxSpeed / this.speed);
        }

        // Update translation based on velocity.
        let newVector = vec3.scaleAndAdd(vec3.create(), this.node.translation, this.velocity, dt);
        if(newVector[0] > -45 && newVector[0] < 63 && newVector[2] < 45 && newVector[2] > -65){
            this.node.translation = newVector; 
        }
        else{
            this.speed0();
        }

        if(newVector[0] > 24 && newVector[0] < 29.5 && newVector[2] < -24 && newVector[2] > -26){
            this.checkpoints[0] = true;
        }
        if(this.checkpoints[0] && newVector[0] > -3 && newVector[0] < 0 && newVector[2] < -14.5 && newVector[2] > -20){
            this.checkpoints[1] = true;
        }
        if(this.checkpoints[1] && newVector[0] > -17 && newVector[0] < -15 && newVector[2] < -27 && newVector[2] > -32){
            this.checkpoints[2] = true;
        }
        if(this.checkpoints[2] && newVector[0] > 3.35 && newVector[0] < 10 && newVector[2] < 3 && newVector[2] > -2.5){
            this.checkpoints[3] = true;
        }
        if(this.checkpoints.every(v => v === true)){
            this.checkpoints =  [false, false, false, false];
            if(this.lap == 1){
                this.lap++;
                lapNode.nodeValue = this.lap + "/2";
            }
            else {
                console.log(timeNode.nodeValue);
            }
        }
        
        //checkpoints
        
        // Update rotation based on the Euler angles.
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        this.node.rotation = rotation;
        speedNode.nodeValue = (this.speed * 10).toFixed(0);
        if (!this.timeOverlay){
            if(this.speed > 0){
                this.timeOverlay = true;
                this.overlayTime = performance.now();
            }
        }
        else{
            const time = (performance.now() - this.overlayTime) * 0.001
            if(time >= 60){
                timeNode.nodeValue = (Math.floor(time / 60)).toFixed(0) + "min " + (time % 60).toFixed(2) + "s";
            }
            else {
                timeNode.nodeValue = (time).toFixed(2) + "s";
            }
        }
    }

    speed0(){
        //this.velocity = [this.velocity[0] / 2, this.velocity[1] / 2, this.velocity[2] / 2];
        this.speed = 0;
    }

    decayF(dt){
        const decay = Math.exp(dt * Math.log(1 - this.decay));
        vec3.scale(this.velocity, this.velocity, decay);
    }

    pointermoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;
        this.pitch -= dy * this.pointerSensitivity;
        this.yaw   -= dx * this.pointerSensitivity;

        const pi = Math.PI;
        const twopi = pi * 2;
        const halfpi = pi / 2;

        // Limit pitch so that the camera does not invert on itself.
        if (this.pitch > halfpi) {
            this.pitch = halfpi;
        }
        if (this.pitch < -halfpi) {
            this.pitch = -halfpi;
        }

        // Constrain yaw to the range [0, pi * 2]
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

}
