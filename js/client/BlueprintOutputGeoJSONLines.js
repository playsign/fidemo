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
        console.info("geojsonlines: data.length " + data.length);
        data.length = 1;
        _.each(data, function(feature) {
            var logCount = 0;
            var geom = new THREE.Geometry();
            _.each(feature.linecoords, function(coord, index) {
                var geoCoord = self.world.project(new VIZI.LatLon(coord[1], coord[0]));
                geom.vertices.push(new THREE.Vector3( geoCoord.x, 10, geoCoord.y ));
                if (false && logCount++ < 2) {
                    console.info("added to line vert to xy " + geoCoord.x + ", " + geoCoord.y);
                }
            });
            
            //var colour = new THREE.Color(0xffffff * Math.random());
            var colour = new THREE.Color(0xff0000);

            var material = new THREE.LineBasicMaterial({
                color: colour,
                //vertexColors: ,
                linewidth: 5
            });

            var line = new THREE.Line( geom, material );
            self.add(line);
        });
        console.info("old line thing done");
        // var cubeSize = 5;
        // var cubeGeom = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        // var cubeMat = new THREE.MeshNormalMaterial();
        // var addCube = function(x, y) {
        //     var cubeMesh = new THREE.Mesh(cubeGeom, cubeMat);
        //     cubeMesh.position.x = x;
        //     cubeMesh.position.y = y;
        //     console.log("cube @ " + x + "," + y);
        //     self.add(cubeMesh);
        // }
        // console.info("addCube defn done");

        // console.info("calling makeSplinePipe");
        // self.add(makeSplinePipe());

        console.info("making route lines");
        var logCount = 0;
        _.each(data, function(feature) {
            var verts = [];
            _.each(feature.linecoords, function(coord, index) {
                var geoCoord = self.world.project(new VIZI.LatLon(coord[1], coord[0]));
                verts.push(new THREE.Vector3( geoCoord.x, 5, geoCoord.y ));
                if (logCount++ < 2) {
                    console.info("tube vert to xy " + geoCoord.x + ", " + geoCoord.y);
                }
            });

            var lineSpline = new UnSplineCurve3(verts);
            var tubeGeometry = new THREE.TubeGeometry(
                lineSpline,
                300 /* lengthwise segments */,
                2 /* tube radius */,
                3 /* cross-section segments */,
                false /* closed? */);
            
            var tubeMat = new THREE.MeshLambertMaterial({color: 0xaf0000});
            
            var tubeMesh = new THREE.Mesh(tubeGeometry, tubeMat);
            tubeMesh.scale.set(1, 5, 1);
            tubeMesh.name = "teppo";
            self.add(tubeMesh);
            console.info("added route line mesh to scene");
        });
        
        
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
