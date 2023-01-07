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
        this.acceleration = 100;
        this.maxSpeed = 3;
        this.decay = 0.9;
        this.pointerSensitivity = 0.002;
        this.speed = 0;
        this.lap = 1;
        this.zadnja = 0;
        this.timeOfPlay = 0;
        this.tt2 = false;
        this.lap1time = 1;
        this.lap2time = 2;

        this.initHandlers();
    }

    initHandlers() {
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);
    }


    update(dt, speedNode, timeNode, collision, lapNode, stats, finishTimeNode, lap1Node, lap2Node) {
        // Calculate forward and right vectors.
        const cos = Math.cos(this.yaw);
        const sin = Math.sin(this.yaw);
        const right = [-sin, 0, -cos];
        const forward = [cos, 0, -sin];
        const twopi = Math.PI * 2;

        // Map user input to the acceleration vector.
        const acc = vec3.create();
        if(this.lap < 3){
            if (this.keys['KeyW'] || this.keys['ArrowUp']) {
                vec3.add(acc, acc, forward);
                this.zadnja = 1;
            }
            if (this.keys['KeyS'] || this.keys['ArrowDown']) {
                vec3.sub(acc, acc, forward);
                this.zadnja = 0;
            }
        }
        if ((this.keys['KeyD'] || this.keys['ArrowRight']) && !this.zadnja && this.speed > 0.8) {
            this.yaw += this.speed * this.pointerSensitivity;
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
        }
        if ((this.keys['KeyA'] || this.keys['ArrowLeft']) && !this.zadnja && this.speed > 0.8) {
            this.yaw -= this.speed * this.pointerSensitivity;
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
        }
        if ((this.keys['KeyA'] || this.keys['ArrowLeft']) && this.zadnja && this.speed > 0.8) {
            this.yaw += this.speed * this.pointerSensitivity;
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
        }
        if ((this.keys['KeyD'] || this.keys['ArrowRight']) && this.zadnja && this.speed > 0.8) {
            this.yaw -= this.speed * this.pointerSensitivity;
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
        }

        // Update velocity based on acceleration.
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

        // If there is no user input, apply decay.
        if (!this.keys['KeyW'] && !this.keys['KeyS'] || this.lap > 2) {
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
        } else {
            this.speed0();
        }


        this.powerChange(newVector, timeNode);
        this.checkCheckPoints(newVector, lapNode, timeNode, stats, lap1Node, lap2Node);

        // Update rotation based on the Euler angles.
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        this.node.rotation = rotation;

        this.timeDisplay(timeNode, speedNode, finishTimeNode);
    }



    speed0(){
        this.speed = 0;
    }


    decayF(dt){
        const decay = Math.exp(dt * Math.log(1 - this.decay));
        vec3.scale(this.velocity, this.velocity, decay);
    }


    powerChange(newVector, timeNode) {
        let powerDown = false;
        if ((newVector[0] > 25.5 && newVector[0] < 27.5 && newVector[2] > -9    && newVector[2] < -7) ||
            (newVector[0] > -9.5 && newVector[0] < -7.5 && newVector[2] > -25.5 && newVector[2] < -23.5)) {
            
            powerDown = true;
        }


        if ((newVector[0] > -16 && newVector[0] < -13 && newVector[2] > -2  && newVector[2] < 0.4) ||
            (newVector[0] >  18 && newVector[0] <  21 && newVector[2] < -29 && newVector[2] > -32.5) || powerDown) {

            if (powerDown) {
                if (this.maxSpeed > 3) {
                    this.maxSpeed -= 1;
                }
            } else {
                if (this.maxSpeed < 25) {
                    this.maxSpeed += 1;
                }
            }


            this.timeOfPlay = timeNode.nodeValue.substr(0, timeNode.nodeValue.length-1);
            this.timeOfPlay++;
            this.tt2 = true;
        }

        if (this.tt2 && timeNode.nodeValue.substr(0, timeNode.nodeValue.length-1) > this.timeOfPlay) {
            this.tt2 = false;
        }
    }


    timeDisplay(timeNode, speedNode, finishTimeNode) {
        speedNode.nodeValue = (this.speed * 10).toFixed(0);
        if (!this.timeOverlay){
            if(this.speed > 0){
                this.timeOverlay = true;
                this.sound_on = true;
                this.overlayTime = performance.now();
            }
        }
        else{
            if(this.lap < 3){
                this.time = (performance.now() - this.overlayTime) * 0.001
                if(this.time >= 60){
                    timeNode.nodeValue = (Math.floor(this.time / 60)).toFixed(0) + "min " + (this.time % 60).toFixed(2) + "s";
                    finishTimeNode.nodeValue = (Math.floor(this.time / 60)).toFixed(0) + "min " + (this.time % 60).toFixed(2) + "s";
                }
                else {
                    timeNode.nodeValue = (this.time).toFixed(2) + "s";
                    finishTimeNode.nodeValue = (this.time).toFixed(2) + "s";
                }
            }
        }
    }


    checkCheckPoints(newVector, lapNode, timeNode, stats, lap1Node, lap2Node) {
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
            this.lap++;
            if(this.lap == 2){
                this.lap1time = Math.floor(this.time*100)/100;
                lapNode.nodeValue = this.lap + "/2";
                if(this.lap1time >= 60){
                    lap1Node.nodeValue = (Math.floor(this.lap1time / 60)).toFixed(0) + "min " + (this.lap1time % 60).toFixed(2) + "s";
                }
                else {
                    lap1Node.nodeValue = (this.lap1time).toFixed(2) + "s";
                }
            }
            else {
                this.lap2time = Math.floor(this.time*100)/100 - this.lap1time;
                if(this.lap2time >= 60){
                    lap2Node.nodeValue = (Math.floor(this.lap2time / 60)).toFixed(0) + "min " + (this.lap2time % 60).toFixed(2) + "s";
                }
                else {
                    lap2Node.nodeValue = (this.lap2time).toFixed(2) + "s";
                }
                stats.className = "";
            }
        }
    }


    keydownHandler(e) {
        this.keys[e.code] = true;
    }


    keyupHandler(e) {
        this.keys[e.code] = false;
    }

}
