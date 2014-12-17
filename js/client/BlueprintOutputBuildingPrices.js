/* globals window, _, VIZI */
(function() {
  "use strict";

  VIZI.BlueprintOutputBuildingPrices = function(options) {
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
        name: "outputBuildingPrices"
      }
    ];

    self.world;
  };

  VIZI.BlueprintOutputBuildingPrices.prototype = Object.create(VIZI.BlueprintOutput.prototype);

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputBuildingPrices.prototype.init = function() {
    var self = this;

    self.emit("initialised");
  };

  VIZI.BlueprintOutputBuildingPrices.prototype.outputBuildingPrices = function(data) {
    var self = this;

    buildingPricesById = {};

    for (var i = 0; i <= data.length; i++) {
      if (data[i] === undefined) {
        continue;
      }

      var lat = data[i].coordinates[0];
      var lon = data[i].coordinates[1];
      var id = data[i].id;
      var postcode = data[i].tags["addr:postcode"];
      if (buildingPricesByPostCode.hasOwnProperty(postcode))
      {
        buildingPricesById[id] = buildingPricesByPostCode[postcode];
        
        // Normalize the building price and store it into globalData object for later use. 
        if (self.options.globalData != null && self.options.globalData.buildingPrices.max > 0)
        {
            var buildingPrices = self.options.globalData.buildingPrices;
            var normalizedPrice = (buildingPricesById[id] - buildingPrices.min) / (buildingPrices.max - buildingPrices.min);
            self.options.priceMap.SetValue(lat, lon, normalizedPrice);
        }

        // Commented out test code to create 3d text of the price information
        /*
        var text = "m^2 price: " + buildingPricesById[id];
        var textFront = self.makeTextPlane(text, 260, 65, "Arial", 32, 'white', 'black');
        var textBack = self.makeTextPlane(text, 260, 65, "Arial", 32, 'white', 'black');

        var dgeocoord = new VIZI.LatLon(lat, lon);
        var dscenepoint = self.world.project(dgeocoord);

        textFront.position.x = textBack.position.x = dscenepoint.x;
        textFront.position.y = textBack.position.y = 40;
        textFront.position.z = textBack.position.z = dscenepoint.y;
        textBack.rotation.y = Math.PI;

        self.add(textFront);
        self.add(textBack);
        */
      }
    }
  };

  VIZI.BlueprintOutputBuildingPrices.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
  
  /*
  VIZI.BlueprintOutputBuildingPrices.prototype.makeTextPlane = function(message, width, height, font, fontsize, textColor, outlineColor) {
    var self = this;

    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    var context = canvas.getContext('2d');
    
    context.font = fontsize + "px " + font;
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

    context.strokeStyle = outlineColor;
    context.miterLimit = 2;
    context.lineJoin = 'circle';
        
    context.fillStyle = textColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 4;
    context.strokeText(message, canvas.width / 2, canvas.height / 2);
    context.lineWidth = 1;
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var material = new THREE.MeshBasicMaterial( { map: texture, shading: THREE.FlatShading, transparent:true, depthTest:true, depthWrite:true, alphaTest: 0.01, side: THREE.FrontSide } );

    var plane = new THREE.Mesh( new THREE.PlaneGeometry(width, height), material );
    return plane;
  };
  */

}());
