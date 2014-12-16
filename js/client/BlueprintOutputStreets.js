/* globals window, _, VIZI */
(function() {
  "use strict";

  /**
   * Blueprint streets output
   */

  VIZI.BlueprintOutputStreets = function(options) {
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
        name: "outputStreet",
        arguments: ["street"]
      }
    ];
  };

  VIZI.BlueprintOutputStreets.prototype = Object.create(VIZI.BlueprintOutput.prototype);

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputStreets.prototype.init = function() {
    var self = this;
    
    self.emit("initialised");
  };

  VIZI.BlueprintOutputStreets.prototype.outputStreet = function(data) {
    var self = this;

    //console.log(data);

    for (var i = 0; i <= data.length; i++) {
      if (data[i] === undefined) {
        continue;
      }
      var lon = data[i].coordinates[0]
      var lat = data[i].coordinates[1];
      var name = data[i].name;
        
      var textFront = self.makeTextPlane(name, 260, 65, "Arial", 32, 'white', 'black');
      var textBack = self.makeTextPlane(name, 260, 65, "Arial", 32, 'white', 'black');
        
      var dgeocoord = new VIZI.LatLon(lat, lon);
      var dscenepoint = self.world.project(dgeocoord);

      textFront.position.x = textBack.position.x = dscenepoint.x;
      textFront.position.y = textBack.position.y = 40;
      textFront.position.z = textBack.position.z = dscenepoint.y;
      textBack.rotation.y = Math.PI;

      self.add(textFront);
      self.add(textBack);
      
      if (self.options.globalData && self.options.globalData.labelCull) {
        if (!data[i].important) {
            self.options.globalData.labelCull.Add(textFront);
            self.options.globalData.labelCull.Add(textBack);
        } else {
            self.options.globalData.labelCull.AddImportant(textFront);
            self.options.globalData.labelCull.AddImportant(textBack);
        }
      }
    }
  };

  VIZI.BlueprintOutputStreets.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
  
  VIZI.BlueprintOutputStreets.prototype.makeTextPlane = function(message, width, height, font, fontsize, textColor, outlineColor) {
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

}());
