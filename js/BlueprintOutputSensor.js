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
    self.triggers = [
      {name: "initialised", arguments: []}
    ];

    self.actions = [
      {name: "outputSensor", arguments: ["sensor"]}
    ];

    self.world;

    // MODELS

    var jsonLoader = new THREE.JSONLoader();
    
    // Lightbulb model
    jsonLoader.load("models/lightbulb.js", self.loadLightbulbModel.bind(this));
    
    // Thermometer model
    jsonLoader.load("models/thermometer.js", self.loadThermometerModel.bind(this));
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
      // var customValue;
      // for (var variable in data[i].data) {
        // doesn't work yet boxDescription.push(variable + ": " + data[i].data[variable]);
      // }
      var boxId = data[i].node;

      if (data[i].light) {
        // self.createSphere(boxLatitude, boxLongitude, boxName, boxDescription, boxId, customValue);
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

 // var coord = [lon, lat];
    // var newPos = city.geo.projection(coord, city.geo.tileZoom);
    thermo.position.x = dscenepoint.x;
    thermo.position.y = 5;
    thermo.position.z = dscenepoint.y;

    // thermo.index = pois.length;
    // pois.push(thermo);
    // dialogs.push(undefined);

    
    self.add(thermo);
    /*
    VIZI.Layer.add vizi.js:7140
    function (object) {
    var self = this;
    self.object.add(object);
    }
    */

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

}());
