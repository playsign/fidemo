"use strict";

var BuildingAnimation = function() {
  this.clock = new THREE.Clock();
  this.radius = 300.0;
  this.speed = 0.75;
  this.delay = 0.35;
  this.animRadius = 1.0;
  this.animScale = 1.0;
  this.animBlast = 1.0;
  this.animCost = 0.0;
  this.animDir = 1.0;
  this.animate = true;
  this.showHeatmap = false;
  this.enableHeatmap = false;
  this.mousePos = new THREE.Vector3(0,0,0);
  this.prevMousePos = new THREE.Vector3(0,0,0);
  
  this.litColorDefault = new THREE.Color("rgb(234,230,221)");
  this.shadowColorDefault = new THREE.Color("rgb(172,202,217)");
  this.ambientColorDefault = new THREE.Color("rgb(149,158,163)");
  this.gradientColor1Default = new THREE.Vector4(1.0,1.0,1.0,0.0);
  this.gradientColor2Default = new THREE.Vector4(1.0,1.0,1.0,0.5);
  this.gradientColor3Default = new THREE.Vector4(1.0,1.0,1.0,1.0);

  //Colors when heatmap is enabled
  this.litColorCost = new THREE.Color("rgb(255,255,255)");
  this.shadowColorCost = new THREE.Color("rgb(155,155,155)");
  this.ambientColorCost = new THREE.Color("rgb(44,44,44)");
  var mult = 1.25;
  this.gradientColor1Cost = new THREE.Vector4(0.4*mult, 0.4*mult, 0.4*mult , 0.0); // no data available - gray
  this.gradientColor2Cost = new THREE.Vector4(0.498*mult, 0.835*mult, 0.192*mult , 0.0); // green - hex 7fd531
  this.gradientColor3Cost = new THREE.Vector4(0.91*mult, 0.286*mult, 0.067*mult , 0.05);// red - hex ea4911

  this.material = new THREE.ShaderMaterial( {
    uniforms: {
      mouseposition: { type: "v3", value: new THREE.Vector3(0.0, 0.0, 0.0) },
      
      
      //light blue overlay, white buildings
      litColor: { type: "c", value: this.litColorDefault},
      shadowColor: { type: "c", value: this.shadowColorDefault},
      ambientColor: { type: "c", value: this.ambientColorDefault},
      
      gradientColor1: { type: "v4", value: this.gradientColor1Default},
      gradientColor2: { type: "v4", value: this.gradientColor2Default},
      gradientColor3: { type: "v4", value: this.gradientColor3Default},
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
    this.animCost = 0.0;
  },
  
  ResetAnimated: function() {
    this.animDir = -1.0;
    this.material.uniforms.mouseposition.value = this.prevMousePos;
    this.animate = true;
    this.animCost = Math.max(0.0, Math.min(1.0, this.animCost));
    this.prevMousePos = this.mousePos;
  },
  
  Update: function(frameTime){
    
    var delta = frameTime;

    var animDelta = this.animDir < 0 ? delta * this.speed*2.0 * this.animDir : delta * this.speed * this.animDir;
    if(this.animate){
      
      this.animRadius = Math.max(0.0,Math.min(1.0, this.animRadius + animDelta));
      var radiusTween = this.animRadius < 0.5 ? 2 * this.animRadius * this.animRadius : -1 + (4 - 2 * this.animRadius) * this.animRadius;
      var radius = 1.0  / (this.radius * radiusTween);
      this.material.uniforms.radiusMultiplier.value = radius;
   
      this.animScale = this.animScale + animDelta;
      var animScaleState = Math.max(0.0,Math.min(1.0, this.animScale - this.delay));
      var scaleTween = animScaleState < 0.5 ? 2 * animScaleState * animScaleState : -1 + (4 - 2 * animScaleState) * animScaleState;
      this.material.uniforms.animScaleUp.value = scaleTween;
      
      //forward animation done
      if( (this.animScale >= 1.0) && (this.animRadius >= 1.0 )){
        this.material.uniforms.mouseposition.value = this.mousePos;
        this.animate = false;
        
      }
      //reverse animation done
      else if( (this.animScale <= 0.0) && (this.animRadius <= 0.0 )){
        this.showHeatmap = this.enableHeatmap;
        
        this.animBlast = 0.0;
        this.animDir = 1.0;
        this.prevMousePos = this.mousePos;
        this.material.uniforms.mouseposition.value = this.mousePos;
        
      }     
           
    }
    if((this.showHeatmap == true && this.animDir > 0.0) || this.animDir <= 0.0){
      this.AnimateCostGradient(animDelta);
    } 
    this.animBlast = this.animBlast + delta * this.speed * 1.0;
    this.material.uniforms.animScaleBlast.value = 1.0  / ((1150.0 + this.animBlast * 1000) * this.animBlast);

  },

  AnimateCostGradient: function(frameTime) {
    this.animCost = Math.max(0.0, this.animCost + frameTime * this.speed);
    
    if(this.animCost < 1.0){
      var tween = this.animCost;
      var tween = tween*tween*tween;
      tween = Math.max(0.0, Math.min(1.0, tween));
      var litColor = this.litColorDefault.clone();
      litColor.lerp(this.litColorCost, tween);
      this.material.uniforms.litColor.value = litColor;
      
      var shadowColor = this.shadowColorDefault.clone();
      shadowColor.lerp(this.shadowColorCost, tween);
      this.material.uniforms.shadowColor.value = shadowColor;
      
      var ambientColor = this.ambientColorDefault.clone();
      ambientColor.lerp(this.ambientColorCost, tween);
      this.material.uniforms.ambientColor.value = ambientColor;
      
      var color1 = this.gradientColor1Default.clone();
      color1.lerp(this.gradientColor1Cost, tween);
      this.material.uniforms.gradientColor1.value = color1;
      
      var color2 = this.gradientColor2Default.clone();
      color2.lerp(this.gradientColor2Cost, tween);
      this.material.uniforms.gradientColor2.value = color2;
      
      var color3 = this.gradientColor3Default.clone();
      color3.lerp(this.gradientColor3Cost, tween);
      this.material.uniforms.gradientColor3.value = color3;
    }
  },
  
  EnableHeatmap: function(enabled) {
    this.enableHeatmap = enabled;
  },
  
  SetPosition: function(position) {
    this.prevMousePos = this.mousePos;
    this.ResetAnimated();
    this.mousePos = position;
    
  }
};