// todo: proper namespacing

var lollipopMenu;

var LollipopMenu = function(owner) {
  lollipopMenu = this;
  this.owner = owner;
  this.worldPlane = new THREE.Plane(new THREE.Vector3(0,1,0),-this.owner.spriteYpos);
  this.selectionChanged = new signals.Signal(); // User selected icon (1-4) or deselected (0)
  this.positionChanged = new signals.Signal(); // new position
  this.shown = new signals.Signal; // Menu was shown
  this.hidden = new signals.Signal; // Menu was hidden

  this.lollipopSprite = null;
  this.iconSprites = [];

  this.lollipopMat = owner.pinMaterialFocus; // todo: replace with proper material
  this.iconMats = [];
  var iconTexNames = [
    "data/2d/icon_photos.png",
    "data/2d/icon_properties.png",
    "data/2d/icon_services.png",
    "data/2d/icon_transportation.png"
  ];
  for (var i = 0; i < iconTexNames.length; ++i) {
    this.iconMats.push(
      new THREE.SpriteMaterial({
        map: THREE.ImageUtils.loadTexture(iconTexNames[i]),
        color: "rgb(255,255,255)",
        fog: true,
        depthWrite : false,
      })
    );
  }
  
  this.iconAngles = [];
  this.minAngle = -90;
  this.maxAngle = 90;
  var angleRange = this.maxAngle - this.minAngle;
  for (var i = 0; i < iconTexNames.length; ++i) {
    this.iconAngles.push((this.minAngle + i * angleRange/(iconTexNames.length-1)) * (Math.PI/180));
  }
  this.iconDist = 0.9;
  this.iconHeight = 0.35;
  this.lollipopScale = 40;
  this.iconScale = 30;
  this.iconSelectedScale = 35;
  this.newPosThreshold = 20; // Clicking closer than this (in world coords) will close instead of moving to new pos
  
  this.hoverTweenSpeed = 4.5;
  this.hoverSelection = 0;
  
  this.scaleTween = 0;
  this.scaleTweenDir = 0;
  this.scaleTweenSpeed = 1.0;

  this.mouseDownX = 0;
  this.mouseDownY = 0;

  this.avatarMoveDelay = 1.0;
  
  // Helsinki issue objects
  this.issueItems = {};
  this.issueIconMaterials = {};
  this.issueIconMaterials.open = new THREE.SpriteMaterial({
    map: THREE.ImageUtils.loadTexture(IssueItem.Icons.OPEN),
    color: "rgb(216,136,0)",
    fog: true,
    depthWrite : false
  });
  this.issueIconMaterials.inprogress = new THREE.SpriteMaterial({
    map: THREE.ImageUtils.loadTexture(IssueItem.Icons.INPROGRESS),
    color: "rgb(216,136,0)",
    fog: true,
    depthWrite : false
  });
  this.issueIconMaterials.closed = new THREE.SpriteMaterial({
    map: THREE.ImageUtils.loadTexture(IssueItem.Icons.CLOSED),
    color: "rgb(216,136,0)",
    fog: true,
    depthWrite : false
  });
  this.issueIconMaterials.unknown = new THREE.SpriteMaterial({
    map: THREE.ImageUtils.loadTexture(IssueItem.Icons.UNKNOWN),
    color: "rgb(216,136,0)",
    fog: true,
    depthWrite : false
  });
  this.issueInstances = [];

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
		 this.sendPositionChanged(pos);
		}
      }
      else {
        // Raycast to icons and perform selection, hide/reopen menu if none hit
        if (!this.doSelectionRaycast(x, y) &&
            !this.doIconRaycast(x, y)) {
          var pos = this.planeRaycast(x, y);
          var distVec = new THREE.Vector3();
          distVec.subVectors(pos, this.lastShowPos);
          var dist = distVec.length();
          if (dist > this.newPosThreshold) {
            this.createMenu(pos);
			this.sendPositionChanged(pos);
          }
          else {
            this.startHideMenu();
          }
        }
      }
    }
  },
  
  sendPositionChanged: function(pos)
  {
	var point = new VIZI.Point(pos.x, pos.y);
	var w = this.owner.options.globalData.world;
	var latLong = w.unproject(point, w.zoom);
	this.positionChanged.dispatch(latLong);
  },
  
  onMouseMove : function(x, y) {
    if (this.isShowing()){
      this.updateIconPositions();
      this.doHoverRaycast(x, y);
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
  
  getIssueMaterial: function(status){
      if (status == "open")
          return this.issueIconMaterials.open;
      else if(status == "inprogress")
          return this.issueIconMaterials.inprogress;
      else if(status == "closed")
          return this.issueIconMaterials.closed;
      else
          return this.issueIconMaterials.unknown;
  },
  
  doIconRaycast : function(x, y) {
    var intersections = this.owner.doRaycast(x, y, this.issueInstances);
    for (var i = 0; i < intersections.length; ++i)
    {
      //console.log(intersections[i]);
      this.openDialog(intersections[i].object.item);
    }
    return intersections.length > 0;
  },
  
  openDialog: function(item) {
    var self = this;
    var image_str = "";
    var i = item;
    if (item.media != null)
        image_str = "<img src='" + item.media + "' alt='Mountain View' style='width:auto;height:220px;'>";
    $("body").append("<div id='" + item.id + "' title='" + item.header + "'>" +
                     "<p>" + item.description + "</p>" + image_str +
                     "</div>");
    
    this.currentDialog = $("#" + item.id).dialog({
          width: 500,
          height: "auto",
          close: function(ev, ui) {
            self.closeDialog(i);
          }
        });
  },
  
  closeDialog: function(item) {
    $("#" + item.id).remove();
    this.currentDialog = null;  
  },
  
  createIssueIcons: function() {
      var world = this.owner.options.globalData.world;
      var item = null;
      var sprite = null;
      
      for (var i in this.issueItems)
      {
          item = this.issueItems[i];
          sprite = new THREE.Sprite(this.getIssueMaterial(item.status));
          sprite.scale.set(20, 20, 20);
          sprite.position.copy(world.project(item.latLon, world.zoom));
          sprite.position.set(sprite.position.x, 60, sprite.position.y);
          sprite.item = item;
          this.issueInstances.push(sprite);
          this.owner.add(sprite);
      }
  },
  
  removeIssueIcons: function() {
      this.issueItems = {};
      for(var i in this.issueInstances)
          this.owner.remove(this.issueInstances[i]);
      this.issueInstances = [];
  },

  createMenu : function(pos) {
    if (this.isShowing()) {
        this.hideMenu(); // If already showing, hide the old first
    }

    if (this.owner.options.globalData != null && this.owner.options.globalData.world != null)
    {
        var point = new VIZI.Point(pos.x, pos.z);
        var w = this.owner.options.globalData.world;
        var latLong = w.unproject(point, w.zoom);
        var that = this;
        this.removeIssueIcons();
        
        var callback = function(result) {
            var item = null;
            for(var i in result) {
                item = result[i];
                if (item instanceof IssueItem) {
                    that.issueItems[item.id] = item;
                }
            }
            that.createIssueIcons();
            
            that = null;
        };
        HelsinkiIssues.RequestIssues(latLong.lat, latLong.lon, 300, callback);
    }

    // Animate the circle to new position
    if (this.owner.options.globalData != null && this.owner.options.globalData.animator != null)
	{
		this.owner.options.globalData.animator.SetPosition(pos);
	}

    this.lastShowPos = pos;

    // Move user's avatar to the position where the menu is going to open
    if (userPresence)
      userPresence.sendPositionUpdate(pos, this.avatarMoveDelay);

    // The central "lollipop" is actually redundant if user has an avatar
    // in that case create just a bare scene node
    var spr;
    if (userPresence && userPresence.entity)
        spr = new THREE.Object3D();
    else
        spr = new THREE.Sprite(this.lollipopMat);

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
      spr2.hoverTween = 0.0;
      
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
  
  doHoverRaycast : function(x, y) {
    var intersections = this.owner.doRaycast(x, y, this.iconSprites);
    this.hoverSelection = -1;
    if(intersections.length != 0){
      this.hoverSelection = intersections[0].object.selectionNumber - 1;
    }
    return this.hoverSelection;
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
    if (this.lollipopSprite){
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
      
      for (var i = 0; i < this.iconSprites.length; ++i) {
        var dir = i == this.hoverSelection ? 1.0 : -1.0;
        this.iconSprites[i].hoverTween = Math.max(0, Math.min(1.0, this.iconSprites[i].hoverTween + dir * this.hoverTweenSpeed * delta));
      }
    }
  },
  
  easeInOutQuad : function (t) {
    return t<.5 ? 2*t*t : -1+(4-2*t)*t 
  },
  
  updateScale : function() {
    if (this.lollipopSprite) {
      //center icon
      var t = Math.min(0.33333, this.scaleTween)*3.0;
      var icontween = this.easeInOutQuad(t);
      var iconscl = (6.5) - (5.5* icontween);
      var s = iconscl*this.lollipopScale * icontween;
      this.lollipopSprite.scale.set(s, s, s);
    
      //Update icon scales
      var num = this.iconSprites.length;
      var step = 1.0 / num;
      var start = 0.5; 
      var totaldelay = start + 0.25*num*step;
      var delaystep = (1.0 / (1.0 - totaldelay));
    
      for (var i = 0; i < this.iconSprites.length; ++i) {
    
        var delay = start + 0.25*i*step;
        t = (this.scaleTween - delay) * delaystep;
        t = Math.max( 0.0, Math.min( 1.0, t) );
        
        var tween = this.easeInOutQuad(t);
        var hoverscl = this.easeInOutQuad(this.iconSprites[i].hoverTween) * 0.5;
        var sclfactor = hoverscl + ((4.5) - (3.5* tween));
      
        if (this.iconSprites[i].selectionNumber == this.selection) {
          s = sclfactor * this.iconSelectedScale * tween;
        }
        else {
          s = sclfactor * this.iconScale * tween;
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
