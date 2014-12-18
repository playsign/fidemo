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
            // var makeV3 = function(coord, index) {
            //     var v2 = self.world.project(new VIZI.LatLon(coord[0], coord[1]));
            //     if (spewCount++ < 20) {
            //         console.info("spline point at " + v2.x + ", " + v2.y);
            //         addCube(v2.x, v2.y);
            //     }
            //     return new THREE.Vector3(v2.x, 10, v2.y);
            // }
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
        });
        
        
    };

  VIZI.BlueprintOutputGeoJSONLines.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
}());


function makeSplinePipe() {
    var startX = lineData[0][0];
    var startY = lineData[0][1];
    var scale = 50000;
    var pairToV3 = function(pair) {
        return new THREE.Vector3((startX - pair[0]) * scale, (startY - pair[1]) * scale, 0.0);
    };
    var pipeSpline = new THREE.SplineCurve3(lineData.map(pairToV3));    
    var nSegments = 1000;
    var radiusSegments = 3;
    var tubeGeom = new THREE.TubeGeometry(pipeSpline, nSegments, 2, radiusSegments, false);    
    // var tubeMesh = THREE.SceneUtils.createMultiMaterialObject(tubeGeom, [
    //     new THREE.MeshLambertMaterial({
    //         color: 0xff00ff
    //     }),
    //     new THREE.MeshBasicMaterial({
    //         color: 0x000000,
    //         opacity: 0.3,
    //         wireframe: true,
    //         transparent: true
    //     })]);
    var tubeMat = new THREE.MeshLambertMaterial({color: 0xff00ff});
    var tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
    tubeMesh.scale.set(1, 1, 6);
    return tubeMesh;
}

