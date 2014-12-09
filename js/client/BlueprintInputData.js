/* globals window, _, VIZI */
(function() {
  "use strict";

/**
 * Blueprint data input
 * @author Tapani Jämsä - playsign.net
 */  

  VIZI.BlueprintInputData = function(options) {
    var self = this;

    VIZI.BlueprintInput.call(self, options);

    _.defaults(self.options, {});

    // Triggers and actions reference
    self.triggers = [
      {name: "initialised", arguments: []},
      {name: "dataReceived", arguments: ["dataJSON"]}
    ];

    self.actions = [
      {name: "requestData", arguments: []}
    ];
  };

  VIZI.BlueprintInputData.prototype = Object.create( VIZI.BlueprintInput.prototype );

  // Initialise instance and start automated processes
  VIZI.BlueprintInputData.prototype.init = function() {
    var self = this;
    self.emit("initialised");
  };

  VIZI.BlueprintInputData.prototype.requestData = function() {
    var self = this;

    if (!self.options.path) {
      throw new Error("Required path option missing");
    }

    // Request data
    $.getJSON(self.options.path, function(data) {
      // JSON to array

      function json2array(json) {
        var result = [];
        var keys = Object.keys(json);
        keys.forEach(function(key) {
          result.push(json[key]);
        });
        return result;
      }

      var rootObj;
      var arr;

      // Get root and force it to array (because vizi seems to need an array)
      for (var p in data) {
        if(p == "osm3s"){
          // open streetmap copyright and version info
          continue;
        }
        if (Array.isArray(data)) {
          arr = data;
          break;
        } else if (Array.isArray(data[p])) {
          arr = data[p];
          break;
        } else if (Object.prototype.toString.call(data[p]) === '[object Object]') { // if object
          rootObj = data[p];
          break;
        }
      }

      if (arr === undefined && rootObj === undefined) {
        throw new Error("JSON doesn't have a data object");
      }

      if (!arr) {
        arr = json2array(rootObj);
      }
      data.data = arr;

      console.log("Data received: "+self.options.path+" Length:"+data.data.length);

      self.emit("dataReceived", data);

      // Repeat
      if (self.options.repeat) {
        window.setTimeout(function() {
          self.emit("requestData", "repeat");
        }, self.options.repeatRate);
      }
    });
  };

}());
