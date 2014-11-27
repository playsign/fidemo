var world = new VIZI.World({
  viewport: document.querySelector("#vizicities-viewport"),
  // center: new VIZI.LatLon(40.01000594412381, -105.2727379358738) // Collada
  // center: new VIZI.LatLon(65.0164696, 25.479259499999998) // Oulu
    center: new VIZI.LatLon(43.47195, -3.79909) // Santander
  // center: new VIZI.LatLon(43.462051, -3.800011) // Santander2
  // center: new VIZI.LatLon(60.1709611, 24.94067) // Helsinki
});

var controls = new VIZI.ControlsMap(world.camera);

// This configuration is the public-facing part of the API and will usually be the only part of it you ever need to deal with.
var mapConfig = {
  input: {
    type: "BlueprintInputMapTiles", // String representation of the input module you want to use (this is the same as the input module filename).
    options: { // Used to provide options for the input; in most cases this will at least include a path to the data source (local or remote).
      // tilePath: "https://a.tiles.mapbox.com/v3/examples.map-i86l3621/{z}/{x}/{y}@2x.png" // default
        tilePath: "https://a.tiles.mapbox.com/v4/tapanij.kai3hkpp/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q&update=i2x0h" // tapanij custom
    }
  },
  output: {
    type: "BlueprintOutputImageTiles", // String representation of the output module you want to use (this is the same as the output module filename).
    options: { // Used to provide options for the output.
      grids: [{
        zoom: 19,
        tilesPerDirection: 3,
        cullZoom: 17
      }, {
        zoom: 18,
        tilesPerDirection: 3,
        cullZoom: 16
      }, {
        zoom: 17,
        tilesPerDirection: 3,
        cullZoom: 15
      }, {
        zoom: 16,
        tilesPerDirection: 3,
        cullZoom: 14
      }, {
        zoom: 15,
        tilesPerDirection: 3,
        cullZoom: 13
      }, {
        zoom: 14,
        tilesPerDirection: 3,
        cullZoom: 12
      }, {
        zoom: 13,
        tilesPerDirection: 5,
        cullZoom: 11
      }]
    }
  },
  // Triggers are events that get fired at a certain point in time (eg. after initialisation, or after you've finished moving around the city)
  triggers: [{  
    // Nothing in the input should know about or be dependant on a specific output. 
    triggerObject: "output", // String defining whether this trigger is fired from the "input" or "output".
    triggerName: "initialised", // String defining the name of the trigger event (found in the documentation for the input or output).
    triggerArguments: ["tiles"], // String defining the names and order of the trigger arguments, if required (found in the documentation for the input or output).
    // Actions are methods that are called after a trigger event has been fired (eg. loading new data after you've finished moving, or outputting something when data is received) 
    actionObject: "input",  // String defining whether the action is to be called on the "input" or "output".
    actionName: "requestTiles", // String defining the name of the action (found in the documentation for the input or output).
    actionArguments: ["tiles"], // String defining the names and order of the action arguments, if required (found in the documentation for the input or output).
    // The actionOutput mappings differ slightly depending on whether the trigger arguments can be directly passed through or whether they require some processing.
    actionOutput: { // Object containing mappings between trigger arguments and action arguments (described below).
      // Loop through each item in tiles and return a new array of processed values "tiles"
      tiles: "tiles" // actionArg: triggerArg
    }
  }, {
    triggerObject: "output",
    triggerName: "gridUpdated",
    triggerArguments: ["tiles"],
    actionObject: "input",
    actionName: "requestTiles",
    actionArguments: ["tiles"],
    actionOutput: {
      tiles: "tiles" // actionArg: triggerArg
    }
  }, {
    triggerObject: "input",
    triggerName: "tileReceived",
    triggerArguments: ["image", "tile"],
    actionObject: "output",
    actionName: "outputImageTile",
    actionArguments: ["image", "tile"],
    actionOutput: {
      image: "image", // actionArg: triggerArg
      tile: "tile"
    }
  }]
};

var switchboardMap = new VIZI.BlueprintSwitchboard(mapConfig);
switchboardMap.addToWorld(world);

