function getTreesConfig() {
  return {
    input: {
      type: "BlueprintInputSensor",
      options: {
        path: "http://overpass-api.de/api/interpreter?data=[out:json];((node(around:1000.0,"+world.center.lat+","+world.center.lon+")[natural~%22tree%22];);(._;node(w);););out;",
        repeat: false,
      }
    },
    output: {
      type: "BlueprintOutputTrees",
      options: {

      }
    },
    triggers: [{
        triggerObject: "output",
        triggerName: "trees ready",
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
        actionName: "outputTrees",
        actionArguments: ["trees"],
        actionOutput: {
          trees: {
            // Loop through each item in triggerArg.kml and return a new array of processed values (a map)
            process: "map", // String representation of the transformation to be applied. Only "map" is supported right now.
            // Name of trigger argument
            itemsObject: "sensorsJSON", // String representation of the trigger argument that holds the data you're interested in.
            // Within sensor the data is stored in the document.placemark array
            itemsProperties: "sensors", // String representation of any object properties or array indices to get to the data list.
            // Return a new object for each document.placemark item with the given propertiea
            transformation: { // Object with a property for each action argument name and a string representation of the hierarchy to get from itemsProperties to the specific piece of data you require.
              // Eg. document.placemark[n].point.coordinates
              coordinates: ["lat", "lon"], // get coordinates from properties of the JSON          
              node: "id",
            }
          }
        }
      }
    ]
  };
}
