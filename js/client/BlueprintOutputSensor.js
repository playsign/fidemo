/* globals window, _, VIZI */
(function() {
  "use strict";

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

    self.world;

    // POI

    self.mouse = {
        x: 0,
        y: 0
      };

    self.intersectedObject;

    self.pois = [];
    self.dialogs = [];

    // listeners
    document.addEventListener('mousemove', self.onDocumentMouseMove.bind(self), false);
    document.addEventListener('mousedown', self.onDocumentMouseDown.bind(self), false);
    document.addEventListener('mouseup', self.onDocumentMouseUp.bind(self), false);
    document.addEventListener('mousewheel', self.updateDialogs.bind(self), false);

    // MODELS & MATERIALS

    self.modelYpos = 10;
    self.spriteYpos = 30;

    var jsonLoader = new THREE.JSONLoader();
    
    // Lightbulb model
    self.lightbulb;
    jsonLoader.load("data/3d/lightbulb.js", self.loadLightbulbModel.bind(self));
    
    // Thermometer model
    self.thermometer;
    jsonLoader.load("data/3d/thermometer.js", self.loadThermometerModel.bind(self));

    // Pin sprite material
    var pinMap = THREE.ImageUtils.loadTexture( "data/2d/bussi.png" );
    self.pinMaterial = new THREE.SpriteMaterial( { map: pinMap, color: 0xffffff, fog: true } );
  };

  VIZI.BlueprintOutputSensor.prototype = Object.create( VIZI.BlueprintOutput.prototype );

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputSensor.prototype.init = function() {
    var self = this;

    self.emit("initialised");
  };

  VIZI.BlueprintOutputSensor.prototype.outputSensor = function(data) {
    var self = this;

    console.log(data);

    for (var i = 0; i <= data.length; i++) {
      if (data[i] === undefined) {
        continue;
      }
      var boxLongitude = data[i].coordinates[1];
      var boxLatitude = data[i].coordinates[0];
      var boxName = "Sensor";
      var boxDescription = [];
      for (var variable in data[i]) {
        if(!data[i][variable]){
          continue;
        }
        boxDescription.push(variable + ": " + data[i][variable]);
      }
      var boxId = data[i].node;

      if (data[i].categories) {
        self.createPin(boxLatitude, boxLongitude, boxName, boxDescription, boxId);
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

VIZI.BlueprintOutputSensor.prototype.createPin = function(lat, lon, name, desc, uuid) {
    var self = this;

    console.log("createPin");

    var pin = new THREE.Sprite(self.pinMaterial);

    pin.scale.set(50, 50, 50);

    pin.name = name;
    pin.description = desc;
    pin.uuid = uuid;

    var dgeocoord = new VIZI.LatLon(lat, lon);
    var dscenepoint = self.world.project(dgeocoord);

    pin.position.x = dscenepoint.x;
    pin.position.y = self.spriteYpos;
    pin.position.z = dscenepoint.y;

    pin.index = self.pois.length;
    self.pois.push(pin);
    self.dialogs.push(undefined);

    self.add(pin);
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

    console.log("createThermometer");

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
    self.pois.push(thermo);
    self.dialogs.push(undefined);

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

    console.log("createLightbulb");

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
    self.pois.push(lightMesh);
    self.dialogs.push(undefined);

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
  };

  VIZI.BlueprintOutputSensor.prototype.loadThermometerModel = function(geometry, materials) {
    var self = this;
    console.log("load thermometer model");
    var material = new THREE.MeshFaceMaterial(materials);
    material.materials[0].emissive = new THREE.Color(0xffffff);
    self.thermometer = new THREE.Mesh(geometry, material);
  };

  VIZI.BlueprintOutputSensor.prototype.onDocumentMouseMove = function(event) {
    var self = this;
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();

    // update the mouse variable
    self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    self.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    self.updateDialogs();

  };

  VIZI.BlueprintOutputSensor.prototype.onDocumentMouseDown = function(event) {
    var self = this;

    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();


    // update the mouse variable
    self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    self.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // find intersections

    // create a Ray with origin at the mouse position
    // and direction into the scene (camera direction)
    var vector = new THREE.Vector3(self.mouse.x, self.mouse.y, 1);
    vector.unproject(self.world.camera.camera);
    var pLocal = new THREE.Vector3(0, 0, -1);
    var pWorld = pLocal.applyMatrix4(self.world.camera.camera.matrixWorld);
    var ray = new THREE.Raycaster(pWorld, vector.sub(pWorld).normalize());

    // create an array containing all objects in the scene with which the ray intersects
    var intersects = ray.intersectObjects(self.pois);

    // if there is one (or more) intersections
    if (intersects.length > 0) {
      console.log(intersects[0]);
      self.intersectedObject = intersects[0].object;
    }
  };


  VIZI.BlueprintOutputSensor.prototype.onDocumentMouseUp = function(event) {
    var self = this;

    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();


    // update the mouse variable
    self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    self.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // find intersections

    // create a Ray with origin at the mouse position
    // and direction into the scene (camera direction)
    var vector = new THREE.Vector3(self.mouse.x, self.mouse.y, 1);
    vector.unproject(self.world.camera.camera);
    var pLocal = new THREE.Vector3(0, 0, -1);
    var pWorld = pLocal.applyMatrix4(self.world.camera.camera.matrixWorld);
    var ray = new THREE.Raycaster(pWorld, vector.sub(pWorld).normalize());

    // create an array containing all objects in the scene with which the ray intersects
    var intersects = ray.intersectObjects(self.pois);

    // if there is one (or more) intersections
    if (intersects.length > 0) {
      console.log(intersects[0]);
      var selectedObject = intersects[0].object;

      if (self.dialogs[selectedObject.index] === undefined && selectedObject == self.intersectedObject) {

        // jQuery dialog
        var newDialog = selectedObject.uuid;
        var descr = "";
        for (var attr in selectedObject.description) {
          descr += selectedObject.description[attr] + "<br>";
        }
        $("body").append("<div id=" + newDialog + " title='" + selectedObject.name + "'>" + descr + "</div>");
        self.dialogs[selectedObject.index] = $("#" + newDialog).dialog({
          width: 300,
          height: "auto",
          ind: selectedObject.index,
          close: function(ev, ui) {
            console.log("close dialog");
            var customAttrValue = $("#" + this.id).dialog("option", "ind");
            self.dialogs[customAttrValue].remove();
            self.dialogs[customAttrValue] = undefined;
          },
        });

        self.setDialogPosition(selectedObject.index);
      } else if(self.dialogs[selectedObject.index]) {
        self.dialogs[selectedObject.index].remove();
        self.dialogs[selectedObject.index] = undefined;
      }
    }

    self.intersectedObject = undefined;

  };

  VIZI.BlueprintOutputSensor.prototype.updateDialogs = function(event) {
    var self = this;
    for (var i = 0; i < self.dialogs.length; i++) {
      self.setDialogPosition(i);
    }
  };

  // Calculate and set dialog position
VIZI.BlueprintOutputSensor.prototype.setDialogPosition  = function(i) {
  var self = this;
  if (self.dialogs[i] === undefined) {
    return;
  }

  var pLocal = new THREE.Vector3(0, 0, -1);
  var pWorld = pLocal.applyMatrix4(self.world.camera.camera.matrixWorld);
  var forward = pWorld.sub(self.world.camera.camera.position).normalize();
  var toOther = self.pois[i].position.clone();
  toOther.sub(self.world.camera.camera.position);
  // console.log(forward.dot(toOther));

  if (forward.dot(toOther) < 0) {
    self.dialogs[i].remove();
    self.dialogs[i] = undefined;
    return;
  }

  var x, y, p, v, percX, percY;

  // this will give us position relative to the world
  p = new THREE.Vector3(self.pois[i].position.x, self.pois[i].position.y /* + (pois[i].geometry.height / 2) */ , self.pois[i].position.z);

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

  self.dialogs[i].dialog("option", "position", [x, y]);
};

}());
