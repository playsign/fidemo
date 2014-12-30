// Init WebTundra
// NOTE was: WebTundra ships with three r62 but it picks up the later included r69 from vizi.js!
// NOW: removed the three r62 from WTs deps and index.html has vizi, for three, first now

function noop() {}

// Global data object is used to share data between blueprints and Tundra-Client.
var globalData = {};
globalData.selection = 0;
globalData.ui = {};
globalData.ui.issueDialogs = [];
globalData.ui.dialogs = [];
globalData.ui.addDialog = function(dialog) {
    var index = -1;
    var dialogs = globalData.ui.issueDialogs;
    for(var i = 0; i < dialogs.length; ++i) {
        if (dialogs[i] == dialog) {
            index = i;
            break;
        }
    }
    if (index >= 0) {
        dialogs = dialogs.slice(index, 1);
    }
};
globalData.ui.removeDialog = function(dialog) {
    globalData.ui.issueDialogs.push(dialog);
};


try
{
    var client = tundra.createWebTundraClient(
    {
        container    : "#webtundra-container",
        renderSystem : ThreeJsRenderer,
        asset : {
            localStoragePath : "build/webtundra"
        },
        taskbar : true,
        console : true
    });

    // Let Tundra know about the Vizi camera
    if (world !== undefined && world.camera !== undefined && world.camera.camera !== undefined)
        client.renderer.camera = world.camera.camera;

    /* TundraClient onWebSocketConnectionClosed calls 'that.reset()' which clears scene
    -- we don't want that here, at least to support standalone dev, but probably not for prod either */
    client.reset = function() {
        client.log.infoC("client reset is a no-op now.");
    };

    var cbclient, demoapp, chat, userPresence;
    var infoDialog, usernameDialog;

    // Start menu initialize
    $.getScript("js/client/UI/StartMenu.js")
        .done(function(/*script, textStatus*/) {
            var start = new StartMenu("startmenu");
            globalData.ui.startMenu = start;

            start.OnClose.add(function(menu) {
                if (!globalData.ui.tutorialMenu.beenVisible)
                    globalData.ui.tutorialMenu.open();
            });

            $("#startmenu-button").button().click(function( event ) {
                event.preventDefault();
                start.open();
            });
        })
        .fail(function(jqxhr, settings, exception) {
            noop(jqxhr, settings);
            console.error(exception);
        });
    // Tutorial menu initialize
    $.getScript("js/client/UI/StartMenu.js")
        .done(function(/*script, textStatus*/) {
            var tutorial = new TutorialMenu("tutorialmenu");
            globalData.ui.tutorialMenu = tutorial;

            $("#tutorialmenu-button").button().click(function( event ) {
                    event.preventDefault();
                    tutorial.open();
            });
        })
        .fail(function(jqxhr, settings, exception) {
            noop(jqxhr, settings);
            console.error(exception);
        });
    // Start menu initialize
    $.getScript("js/client/UI/HeatMapBar.js")
        .done(function(/*script, textStatus*/) {
            var bar = new HeatMapBar();
            globalData.heatMapMenu = bar;
            $("#StartMenuButton").button().click(function( event ) {
                event.preventDefault();
                bar.open();
            });
        })
        .fail(function(jqxhr, settings, exception) {
            noop(jqxhr, settings);
            console.error(exception);
        });

    // Building material animation
    $.getScript("js/client/BuildingAnimation.js")
        .done(function(/*script, textStatus*/) {
            globalData.animator = new BuildingAnimation();
        })
        .fail(function(jqxhr, settings, exception) {
            noop(jqxhr, settings);
            console.error(exception);
        });

    // Apartment price map
    $.getScript("js/client/ApartmentPriceMap.js")
        .done(function(/*script, textStatus*/) {
            var priceMap = new PriceMap(new VIZI.LatLon(60.1431, 24.89018),
                                        new VIZI.LatLon(60.19559, 24.9902),
                                        10);
            for(var y = 0; y < priceMap.resolution; ++y)
                for(var x = 0; x < priceMap.resolution; ++x)
                    priceMap._setValue(x, y, 0.0);
            globalData.priceMap = priceMap;
        })
        .fail(function(jqxhr, settings, exception) {
            noop(jqxhr, settings);
            console.error(exception);
        });

    // Label application
    $.getScript("js/client/LabelCull.js")
        .done(function(/*script, textStatus*/) {
            globalData.labelCull = new LabelCull(globalData);
        })
        .fail(function(jqxhr, settings, exception) {
            noop(jqxhr, settings);
            console.error(exception);
        });

    // Fiware demo application
    $.getScript("js/client/tundra-client.js")
        .done(function(/*script, textStatus*/) {
            demoapp = new FiwareDemo();
            demoapp.globalData = globalData;
        })
        .fail(function(jqxhr, settings, exception) {
            noop(jqxhr, settings);
            console.error(exception);
        });

    // Context broker lib
    $.getScript("js/client/context-broker.js")
        .done(function(/*script, textStatus*/) {
            cbclient = new ContextBrokerClient();
            cbclient.runTests();
        })
        .fail(function(jqxhr, settings, exception) {
            noop(jqxhr, settings);
            console.error(exception);
        });

    // If connected to a server avatar and chat features will be available.
    client.onConnected(null, function()
    {
        // User presence (avatar)
        $.getScript("js/client/user-presence.js")
            .done(function(/*script, textStatus*/) {
                userPresence = new UserPresenceApplication();
            })
            .fail(function(jqxhr, settings, exception) {
                noop(jqxhr, settings);
                console.error(exception);
            });

        // Chat
        $.getScript("js/client/chat.js")
            .done(function(/*script, textStatus*/) {
                // Note that chat is not initialized fully until we're connected to the server.
                chat = new ChatApplication();
                // chat.initUi(); // Uncomment to test chat UI in standalone mode
                TundraSDK.framework.ui.addAction(); // for some reason must to this to get taskbar visible
            })
            .fail(function(jqxhr, settings, exception) {
                noop(jqxhr, settings);
                console.error(exception);
            });
    });

    // Disconnected from server
    client.onDisconnected(null, function() {
        // TODO hide chat/username functionality?
    });

    // Mouse pressed
    client.input.onMousePress(null, function(mouse) {
        if (!mouse.leftDown || mouse.targetNodeName !== "canvas")
            return;

        // var serverEnt = client.scene.entityByName("FIWARE Demo Application"); //"Test Cube");
        // if (serverEnt)
            // serverEnt.exec(EntityAction.Server, "TestAction");

        var result = client.renderer.raycast();
        //console.log(result.entity);
        if (result.entity !== null) //&& result.entity.name === "Boulder")
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

console.log("Client initialized:" + client);
T = TundraSDK.framework;

var loginProperties = {};
loginProperties.username = "fidemo-user" + Math.ceil(Math.random() * 100);
var loginHost = "ws://127.0.0.1:2345";
client.connect(loginHost, loginProperties);

var viewport = document.querySelector("#webtundra-container");
//var viewport = document.querySelector("#vizicities-viewport");

/* use WebTundra's scene & renderer */
threejs = {
    scene: TundraSDK.framework.renderer.scene,
    renderer: TundraSDK.framework.renderer.renderer
};

// threejs = null; //no overrides, vizicity creates scene & renderer

// COORDINATES

var santanderLatLon;
var helsinkiLatLon;

//NOTE: we have own cam controls & rendering - perhaps don't even need a VIZI cam?
var vizicam = new VIZI.Camera({
    aspect: viewport.clientWidth / viewport.clientHeight,
    near: 30,
    position: new VIZI.Point(0, 638, 724),
});


//original: new VIZI.LatLon(60.17096119799872, 24.94066956044796), // Helsinki
var helsinkiLatLon = new VIZI.LatLon(60.168770, 24.943573);

var world = new VIZI.World({
    viewport: viewport,
    // center: new VIZI.LatLon(40.01000594412381, -105.2727379358738), // Collada
    // center: new VIZI.LatLon(65.0164696, 25.479259499999998), // Oulu
    // center: santanderLatLon = new VIZI.LatLon(43.47195, -3.79909),
    center: helsinkiLatLon,
    threejs: threejs,
    camera: vizicam
});
globalData.world = world;
globalData.raycast = new Raycast(world);

// Let Tundra know about the camera
if (client !== undefined)
    client.renderer.camera = world.camera.camera;

// TODO Move Vizi attribution overlay to the top right corner, for now hide it altogether.
world.attribution.container.style.display = "none";

//var controls = new VIZI.ControlsMap(world.camera);
//var controls = new VIZI.ControlsOrbit(world.camera);
//override change emitting as the unload & load code is not good in 0.2.0 yet
//controls.onChange = function() {};
globalData.controls = new THREE.PanAndOrbitControls(world.camera.camera, TundraSDK.framework.renderer.renderer.domElement);
//globalData.controls.autoRotate = true;
globalData.controls.maxPolarAngle = 1.5534;

// MAP

// This configuration is the public-facing part of the API and will usually be the only part of it you ever need to deal with.
var mapConfig = {
  input: {
    type: "BlueprintInputMapTiles", // String representation of the input module you want to use (this is the same as the input module filename).
    options: { // Used to provide options for the input; in most cases this will at least include a path to the data source (local or remote).
        //tilePath: "https://a.tiles.mapbox.com/v3/examples.map-i86l3621/{z}/{x}/{y}@2x.png"
        tilePath: "https://a.tiles.mapbox.com/v4/ludocraft.1dadc7d9/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoibHVkb2NyYWZ0IiwiYSI6IlRNeFNyM3cifQ.-i0NBrmAHEYS7DcX1KR56w&update=i2x0h" // ludo
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


// DATA

if (santanderLatLon !== undefined) {
  // Santander
  var config = getSantanderConfig();

  var switchboardData = new VIZI.BlueprintSwitchboard(config);
  switchboardData.addToWorld(world);

  // heatmap
  var heatmapConfig = getHeatmapConfig();
  var switchboardHeatmap = new VIZI.BlueprintSwitchboard(heatmapConfig);
  switchboardHeatmap.addToWorld(world);
} else if(helsinkiLatLon){
  // Helsinki

  config = getHelsinkiConfig();
  config.output.options.globalData = globalData;

  var switchboardData = new VIZI.BlueprintSwitchboard(config);
  switchboardData.addToWorld(world);

  var streetLabelsConfig = getStreetLabelsConfig();
  streetLabelsConfig.output.options.globalData = globalData;
  var switchboardStreets = new VIZI.BlueprintSwitchboard(streetLabelsConfig);
  switchboardStreets.addToWorld(world);
}


// TREES

var treesConfig = getTreesConfig();

var switchboardTrees = new VIZI.BlueprintSwitchboard(treesConfig);
switchboardTrees.addToWorld(world);


globalData.pinView = new PinView();
globalData.currentPos = world.center;

// overpass data
globalData.overpassInputPath = function() {
    var dist = "300.0";
    return "http://overpass-api.de/api/interpreter?data=[out:json];((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22cafe%22];);(._;node(w);););out;"+
        "((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22bar%22];);(._;node(w);););out;" +
        "((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22restaurant%22];);(._;node(w);););out;" +
        "((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22library%22];);(._;node(w);););out;" +
        "((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22school%22];);(._;node(w);););out;" +
        "((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22university%22];);(._;node(w);););out;" +
        "((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22college%22];);(._;node(w);););out;" +
        "((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22kindergarten%22];);(._;node(w);););out;" +
        "((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22hospital%22];);(._;node(w);););out;" +
        "((node(around:"+dist+","+globalData.currentPos.lat+","+globalData.currentPos.lon+")[shop];);(._;node(w);););out;";
};

var overpassConfig = getOverpassConfig();

overpassConfig.input.options.globalData = globalData;
overpassConfig.output.options.globalData = globalData;

var switchboardOverpass = new VIZI.BlueprintSwitchboard(overpassConfig);
switchboardOverpass.addToWorld(world);



// BUILDING PRICES
var buildingPricesConfig = getBuildingPricesConfig();

buildingPricesConfig.output.options.globalData = globalData;

var min = 5000;
var max = 7000;

globalData.buildingPrices = {};
globalData.buildingPrices.min = min;
globalData.buildingPrices.max = max;

var switchboardBuildingPrices = new VIZI.BlueprintSwitchboard(buildingPricesConfig);
switchboardBuildingPrices.addToWorld(world);

// BUILDINGS
var highpolyBuildingsConfig = {
    buildings : [{
        model: "data/3d/rautatieasema.js",
        ids: ["122595198"]
    }, {
        model: "data/3d/tuomiokirkko.js",
        ids: ["4253123"]
    }, {
        model: "data/3d/eduskuntatalo.js",
        ids: ["158575956"]
    }, {
        model: "data/3d/kansallismuseo.js",
        ids: ["95a6c3df48"]
    }, {
        model: "data/3d/kiasma.js",
        ids: ["8042215"]
    }, {
        model: "data/3d/stockmann.js",
        ids: ["122595241"]
    }, {
        model: "",
        ids: [
            // tuomiokirkko
            "234872439", "234871242", "234870674",
            // eduskuntatalo
            "158575955", "89533460", "89533458", "89533457", "5387395028", "8b12ad8933", "c81f437c72", "f404ce2702", "2a1c7f9cf3", "89533449", "89533454", "89533455", "158968790", "89533451",
            // Kansallismuseo
            "28110845",
            // Kiasma
            "89538798", "89538802", "122595236", "122595218",
            // Postitalo
            "54401309", "54401321", "89534178", "89534180", "89534181", "89534183", "89534184", "ab3ff2b06d", "5622d83118",
            // Sokos-building
            "122595238", "89384331", "89384333", "89384389", "89384330", "89384334", "abaa32aa6f", "b2066d31dc", "b6819581d4"
            ]
    }]
};

var buildingsConfig = {
  input: {
    type: "BlueprintInputOverrideGeoJSON",
    options: {
        tilePath: "http://vector.mapzen.com/osm/buildings/{z}/{x}/{y}.json"
    }
  },
  output: {
    type: "BlueprintOutputFlatBuildingTiles", //BlueprintOutputBuildingTiles",
    options: {
      grids: [{
        zoom: 15,
        tilesPerDirection: 3,
        cullZoom: 13
      }],
      workerURL: "build/vizicities/vizi-worker.min.js",
      globalData: globalData,
      manualBuildings: highpolyBuildingsConfig
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
          height: "properties.height",
          id: "id"
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

//ROUTE LINES TEST

var routelinesConfig = {
  input: {
    type: "BlueprintInputGeoJSON",
    options: {
      path: "./data/routes.geojson"
    }
  },
  output: {
    type: "BlueprintOutputGeoJSONLines"
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
    actionName: "outputGeoJSONLines",
    actionArguments: ["data"],
    actionOutput: {
      data: {
        // Loop through each item in trigger.geoJSON and return a new array of processed values (a map)
        process: "map",
        itemsObject: "geoJSON",
        itemsProperties: "features",
        // Return a new object for each item with the given properties
        transformation: {
          linecoords: "geometry.coordinates",
          value: "properties.POPDEN"
        }
      }
    }
  }]
};

var switchboardGeoJSONLines = new VIZI.BlueprintSwitchboard(routelinesConfig);
switchboardGeoJSONLines.addToWorld(world);

/* geopositioned -> scene converted positions for test/reference
debugObject(60.17096119799872, 24.94066956044796); //Helsinki start center
debugObject(60.170040, 24.936350); //Lasipalatsinaukion tötsä
debugObject(60.171680, 24.943881); //Rautatientorin patsas
*/

//lights & sky/clearcolor & fog
function addEnvironment(scene, renderer) {
    var directionalLight = new THREE.DirectionalLight( 0x999999 );
    // directionalLight.intensity = 0.1; // TODO this was typoed as 'intesity' but 0.1 value for intensity doesn't look that hot
    directionalLight.position.x = 1;
    directionalLight.position.y = 1;
    directionalLight.position.z = 1;
    scene.add(directionalLight);

    var directionalLight2 = new THREE.DirectionalLight( 0x999999 );
    // directionalLight2.intensity = 0.1; // TODO this was typoed as 'intesity' but 0.1 value for intensity doesn't look that hot
    directionalLight2.position.x = -1;
    directionalLight2.position.y = 1;
    directionalLight2.position.z = -1;
    scene.add(directionalLight2);

    var fogColour = 0xFFFFFF;
    scene.fog = new THREE.Fog(fogColour, 1, 15000);
    renderer.setClearColor(scene.fog.color, 1);
}
addEnvironment(threejs.scene, threejs.renderer);

var clock = new VIZI.Clock();

var update = function() {
    var delta = clock.getDelta();

    world.onTick(delta);
    globalData.pinView.onTick(delta);
    globalData.controls.update(delta);
    // world.render();
    //render ourself now that we create (or pass) the scene & renderer
    threejs.renderer.render(threejs.scene, world.camera.camera);

    window.requestAnimationFrame(update); //is this really best as first like a rumour says?
};

update();
