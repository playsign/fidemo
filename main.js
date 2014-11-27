
// Init WebTundra
// note: WebTundra ships with three r62 but it picks up the later included r69 from vizi.js!
try
{
  var client = tundra.createWebTundraClient({
    container    : "#webtundra-container",
    renderSystem : ThreeJsRenderer,
    asset : {
      localStoragePath : "build/webtundra"
    },
    taskbar : false,
    console : false
  });

  var freecamera = undefined;
  var demoapp = undefined;

  // Free camera application
  $.getScript("build/webtundra/application/freecamera.js")
    .done(function(script, textStatus) {
      freecamera = new FreeCameraApplication();
    })
    .fail(function(jqxhr, settings, exception) {
      console.error(exception);
    }
  );

  // Fiware demo application
  $.getScript("js/client/tundra-client.js")
    .done(function(script, textStatus) {
      demoapp = new FiwareDemo();
    })
    .fail(function(jqxhr, settings, exception) {
      console.error(exception);
    }
  );
}
catch(e)
{
  console.error("WebTundra initialization failed");
  console.error(e.stack);
}

var world = new VIZI.World({
  viewport: document.querySelector("#vizicities-viewport"),
  // center: new VIZI.LatLon(40.01000594412381, -105.2727379358738) // Collada
  // center: new VIZI.LatLon(65.0164696, 25.479259499999998) // Oulu
  // center: new VIZI.LatLon(43.47195, -3.79909) // Santander
  // center: new VIZI.LatLon(43.462051, -3.800011) // Santander2
    center: new VIZI.LatLon(60.17096119799872, 24.94066956044796) // Helsinki
});

var controls = new VIZI.ControlsMap(world.camera);

var mapConfig = {
  input: {
    type: "BlueprintInputMapTiles",
    options: {
      // tilePath: "https://a.tiles.mapbox.com/v3/examples.map-i86l3621/{z}/{x}/{y}@2x.png" // default
        tilePath: "https://a.tiles.mapbox.com/v4/tapanij.kai3hkpp/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q&update=i2x0h" // tapanij custom
    }
  },
  output: {
    type: "BlueprintOutputImageTiles",
    options: {
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
      workerURL: "build/vizicities/vizi-worker.min.js"
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

debugObject(60.17096119799872, 24.94066956044796); //Helsinki start center
debugObject(60.170040, 24.936350); //Lasipalatsinaukion tötsä
debugObject(60.171680, 24.943881); //Rautatientorin patsas

var clock = new VIZI.Clock();

var update = function() {
  var delta = clock.getDelta();

  world.onTick(delta);
  world.render();

  window.requestAnimationFrame(update);
};

update();