var lineData = [
          [
            24.956381637753,
            60.161521862322
          ],
          [
            24.956398601577,
            60.161485835716
          ],
          [
            24.956396516339,
            60.161414042317
          ],
          [
            24.956393909807,
            60.161324300567
          ],
          [
            24.956354248149,
            60.161198921921
          ],
          [
            24.956260568189,
            60.161073932936
          ],
          [
            24.956167670705,
            60.160975866408
          ],
          [
            24.956019973849,
            60.16085126686
          ],
          [
            24.955982398473,
            60.160797681504
          ],
          [
            24.955945083744,
            60.160753070314
          ],
          [
            24.955869412581,
            60.160627951191
          ],
          [
            24.955736859208,
            60.160404505524
          ],
          [
            24.955642142133,
            60.160243619362
          ],
          [
            24.955509852271,
            60.160029147626
          ],
          [
            24.955433924075,
            60.159895054054
          ],
          [
            24.955358256855,
            60.159769934613
          ],
          [
            24.955339209967,
            60.159734167656
          ],
          [
            24.955302157665,
            60.159698530453
          ],
          [
            24.955265105443,
            60.159662893239
          ],
          [
            24.955210308197,
            60.159636359939
          ],
          [
            24.955119500222,
            60.159610086084
          ],
          [
            24.955046697787,
            60.159583682446
          ],
          [
            24.954901873947,
            60.159557797594
          ],
          [
            24.954756790145,
            60.1595229384
          ],
          [
            24.954503414464,
            60.159479882792
          ],
          [
            24.953344057714,
            60.159245872194
          ],
          [
            24.952420081329,
            60.15905504083
          ],
          [
            24.951007129286,
            60.158768975407
          ],
          [
            24.950264782114,
            60.158630682262
          ],
          [
            24.949902354431,
            60.158552495417
          ],
          [
            24.949721270635,
            60.158517888719
          ],
          [
            24.949539928462,
            60.158474307576
          ],
          [
            24.949340840675,
            60.158439829327
          ],
          [
            24.949214289752,
            60.158422783483
          ],
          [
            24.949051470776,
            60.158397021135
          ],
          [
            24.948961188296,
            60.158388691432
          ],
          [
            24.948835154885,
            60.158389593623
          ],
          [
            24.947807074557,
            60.158334116158
          ],
          [
            24.946815523086,
            60.15829632192
          ],
          [
            24.945517120634,
            60.158233781211
          ],
          [
            24.945300806558,
            60.158226347924
          ],
          [
            24.945102239735,
            60.158209811708
          ],
          [
            24.944885925904,
            60.158202377743
          ],
          [
            24.943768091635,
            60.158156484786
          ],
          [
            24.94207308455,
            60.158078781397
          ],
          [
            24.941694217267,
            60.158054545295
          ],
          [
            24.941171570066,
            60.158040305079
          ],
          [
            24.94201771602,
            60.15929094032
          ],
          [
            24.941970815342,
            60.160799248054
          ],
          [
            24.941281402652,
            60.161252946834
          ],
          [
            24.940257276447,
            60.161969321312
          ],
          [
            24.939039889605,
            60.162857601242
          ],
          [
            24.938104936109,
            60.163546398705
          ],
          [
            24.93701068065,
            60.164335051612
          ],
          [
            24.9380656326,
            60.164695608393
          ],
          [
            24.942104296617,
            60.166094159608
          ],
          [
            24.943487384206,
            60.166586982043
          ],
          [
            24.942620603158,
            60.167140685331
          ],
          [
            24.941948306948,
            60.167567336787
          ],
          [
            24.94101148593,
            60.168193335013
          ],
          [
            24.940622185448,
            60.168438450152
          ],
          [
            24.938483615749,
            60.169880792259
          ],
          [
            24.938849980999,
            60.170093623103
          ],
          [
            24.939830017714,
            60.170346984675
          ],
          [
            24.94127272253,
            60.170399582864
          ],
          [
            24.942697163391,
            60.170443319199
          ],
          [
            24.944395126324,
            60.170601780699
          ],
          [
            24.945118935093,
            60.170713311712
          ],
          [
            24.947172572376,
            60.17133595561
          ],
          [
            24.947527973158,
            60.171791193904
          ],
          [
            24.949543589597,
            60.173589933266
          ],
          [
            24.950006091596,
            60.17400849393
          ],
          [
            24.950012530222,
            60.176728184455
          ],
          [
            24.95034560292,
            60.17827865041
          ],
          [
            24.950120591511,
            60.179222745271
          ],
          [
            24.949995117093,
            60.17986991783
          ],
          [
            24.949835558965,
            60.179960820946
          ],
          [
            24.94975221106,
            60.18019479445
          ],
          [
            24.949693872524,
            60.180670941369
          ],
          [
            24.949580703682,
            60.181120552765
          ],
          [
            24.950683517554,
            60.181866637647
          ],
          [
            24.953194308669,
            60.183311707367
          ],
          [
            24.952269041236,
            60.183722275056
          ],
          [
            24.951394433372,
            60.184015784514
          ],
          [
            24.951002689592,
            60.184180162405
          ],
          [
            24.951399809752,
            60.186071253966
          ],
          [
            24.95112939507,
            60.186692538479
          ],
          [
            24.949465573241,
            60.18649801104
          ],
          [
            24.948547062566,
            60.186522535038
          ],
          [
            24.948448866469,
            60.187492646454
          ],
          [
            24.948211239856,
            60.189253643189
          ],
          [
            24.947892280867,
            60.189444419077
          ],
          [
            24.94770102285,
            60.189688137888
          ],
          [
            24.945245720067,
            60.190809705915
          ],
          [
            24.944585587158,
            60.191047784423
          ],
          [
            24.94152404204,
            60.191150334364
          ],
          [
            24.940587885531,
            60.191192879797
          ],
          [
            24.94044395993,
            60.191202876268
          ],
          [
            24.939777886164,
            60.19123452488
          ],
          [
            24.939598170891,
            60.19125374998
          ],
          [
            24.939382666077,
            60.191282204286
          ],
          [
            24.939077815373,
            60.191338218769
          ],
          [
            24.938898611502,
            60.191375391281
          ],
          [
            24.938701896601,
            60.191430639454
          ],
          [
            24.938433601381,
            60.191504345733
          ],
          [
            24.93807621384,
            60.191614585506
          ],
          [
            24.937879752036,
            60.191678806645
          ],
          [
            24.937558918637,
            60.191806738529
          ],
          [
            24.936970547129,
            60.192035295521
          ],
          [
            24.936061322481,
            60.19239177819
          ],
          [
            24.936025786408,
            60.192409980922
          ],
          [
            24.934297140491,
            60.193113318272
          ],
          [
            24.931836485328,
            60.192798514799
          ],
          [
            24.930260299469,
            60.19252234615
          ]
        ];


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
