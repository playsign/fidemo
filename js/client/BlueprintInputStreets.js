/* globals window, _, VIZI */
(function() {
  "use strict";

/**
 * Blueprint streets input
 */  

  VIZI.BlueprintInputStreets = function(options) {
    var self = this;

    VIZI.BlueprintInput.call(self, options);

    _.defaults(self.options, {});

    // Triggers and actions reference
    self.triggers = [
      {name: "initialised", arguments: []},
      {name: "dataReceived", arguments: ["streetsJSON"]}
    ];

    self.actions = [
      {name: "requestData", arguments: []}
    ];
  };

  VIZI.BlueprintInputStreets.prototype = Object.create( VIZI.BlueprintInput.prototype );

  // Initialise instance and start automated processes
  VIZI.BlueprintInputStreets.prototype.init = function() {
    var self = this;
    self.emit("initialised");
  };

  VIZI.BlueprintInputStreets.prototype.requestData = function() {
    var self = this;

    if (!self.options.path) {
      throw new Error("Required path option missing");
    }

    // Request data
    $.getJSON(self.options.path, function(data) {
      // JSON to array

      var rootObj;
      var arr = [];
      for (var first in data) {
        arr.push(data[first]);
      }

      data.streets = arr;

      //console.log("Data received: ");
      //console.log(data);
      self.emit("dataReceived", data);
    });
  };

}());
