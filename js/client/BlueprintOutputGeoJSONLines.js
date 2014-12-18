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

    // Triggers and actions reference
    self.triggers = [
      {name: "initialised", arguments: []}
    ];

    self.actions = [
      {name: "outputGeoJSONLines", arguments: ["data"]}
    ];

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

        return; // this is an unused copy of the code now, moved to BlueprintOutputSensor
    };

  VIZI.BlueprintOutputGeoJSONLines.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
}());


// Modified from three r68 SplineCurve3.js according to
// https://stackoverflow.com/questions/18578249/three-js-splinecurve3-without-round-edges-or-linecurve3-replacement
// (+ jslint-fixed)

UnSplineCurve3 = THREE.Curve.create(

    function ( points /* array of Vector3 */) {

	this.points = (points === undefined) ? [] : points;

    },
    function ( t ) {

	var v = new THREE.Vector3();
	var c = [];
	var points = this.points, point, intPoint, weight;
	point = ( points.length - 1 ) * t;

	intPoint = Math.floor( point );
	weight = point - intPoint;

	c[ 0 ] = intPoint === 0 ? intPoint : intPoint - 1;
	c[ 1 ] = intPoint;
	c[ 2 ] = intPoint  > points.length - 2 ? points.length - 1 : intPoint + 1;
	c[ 3 ] = intPoint  > points.length - 3 ? points.length - 1 : intPoint + 2;

	var pt0 = points[ c[0] ],
	pt1 = points[ c[1] ],
	pt2 = points[ c[2] ],
	pt3 = points[ c[3] ];

        // original code:
	// v.x = THREE.Curve.Utils.interpolate(pt0.x, pt1.x, pt2.x, pt3.x, weight);
	// v.y = THREE.Curve.Utils.interpolate(pt0.y, pt1.y, pt2.y, pt3.y, weight);
	// v.z = THREE.Curve.Utils.interpolate(pt0.z, pt1.z, pt2.z, pt3.z, weight);
        // replacement code:
        v.copy( pt1 ).lerp( pt2, weight );
        
	return v;

    }

);


function makeTramJoreId(route, direction) {
    var lineNr = "" + route;
    while (lineNr.length < 3)
        lineNr = "0" + lineNr;
    var variant1 = " ", variant2 = " ";
    return "1" + lineNr + variant1 + variant2 + direction;
}
