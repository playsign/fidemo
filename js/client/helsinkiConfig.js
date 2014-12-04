function getHelsinkiConfig(){
  return {
    input: {
      type: "BlueprintInputSensor",
      options: {
        path: "http://dev.cie.fi/FI-WARE/mlevanto/dynpoi/server/radial_search"
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
              coordinates: ["fw_core.location.wgs84.latitude", "fw_core.location.wgs84.longitude"], // get coordinates from properties of the JSON          
              node: "data.Node",
              categories : "fw_core.categories"
            }
          }
        }
      }
    ]
  };
}

