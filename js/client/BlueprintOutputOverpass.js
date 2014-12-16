/* globals window, _, VIZI */
(function() {
  "use strict";

  /**
   * Blueprint overpass output
   */

  VIZI.BlueprintOutputOverpass = function(options) {
    var self = this;

    VIZI.BlueprintOutput.call(self, options);

    _.defaults(self.options, {});

    // Triggers and actions reference
    self.triggers = [{
        name: "initialised",
        arguments: []
      },
      {
        name: "requestUpdatePath",
        arguments: []
      }
    ];
    
    self.actions = [{
        name: "outputOverpass",
        arguments: ["overpass"]
      }
    ];

    self.world;
    
    self.pins = [];

    // MODELS & MATERIALS

    self.modelYpos = 10;
    self.spriteYpos = 40;

    // Pin sprite material
    var pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_cafe.png");
    self.pinMaterialCafe = new THREE.SpriteMaterial({
      map: pinMap,
      color: 0xffffff,
      fog: true
    });
    
    pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_bar.png");
    self.pinMaterialBar = new THREE.SpriteMaterial({
      map: pinMap,
      color: 0xffffff,
      fog: true
    });
    
    pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_restaurant.png");
    self.pinMaterialRestaurant = new THREE.SpriteMaterial({
      map: pinMap,
      color: 0xffffff,
      fog: true
    });

    pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_shop.png");
    self.pinMaterialShop = new THREE.SpriteMaterial({
      map: pinMap,
      color: 0xffffff,
      fog: true
    });

    pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_public.png");
    self.pinMaterialLibrary = new THREE.SpriteMaterial({
      map: pinMap,
      color: 0xffffff,
      fog: true
    });
    
       pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_hospital.png");
    self.pinMaterialHealthcare = new THREE.SpriteMaterial({
      map: pinMap,
      color: 0xffffff,
      fog: true
    });
  };

  VIZI.BlueprintOutputOverpass.prototype = Object.create(VIZI.BlueprintOutput.prototype);

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputOverpass.prototype.init = function() {
    var self = this;

    //requestOverpassData is called also when receiving new long lat position from lollipopmenu (onLollipopPositionChanged)
    self.emit("requestOverpassData");	
    if(self.options.globalData.lollipopMenu != null)
        self.options.globalData.lollipopMenu.positionChanged.add(self.onLollipopPositionChanged, self);
  };

  VIZI.BlueprintOutputOverpass.prototype.outputOverpass = function(data) {
    var self = this;
    for (var i = 0; i <= data.length; i++) {
      if (data[i] === undefined) {
        continue;
      }
      var objectLongitude = data[i].coordinates[1];
      var objectLatitude = data[i].coordinates[0];
      var objectName = "overpass";
      var objectDescription = [];
      for (var variable in data[i]) {
        if (!data[i][variable]) {
          continue;
        }
        objectDescription.push(variable + ": " + data[i][variable]);
      }
      var type = "";
      
      if(data[i].tags["amenity"] != null)
        type = data[i].tags["amenity"];
        else  if(data[i].tags["shop"] != null)
        type = "shop";
      var objectId = data[i].node;
      
      self.createOverpass(objectLatitude, objectLongitude, objectName, objectDescription, objectId, type);
    }
  };

  VIZI.BlueprintOutputOverpass.prototype.createOverpass = function(lat, lon, name, desc, uuid, type) {
    var self = this;

    for(var pin in self.pins)
    {
        if(self.pins[pin].uuid == uuid)
        {
            self.pins[pin].visible = true;
            return;
        }
    }
    var pin = undefined;

    if(type == "cafe")
        pin = new THREE.Sprite(self.pinMaterialCafe);
    else if(type == "bar")
        pin = new THREE.Sprite(self.pinMaterialBar);
    else if(type == "restaurant")
        pin = new THREE.Sprite(self.pinMaterialRestaurant);
    else if(type == "library" || type == "school" || type == "university" || type == "college" || type == "kindergarten")
        pin = new THREE.Sprite(self.pinMaterialLibrary);
    else if(type == "hospital")
        pin = new THREE.Sprite(self.pinMaterialHealthcare);
    else if(type == "shop")
        pin = new THREE.Sprite(self.pinMaterialShop);
    
    if (pin === undefined)
    {
      console.warn("Pin type", type, "not supported");
      return;
    }

    pin.scale.set(25, 25, 25);

    pin.name = name;
    pin.description = desc;
    pin.uuid = uuid;

    var dgeocoord = new VIZI.LatLon(lat, lon);
    var dscenepoint = self.world.project(dgeocoord);

    pin.position.x = dscenepoint.x;
    pin.position.y = self.spriteYpos;
    pin.position.z = dscenepoint.y;

    pin.index = self.pins.length;

    self.pins[pin.index] = pin;

    self.add(pin);
  };
 
    VIZI.BlueprintOutputOverpass.prototype.hideAllPins = function() {
    var self = this;
    for(var pin in self.pins)
        self.pins[pin].visible = false;
  };
 
  VIZI.BlueprintOutputOverpass.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
  
    VIZI.BlueprintOutputOverpass.prototype.onLollipopPositionChanged = function(latLong) {
        var self = this;
        self.hideAllPins();
        self.options.globalData.currentPos = latLong;
        self.emit("requestUpdatePath"); //send info to BlueprintInputData to update path
        self.emit("requestOverpassData");		
   };

 }());
