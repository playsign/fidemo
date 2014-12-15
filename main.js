// Init WebTundra
// NOTE was: WebTundra ships with three r62 but it picks up the later included r69 from vizi.js!
// NOW: removed the three r62 from WTs deps and index.html has vizi, for three, first now

// Global data object is used to share data between blueprints and Tundra-Client.
var globalData = {};

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

    /* TundraClient onWebSocketConnectionClosed calls 'that.reset()' which clears scene
    -- we don't want that here, at least to support standalone dev, but probably not for prod either */
    client.reset = function() {
        client.log.infoC("client reset is a no-op now.");
    };

    var freecamera, cbclient, demoapp, chat, userPresence, animator;
    var infoDialog, usernameDialog;

    // Free camera application
    $.getScript("js/client/BuildingAnimation.js")
        .done(function(/*script, textStatus*/) {
            globalData.animator = new BuildingAnimation();
        })
        .fail(function(jqxhr, settings, exception) {
            console.error(exception);
        });

    // Label application
    $.getScript("js/client/LabelCull.js")
        .done(function(/*script, textStatus*/) {
            globalData.labelCull = new LabelCull(globalData);
        })
        .fail(function(jqxhr, settings, exception) {
            console.error(exception);
        });
        
    // Free camera application
    $.getScript("build/webtundra/application/freecamera.js")
        .done(function(/*script, textStatus*/) {
            freecamera = new FreeCameraApplication();
        })
        .fail(function(jqxhr, settings, exception) {
            console.error(exception);
        });

    // Fiware demo application
    $.getScript("js/client/tundra-client.js")
        .done(function(/*script, textStatus*/) {
            demoapp = new FiwareDemo();
            demoapp.globalData = globalData;
        })
        .fail(function(jqxhr, settings, exception) {
            console.error(exception);
        });

    // Context broker lib
    $.getScript("js/client/context-broker.js")
        .done(function(/*script, textStatus*/) {
            cbclient = new ContextBrokerClient();
            cbclient.runTests();
        })
        .fail(function(jqxhr, settings, exception) {
            console.error(exception);
        });

    // Context broker comment test ui
      $.getScript("js/client/poi-comment.js")
        .done(function(/*script, textStatus*/) {
          poicommentclient = new PoiComment();
        })
        .fail(function(jqxhr, settings, exception) {
          console.error(exception);
        }
      );

    // Information dialog
    var showInfo = TundraSDK.framework.ui.addAction("Information",
        TundraSDK.framework.asset.getLocalAssetPath("../../img/ic_info_outline_24px.svg"));
    showInfo.click(function(e)
    {
        if (infoDialog)
            infoDialog.setVisible(!infoDialog.isVisible());
        e.preventDefault();
        e.stopPropagation();
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
                console.error(exception);
            });

        // Chat
        $.getScript("js/client/chat.js")
            .done(function(/*script, textStatus*/) {
                // Note that chat is not initialized fully until we're connected to the server.
                chat = new ChatApplication();
                // chat.initUi(); // Uncomment to test chat UI in standalone mode
            })
            .fail(function(jqxhr, settings, exception) {
                console.error(exception);
            });

        usernameDialog = new UsernameDialog();
        usernameDialog.show();

        // Username config dialog
        var showUsernameConfig = TundraSDK.framework.ui.addAction(
            "Set username", TundraSDK.framework.asset.getLocalAssetPath("../../img/ic_perm_identity_24px.svg"));
        showUsernameConfig.click(function(e)
        {
            if (usernameDialog)
                usernameDialog.setVisible(!usernameDialog.isVisible());
            e.preventDefault();
            e.stopPropagation();
        });

        infoDialog = new InfoDialog();
        infoDialog.show();
    });

    // Disconnected from server
    client.onDisconnected(null, function() {
        // TODO hide chat/username functionality?
    });

    // Mouse pressed
    client.input.onMousePress(null, function(mouse) {
        if (!mouse.leftDown)
            return;

        // var serverEnt = client.scene.entityByName("FIWARE Demo Application"); //"Test Cube");
        // if (serverEnt)
            // serverEnt.exec(EntityAction.Server, "TestAction");

        var result = client.renderer.raycast();
        // console.log(result);
        if (result.entity) //&& result.entity.name === "Boulder")
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
    directionalLight.intensity = 0.1;
    directionalLight.position.x = 1;
    directionalLight.position.y = 1;
    directionalLight.position.z = 1;

    scene.add(directionalLight);

    var directionalLight2 = new THREE.DirectionalLight( 0x999999 );
    directionalLight2.intensity = 0.1;
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
};

/* use the local code here to create for this app
var fidemo_scene = createScene() //need to pass to renderer so can't be in same decl below
threejs = {
    scene: fidemo_scene,
    renderer: createRenderer(viewport, fidemo_scene)
}
console.log("FIDEMO: created scene", threejs.scene);
*/

// threejs = null; //no overrides, vizicity creates scene & renderer


// COORDINATES

var santanderLatLon;
var helsinkiLatLon;

var world = new VIZI.World({
    viewport: viewport,
    // center: new VIZI.LatLon(40.01000594412381, -105.2727379358738), // Collada
    // center: new VIZI.LatLon(65.0164696, 25.479259499999998), // Oulu
    // center: santanderLatLon = new VIZI.LatLon(43.47195, -3.79909),
    center: helsinkiLatLon = new VIZI.LatLon(60.17096119799872, 24.94066956044796), // Helsinki
    threejs: threejs,
    camera: camera = new VIZI.Camera({
      aspect: viewport.clientWidth / viewport.clientHeight,
      near: 30
    })
});
globalData.world = world;

// TODO Move Vizi attribution overlay to the top right corner, for now hide it altogether.
world.attribution.container.style.display = "none";

var controls = new VIZI.ControlsMap(world.camera);
//override change emitting as the unload & load code is not good in 0.2.0 yet
controls.onChange = function() {}; 

// MAP

// This configuration is the public-facing part of the API and will usually be the only part of it you ever need to deal with.
var mapConfig = {
  input: {
    type: "BlueprintInputMapTiles", // String representation of the input module you want to use (this is the same as the input module filename).
    options: { // Used to provide options for the input; in most cases this will at least include a path to the data source (local or remote).
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


// overpass data
globalData.currentPos = world.center;
globalData.overpassInputPath = function() {
    return "http://overpass-api.de/api/interpreter?data=[out:json];((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22cafe%22];);(._;node(w);););out;"+
        "((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22bar%22];);(._;node(w);););out;" +
        "((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22restaurant%22];);(._;node(w);););out;" +
        "((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22library%22];);(._;node(w);););out;" +
        "((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22school%22];);(._;node(w);););out;" +
        "((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22university%22];);(._;node(w);););out;" +
        "((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22college%22];);(._;node(w);););out;" +
        "((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22kindergarten%22];);(._;node(w);););out;" +
        "((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22hospital%22];);(._;node(w);););out;" +
        "((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[shop];);(._;node(w);););out;";
};

var overpassConfig = getOverpassConfig();

overpassConfig.input.options.globalData = globalData;
overpassConfig.output.options.globalData = globalData;

var switchboardOverpass = new VIZI.BlueprintSwitchboard(overpassConfig);
switchboardOverpass.addToWorld(world);



// BUILDING PRICES

var buildingPricesConfig = getBuildingPricesConfig();
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
        ids: ["124681352"]
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
            "158575955", "89533460", "89533458",
            // Kansallismuseo
            "2761859235",
            // Kiasma
            "89538798", "89538802", "122595236", "122595218",
            // Postitalo
            "54401309", "54401321", "89534178", "89534180", "89534181", "89534183", "89534184",
            // Sokos-building
            "122595238", "89384331", "89384333", "89384389", "89384330", "89384334"
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
}

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

//lights
function addLights(scene) {
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

// Helper function, perfect candidate for something to be in UiAPI, or at least in some centralized place, at some point.
var createButton = function(id, text, css, parent)
{
    var button = $("<div/>", { id : id, type : "button" });
    button.button();
    button.text(text);
    button.css(css);
    if (parent !== undefined)
        parent.append(button);
    button.show();
    return button;
};
// Sets the position of the widget. Does not let the widget go outside of the window.
// TODO Move this utility function to UiAPI.
var setWidgetPosition = function(widget, x, y)
{
    if (y + widget.height() > $(document).height())
        y -= widget.height();
    widget.css("top", y);
    if (x + widget.width() > $(document).width())
        x -= widget.width();
    widget.css("left", x);
};
var UsernameDialog = Class.$extend(
{
    __init__ : function()
    {
        this.ui = {};
        this.ui.dialog = $("<div/>", { id : "UsernameDialog"});
        this.ui.dialog.css(
        {
            "border"           : "0px solid gray",
            "position"         : "absolute",
            "width"            : 160,
            "height"           : "auto",
            "overflow"         : "hidden",
            "color"            : "color: rgb(56,56,56)",
            "background-color" : "color: rgb(214,214,214)",
            "left"             : 5,
            "top"              : 5
        });

        this.ui.labelField = $("<div/>", { id : "label" });
        this.ui.labelField.text("Enter username for chat");
        this.ui.inputField = $("<input/>", { id : "inputField", type : "text" });
        this.ui.inputField.width(155);
        // Workaround for other scripts stealing the clicks to line edit.
        this.ui.inputField.mousedown(function(e) { e.preventDefault(); e.stopPropagation(); });
        this.ui.inputField.mouseup(function(e) { this.ui.inputField.focus(); e.preventDefault(); e.stopPropagation(); }.bind(this));
        this.ui.inputField.keypress(function(e)
        {
            if (e.keyCode == 13) // Enter
            {
                if (this.ui.okButton.is(":visible"))
                    this.ui.okButton.trigger('click');
                e.preventDefault();
            }
        }.bind(this));
        var buttonStyle = { "border" : "1px solid gray", "text" : "align:center" };
        this.ui.okButton = createButton("okButton", "OK", buttonStyle);
        this.ui.cancelButton = createButton("cancelButton", "Cancel/Close", buttonStyle);
        this.ui.dialog.append(this.ui.labelField);
        this.ui.dialog.append(this.ui.inputField);
        this.ui.dialog.append(this.ui.okButton);
        this.ui.dialog.append(this.ui.cancelButton);
        TundraSDK.framework.ui.addWidgetToScene(this.ui.dialog);
        this.ui.dialog.hide();

        this.ui.okButton.click(this.onOkPressed.bind(this));
        this.ui.cancelButton.click(this.hide.bind(this));
    },

    show : function() { this.ui.dialog.fadeIn(); },
    hide : function() { this.ui.dialog.fadeOut(); },
    setVisible : function(visible) { if (visible) this.show(); else this.hide(); },
    isVisible : function() { return this.ui.dialog.is(":visible"); },

    onOkPressed : function()
    {
        var newUsername = this.ui.inputField.val();
        if (newUsername.trim().length > 0 && chat && chat.entity)
            chat.entity.exec(EntityAction.Server, Msg.SetUsername, [ newUsername, TundraSDK.framework.client.connectionId ]);
    }
});

var InfoDialog = Class.$extend(
{
    __init__ : function()
    {
        this.ui = {};
        this.ui.dialog = $("<div/>", { id : "InfoDialog"});
        this.ui.dialog.css(
        {
            "border"           : "0px solid gray",
            "position"         : "absolute",
            "width"            : 160,
            "height"           : "auto",
            "overflow"         : "hidden",
            "color"            : "color: rgb(56,56,56)",
            "background-color" : "color: rgb(214,214,214)",
            "left"             : 5,
            "top"              : 5
        });

        this.ui.labelField = $("<div/>", { id : "label" });
        this.ui.labelField.text("Hi! This is FIDEMO.");
        var buttonStyle = { "border" : "1px solid gray", "text" : "align:center" };
        this.ui.closeButton = createButton("closeButton", "Close", buttonStyle);
        this.ui.dialog.append(this.ui.labelField);
        this.ui.dialog.append(this.ui.closeButton);
        TundraSDK.framework.ui.addWidgetToScene(this.ui.dialog);
        this.ui.dialog.hide();

        this.ui.closeButton.click(this.hide.bind(this));

        this.positionUi($(document).width(), $(document).height());
    },

    show : function() { this.ui.dialog.fadeIn(); },
    hide : function() { this.ui.dialog.fadeOut(); },
    setVisible : function(visible) { if (visible) this.show(); else this.hide(); },
    isVisible : function() { return this.ui.dialog.is(":visible"); },

    positionUi : function(canvasWidth, canvasHeight)
    {
        var x = canvasWidth/2 - this.ui.dialog.width()/2;
        var y = canvasHeight/2 - this.ui.dialog.height()/2;
        setWidgetPosition(this.ui.dialog, x, y);
    }
});
