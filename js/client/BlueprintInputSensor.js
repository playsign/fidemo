/* globals window, _, VIZI */
(function() {
  "use strict";

/**
 * Blueprint sensor input
 * @author Tapani Jämsä - playsign.net
 */  

  VIZI.BlueprintInputSensor = function(options) {
    var self = this;

    VIZI.BlueprintInput.call(self, options);

    _.defaults(self.options, {});

    // Triggers and actions reference
    self.triggers = [
      {name: "initialised", arguments: []},
      {name: "dataReceived", arguments: ["sensorsJSON"]}
    ];

    self.actions = [
      {name: "requestData", arguments: []}
    ];
  };

  VIZI.BlueprintInputSensor.prototype = Object.create( VIZI.BlueprintInput.prototype );

  // Initialise instance and start automated processes
  VIZI.BlueprintInputSensor.prototype.init = function() {
    var self = this;
    self.emit("initialised");
  };

  VIZI.BlueprintInputSensor.prototype.requestData = function() {
    var self = this;

    if (!self.options.path) {
      throw new Error("Required path option missing");
    }

    // Request data
    $.getJSON(self.options.path, function(data) {
      // Santander json hack

      // function json2array(json) {
      //   var result = [];
      //   var keys = Object.keys(json);
      //   keys.forEach(function(key) {
      //     result.push(json[key]);
      //   });
      //   return result;
      // }

      // var arr = json2array(data.sensors);
      // data.sensors = arr;

      console.log(data);
      self.emit("dataReceived", data);
    });
  };

}());
