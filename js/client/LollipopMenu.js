// todo: proper namespacing
var LollipopMenu = function(owner) {
  this.owner = owner
  this.worldPlane = new THREE.Plane(new THREE.Vector3(0,1,0),-this.owner.spriteYpos);
  this.selectionChanged = new signals.Signal(); // User selected icon (1-4) or deselected (0)
  this.shown = new signals.Signal; // Menu was shown
  this.hidden = new signals.Signal; // Menu was hidden

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
      fog: true,
      depthWrite : false
    }));
  }
  this.iconAngles = [];
  this.minAngle = -90;
  this.maxAngle = 90;
  var angleRange = this.maxAngle - this.minAngle;
  for (var i = 0; i < iconTexNames.length; ++i) {
    this.iconAngles.push((this.minAngle + i * angleRange/(iconTexNames.length-1)) * (Math.PI/180));
  }
  this.iconDist = 0.9;
  this.iconHeight = 0.2;
  this.lollipopScale = 40;
  this.iconScale = 30;
  this.iconSelectedScale = 35;
  
  this.scaleTween = 0;
  this.scaleTweenDir = 0;
  this.scaleTweenSpeed = 2.5;

  this.mouseDownX = 0;
  this.mouseDownY = 0;

  this.selection = 0; // 0 = none, 1 = photos, 2 = properties etc.
};

LollipopMenu.prototype = {
  onMouseDown : function(x, y) {
    this.mouseDownX = x;
    this.mouseDownY = y;
  },

  onMouseUp : function(x, y) {
    // Only show/hide menu if this is not a drag
    if (x == this.mouseDownX && y == this.mouseDownY) {
      if (!this.isShowing()) {
        var pos = this.planeRaycast(x, y);
        if (pos) {
          this.createMenu(pos);
        }
      }
      else {
        // Raycast to icons and perform selection, hide menu if none hit
        if (!this.doSelectionRaycast(x, y)) {
          this.startHideMenu();
        }
      }
    }
  },
  
  onMouseMove : function() {
    if (this.isShowing())
      this.updateIconPositions();
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
    spr.position.x = pos.x;
    spr.position.y = this.owner.spriteYpos;
    spr.position.z = pos.z;
    this.owner.add(spr);
    this.lollipopSprite = spr;

    for (var i = 0; i < this.iconMats.length; ++i) {
      var spr2 = new THREE.Sprite(this.iconMats[i]);
      spr2.scale.set(this.iconScale,this.iconScale,this.iconScale);
      spr2.position.copy(this.calculateIconPosition(i));
      spr2.selectionNumber = i+1;

      this.lollipopSprite.add(spr2);
      this.iconSprites.push(spr2);
    }
    this.setSelection(0);
    this.scaleTween = 0.1;
    this.scaleTweenDir = 1;
    this.updateScale(); // Set initial lollipop scale

    this.shown.dispatch();
  },

  startHideMenu : function() {
    this.scaleTweenDir = -1;
  },

  hideMenu : function() {
    if (!this.isShowing()) {
      return; // Not showing
    }

    for (var i = 0; i < this.iconSprites.length; ++i)
      this.lollipopSprite.remove(this.iconSprites[i]);
    this.iconSprites = [];
    this.owner.remove(this.lollipopSprite);
    this.lollipopSprite = null;
    this.setSelection(0);

    this.hidden.dispatch();
  },
  
  isShowing : function() {
    return this.lollipopSprite != null;
  },
  
  calculateIconPosition : function(i) {
    var iconPos = new THREE.Vector3(Math.sin(this.iconAngles[i])*this.iconDist,
      this.iconHeight + Math.cos(this.iconAngles[i])*this.iconDist, 0);
    iconPos.applyQuaternion(this.owner.world.camera.camera.getWorldQuaternion());
    return iconPos;
  },
  
  updateIconPositions : function() {
    for (var i = 0; i < this.iconSprites.length; ++i) {
      this.iconSprites[i].position.copy(this.calculateIconPosition(i));
    }
  },
  
  doSelectionRaycast : function(x, y) {
    var intersections = this.owner.doRaycast(x, y, this.iconSprites);
    for (var i = 0; i < intersections.length; ++i)
    {
      // If we raycast to already hit object, rather use the one that is unselected
      if (this.selection != intersections[i].object.selectionNumber) {
        this.setSelection(intersections[i].object.selectionNumber);
        break;
      }
    }
    return intersections.length > 0;
  },
  
  onTick : function(delta) {
    this.updateTween(delta);
    this.updateScale();
  },

  updateTween : function(delta) {
    if (this.lollipopSprite && this.scaleTweenDir != 0) {
      this.scaleTween += this.scaleTweenDir * this.scaleTweenSpeed * delta;
      if (this.scaleTween > 1) {
        this.scaleTween = 1;
        this.scaleTweenDir = 0;
      }
      if (this.scaleTween < 0) {
        this.scaleTween = 0;
        this.scaleTweenDir = 0;
        this.hideMenu();
      }
    }
  },

  updateScale : function() {
    if (this.lollipopSprite) {
      var s = this.lollipopScale * this.scaleTween;
      this.lollipopSprite.scale.set(s, s, s);
      // Update icon scales
      for (var i = 0; i < this.iconSprites.length; ++i) {
        if (this.iconSprites[i].selectionNumber == this.selection) {
          s = this.iconSelectedScale * this.scaleTween;
        }
        else {
          s = this.iconScale * this.scaleTween;
        }
        this.iconSprites[i].scale.set(s, s, s);
      }
    }
  },

  setSelection : function(newSel) {
    if (newSel != this.selection) {
      this.selection = newSel;
      this.updateScale();
      this.selectionChanged.dispatch(this.selection);
    }
  },
  
  getSelection : function() {
    return this.selection;
  }
}
