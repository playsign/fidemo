// Static data from tilastokeskus, average price of all kinds of buildings by postal code around Helsinki area
var buildingPricesByPostCode = {
    "00100": 5969, "00120": 6166, "00130": 7220, "00140": 6828, "00150": 6633, "00160": 6250, "00170": 6172, "00180": 6107, "00200": 4950, "00210": 5134, "00240": 5045, "00250": 5433, "00260": 5910, "00270": 5451, "00280": 4796, "00300": 4923, "00310": 3505, "00320": 4362, "00330": 4937, "00340": 3659, "00350": 4187, "00360": 3277, "00370": 3159, "00390": 3150, "00400": 3748, "00410": 2693, "00420": 2992, "00430": 3498, "00440": 3576, "00500": 5154, "00510": 4914, "00520": 4401, "00530": 5135, "00550": 4647, "00560": 4957, "00570": 4312, "00580": 4772, "00600": 3323, "00610": 4633, "00620": 3765, "00630": 3202, "00640": 3207, "00650": 3632, "00660": 3451, "00670": 3473, "00680": 3083, "00700": 3172, "00710": 2568, "00720": 3156, "00730": 3299, "00740": 2688, "00750": 2632, "00760": 2922, "00770": 2083, "00780": 3021, "00790": 3925, "00800": 4002, "00810": 4399, "00820": 2933, "00830": 3444, "00840": 3221, "00850": 4552, "00870": 2806, "00900": 3040, "00910": 3215, "00920": 2593, "00930": 3237, "00940": 2283, "00950": 3409, "00960": 2708, "00970": 2535, "00980": 3155, "00990": 4190
};

// Will be filled by the blueprint
var buildingPricesById = {}

function getBuildingPricesConfig() {
  return {
    input: {
      type: "BlueprintInputData",
      options: {
        path: "http://overpass-api.de/api/interpreter?data=[out:json];((node(around:1500.0,"+world.center.lat+","+world.center.lon+")[\"addr:postcode\"];);(._;node(w);););out;",
        repeat: false,
      }
    },
    output: {
      type: "BlueprintOutputBuildingPrices",
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
        triggerArguments: ["dataJSON"],
        actionObject: "output",
        actionName: "outputBuildingPrices",
        actionArguments: ["buildingPrices"],
        actionOutput: {
          buildingPrices: {
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
              id: "id",
              tags: "tags"
            }
          }
        }
      }
    ]
  };
}

