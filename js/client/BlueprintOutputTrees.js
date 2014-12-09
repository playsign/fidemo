/* globals window, _, VIZI */
(function() {
  "use strict";

  /**
   * Blueprint trees output
   * @author Tapani Jämsä - playsign.net
   */

  VIZI.BlueprintOutputTrees = function(options) {
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
        name: "outputTrees",
        arguments: ["sensor"]
      }
    ];

    self.world;

    // MODELS & MATERIALS

    // Tree models
    self.modelYpos = 0;
    self.treeAmount = 0;
    self.treeLimit = 1000; // 999999
    self.trees;
    self.treeModel;
    self.treeModelB;
    self.treeModelC;

    var jsonLoader = new THREE.JSONLoader();
    self.models = ["data/3d/tree.js", "data/3d/tree2.js", "data/3d/tree3.js"]
    self.modelCount = 0;
    jsonLoader.load(self.models[0], self.loadTreeModel.bind(self));
    jsonLoader.load(self.models[1], self.loadTreeModelB.bind(self));
    jsonLoader.load(self.models[2], self.loadTreeModelC.bind(self));
  };

  VIZI.BlueprintOutputTrees.prototype = Object.create(VIZI.BlueprintOutput.prototype);

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputTrees.prototype.init = function() {
    var self = this;

    self.emit("initialised");
  };

  VIZI.BlueprintOutputTrees.prototype.outputTrees = function(data) {
    var self = this;

    for (var i = 0; i <= data.length; i++) {
      if (data[i] === undefined) {
        continue;
      }
      var objectLongitude = data[i].coordinates[1];
      var objectLatitude = data[i].coordinates[0];
      var objectName = "Sensor";
      var objectDescription = [];
      for (var variable in data[i]) {
        if (!data[i][variable]) {
          continue;
        }
        objectDescription.push(variable + ": " + data[i][variable]);
      }
      var objectId = data[i].node;

      self.createTree(objectLatitude, objectLongitude, objectName, objectDescription, objectId);
    }
  };

  VIZI.BlueprintOutputTrees.prototype.createTree = function(lat, lon, name, desc, uuid) {
    var self = this;

    if (self.treeAmount >= self.treeLimit) {
      return;
    }

    // console.log("createTree");

    var max = 2;
    var min = 0;
    var randomTree = Math.floor(Math.random() * (max - min + 1)) + min;

    var treeClone;
    if (randomTree === 0) {
      treeClone = new THREE.Mesh(self.treeModel.geometry.clone(), self.treeModel.material.clone());
    } else if (randomTree === 1) {
      treeClone = new THREE.Mesh(self.treeModelB.geometry.clone(), self.treeModelB.material.clone());
    } else if (randomTree === 2) {
      treeClone = new THREE.Mesh(self.treeModelC.geometry.clone(), self.treeModelC.material.clone());
    }

    treeClone.name = name;
    treeClone.description = desc;
    treeClone.uuid = uuid;

    var dgeocoord = new VIZI.LatLon(lat, lon);
    var dscenepoint = self.world.project(dgeocoord);
    treeClone.position.x = dscenepoint.x;
    treeClone.position.y = self.modelYpos;
    treeClone.position.z = dscenepoint.y;

    if (self.trees == undefined) {
      self.trees = treeClone;
      self.add(self.trees);
    } else {
      // Rotation
      var max = 6;
      var min = 0;
      var randomValue = Math.random() * (max - min) + min;
      treeClone.rotateY(randomValue);

      // // Scale
      // max = 2;
      // min = 0.8;
      // randomValue = Math.random() * (max - min) + min;
      // treeClone.scale.set(randomValue, randomValue, randomValue);

      // console.log("create combined tree mesh");

      treeClone.updateMatrix();
      self.trees.geometry.merge(treeClone.geometry, treeClone.matrix);

      // Center trees
      self.trees.position.set(0, 0, 0);
    }

    self.treeAmount++;
  };

  VIZI.BlueprintOutputTrees.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };

  VIZI.BlueprintOutputTrees.prototype.loadTreeModel = function(geometry, materials) {
    var self = this;
    console.log("load tree model");
    var material = new THREE.MeshFaceMaterial(materials);

    self.treeModel = new THREE.Mesh(geometry, material);
    self.updateModelCount();
  };

  VIZI.BlueprintOutputTrees.prototype.loadTreeModelB = function(geometry, materials) {
    var self = this;
    console.log("load tree model B");
    var material = new THREE.MeshFaceMaterial(materials);

    self.treeModelB = new THREE.Mesh(geometry, material);
    self.updateModelCount();
  };

  VIZI.BlueprintOutputTrees.prototype.loadTreeModelC = function(geometry, materials) {
    var self = this;
    console.log("load tree model C");
    var material = new THREE.MeshFaceMaterial(materials);

    self.treeModelC = new THREE.Mesh(geometry, material);
    self.updateModelCount();
  };

  VIZI.BlueprintOutputTrees.prototype.updateModelCount = function() {
    var self = this;
    self.modelCount++;
    if (self.modelCount == self.models.length) {
      self.emit("trees ready");
    }
  };

}());
