function getHeatmapConfig(){
  return {
    input: {
      type: "BlueprintInputSensor",
      options: {
        path: "./data/nodeinfo.json"
      }
    },
    output: {
      type: "BlueprintOutputHeatmap",
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
        actionName: "outputHeatmap",
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
              coordinates: ["geopos[0]", "geopos[1]"], // get coordinates from properties of the JSON          
              battery: "data.Battery",
              date: "data.Last update",
              light: "data.Light",
              node: "data.Node",
              temperature: "data.Temperature"
            }
          }
        }
      }
    ]
  };
}

