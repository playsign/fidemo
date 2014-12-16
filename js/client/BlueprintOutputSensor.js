/* globals window, _, VIZI */
(function() {
  "use strict";

  // Adapted from https://github.com/HSLdevcom/navigator-proto/blob/master/src/routing.coffee#L40
  var intepretJoreCode = function(routeId)
  {
    // Note that the order of checks here is important and acts as a precedence.
    if (routeId.match(/^1019/))
      return { mode : "FERRY", routeType : 4, route : "Ferry" };
    else if (routeId.match(/^1300/))
      return { mode : "SUBWAY", routeType : 1, route : routeId.substring(4, 5) };
    else if (routeId.match(/^300/))
      return { mode : "RAIL", routeType : 2, route : routeId.substring(4, 5) };
    else if (routeId.match(/^10(0|10)/))
      return { mode : "TRAM", routeType : 0, route : "" + (parseInt(routeId.substring(2, 4))) };
    else if (routeId.match(/^(1|2|4).../))
      return { mode : "BUS", routeType : 3, route : "" + (parseInt(routeId.substring(1))) };
    else // unknown, assume bus
      return { mode : "BUS", routeType : 3, route : routeId };
  };

  /**
   * Blueprint sensor output
   * @author Tapani Jämsä - playsign.net
   */

  VIZI.BlueprintOutputSensor = function(options) {
    var self = this;

    VIZI.BlueprintOutput.call(self, options);

    _.defaults(self.options, {});

    // Triggers and actions reference
    self.triggers = [{
        name: "initialised",
        arguments: []
      }
    ];

    self.actions = [{
        name: "outputSensor",
        arguments: ["sensor"]
      }
    ];

    // POI

    self.mouse = {
      x: 0,
      y: 0
    };

    self.raycastsEnabled = true;

    self.pois = {};
    self.poisArray = [];

    // listeners
    document.addEventListener('mousemove', self.onDocumentMouseMove.bind(self), false);
    document.addEventListener('mousedown', self.onDocumentMouseDown.bind(self), false);
    document.addEventListener('mouseup', self.onDocumentMouseUp.bind(self), false);
    document.addEventListener('mousewheel', self.setDialogPosition.bind(self), false);


    // MODELS & MATERIALS

    self.modelYpos = 10;
    self.spriteYpos = 20;

    var jsonLoader = new THREE.JSONLoader();
    self.assetPaths = {
      lightbulb: 'data/3d/lightbulb.js',
      thermometer: 'data/3d/thermometer.js',
      arrow: 'data/3d/arrow.js',
      bus: 'data/2d/bussi.png',
      tram: 'data/2d/ratikka.png',
      metro: 'data/2d/metro.png',
    };

    self.modelCount = 0;

    // Lightbulb model
    jsonLoader.load(self.assetPaths.lightbulb, self.loadLightbulbModel.bind(self));

    // Thermometer model
    jsonLoader.load(self.assetPaths.thermometer, self.loadThermometerModel.bind(self));

    // Arrow model
    jsonLoader.load(self.assetPaths.arrow, self.loadArrowModel.bind(self));


    // Bus image
    self.busImg = new Image();
    self.busImg.src = self.assetPaths.bus;
    self.busImg.onload = function() {
      self.updateModelCount();
    };

    // Tram image
    self.tramImg = new Image();
    self.tramImg.src = self.assetPaths.tram;
    self.tramImg.onload = function() {
      self.updateModelCount();
    };

    // Metro image
    self.metroImg = new Image();
    self.metroImg.src = self.assetPaths.metro;
    self.metroImg.onload = function() {
      self.updateModelCount();
    };

    var pinMap = THREE.ImageUtils.loadTexture("data/2d/pointer.png");
    self.pinMaterialFocus = new THREE.SpriteMaterial({
      map: pinMap,
      color: "rgb(216,136,0)",
      fog: true
    });
    
    // INTERPOLATION

    self.interpolations = [];
    self.updatePeriod_ = 9; // 1 / 20; // seconds
    // self.avgUpdateInterval = 0;
    // self.lerpClock = new THREE.Clock();
  };

  VIZI.BlueprintOutputSensor.prototype = Object.create(VIZI.BlueprintOutput.prototype);

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputSensor.prototype.init = function() {
    var self = this;

    self.emit("initialised");

    // Lollipop menu
    self.lollipopMenu = new LollipopMenu(self);
    self.lollipopMenu.selectionChanged.add(self.onLollipopSelectionChanged, self);
    self.options.globalData.lollipopMenu = self.lollipopMenu;
  };

  VIZI.BlueprintOutputSensor.prototype.outputSensor = function(data) {
    var self = this;

    for (var i = 0; i <= data.length; i++) {
      if (data[i] === undefined) {
        continue;
      }

      var boxLongitude = data[i].coordinates[1];
      var boxLatitude = data[i].coordinates[0];
      var boxName = "Sensor";
      var boxDescription = [];
      for (var variable in data[i]) {
        if (!data[i][variable]) {
          continue;
        }
        boxDescription.push(variable + ": " + data[i][variable]);
      }
      var boxId = data[i].node;

      if (data[i].categories) {
        boxName = data[i].lineref;
        self.createPin(boxLatitude, boxLongitude, boxName, boxDescription, boxId, data[i].name, data[i].bearing); // 'name' is a vehicle ID
      } else if (data[i].light) {
        var lux = parseFloat(data[i].light, 10);
        self.createLightbulb(boxLatitude, boxLongitude, boxName, boxDescription, boxId, lux);
      } else {
        self.createThermometer(boxLatitude, boxLongitude, boxName, boxDescription, boxId);
      }
    }
    // self.createThermometer(88);
    // self.createThermometer(39);
    // self.createThermometer(51);
    // self.createThermometer(79);
    // self.createThermometer(82);
    // self.createThermometer(81);
    // self.createThermometer(80);
    // self.createThermometer(94);
    // self.createThermometer(78);
    // self.createThermometer(7);
    // self.createThermometer(70);

    // LAMPS
    // for (var i = 10000; i <= 10015; i++) {
    //   self.createSensor(i);
    // }

    // self.emit("sensorReceived", data);

  };

  // TODO: rename
  VIZI.BlueprintOutputSensor.prototype.createPin = function(lat, lon, name, desc, uuid, vehicleId, bearing) {
    var self = this;

    var dgeocoord = new VIZI.LatLon(lat, lon);
    var dscenepoint = self.world.project(dgeocoord);
    if (self.pois[vehicleId]) {
      // UPDATE
      var newTransfrom = {
        position: new THREE.Vector3( dscenepoint.x, self.spriteYpos, dscenepoint.y )
        // TODO rotation and scale
      };
      self.handleTransformUpdate(self.pois[vehicleId], newTransfrom);
      if (bearing) {
        self.pois[vehicleId].arrow.rotation.set(THREE.Math.degToRad(180), THREE.Math.degToRad(bearing), 0);
      }
    } else {
      // CREATE NEW
      var pin = new THREE.Object3D();
      
      // Sprite
      var pinSprite = self.makePinSprite(name);
      // pinSprite.translateX(12);
      pinSprite.translateY(25);

      pin.name = name;
      pin.description = desc;
      pin.uuid = uuid;
      //pin.scale.set(20, 20, 20);
      //was with ludo's icons

      pin.position.x = dscenepoint.x;
      pin.position.y = self.spriteYpos;
      pin.position.z = dscenepoint.y;

      pin.index = self.pois.length;

      self.pois[vehicleId] = pin;
      // Add also to array for raycast
      self.poisArray.push(pin);
      self.updatePoiVisibility(pin); // Set initial visibility according to lollipopmenu selection mode

      pin.add(pinSprite);

      // Arrow
      var newMaterial = self.arrow.material.clone();
      var info = intepretJoreCode(name);
      if (info.mode == "TRAM") {
        newMaterial.materials[0].map = THREE.ImageUtils.loadTexture("data/3d/arrow_diffuse_ratikka.png");
      } else if (info.mode == "SUBWAY") {
        newMaterial.materials[0].map = THREE.ImageUtils.loadTexture("data/3d/arrow_diffuse_metro.png");
      } else {
        newMaterial.materials[0].map = THREE.ImageUtils.loadTexture("data/3d/arrow_diffuse_bussi.png");
      }

      if (bearing) {
        var arrowMesh = new THREE.Mesh(self.arrow.geometry.clone(), newMaterial);
        arrowMesh.rotation.set(THREE.Math.degToRad(180), THREE.Math.degToRad(bearing), 0);
        pin.add(arrowMesh);
        pin.arrow = arrowMesh;
      }

      // Number sprite
      var textSprite = self.makeTextSprite(name, {
        fontsize: 12,
        borderColor: {
          r: 0,
          g: 0,
          b: 255,
          a: 1.0
        },
        backgroundColor: {
          r: 100,
          g: 100,
          b: 255,
          a: 0.8
        }
      });

      self.updatePoiVisibility(pin); // Set initial visibility according to lollipopmenu selection mode

      self.add(pin);
    }


    /*
    VIZI.Layer.add vizi.js:7140
    function (object) {
    var self = this;
    self.object.add(object);
    }
    */

  };

  VIZI.BlueprintOutputSensor.prototype.createThermometer = function(lat, lon, name, desc, uuid) {
    var self = this;

    var thermo = new THREE.Mesh(self.thermometer.geometry.clone(), self.thermometer.material.clone());

    thermo.scale.set(1, 1, 1);
    thermo.rotateY(90);

    thermo.name = name;
    thermo.description = desc;
    thermo.uuid = uuid;

    var dgeocoord = new VIZI.LatLon(lat, lon);
    var dscenepoint = self.world.project(dgeocoord);

    thermo.position.x = dscenepoint.x;
    thermo.position.y = self.modelYpos;
    thermo.position.z = dscenepoint.y;

    thermo.index = self.pois.length;
    self.poisArray.push(thermo);

    self.add(thermo);
    /*
    VIZI.Layer.add vizi.js:7140
    function (object) {
    var self = this;
    self.object.add(object);
    }
    */

  };

  VIZI.BlueprintOutputSensor.prototype.createLightbulb = function(lat, lon, name, desc, uuid, customValue) {
    var self = this;

    /*
    0.0001 lux    Moonless, overcast night sky (starlight)[3]
    0.002 lux   Moonless clear night sky with airglow[3]
    0.27–1.0 lux  Full moon on a clear night[3][4]
    3.4 lux     Dark limit of civil twilight under a clear sky[5]
    50 lux      Family living room lights (Australia, 1998)[6]
    80 lux      Office building hallway/toilet lighting[7][8]
    100 lux     Very dark overcast day[3]
    320–500     lux Office lighting[9][10][11]
    400 lux     Sunrise or sunset on a clear day.
    1000 lux    Overcast day;[3] typical TV studio lighting
    10000–25000   lux Full daylight (not direct sun)[3]
    32000–100000  lux Direct sunlight
    */

    // Lux between 0-500
    var newColor = customValue / 10; // 500; // lux between 0 and 1

    var lightMesh = new THREE.Mesh(self.lightbulb.geometry.clone(), self.lightbulb.material.clone());
    lightMesh.material.materials[0].color = new THREE.Color(newColor, newColor, 0);
    lightMesh.material.materials[0].emissive = new THREE.Color(0x8F4800);

    lightMesh.scale.set(0.125, 0.125, 0.125);

    lightMesh.name = name;
    lightMesh.description = desc;
    lightMesh.uuid = uuid;

    // // PointLight
    // var light = new THREE.PointLight( 0xFFF87A, customValue, 100 );
    // sphere.add(light);

    var dgeocoord = new VIZI.LatLon(lat, lon);
    var dscenepoint = self.world.project(dgeocoord);
    lightMesh.position.x = dscenepoint.x;
    lightMesh.position.y = self.modelYpos;
    lightMesh.position.z = dscenepoint.y;

    lightMesh.index = self.pois.length;
    self.poisArray.push(lightMesh);

    self.add(lightMesh);
  };


  VIZI.BlueprintOutputSensor.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };

  VIZI.BlueprintOutputSensor.prototype.loadLightbulbModel = function(geometry, materials) {
    var self = this;
    console.log("load lightbulb model");
    var material = new THREE.MeshFaceMaterial(materials);

    self.lightbulb = new THREE.Mesh(geometry, material);

    self.updateModelCount();
  };

  VIZI.BlueprintOutputSensor.prototype.loadThermometerModel = function(geometry, materials) {
    var self = this;
    console.log("load thermometer model");
    var material = new THREE.MeshFaceMaterial(materials);
    material.materials[0].emissive = new THREE.Color(0xffffff);
    self.thermometer = new THREE.Mesh(geometry, material);

    self.updateModelCount();
  };

  VIZI.BlueprintOutputSensor.prototype.loadArrowModel = function(geometry, materials) {
    var self = this;
    console.log("load arrow model");
    var material = new THREE.MeshFaceMaterial(materials);
    material.materials[0].emissive = new THREE.Color(0xffffff);
    self.arrow = new THREE.Mesh(geometry, material);
    self.updateModelCount();
  };

  VIZI.BlueprintOutputSensor.prototype.onDocumentMouseMove = function(event) {
    var self = this;
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();

    // update the mouse variable
    self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    self.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    self.setDialogPosition();

    // Lollipop also needs to handle move to keep icons straightened during rotate
    self.lollipopMenu.onMouseMove(self.mouse.x, self.mouse.y);
  };

  VIZI.BlueprintOutputSensor.prototype.onDocumentMouseDown = function(event) {
    var self = this;

    if (!self.raycastsEnabled) {
      return;
    }

    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();


    // update the mouse variable
    self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    self.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // find intersections
    var intersects = self.doRaycast(self.mouse.x, self.mouse.y, self.poisArray);

    // if there is one (or more) intersections
    // if (intersects.length > 0 && intersects[0].object.visible) {
    //   // console.log(intersects[0]);
    //   self.intersectedObject = intersects[0].object;
    // } else {
      // If no ray hits, pass on to lollipopmenu
      self.lollipopMenu.onMouseDown(self.mouse.x, self.mouse.y);
    // }
  };


  VIZI.BlueprintOutputSensor.prototype.onDocumentMouseUp = function(event) {
    var self = this;

    if (!self.raycastsEnabled) {
      return;
    }

    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();


    // update the mouse variable
    self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    self.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // find intersections
    var intersects = self.doRaycast(self.mouse.x, self.mouse.y, self.poisArray);

    // if there is one (or more) intersections
    if (intersects.length > 0 && intersects[0].object.visible) {
      // console.log(intersects[0]);

      self.closeDialog();

      var selectedObject = intersects[0].object;

      if (self.currentPoi != selectedObject && selectedObject == self.intersectedObject) {

        self.currentPoi = selectedObject;

        // jQuery dialog
        var newDialog = selectedObject.uuid;
        var descr = "";
        for (var attr in selectedObject.description) {
          descr += selectedObject.description[attr] + "<br>";
        }
        $("body").append("<div id=" + newDialog + " title='" + selectedObject.name + "'>" + descr + "</div>");
        self.currentDialog = $("#" + newDialog).dialog({
          width: 300,
          height: "auto",
          ind: selectedObject.index,
          close: function(ev, ui) {
            self.closeDialog();
          },
        });

        self.currentDialog.mouseenter(function() {
          self.raycastsEnabled = false;
        });

        self.currentDialog.mouseleave(function() {
          self.raycastsEnabled = true;
        });

        self.currentDialog.parent().find('.ui-dialog-titlebar').mouseenter(function() {
          self.raycastsEnabled = false;
        });

        self.currentDialog.parent().find('.ui-dialog-titlebar').mouseleave(function() {
          self.raycastsEnabled = true;
        });

        self.setDialogPosition();
      }
    } else {
      // If no ray hits, pass on to lollipopmenu
      self.lollipopMenu.onMouseUp(self.mouse.x, self.mouse.y);
    }

    self.intersectedObject = undefined;

  };

  VIZI.BlueprintOutputSensor.prototype.doRaycast = function(x, y, objects) {
    var self = this;
    // create a Ray with origin at the mouse position
    // and direction into the scene (camera direction)
    var vector = new THREE.Vector3(x, y, 1);
    vector.unproject(self.world.camera.camera);
    var pLocal = new THREE.Vector3(0, 0, -1);
    var pWorld = pLocal.applyMatrix4(self.world.camera.camera.matrixWorld);
    var ray = new THREE.Raycaster(pWorld, vector.sub(pWorld).normalize());

    return ray.intersectObjects(objects);
  };

  VIZI.BlueprintOutputSensor.prototype.closeDialog = function() {
    var self = this;
    if (!self.currentDialog) {
      return;
    }

    self.raycastsEnabled = true;
    self.currentDialog.remove();
    self.currentDialog = undefined;
    self.currentPoi = undefined;
  };

  // Calculate and set dialog position
  VIZI.BlueprintOutputSensor.prototype.setDialogPosition = function() {
    var self = this;
    if (self.currentDialog === undefined) {
      return;
    }

    var x, y, p, v, percX, percY;

    // this will give us position relative to the world
    p = new THREE.Vector3(self.currentPoi.position.x, self.currentPoi.position.y /* + (pois[i].geometry.height / 2) */ , self.currentPoi.position.z);

    // projectVector will translate position to 2d
    v = p.project(self.world.camera.camera);

    // translate our vector so that percX=0 represents
    // the left edge, percX=1 is the right edge,
    // percY=0 is the top edge, and percY=1 is the bottom edge.
    percX = (v.x + 1) / 2;
    percY = (-v.y + 1) / 2;

    // scale these values to our viewport size
    x = percX * window.innerWidth;
    y = percY * window.innerHeight;

    // calculate distance between the camera and the person. Used for fading the tooltip
    var distance = p.distanceTo(self.world.camera.camera.position);
    distance = 2 / distance;

    self.currentDialog.dialog("option", "position", [x, y]);
  };

  // Tick handler
  VIZI.BlueprintOutputSensor.prototype.onTick = function(delta) {
    var self = this;
    self.lollipopMenu.onTick(delta);
    self.updateInterpolations(delta);
  };

  VIZI.BlueprintOutputSensor.prototype.onLollipopSelectionChanged = function(newSel) {
    var self = this;
    for (var i = 0; i < self.poisArray.length; ++i) {
      self.updatePoiVisibility(self.poisArray[i]);
    }
  };

  VIZI.BlueprintOutputSensor.prototype.updatePoiVisibility = function(poi) {
    var self = this;
    if (!self.lollipopMenu)
      return;
    var sel = self.lollipopMenu.getSelection();
    poi.visible = sel === 0 || sel == 4; // No selection, or Transportation
  };
  VIZI.BlueprintOutputSensor.prototype.updateModelCount = function() {
    var self = this;
    self.modelCount++;
    if (self.modelCount == Object.keys(self.assetPaths).length) {
      self.emit("assets ready");
    }
  };

  VIZI.BlueprintOutputSensor.prototype.makePinSprite = function(name) {
    var self = this;

    var fontface = "Arial";

    var fontsize = 64;

    var canvas = document.createElement('canvas');
    canvas.width = "512";
    canvas.height = "512";
    var context = canvas.getContext('2d');


    // IMAGE
    var info = intepretJoreCode(name);
    // console.log(name + " is route " + info.route + " and is a " + info.mode);
    if (info.mode == "TRAM") {
      context.drawImage(self.tramImg, 0, 0);
    } else if (info.mode == "SUBWAY") {
      context.drawImage(self.metroImg, 0, 0);
    } else {
      context.drawImage(self.busImg, 0, 0);
    }


    // TEXT

    context.font = "Bold " + fontsize + "px " + fontface;

    name = info.route; //name.slice(-3);

    // get size data (height depends only on font size)
    var metrics = context.measureText(name);
    var textWidth = metrics.width;

    // text color
    context.fillStyle = "rgba(255, 255, 255, 1.0)";

    context.textAlign = "left";
    context.textBaseline = "top";

    context.fillText(name, 270, 92, 160);


    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      useScreenCoordinates: false,
    });

    var sprite = new THREE.Sprite(spriteMaterial);

    sprite.scale.set(25, 25, 1.0);
    return sprite;
  };

  VIZI.BlueprintOutputSensor.prototype.makeTextSprite = function(message, parameters) {
    var self = this;

    if (parameters === undefined) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface") ?
      parameters.fontface : "Arial";

    var fontsize = parameters.hasOwnProperty("fontsize") ?
      parameters.fontsize : 18;

    var borderThickness = parameters.hasOwnProperty("borderThickness") ?
      parameters.borderThickness : 4;

    var borderColor = parameters.hasOwnProperty("borderColor") ?
      parameters.borderColor : {
      r: 0,
      g: 0,
      b: 0,
      a: 1.0
    };

    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
      parameters.backgroundColor : {
      r: 255,
      g: 255,
      b: 255,
      a: 1.0
    };

    var spriteAlignment = new THREE.Vector2(0, 1);

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = "Bold " + fontsize + "px " + fontface;

    // get size data (height depends only on font size)
    var metrics = context.measureText(message);
    var textWidth = metrics.width;

    // background color
    context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
    // border color
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

    context.lineWidth = borderThickness;
    self.roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = "rgba(0, 0, 0, 1.0)";

    context.fillText(message, borderThickness, fontsize + borderThickness);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      useScreenCoordinates: false,
      alignment: spriteAlignment
    });
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(100, 50, 1.0);
    return sprite;
  };

  VIZI.BlueprintOutputSensor.prototype.roundRect = function(ctx, x, y, w, h, r) {
    var self = this;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

// "updateFromTransform" from https://github.com/realXtend/WebTundra/blob/master/src/view/ThreeView.js
  VIZI.BlueprintOutputSensor.prototype.handleTransformUpdate = function(threeMesh, newTransform) {
    var self = this;

    // Tundra.checkDefined(placeable, threeMesh);
    // var ptv = placeable.transform;


    // INTERPOLATION

    // Update interval

    // If it's the first measurement, set time directly. Else smooth
    // var time = self.lerpClock.getDelta(); // seconds

    // if (self.avgUpdateInterval === 0) {
    //   self.avgUpdateInterval = time;
    // } else {
    //   self.avgUpdateInterval = 0.5 * time + 0.5 * self.avgUpdateInterval;
    // }

    var updateInterval = self.updatePeriod_;
    // if (self.avgUpdateInterval > 0) {
    //   updateInterval = self.avgUpdateInterval;
    // }
    // // Add a fudge factor in case there is jitter in packet receipt or the server is too taxed
    // updateInterval *= 1.25;

    // // End previous interpolation if existed 
    // var previous = self.endInterpolation(threeMesh);

    // // If previous interpolation does not exist, perform a direct snapping to the end value
    // // but still start an interpolation period, so that on the next update we detect that an interpolation is going on,
    // // and will interpolate normally
    // if (!previous) {
    //   // // Position
    //   // copyXyz(ptv.pos, threeMesh.position);

    //   // // Rotation
    //   // var quat = new THREE.Quaternion();
    //   // var euler = new THREE.Euler();
    //   // //euler.order = 'XYZ'; //not needed as tundraToThreeEuler defines it too
    //   // tundraToThreeEuler(ptv.rot, euler);
    //   // quat.setFromEuler(euler, true);
    //   // threeMesh.quaternion = quat;

    //   // fidemo
    //   threeMesh.position.set(newTransform.position.x, newTransform.position.y, newTransform.position.z);
    //   // threeMesh.quaternion = newTransform.endRot;
    //   // threeMesh.scale = newTransform.endScale;

    //   // Scale
    //   // copyXyz(ptv.scale, threeMesh.scale);
    // }
    
        // Create new interpolation

    // // position
    // var endPos = new THREE.Vector3();
    // copyXyz(newTransform.pos, endPos);

    // // rotation
    // var endRot = new THREE.Quaternion();
    // var euler = new THREE.Euler();
    // //euler.order = 'XYZ'; ////not needed as tundraToThreeEuler defines it too
    // tundraToThreeEuler(newTransform.rot, euler);
    // endRot.setFromEuler(euler, true);

    // // scale
    // var endScale = new THREE.Vector3();
    // copyXyz(newTransform.scale, endScale);

    // interpolation struct
    var newInterp = {
      dest: threeMesh,
      start: {
        // Use CLONED values!!!
        position: threeMesh.position.clone(),
        // rotation: threeMesh.quaternion clone,
        // scale: threeMesh.scale clone
      },
      end: {
        // position: endPos,
        // rotation: endRot,
        // scale: endScale

        // fidemo
        position: newTransform.position,
        // rotation: newTransform.endRot,
        // scale: newTransform.endScale
      },
      time: 0,
      length: updateInterval // update interval (seconds)
    };

    self.interpolations.push(newInterp);
  };

  // "updateInterpolations" from https://github.com/realXtend/WebTundra/blob/master/src/view/ThreeView.js
  VIZI.BlueprintOutputSensor.prototype.updateInterpolations = function(delta) {
    var self = this;

    for (var i = self.interpolations.length - 1; i >= 0; i--) {
      var interp = self.interpolations[i];
      var finished = false;

      // Allow the interpolation to persist for 2x time, though we are no longer setting the value
      // This is for the continuous/discontinuous update detection in updateFromTransform()

      if (interp.time <= interp.length) {
        interp.time += delta;
        var t = interp.time / interp.length; // between 0 and 1
        if (self.interpolations.length > 100 && i == 200) {
          // console.log("---");
          // console.log("interp.time: " + interp.time);
          // console.log("interp.length: " + interp.length);
          // console.log("self.interpolations.length: " + self.interpolations.length);
          // console.log("t: "+t);
        }

        if (t > 1) {
          t = 1;
        }


        // LERP

        // position
        var newPos = interp.start.position.clone();

        //  if (self.interpolations.length > 100 && i == 200)
        // console.log("newPos.x: "+newPos.x);

        newPos.lerp(interp.end.position, t);
        interp.dest.position.set(newPos.x, newPos.y, newPos.z);

        //  if (self.interpolations.length > 100 && i == 200)
        // console.log("interp.end.position.x: "+interp.end.position.x);

        // console.log("t:" + t);
        // console.log("i:" + i);

        // // rotation
        // var newRot = interp.start.rotation.clone();
        // newRot.slerp(interp.end.rotation, t);
        // interp.dest.quaternion.set(newRot.x, newRot.y, newRot.z, newRot.w);

        // // scale
        // var newScale = interp.start.scale.clone();
        // newScale.lerp(interp.end.scale, t);
        // interp.dest.scale.set(newScale.x, newScale.y, newScale.z);
      } else {
        interp.time += delta;
        if (interp.time >= interp.length * 2) {
          finished = true;
        }
      }

      // Remove interpolation (& delete start/endpoints) when done
      if (finished) {
        self.interpolations.splice(i, 1);
      }
    }
  };

  // "endInterpolation" from https://github.com/realXtend/WebTundra/blob/master/src/view/ThreeView.js
  VIZI.BlueprintOutputSensor.prototype.endInterpolation = function(obj) {
    var self = this;
    for (var i = self.interpolations.length - 1; i >= 0; i--) {
      if (self.interpolations[i].dest == obj) {
        self.interpolations.splice(i, 1);
        return true;
      }
    }
    return false;
  };

}());
