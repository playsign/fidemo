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

        var		height = 0,
			size = 20,
			curveSegments = 4,
			bevelThickness = 2,
			bevelSize = 1.5,
			bevelSegments = 3,
			bevelEnabled = false,

			font = "optimer",
			weight = "normal",
			style = "normal";
				
        var material = new THREE.MeshFaceMaterial( [ 
					new THREE.MeshBasicMaterial( { color: 0xd64541, shading: THREE.FlatShading } ), // front
					new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.SmoothShading } ) // side
				] );
				
        var textGeo = new THREE.TextGeometry( name, {

			size: size,
			height: height,
			curveSegments: curveSegments,

			font: font,
			weight: weight,
			style: style,

			bevelThickness: bevelThickness,
			bevelSize: bevelSize,
			bevelEnabled: bevelEnabled,

			material: 0,
			extrudeMaterial: 1

		});

		textGeo.computeBoundingBox();
		textGeo.computeVertexNormals();

        var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

        var textMesh1 = new THREE.Mesh( textGeo, material );
        var dgeocoord = new VIZI.LatLon(lat, lon);
        var dscenepoint = self.world.project(dgeocoord);

        textMesh1.position.x = dscenepoint.x + centerOffset;
        textMesh1.position.y = 40;
        textMesh1.position.z = dscenepoint.y;

        self.add(textMesh1);
    }
  };

  VIZI.BlueprintOutputStreets.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };

}());
