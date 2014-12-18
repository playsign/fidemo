/* globals window, _, VIZI, THREE, operative */
(function() {
  "use strict";

/**
 * Blueprint building tiles output
 * @author Robin Hawkes - vizicities.com
 */  

  // output: {
  //   type: "BlueprintOutputBuildingTiles",
  //   options: {
  //     grids: [{
  //       zoom: 19,
  //       tilesPerDirection: 3,
  //       cullZoom: 15
  //     },
  //     ...
  //   }
  // }
  VIZI.BlueprintOutputFlatBuildingTiles = function(options) {
    var self = this;

    VIZI.BlueprintOutput.call(self, options);

    _.defaults(self.options, {
      workerURL: "vizi-worker.min.js"
    });

    // Triggers and actions reference
    self.triggers = [
      {name: "initialised", arguments: ["tiles"]},
      {name: "gridUpdated", arguments: ["tiles"]}
    ];

    self.actions = [
      {name: "outputBuildingTile", arguments: ["buildings", "tile"]}
    ];

    // Grids
    // {16: {
    //   grid: VIZI.BlueprintHelperTileGrid,
    //   mesh: THREE.Object3D
    // }, ...}
    self.grids = {};

    self.world;
    self.worker;
  };

  VIZI.BlueprintOutputFlatBuildingTiles.prototype = Object.create( VIZI.BlueprintOutput.prototype );

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputFlatBuildingTiles.prototype.init = function() {
    var self = this;

    self.worker = operative(self.outputBuildingTileWorker, [
      self.options.workerURL
    ]);

    // Create grids
    _.each(self.options.grids, function(grid) {
      self.grids[grid.zoom] = self.createGrid(grid);
    });

    var combinedTiles = [];

    _.each(self.grids, function(gridHash) {
      combinedTiles = combinedTiles.concat(gridHash.grid.tiles);
    });

    self.emit("initialised", combinedTiles);
  };

  VIZI.BlueprintOutputFlatBuildingTiles.prototype.createGrid = function(gridOptions) {
    var self = this;

    var gridOutput = {};

    var grid = new VIZI.BlueprintHelperTileGrid(self.world, gridOptions);

    grid.on("moved", function(tiles, diff) {
      if (VIZI.DEBUG) console.log("Grid moved", tiles, diff);

      // TODO: Animate building heights before removing them
      _.each(gridOutput.meshes, function(mesh) {
        self.remove(mesh);
      });

      // TODO: Check whether this is enough to remove references to the old mesh
      gridOutput.meshes = [];

      // Only emit update event if grid is enabled
      if (!grid.disable) {
        self.emit("gridUpdated", tiles);
      }
    });

    grid.on("disabled", function() {
      if (VIZI.DEBUG) console.log("Grid disabled");

      _.each(gridOutput.meshes, function(mesh) {
        mesh.visible = false;
      });
    });
    
    // TODO: Either remove previous tiles or prevent event if grid hasn't moved
    // There's a huge hang-up when zooming in due to re-loading and processing tiles
    grid.on("enabled", function() {
      if (VIZI.DEBUG) console.log("Grid enabled");

      self.emit("gridUpdated", grid.tiles);

      // TODO: Animate building heights when making them visible again
      _.each(gridOutput.meshes, function(mesh) {
        mesh.visible = true;
      });
    });

    var tiles = grid.init();

    if (VIZI.DEBUG) console.log("Grid initialised", tiles);

    gridOutput.grid = grid;
    gridOutput.meshes = [];

    return gridOutput;
  };

  // Building
  // {
  //   outline: [...],
  //   height: 123
  // }

  // TODO: Cache processed tile
  // TODO: Use cached tile if available
  // TODO: Animate building heights on load
  VIZI.BlueprintOutputFlatBuildingTiles.prototype.outputBuildingTile = function(buildings, tile) {
    var self = this;

    // Find grid
    var gridHash = self.grids[tile.z];

    var loader = new THREE.JSONLoader();
	
    var material = null;
    if (self.options.globalData != null && self.options.globalData.animator != null)
    {
        material = self.options.globalData.animator.material;
    }
    else
    {
        material = new THREE.MeshLambertMaterial({
            color: 0xeeeeee,
            ambient: 0x0000ff,
            shading: THREE.FlatShading,
            vertexColors:THREE.VertexColors,
            fragmentShader: (document.getElementById( 'fs-effect' ).textContent)
        });
    }

    // Load buildings in a Web Worker
    self.worker(self.world.origin, self.world.originZoom, buildings, self.options.manualBuildings, self.options.globalData.priceMap).then(function(result) {
      var model = result.model;
      var offset = result.offset;

      // Convert typed data back to arrays
      model.vertices = Array.apply( [], model.vertices );
      model.normals = Array.apply( [], model.normals );
      model.colors = Array.apply( [], model.colors );
      // Wrap UVs within an array
      // https://github.com/mrdoob/three.js/blob/master/examples/js/exporters/GeometryExporter.js#L231
      model.uvs = [ Array.apply( [], model.uvs ) ];
      
      //model.vertices[i].y = model.vertices[i].y + 1;

      // Keep getting a "Maximum call stack size exceeded" error here
      //model.faces = Array.apply( [], model.faces );
      var faces = [];
      _.each(model.faces, function(face) {
        faces.push(face);
      });

      model.faces = faces;

      // TODO: Stop this locking up the browser
      // No visible lock up at all when removed
      var geom = loader.parse(model);
      
      //moves building's pivot points to compensate position offset
      for (var i = 0 ; i < geom.geometry.faceVertexUvs[0].length; i=i+2) {
        for (var j = 0; j < 2; j++) {
          for(var k = 0 ; k < 3 ; k++){
            geom.geometry.faceVertexUvs[0][i+j][k].x += offset.x;
            geom.geometry.faceVertexUvs[0][i+j][k].y += offset.z;
            geom.geometry.faceVertexUvs[0][i+j][k].z += 0 ;
          }
        }
      }
      
      var mesh = new THREE.Mesh(geom.geometry, material);

      // Use previously calculated offset to return merged mesh to correct position
      // This allows frustum culling to work correctly
      mesh.position.x = -1 * offset.x;
      mesh.position.y = -1 * offset.y;
      mesh.position.z = -1 * offset.z;

      gridHash.meshes.push(mesh);

      // TODO: Make sure coordinate space is right
      self.add(mesh);

      _.each(result.highPolyModels, function(building) {
        if (building.model !== "") {
            console.log("Loading " + building.model + " model.");
            // TODO Making functions within loop is bad.
            loader.load( building.model, function(geometry, materials) {
                console.log(building.model + " loaded.");
                var mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
                mesh.scale.set( 0.8582932963847628, 0.8582932963847628, 0.8582932963847628 );
                mesh.position.x = building.position.x;
                mesh.position.z = building.position.y;
                self.add(mesh);
                //TundraSDK.framework.renderer.scene.add( mesh );
            });
         }
       });
    }, function(failure) {
      // ...
    });

    // Dead code from move to Web Worker processor (31/10/2014)

    // var combinedGeom = new THREE.Geometry();

    // // TODO: Remove manual, hard-baked height-related stuff
    // var metersPerLevel = 3;

    // // TODO: Remove forced office scaling
    // var scalingFactor = 1.45;
    // // var scalingFactor = (tags["building"] === "office") ? 1.45 : 1;

    // // Local pixels per meter - set once per tile
    // var pixelsPerMeter;

    // _.each(buildings, function(feature) {
    //   var offset = new VIZI.Point();
    //   var shape = new THREE.Shape();

    //   // TODO: Don't manually use first set of coordinates (index 0)
    //   _.each(feature.outline[0], function(coord, index) {
    //     var latLon = new VIZI.LatLon(coord[1], coord[0]);
    //     var geoCoord = self.world.project(latLon);

    //     // Set local pixels per meter if not set
    //     if (pixelsPerMeter === undefined) {
    //       pixelsPerMeter = self.world.pixelsPerMeter(latLon);
    //     }

    //     if (offset.length === 0) {
    //       offset.x = -1 * geoCoord.x;
    //       offset.y = -1 * geoCoord.y;
    //     }

    //     // Move if first coordinate
    //     if (index === 0) {
    //       shape.moveTo( geoCoord.x + offset.x, geoCoord.y + offset.y );
    //     } else {
    //       shape.lineTo( geoCoord.x + offset.x, geoCoord.y + offset.y );
    //     }
    //   });

    //   // TODO: Don't have random height logic in here
    //   var height = (feature.height) ? feature.height : 5 + Math.random() * 10;

    //   // TODO: Add floor/level-based heights
    //   // << rounds the height down
    //   // var height = (feature.height * metersPerLevel * scalingFactor << 0);
      
    //   // Multiply height in meters by pixels per meter ratio at latitude
    //   height *= pixelsPerMeter.y;

    //   var extrudeSettings = { amount: height, bevelEnabled: false };
      
    //   var geom = new THREE.ExtrudeGeometry( shape, extrudeSettings );
    //   geom.computeFaceNormals();
      
    //   var mesh = new THREE.Mesh(geom);

    //   mesh.position.y = height;

    //   // Offset
    //   mesh.position.x = -1 * offset.x;
    //   mesh.position.z = -1 * offset.y;

    //   // Flip as they are up-side down
    //   mesh.rotation.x = 90 * Math.PI / 180;

    //   mesh.matrixAutoUpdate && mesh.updateMatrix();
    //   combinedGeom.merge(mesh.geometry, mesh.matrix);
    // });

    // // Move merged geom to 0,0 and return offset
    // var offset = combinedGeom.center();

    // var combinedMesh = new THREE.Mesh(combinedGeom, material);

    // // Use previously calculated offset to return merged mesh to correct position
    // // This allows frustum culling to work correctly
    // combinedMesh.position.x = -1 * offset.x;

    // // Removed for scale center to be correct
    // // Offset with applyMatrix above
    // combinedMesh.position.y = -1 * offset.y;

    // combinedMesh.position.z = -1 * offset.z;

    // gridHash.meshes.push(combinedMesh);

    // TODO: Make sure coordinate space is right
    // self.add(combinedMesh);
  };

  // TODO: Is this running before the Blueprint is initialised and taking up unnecessary memory?
  // TODO: Find a better way to replicate World state (origin, origin zoom, CRS, etc) so it doesn't have to be duplicated for every Blueprint
  VIZI.BlueprintOutputFlatBuildingTiles.prototype.outputBuildingTileWorker = function(origin, originZoom, buildings, manualBuildings, priceMap) {
    var self = this;
    var deferred = self.deferred();
    var pMap = priceMap;

    // Set up CRS to replicate main thread
    var crs = VIZI.CRS.EPSG3857;

    // Proxy world project (normal project - world origin)
    // TODO: Find a better way so this doesn't have to be duplicated for every Blueprint
    var project = function(latLon, zoom) {
      zoom = zoom || originZoom;

      // TODO: Are there ramifications to rounding the pixels?
      var originPoint = crs.latLonToPoint(origin, zoom, {round: true});
      var projected = crs.latLonToPoint(latLon, zoom, {round: true});

      return projected.subtract(originPoint);
    };

    // Proxy world pixelPerMeter
    // TODO: Find a better way so this doesn't have to be duplicated for every Blueprint
    var pixelsPerMeter = function(latLon, zoom) {
      zoom = zoom || originZoom; 
      return crs.pixelsPerMeter(latLon, zoom);
    };

    var combinedGeom = new THREE.Geometry();

    // TODO: Remove manual, hard-baked height-related stuff
    var metersPerLevel = 3;

    // TODO: Remove forced office scaling
    var scalingFactor = 1.45;
    // var scalingFactor = (tags["building"] === "office") ? 1.45 : 1;

    // Local pixels per meter - set once per tile
    var ppm;
    //console.log(manualBuildings);
    var highPolyModels = [];
    var found = false;
    var building;
      
    _.each(buildings, function(feature) {
      found = false;
      building = null;
      
      if (manualBuildings) {
          // TODO: better logic for finding ids
          found = _.find(manualBuildings.buildings, function( value ) {
            return _.find(value.ids, function( id ) {
                if (id == feature.id) {
                  building = value;
                  return true;
                }
                return false;
            });
          });
      }
          
      if (found) {
        if (feature.outline[0].length > 0) {
            var position = new VIZI.Point(0, 0);
            // Get center of feature outline
            _.each(feature.outline[0], function(coord, index) {
              var latLon = new VIZI.LatLon(coord[1], coord[0]);
              var geoCoord = project(latLon);
              position.x += geoCoord.x;
              position.y += geoCoord.y;
            });
            
            //console.log(building.model + "  " + feature.id + "  " + position.x + "  " + position.y + "  " + feature.outline[0].length);
            // Round, since vizicity itself also rounds.
            position.x = Math.round(position.x / feature.outline[0].length);
            position.y = Math.round(position.y / feature.outline[0].length);
            highPolyModels.push({ model: building.model, position:position });
          }
      }

      if (!found) {
          var offset = new VIZI.Point();
          var shape = new THREE.Shape();
          var points = [];
          var lat = 0.0, lon = 0.0, count = 0;
          // TODO: Don't manually use first set of coordinates (index 0)
          _.each(feature.outline[0], function(coord, index) {
            var latLon = new VIZI.LatLon(coord[1], coord[0]);
            var geoCoord = project(latLon);

            // Set local pixels per meter if not set
            if (ppm === undefined) {
              ppm = pixelsPerMeter(latLon);
            }

            if (offset.length === 0) {
              offset.x = -1 * geoCoord.x;
              offset.y = -1 * geoCoord.y;
            }
            
            points.push(new THREE.Vector2(geoCoord.x + offset.x, geoCoord.y + offset.y));
            
            // Move if first coordinate
            if (index === 0) {
              shape.moveTo( geoCoord.x + offset.x, geoCoord.y + offset.y );
            } else {
              shape.lineTo( geoCoord.x + offset.x, geoCoord.y + offset.y );
            }
            
            lat += latLon.lat;
            lon += latLon.lon;
            count++;
          });
          lat = lat / count;
          lon = lon / count;

          // TODO: Don't have random height logic in here
          var height = (feature.height) ? feature.height : 5 + Math.random() * 10;

          // TODO: Add floor/level-based heights
          // << rounds the height down
          // var height = (feature.height * metersPerLevel * scalingFactor << 0);
          
          // Multiply height in meters by pixels per meter ratio at latitude
          height *= ppm.y;

          var extrudeSettings = { amount: height, bevelEnabled: false };
          
          var geom = new THREE.ExtrudeGeometry( shape, extrudeSettings );
          geom.computeFaceNormals();
          
          var mesh = new THREE.Mesh(geom);
          var f, n;
          
          var getValue = function(map, lat, lon) {
                var p = {x:0,y:0};
                if (lat >= map.latLongMax.lat)
                    p.x = 1.0;
                else if(lat <= map.latLongMin.lat)
                    p.x = 0.0;
                else
                    p.x = (lat - map.latLongMin.lat)/(map.latLongMax.lat - map.latLongMin.lat);

                if (lon >= map.latLongMax.lon)
                    p.y = 1.0;
                else if(lon <= map.latLongMin.lon)
                    p.y = 0.0;
                else
                    p.y = (lon - map.latLongMin.lon)/(map.latLongMax.lon - map.latLongMin.lon);
                
                var x = Math.round(p.x * map.resolution);
                var y = Math.round(p.y * map.resolution);
                return map.data[x + (map.resolution * y)];
          };
          
          var value = count > 0 ? getValue(priceMap, lat, lon) : 0.0;
          for ( var i = 0; i < mesh.geometry.faces.length; i++ ) {

              f  = mesh.geometry.faces[i];
              n = ( f instanceof THREE.Face3 ) ? 3 : 4;
              for( var j = 0; j < n; j++ ) {
                  color = new THREE.Color(value, value, value);
                  f.vertexColors[ j ] = color;
              }
          }

          mesh.position.y = height;

          // Offset
          mesh.position.x = -1 * offset.x;
          mesh.position.z = -1 * offset.y;

          // Flip as they are up-side down
          mesh.rotation.x = 90 * Math.PI / 180;
          
          
          mesh.matrixAutoUpdate && mesh.updateMatrix();
          
          var avgpivot = new THREE.Vector2(0.0, 0.0);
          for(var i = 0 ; i < points.length ; i++){
            avgpivot.add(points[i]);
          }
          avgpivot.divideScalar(points.length);

          // Buildings' animated shader needs to store mesh position to to uv coordinates
          // so that we can animate mesh height change when a building is highlighted
          var pos = mesh.position;
          for (var i = 0 ; i < geom.faceVertexUvs[0].length; i=i+2) {
            for (var j = 0; j < 2; j++) {
              for(var k = 0 ; k < 3 ; k++){
                geom.faceVertexUvs[0][i+j][k].x = avgpivot.x;
                geom.faceVertexUvs[0][i+j][k].y = avgpivot.y;
                geom.faceVertexUvs[0][i+j][k].z = 0 ;
              }
            }
          }
          mesh.uvsNeedUpdate = true;
          
          combinedGeom.merge(mesh.geometry, mesh.matrix);
          //console.log(combinedGeom);
      }
    });

    // Move merged geom to 0,0 and return offset
    var offset = combinedGeom.center();
   
    var exportedGeom = combinedGeom.toJSON();

    // Convert exported geom into a typed array
    var verticesArray = new Float64Array( exportedGeom.data.vertices );
    var normalsArray = new Float64Array( exportedGeom.data.normals );
    //var vertexColorsArray = new Float64Array( exportedGeom.data.color );
    var colorsArray = new Float64Array( exportedGeom.data.colors );
    // Seems to be manually set to have 1 array in the uvs array
    // https://github.com/mrdoob/three.js/blob/master/examples/js/exporters/GeometryExporter.js#L231
    var uvsArray;
    if (exportedGeom.data.uvs)
        uvsArray = new Float64Array( exportedGeom.data.uvs[0] );
    else
        uvsArray = new Float64Array();
    var facesArray = new Float64Array( exportedGeom.data.faces );

    // Store geom typed array as Three.js model object
    var model = {
      metadata: exportedGeom.metadata,
      colors: colorsArray,//exportedGeom.colors,
      vertices: verticesArray,
      normals: normalsArray,
      uvs: uvsArray,
      faces: facesArray
    };

    var data = {model: model, offset: offset, highPolyModels: highPolyModels};

    deferred.transferResolve(data, [model.vertices.buffer, model.normals.buffer, model.uvs.buffer, model.faces.buffer, model.colors.buffer]);
  };

  VIZI.BlueprintOutputFlatBuildingTiles.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
}());