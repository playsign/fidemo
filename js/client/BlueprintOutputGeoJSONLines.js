/* globals window, _, VIZI, d3, THREE */
(function() {
  "use strict";

/**
 * Blueprint choropleth output
 * @author Robin Hawkes - vizicities.com
 */  

  // output: {
  //   type: "BlueprintOutputGeoJSONLines",
  //   options: {
  //     colourRange: ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"],
  //     layer: 100
  //   }
  // }
  VIZI.BlueprintOutputGeoJSONLines = function(options) {
    var self = this;

    VIZI.BlueprintOutput.call(self, options);

    _.defaults(self.options, {
      colourRange: ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"],
      layer: 10
    });

    // Triggers and actions reference
    self.triggers = [
      {name: "initialised", arguments: []}
    ];

    self.actions = [
      {name: "outputGeoJSONLines", arguments: ["data"]}
    ];

    self.world;
  };

  VIZI.BlueprintOutputGeoJSONLines.prototype = Object.create( VIZI.BlueprintOutput.prototype );

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputGeoJSONLines.prototype.init = function() {
    var self = this;

    self.emit("initialised");
  };

  // {
  //   outline: [],
  //   value: 123
  // }
  VIZI.BlueprintOutputGeoJSONLines.prototype.outputGeoJSONLines = function(data) {
    var self = this;

    /*var material = new THREE.MeshLambertMaterial({
      vertexColors: THREE.VertexColors,
      ambient: 0xffffff,
      emissive: 0xcccccc,
      shading: THREE.FlatShading,
      // TODO: Remove this by implementing logic to make points clockwise
      side: THREE.BackSide
    });*/

    var material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 3
    });

    var geom = new THREE.Geometry();

    _.each(data, function(feature) {
      var offset = new VIZI.Point();

      _.each(feature.linecoords, function(coord, index) {
        var geoCoord = self.world.project(new VIZI.LatLon(coord[1], coord[0]));

        if (offset.length === 0) {
          offset.x = -1 * geoCoord.x;
          offset.y = -1 * geoCoord.y;
        }

        // Move if first coordinate
        /*if (index === 0) {
          shape.moveTo( geoCoord.x + offset.x, geoCoord.y + offset.y );
        } else {
          shape.lineTo( geoCoord.x + offset.x, geoCoord.y + offset.y );
        }*/
        geom.vertices.push(new THREE.Vector3( geoCoord.x, 10, geoCoord.y ));
      });

      // Use choropleth range colour if defined, else random
      /*var colour = (self.options.colourRange) ? new THREE.Color(scaleColour(feature.value)) : new THREE.Color(0xffffff * Math.random());

      self.applyVertexColors(geom, colour);
      */
    });

    // Move merged geom to 0,0 and return offset
    var offset = geom.center();

    var line = new THREE.Line( geom, material );

    // Use previously calculated offset to return merged mesh to correct position
    // This allows frustum culling to work correctly
    line.position.x = -1 * offset.x;

    // Removed for scale center to be correct
    // Offset with applyMatrix above
    line.position.y = -1 * offset.y;

    line.position.z = -1 * offset.z;

    self.add(line);
  };

  VIZI.BlueprintOutputGeoJSONLines.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
}());