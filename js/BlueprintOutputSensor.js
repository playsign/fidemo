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
      var boxId = data[i].node;

      if (data[i].light) {
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
    console.log("newColor: " + newColor);

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
    lightMesh.position.y = 5;
    lightMesh.position.z = dscenepoint.y;

    // lightMesh.index = pois.length;
    // pois.push(lightMesh);
    // dialogs.push(undefined);

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

}());