var sensorConfig = {
  input: {
    type: "BlueprintInputSensor",
    options: {
      path: "./data/nodeinfo.json"
    }
  },
  output: {
    type: "BlueprintOutputSensor",
    options: {
      // modelPathPrefix: "./data/"
    }
  },
  triggers: [{
    triggerObject: "output",
    triggerName: "initialised",
    triggerArguments: [],
    actionObject: "input",
    actionName: "requestData",
    actionArguments: [],
    actionOutput: {}
  }, {
    triggerObject: "input",
    triggerName: "dataReceived",
    triggerArguments: ["sensorsJSON"],
    actionObject: "output",
    actionName: "outputSensor",
    actionArguments: ["sensor"],
    actionOutput: {
      sensor: {
        // Loop through each item in triggerArg.kml and return a new array of processed values (a map)
        process: "map", // String representation of the transformation to be applied. Only "map" is supported right now.
        // Name of trigger argument
        itemsObject: "sensorsJSON", // String representation of the trigger argument that holds the data you're interested in.
        // Within sensor the data is stored in the document.placemark array
        itemsProperties: "sensors", // String representation of any object properties or array indices to get to the data list.
        // Return a new object for each document.placemark item with the given propertiea
        transformation: { // Object with a property for each action argument name and a string representation of the hierarchy to get from itemsProperties to the specific piece of data you require.
          // Eg. document.placemark[n].point.coordinates
          coordinates: ["geopos[0]", "geopos[1]"], // get coordinates from properties of the JSON          
          battery: "data.Battery",
          date: "data.Last update",
          light: "data.Light",
          node: "data.Node",
          temperature: "data.Temperature"
        }
      }
    }
  }]
};

var switchboardSensor = new VIZI.BlueprintSwitchboard(sensorConfig);
switchboardSensor.addToWorld(world);

var buildingsConfig = {
  input: {
    type: "BlueprintInputGeoJSON",
    options: {
      tilePath: "http://vector.mapzen.com/osm/buildings/{z}/{x}/{y}.json"
    }
  },
  output: {
    type: "BlueprintOutputBuildingTiles",
    options: {
      grids: [{
        zoom: 15,
        tilesPerDirection: 1,
        cullZoom: 13
      }],
      workerURL: "build/vizi-worker.min.js"
    }
  },
  triggers: [{
    triggerObject: "output",
    triggerName: "initialised",
    triggerArguments: ["tiles"],
    actionObject: "input",
    actionName: "requestTiles",
    actionArguments: ["tiles"],
    actionOutput: {
      tiles: "tiles" // actionArg: triggerArg
    }
  }, {
    triggerObject: "output",
    triggerName: "gridUpdated",
    triggerArguments: ["tiles"],
    actionObject: "input",
    actionName: "requestTiles",
    actionArguments: ["tiles"],
    actionOutput: {
      tiles: "tiles" // actionArg: triggerArg
    }
  }, {
    triggerObject: "input",
    triggerName: "tileReceived",
    triggerArguments: ["geoJSON", "tile"],
    actionObject: "output",
    actionName: "outputBuildingTile",
    actionArguments: ["buildings", "tile"],
    actionOutput: {
      buildings: {
        process: "map",
        itemsObject: "geoJSON",
        itemsProperties: "features",
        transformation: {
          outline: "geometry.coordinates",
          height: "properties.height"
        }
      },
      tile: "tile"
    }
  }]
};

var switchboardBuildings = new VIZI.BlueprintSwitchboard(buildingsConfig);
switchboardBuildings.addToWorld(world);

var choroplethConfig = {
  input: {
    type: "BlueprintInputGeoJSON",
    options: {
      path: "./data/sample.geojson"
    }
  },
  output: {
    type: "BlueprintOutputChoropleth",
    options: {
      colourRange: ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"],
      layer: 100
    }
  },
  triggers: [{
    triggerObject: "output",
    triggerName: "initialised",
    triggerArguments: [],
    actionObject: "input",
    actionName: "requestData",
    actionArguments: [],
    actionOutput: {}
  }, {
    triggerObject: "input",
    triggerName: "dataReceived",
    triggerArguments: ["geoJSON"],
    actionObject: "output",
    actionName: "outputChoropleth",
    actionArguments: ["data"],
    actionOutput: {
      data: {
        // Loop through each item in trigger.geoJSON and return a new array of processed values (a map)
        process: "map",
        itemsObject: "geoJSON",
        itemsProperties: "features",
        // Return a new object for each item with the given properties
        transformation: {
          outline: "geometry.coordinates[0]",
          value: "properties.POPDEN"
        }
      }
    }
  }]
};

var switchboardChoropleth = new VIZI.BlueprintSwitchboard(choroplethConfig);
switchboardChoropleth.addToWorld(world);

var clock = new VIZI.Clock();

var update = function() {
  var delta = clock.getDelta();

  world.onTick(delta);
  world.render();

  window.requestAnimationFrame(update);
};

update();
