/* globals window, _, VIZI, */
(function() {
    "use strict";

    /**
     * Blueprint heatmap output
     * @author Toni Alatalo - playsign.net
     * @author Tapani Jämsä - playsign.net
     */

    /* 1st test area in Santander
bottom-left: 43.463369, -3.805923
top-right:   43.476170, -3.789915

tight on univ sensors:
43.470695, -3.803182
43.472606, -3.799289

plane scale there:
566, y: 1, z: 410
*/

    VIZI.BlueprintOutputHeatmap = function(options) {
        var self = this;

        VIZI.BlueprintOutput.call(self, options);

        _.defaults(self.options, {});

        // Triggers and actions reference
        self.triggers = [{
                name: "initialised",
                arguments: []
            }
        ];

        self.actions = [{
                name: "outputHeatmap",
                arguments: ["sensor"]
            }
        ];

        //east, south, 
        self.heatmapbox = {
            'east': -3.799289,
            'south': 43.470600,
            'west': -3.803182,
            'north': 43.472606
        };

        self.world;
    };

    VIZI.BlueprintOutputHeatmap.prototype = Object.create(VIZI.BlueprintOutput.prototype);

    // Initialise instance and start automated processes
    VIZI.BlueprintOutputHeatmap.prototype.init = function() {
        var self = this;

        self.emit("initialised");
    };

    VIZI.BlueprintOutputHeatmap.prototype.onAdd = function(world) {
        var self = this;
        self.world = world;
        self.init();
    };

    VIZI.BlueprintOutputHeatmap.prototype.outputHeatmap = function(data) {
        var self = this;

        //debugObject(self.heatmapbox.south, self.heatmapbox.west);
        //debugObject(self.heatmapbox.north, self.heatmapbox.east);

        var heatgeom = new THREE.CubeGeometry(1, 1, 1);
        var heatmat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF
        });
        var heatlayer = new THREE.Mesh(heatgeom, heatmat);

        var heatboxcenter = [(self.heatmapbox.east + self.heatmapbox.west) / 2, (self.heatmapbox.south + self.heatmapbox.north) / 2];
        //debugObject(heatboxcenter[1], heatboxcenter[0]);

        var dgeocoord = new VIZI.LatLon(heatboxcenter[1], heatboxcenter[0]);
        var dscenepoint = self.world.project(dgeocoord);

        // var heat_scenecoord = city.geo.projection(heatboxcenter, city.geo.tileZoom);
        heatlayer.position.x = dscenepoint.x;
        heatlayer.position.y = 10;
        heatlayer.position.z = dscenepoint.y;

        heatlayer.scale.set(233, 0.5, 205);
        self.add(heatlayer);

        // create a heatmap instance
        var heatmap = h337.create({
            container: document.getElementById('heatmapContainer'),
            maxOpacity: .5,
            radius: 1000,
            blur: .75,
            // update the legend whenever there's an extrema change
            onExtremaChange: function onExtremaChange(data) {
                //updateLegend(data);
            }
        });

        // // boundaries for data generation
        // var width = (+window.getComputedStyle(document.body).width.replace(/px/,''));
        // var height = (+window.getComputedStyle(document.body).height.replace(/px/,''));

        // // generate 1000 datapoints
        // var generate = function() {
        //   // randomly generate extremas
        //   var extremas = [(Math.random() * 1000) >> 0,(Math.random() * 1000) >> 0];
        //   var max = Math.max.apply(Math, extremas);
        //   var min = Math.min.apply(Math,extremas);
        //   var t = [];


        //   for (var i = 0; i < 1000; i++) {
        //     var x = (Math.random()* width) >> 0;
        //     var y = (Math.random()* height) >> 0;
        //     var c = ((Math.random()* max-min) >> 0) + min;
        //     // btw, we can set a radius on a point basis
        //     var r = (Math.random()* 80) >> 0;
        //     // add to dataset
        //     t.push({ x: x, y:y, value: c, radius: r });
        //   }
        //   var init = +new Date;
        //   // set the generated dataset
        //   heatmap.setData({
        //     min: min,
        //     max: max,
        //     data: t
        //   });
        //   console.log('took ', (+new Date) - init, 'ms');
        // };
        // // initial generate
        // generate();

        var heatmap_tex = new THREE.Texture(heatmap._renderer.canvas, new THREE.UVMapping(), THREE.RepeatWrapping, THREE.RepeatWrapping);
        heatlayer.material.map = heatmap_tex;
        heatlayer.material.transparent = true;
        heatlayer.castShadow = false;
        heatlayer.material.map.needsUpdate = true;

        self.heatmap_parseOfflineCBData(data, heatmap);

        //console debug access
        VIZI.heat = {};
        VIZI.heat.heatmap = heatmap;
        VIZI.heat.heatlayer = heatlayer;
    };

    //sensor data reading -- instead of the random generation from example (above)
    // VIZI.BlueprintOutputHeatmap.prototype.updateData = function(heatmap, heatlayer) {
    //     // COPY-PASTE from tapanij-vizi-poi Scene.js !!!
    //     ///Get offline Context Broker info
    //     $.getJSON("nodeinfo.json", function(data) {
    //  heatmap_parseOfflineCBData(data, heatmap);
    //         heatlayer.material.map.needsUpdate = true;
    //         //heatmap._renderer.canvas.parentNode.removeChild(heatmap._renderer.canvas);
    //     });
    // };

    VIZI.BlueprintOutputHeatmap.prototype.normaliseGeopos = function(geopos) {
        var self = this;

        var east = self.heatmapbox.east;
        var west = self.heatmapbox.west;
        var south = self.heatmapbox.south;
        var north = self.heatmapbox.north;

        var width = west - east;
        var height = north - south;

        var scale_x = 1 / width;
        var scale_y = 1 / height;

        var x = (west - geopos[1]) * scale_x;
        var y = (north - geopos[0]) * scale_y;

        return [x, y];
    };

    VIZI.BlueprintOutputHeatmap.prototype.heatmap_parseOfflineCBData = function(data, heatmap) {
        var self = this;

        var temperatures = []; //longlat, celciusfloat pairs

        //read temperatures from own offline json
        for (var i = 0; i <= data.length; i++) {
            if (data[i] === undefined) {
                continue;
            }

            if (data[i].temperature) {
                var temperinfo = data[i].temperature;
                var tempernum = parseFloat(temperinfo); //temperinfo.slice(0, -2)
                temperatures.push([data[i].coordinates, tempernum]);
            }
        }

        //console.log(temperatures);

        //populate heatmap data
        var hmapdata = [];
        THREE.hmapdata = hmapdata;
        var r = 30;

        var canvas = heatmap._renderer.canvas;
        //var width = (+window.getComputedStyle(document.body).width.replace(/px/,''));
        //var height = (+window.getComputedStyle(document.body).height.replace(/px/,''));
        var width = canvas.width;
        var height = canvas.height;
        console.log("HEATMAP DRAW DIMS: " + width + " : " + height);
        temperatures.forEach(function(t) {
            //console.log(t);
            var norm_xypos = self.normaliseGeopos(t[0]);

            var xypos = [-1, -1];
            xypos[0] = norm_xypos[0] * width;
            xypos[1] = norm_xypos[1] * height;
            hmapdata.push({
                x: xypos[0],
                y: xypos[1],
                value: t[1],
                radius: r
            });
        });

        heatmap.setData({
            min: 10,
            max: 30,
            data: hmapdata
        });
    };

    // whenever a user clicks on the ContainerWrapper the data will be regenerated -> new max & min
    /*
document.getElementById('heatmapContainerWrapper').onclick = function() { 
    //generate();
    updateData();
    cube.material.map.needsUpdate = true;            
};
*/

}());
