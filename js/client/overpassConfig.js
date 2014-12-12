function getOverpassConfig() {
  return {
    input: {
      type: "BlueprintInputData",
      options: {
        path: "http://overpass-api.de/api/interpreter?data=[out:json];((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22cafe%22];);(._;node(w);););out;"+
		"((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22bar%22];);(._;node(w);););out;" +
		"((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22restaurant%22];);(._;node(w);););out;" +
		"((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22library%22];);(._;node(w);););out;" +
		"((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22school%22];);(._;node(w);););out;" +
		"((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22university%22];);(._;node(w);););out;" +
		"((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22college%22];);(._;node(w);););out;" +
		"((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22kindergarten%22];);(._;node(w);););out;" +
		"((node(around:300.0,"+globalData.currentPos.lat+","+globalData.currentPos.lon+")[amenity~%22hospital%22];);(._;node(w);););out;",
      }
    },
    output: {
      type: "BlueprintOutputOverpass",
      options: {
      }
    },
    triggers: [{
        triggerObject: "output",
        triggerName: "requestOverpassData",
        triggerArguments: [],
        actionObject: "input",
        actionName: "requestData",
        actionArguments: [],
        actionOutput: {}
      }, {
        triggerObject: "input",
        triggerName: "dataReceived",
        triggerArguments: ["dataJSON"],
        actionObject: "output",
        actionName: "outputOverpass",
        actionArguments: ["overpass"],
        actionOutput: {
          overpass: {
            // Loop through each item in triggerArg.kml and return a new array of processed values (a map)
            process: "map", // String representation of the transformation to be applied. Only "map" is supported right now.
            // Name of trigger argument
            itemsObject: "dataJSON", // String representation of the trigger argument that holds the data you're interested in.
            // Within sensor the data is stored in the document.placemark array
            itemsProperties: "data", // String representation of any object properties or array indices to get to the data list.
            // Return a new object for each document.placemark item with the given propertiea
            transformation: { // Object with a property for each action argument name and a string representation of the hierarchy to get from itemsProperties to the specific piece of data you require.
              // Eg. document.placemark[n].point.coordinates
              coordinates: ["lat", "lon"], // get coordinates from properties of the JSON          
              node: "id",
			  tags: "tags",
            }
          }
        }
      }
    ]
  };
}
