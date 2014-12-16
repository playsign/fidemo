/* globals window, _, VIZI */
(function() {
  "use strict";

  /**
   * Blueprint overpass output
   */

  VIZI.BlueprintOutputOverpass = function(options) {
    var self = this;

    VIZI.BlueprintOutput.call(self, options);

    _.defaults(self.options, {});

    // Triggers and actions reference
    self.triggers = [{
        name: "initialised",
        arguments: []
      },
      {
        name: "requestUpdatePath",
        arguments: []
      }
    ];
    
    self.actions = [{
        name: "outputOverpass",
        arguments: ["overpass"]
      }
    ];

    };

  VIZI.BlueprintOutputOverpass.prototype = Object.create(VIZI.BlueprintOutput.prototype);

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputOverpass.prototype.init = function() {
    var self = this;

    //requestOverpassData is called also when receiving new long lat position from lollipopmenu (onLollipopPositionChanged)
    self.emit("requestOverpassData");	
    if(self.options.globalData.lollipopMenu != null)
        self.options.globalData.lollipopMenu.positionChanged.add(self.onLollipopPositionChanged, self);
  };

  VIZI.BlueprintOutputOverpass.prototype.outputOverpass = function(data) {
    var self = this;
    for (var i = 0; i <= data.length; i++) {
      if (data[i] === undefined) {
        continue;
      }
    
      var objectLatitude = data[i].coordinates[0];
      var objectLongitude = data[i].coordinates[1];
      var latLong = new VIZI.LatLon(objectLatitude, objectLongitude);
      
      var objectDescription = [];
      for (var variable in data[i]) {
        if (!data[i][variable]) {
          continue;
        }
        objectDescription.push(variable + ": " + data[i][variable]);
      }
      var objectId = data[i].node;
      
      var type = "";
      if(data[i].tags["amenity"] != null)
        if(data[i].tags["amenity"] == "school" || data[i].tags["amenity"] == "university" || data[i].tags["amenity"] == "library" || data[i].tags["amenity"] == "college")
            type = "education";
        else
            type = data[i].tags["amenity"];
      else  if(data[i].tags["shop"] != null)
          type = "shop";
       else  if(data[i].tags["shop"] != null)
          type = "shop";
      
      if(self.options.globalData.pinView != null)
        self.options.globalData.pinView.addPin(type, self, latLong, objectDescription, objectId, data[i].tags);
    }
  };
  
  VIZI.BlueprintOutputOverpass.prototype.hideAllPins = function() {
    var self = this;
    if(self.options.globalData.pinView != null)
        self.options.globalData.pinView.hidePinsByOwner(self);
  };
 
  VIZI.BlueprintOutputOverpass.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
  
    VIZI.BlueprintOutputOverpass.prototype.onLollipopPositionChanged = function(latLong) {
        var self = this;
        self.hideAllPins();
        self.options.globalData.currentPos = latLong;
        self.emit("requestUpdatePath"); //send info to BlueprintInputData to update path
        self.emit("requestOverpassData");		
   };

 }());
