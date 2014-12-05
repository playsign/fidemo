function getStreetLabelsConfig(){
  return {
    input: {
      type: "BlueprintInputStreets",
      options: {
        path: "./data/helsinki_labels.json"
      }
    },
    output: {
      type: "BlueprintOutputStreets",
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
        triggerArguments: ["streetsJSON"],
        actionObject: "output",
        actionName: "outputStreet",
        actionArguments: ["street"],
        actionOutput: {
          street: {
            // Loop through each item in triggerArg.kml and return a new array of processed values (a map)
            process: "map", // String representation of the transformation to be applied. Only "map" is supported right now.
            // Name of trigger argument
            itemsObject: "streetsJSON", // String representation of the trigger argument that holds the data you're interested in.
            // Within sensor the data is stored in the document.placemark array
            itemsProperties: "streets", // String representation of any object properties or array indices to get to the data list.
            // Return a new object for each document.placemark item with the given propertiea
            transformation: { // Object with a property for each action argument name and a string representation of the hierarchy to get from itemsProperties to the specific piece of data you require.
              // Eg. document.placemark[n].point.coordinates
              coordinates: ["Lon", "Lat"], // get coordinates from properties of the JSON          
              name: "Name"
            }
          }
        }
      }
    ]
  };
}

