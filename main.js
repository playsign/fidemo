// Init WebTundra
// NOTE was: WebTundra ships with three r62 but it picks up the later included r69 from vizi.js!
// NOW: removed the three r62 from WTs deps and index.html has vizi, for three, first now
try
{
  var client = tundra.createWebTundraClient({
    container    : "#webtundra-container",
    renderSystem : ThreeJsRenderer,
    asset : {
      localStoragePath : "build/webtundra"
    },
    taskbar : false,
    console : true
  });

  var freecamera = undefined;
  var demoapp = undefined;
  var cbclient = undefined;

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

  // Context broker lib
  $.getScript("js/client/context-broker.js")
    .done(function(script, textStatus) {
      cbclient = new ContextBrokerClient();
      cbclient.runTests();

    })
    .fail(function(jqxhr, settings, exception) {
      console.error(exception);
    }
  );

    // Connected to server
    client.onConnected(null, function() {
        // Setup initial camera position
        if (freecamera && freecamera.cameraEntity)
            freecamera.cameraEntity.placeable.setPosition(0, 8.50, 28.50);

        instructions = $("<div/>", {
            text : "Click anywhere to jump the big plane up & down",
            css : {
                "position": "absolute",
                "width": 360,
                "background-color": "white",
                "top": 10,
                "left": 10,
                "padding": 10,
                "border-radius": 10,
                "text-align": "center"
            }
        });
        client.ui.addWidgetToScene(instructions);
        instructions.hide();
        instructions.fadeIn(5000);

        //var dirLight = new THREE.DirectionalLight();
        //client.renderer.scene.add(dirLight);
    });

    // Disconnected from server
    client.onDisconnected(null, function() {
        if (instructions)
            instructions.remove()
        instructions = null;
    });

    // Mouse pressed
    client.input.onMousePress(null, function(mouse) {
	console.log("onMousePress");
        if (!mouse.leftDown)
            return;

	var serverEnt = client.scene.entityByName("FIWARE Demo Application"); //"Test Cube");
	serverEnt.exec(EntityAction.Server, "TestAction");

        var result = client.renderer.raycast();
	console.log(result);
        if (result.entity != null) //&& result.entity.name === "Boulder")
        {
            result.entity.exec(EntityAction.Server, "MousePress");
        }
    });
}
catch(e)
{
  console.error("WebTundra initialization failed");
  console.error(e.stack);
}

console.log("Client inited:" + client);
T = TundraSDK.framework;

var loginProperties = {};
loginProperties.username = "fidemo-user";
var loginHost = "ws://127.0.0.1:2345";
client.connect(loginHost, loginProperties);

var viewport = document.querySelector("#webtundra-container");
//var viewport = document.querySelector("#vizicities-viewport");

//Three.JS Scene & Renderer to be passed to Vizi

/*
//creating the scene here - that's perhaps nicest anyway, can pass it to WT then too
function createScene() {
    var scene = new THREE.Scene();

    // TODO: Fog distance should be an option
    //scene.fog = new THREE.Fog(self.options.fogColour, 1, 15000);

    // TODO: Make this more customisable, perhaps as a "day/night" option
    // - I'm sure people would want to add their own lighting too
    // TODO: Should this even be in here?
    var directionalLight = new THREE.DirectionalLight( 0x999999 );
    directionalLight.intesity = 0.1;
    directionalLight.position.x = 1;
    directionalLight.position.y = 1;
    directionalLight.position.z = 1;

    scene.add(directionalLight);

    var directionalLight2 = new THREE.DirectionalLight( 0x999999 );
    directionalLight2.intesity = 0.1;
    directionalLight2.position.x = -1;
    directionalLight2.position.y = 1;
    directionalLight2.position.z = -1;

    scene.add(directionalLight2);

    return scene;
}

function createRenderer(viewport, scene) {
    var renderer;

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    //renderer.setClearColor(scene.fog.color, 1);

    // Gamma settings make things look 'nicer' for some reason
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    viewport.appendChild(renderer.domElement);

    return renderer;
}
*/

/* use WebTundra's scene & renderer */
threejs = {
    scene: TundraSDK.framework.renderer.scene,
    renderer: TundraSDK.framework.renderer.renderer
}

/* use the local code here to create for this app
var fidemo_scene = createScene() //need to pass to renderer so can't be in same decl below
threejs = {
    scene: fidemo_scene,
    renderer: createRenderer(viewport, fidemo_scene)
}
console.log("FIDEMO: created scene", threejs.scene);
*/

// threejs = null; //no overrides, vizicity creates scene & renderer

var santanderLatLon;
var helsinkiLatLon;

var world = new VIZI.World({
  viewport: viewport,
  // center: new VIZI.LatLon(40.01000594412381, -105.2727379358738), // Collada
  // center: new VIZI.LatLon(65.0164696, 25.479259499999998), // Oulu
  // center: santanderLatLon = new VIZI.LatLon(43.47195, -3.79909),
  // center: new VIZI.LatLon(43.462051, -3.800011), // Santander2
    center: helsinkiLatLon = new VIZI.LatLon(60.17096119799872, 24.94066956044796), // Helsinki
    threejs: threejs
});

var controls = new VIZI.ControlsMap(world.camera);


// MAP

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


// SENSOR

if (santanderLatLon !== undefined) {
  // Santander
  var config = getSantanderConfig();

  var switchboardSensor = new VIZI.BlueprintSwitchboard(config);
  switchboardSensor.addToWorld(world);

  // heatmap
  var heatmapConfig = getHeatmapConfig();
  var switchboardHeatmap = new VIZI.BlueprintSwitchboard(heatmapConfig);
  switchboardHeatmap.addToWorld(world);
} else if(helsinkiLatLon){
  // Helsinki

  var config = getHelsinkiConfig();

  var switchboardSensor = new VIZI.BlueprintSwitchboard(config);
  switchboardSensor.addToWorld(world);
}

// BUILDINGS

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


// CHOROPLET

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

/* geopositioned -> scene converted positions for test/reference
debugObject(60.17096119799872, 24.94066956044796); //Helsinki start center
debugObject(60.170040, 24.936350); //Lasipalatsinaukion tötsä
debugObject(60.171680, 24.943881); //Rautatientorin patsas
*/

//lights
function addLights(scene) {
    var directionalLight = new THREE.DirectionalLight( 0x999999 );
    directionalLight.intesity = 0.1;
    directionalLight.position.x = 1;
    directionalLight.position.y = 1;
    directionalLight.position.z = 1;

    scene.add(directionalLight);

    var directionalLight2 = new THREE.DirectionalLight( 0x999999 );
    directionalLight2.intesity = 0.1;
    directionalLight2.position.x = -1;
    directionalLight2.position.y = 1;
    directionalLight2.position.z = -1;

    scene.add(directionalLight2);
}
addLights(world.scene.scene);

var clock = new VIZI.Clock();

var update = function() {
    var delta = clock.getDelta();

    world.onTick(delta);
    // world.render();
    //render ourself now that we create (or pass) the scene & renderer
    threejs.renderer.render(threejs.scene, world.camera.camera);

    window.requestAnimationFrame(update); //is this really best as first like a rumour says?
};

update();
