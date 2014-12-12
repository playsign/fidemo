"use strict";

var BuildingAnimation = function() {
    this.clock = new THREE.Clock();
    this.radius = 300.0;
    this.speed = 0.75;
    this.delay = 0.35;
    this.animState = 0.0;
    this.animState2 = 0.0;
    this.animState3 = 0.0;
    this.ambientColor = new THREE.Vector3(0.6, 0.6, 0.6);
    this.ambientColor2 = new THREE.Vector3(1.0,1.0,1.0);
    
    this.material = new THREE.ShaderMaterial( {
        uniforms: {
            mouseposition: { type: "v3", value: new THREE.Vector3(0.0, 0.0, 0.0) },
            ambientColor: { type: "v3", value: new THREE.Vector3(1.0, 1.0, 1.0)},
            gradientColor1: { type: "v4", value: new THREE.Vector4(1.0,0.0,0.0,0.0)},
            gradientColor2: { type: "v4", value: new THREE.Vector4(0.0,1.0,0.0,0.5)},
            gradientColor3: { type: "v4", value: new THREE.Vector4(0.0,0.0,1.0,1.0)},
            animScaleUp: { type: "f", value: 5.0 },
            animScaleBlast: { type: "f", value: 5.0 },
            radiusMultiplier: { type: "f", value: 0.01 }
        },
        vertexColors: THREE.VertexColors,
        vertexShader: (document.getElementById( 'vs-generic-effect' ).textContent),
        fragmentShader: (document.getElementById( 'fs-effect' ).textContent)
    } );
};

BuildingAnimation.prototype = {
    
    Reset: function() {
        this.animState = 0.0;
        this.animState2 = 0.0;
        this.animState3 = 0.0;
    },
    
    Update: function(frameTime){
        var delta = frameTime;
        
        this.animState = Math.max(0.0,Math.min(1.0, this.animState + delta * this.speed));
        this.animState2 = this.animState2 + delta * this.speed;

        var canimState2 = Math.max(0.0,Math.min(1.0, this.animState2 - this.delay));
        this.animState3 = this.animState3 + delta * this.speed * 0.5;
        
        var anim = this.animState < 0.5 ? 2 * this.animState * this.animState : -1 + (4 - 2 * this.animState) * this.animState;
        var anim2 = canimState2 < 0.5 ? 2 * canimState2 * canimState2 : -1 + (4 - 2 * canimState2) * canimState2;
        var radius = 1.0  / (this.radius * anim);

        this.material.uniforms.animScaleUp.value = anim2;
        //this.material.uniforms.animscale2.value = anim;
        this.material.uniforms.animScaleBlast.value = 1.0  / ((1150.0 + this.animState3 * 1000) * this.animState3);
        this.material.uniforms.radiusMultiplier.value = radius;

        //var testsin = (Math.sin(this.animState3) + 1.0) * 0.5;
        //material.uniforms.ambientColor.value = this.ambinetColor.lerp(this.ambinetColor2, testsin);
        this.material.uniforms.ambientColor.value = this.ambientColor;
    },
    
    SetPosition: function(position) {
        this.material.uniforms.mouseposition.value = position;
        this.Reset();
    }
};