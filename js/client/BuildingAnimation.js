"use strict";

var BuildingAnimation = function() {
    this.clock = new THREE.Clock();
    this.radius = 300.0;
    this.speed = 0.75;
    this.delay = 0.35;
    this.animRadius = 1.0;
    this.animScale = 1.0;
    this.animBlast = 1.0;
    
    this.material = new THREE.ShaderMaterial( {
        uniforms: {
            mouseposition: { type: "v3", value: new THREE.Vector3(0.0, 0.0, 0.0) },
            
            
            //light blue overlay, white buildings
            litColor: { type: "c", value: new THREE.Color("rgb(244,240,231)")},
            shadowColor: { type: "c", value: new THREE.Color("rgb(182,212,227)")},
            ambientColor: { type: "c", value: new THREE.Color("rgb(149,158,163)")},
            
            gradientColor1: { type: "v4", value: new THREE.Vector4(1.0,1.0,1.0,0.0)},
            gradientColor2: { type: "v4", value: new THREE.Vector4(1.0,1.0,1.0,0.5)},
            gradientColor3: { type: "v4", value: new THREE.Vector4(1.0,1.0,1.0,1.0)},
            animScaleUp: { type: "f", value: 0.0 },
            animScaleBlast: { type: "f", value: 0.0 },
            radiusMultiplier: { type: "f", value: 0.0 },
        },
        vertexColors: THREE.VertexColors,
        vertexShader: (document.getElementById( 'vs-generic-effect' ).textContent),
        fragmentShader: (document.getElementById( 'fs-effect' ).textContent)
    } );
};

BuildingAnimation.prototype = {
    
    Reset: function() {
        this.animRadius = 0.0;
        this.animScale = 0.0;
        this.animBlast = 0.0;
    },
    
    Update: function(frameTime){
        var delta = frameTime;
        
        this.animRadius = Math.max(0.0,Math.min(1.0, this.animRadius + delta * this.speed));
        var radiusTween = this.animRadius < 0.5 ? 2 * this.animRadius * this.animRadius : -1 + (4 - 2 * this.animRadius) * this.animRadius;
        var radius = 1.0  / (this.radius * radiusTween);
        this.material.uniforms.radiusMultiplier.value = radius;
     
        this.animScale = this.animScale + delta * this.speed;
        var animScaleState = Math.max(0.0,Math.min(1.0, this.animScale - this.delay));
        var scaleTween = animScaleState < 0.5 ? 2 * animScaleState * animScaleState : -1 + (4 - 2 * animScaleState) * animScaleState;
        this.material.uniforms.animScaleUp.value = scaleTween;
       
        this.animBlast = this.animBlast + delta * this.speed * 1.0;
        this.material.uniforms.animScaleBlast.value = 1.0  / ((1150.0 + this.animBlast * 1000) * this.animBlast);
    },
    
    SetPosition: function(position) {
        this.material.uniforms.mouseposition.value = position;
        this.Reset();
    }
};