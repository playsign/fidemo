// todo: proper namespacing
var LollipopMenu = function(owner) {
  this.owner = owner
  this.worldPlane = new THREE.Plane(new THREE.Vector3(0,1,0),-this.owner.spriteYpos);
  this.iconSelected = new signals.Signal();
  this.shown = new signals.Signal;
  this.hidden = new signals.Signal;

  this.lollipopSprite = null;
  this.iconSprites = [];

  this.lollipopMat = owner.pinMaterialBus; // todo: replace with proper material
  this.iconMats = [];
  var iconTexNames = [
    "data/2d/icon_photos.png",
    "data/2d/icon_properties.png",
    "data/2d/icon_services.png",
    "data/2d/icon_transportation.png"
  ];
  for (var i = 0; i < iconTexNames.length; ++i) {
    this.iconMats.push(new THREE.SpriteMaterial({
      map: THREE.ImageUtils.loadTexture(iconTexNames[i]),
      color: 0x000000, // Images black for now to make them stand out from totally white city
      fog: true
    }));
  }
  this.iconAngles = [];
  this.minAngle = -90;
  this.maxAngle = 90;
  var angleRange = this.maxAngle - this.minAngle;
  for (var i = 0; i < iconTexNames.length; ++i) {
    this.iconAngles.push((this.minAngle + i * angleRange/(iconTexNames.length-1)) * (Math.PI/180));
  }
  this.mouseDownX = 0;
  this.mouseDownY = 0;
};

LollipopMenu.prototype = {
  onMouseDown : function(x, y) {
    this.mouseDownX = x;
    this.mouseDownY = y;
  },

  onMouseUp : function(x, y) {
    // Only show menu if this is not a drag
    if (!this.isShowing() && x == this.mouseDownX && y == this.mouseDownY) {
      var pos = this.planeRaycast(x, y);
      if (pos) {
        this.createMenu(pos);
      }
    }
    else {
      this.hideMenu();
    }
  },

  planeRaycast : function(x, y) {
    var vector = new THREE.Vector3(x, y, 1);
    vector.unproject(this.owner.world.camera.camera);
    var pLocal = new THREE.Vector3(0, 0, -1);
    var pWorld = pLocal.applyMatrix4(this.owner.world.camera.camera.matrixWorld);
    var ray = new THREE.Ray(pWorld, vector.sub(pWorld).normalize());
    var intersectPoint = ray.intersectPlane(this.worldPlane, null);
    return intersectPoint;
  },

  createMenu : function(pos) {
    if (this.isShowing()) {
      return; // Already showing
    }

    var spr = new THREE.Sprite(this.lollipopMat);
    spr.scale.set(40,40,40);
    spr.position.x = pos.x;
    spr.position.y = this.owner.spriteYpos;
    spr.position.z = pos.z;
    this.owner.add(spr);
    this.lollipopSprite = spr;

    var iconDist = 35;
    var iconHeight = 10;
    for (var i = 0; i < this.iconMats.length; ++i)
    {
      var iconPosWorld = new THREE.Vector3(Math.sin(this.iconAngles[i])*iconDist, iconHeight + Math.cos(this.iconAngles[i])*iconDist, 0);
      iconPosWorld.applyQuaternion(this.owner.world.camera.camera.getWorldQuaternion());
      iconPosWorld.add(spr.position);

      var spr2 = new THREE.Sprite(this.iconMats[i]);
      spr2.scale.set(30,30,30);
      spr2.position.copy(iconPosWorld);
      this.owner.add(spr2);
      this.iconSprites.push(spr2);
    }


    this.shown.dispatch();
  },

  hideMenu : function() {
    if (!this.isShowing()) {
      return; // Not showing
    }
    
    this.owner.remove(this.lollipopSprite);
    for (var i = 0; i < this.iconSprites.length; ++i)
      this.owner.remove(this.iconSprites[i]);
    this.lollipopSprite = null;
    this.iconSprites = [];

    this.hidden.dispatch();
  },
  
  isShowing : function() {
    return this.lollipopSprite != null;
  }
}
