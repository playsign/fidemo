var _cburl = "http://orion.lab.fi-ware.org:1026";
var _cbtoken = "K260vyH-hNJ-AVG3CszxXZTsM1Y62qcaX1IN9Y9bALgkHIcnFlCe49ythKEku5Bxs2n5FM8utLeC7GE0wYx6AQ";

var ContextBrokerClient = IApplication.$extend({

    __init__ : function()
    {
        console.log("ContextBrokerClient");
        this.$super("ContextBrokerClient");
    },

    // get first 1000 context elements by type and id
    // @param type as type of context element e.g. POI
    // @param id as id of the context elemeny e.g. POI1 or wildcard .* or PO.*
    getContextBrokerItems : function(type, id) {

        var json = "{ \"entities\": [ { \"type\": \"" + type + "\", \"isPattern\": \"true\", \"id\": \"" + id + "\" }]}";

        var xhr = new XMLHttpRequest();
        xhr.open("POST", _cburl + "/ngsi10/queryContext?limit=1000", false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("X-Auth-Token", _cbtoken);
        xhr.send(json);

        if (xhr.status === 200) {
            console.log("Get context broker items succeeded!");
            return xhr.responseText;
        } else if (xhr.status === 404) {
            console.log("Get context broker item failed: " + xhr.responseText);
        }
        return "";
    },

    // get context element by its id
    getContextBrokerItemById : function(id) {

        var xhr = new XMLHttpRequest();
        xhr.open("GET", _cburl+"/ngsi10/contextEntities/"+id, false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("X-Auth-Token", _cbtoken);
        xhr.send();

        if (xhr.status === 200) {
            console.log("Get context broker item succeeded!");
            return xhr.responseText;

        } else if (xhr.status === 404) {
            console.log("Get context broker item failed: " + xhr.responseText);
            return "";
        }
    },

    // @param type as type of context element e.g. POI
    // @param id as id of the context elemeny e.g. POI1
    // @param attributes as array of attributes e.g.
    //        var attributes = [{ "name"  : "temperature",  // First element
    //                   "type"  : "float",
    //                   "value" : 23 },
    //                 { "name"  : "comment",  // Second Element
    //                  "type"  : "string",
    //                   "value" : "my comment" }]
    //                ;

    // NOTE: "current Orion Context Broker version interprets APPEND as UPDATE if the entity already exists"
    // https: //forge.fi-ware.org/plugins/mediawiki/wiki/fiware/index.php/Publish/Subscribe_Broker_-_Orion_Context_Broker_-_Quick_Start_for_Programmers

    createContextBrokerItem : function(type, id, attributes) {

        if (type === undefined || type === null || type === "") {
            console.log("Please give type for the context element.");
            return;
        }

        if (id === undefined || id === null || id === "") {
            console.log("Please give id for the context element.");
            return;
        }

        if (!jQuery.isArray(attributes)) {
            console.log("Please give array of attributes e.g. var attributes = [{ \"name\"  : \"temperature\", \"type\"  : \"float\", \"value\" : 23 }];");
            return;
        }

        var attrs = JSON.stringify(attributes);
        console.log("CB UPDATING : "+type +" - " + id + " - " +attrs);
        var json = "{ \"contextElements\": [ { \"type\": \""+type+"\", \"isPattern\": \"false\", \"id\": \""+id+"\", \"attributes\": "+attrs+"} ], \"updateAction\": \"APPEND\" }";

        var xhr = new XMLHttpRequest();
        xhr.open("POST", _cburl + "/ngsi10/updateContext", false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("X-Auth-Token", _cbtoken);
        xhr.send(json);

        if (xhr.status === 200) {
            console.log("Creating/updating context broker item succeeded!");
            console.log(xhr.responseText);
            return true;
        } else {
            console.log("Creating/updating context broker item failed: " + xhr.responseText);
            return false;
        }

    },

    //NOTE: untested function. Once there is real POI data with these values this can be tested or tweaked to POI purpose.
    getContextBrokerItemsNear : function (type, lat, lng, radius)
    {

        if (type === undefined || type === null || type === "") {
            console.log("Please give type for the context element.");
            return;
        }
        if (lat === undefined || lat === null || lat === "") {
            console.log("Please give lat for the context element.");
            return;
        }
        if (lng === undefined || lng === null || lng === "") {
            console.log("Please give lng for the context element.");
            return;
        }
        if (radius === undefined || radius === null || radius === "") {
            console.log("Please give radius for the context element.");
            return;
        }

        var json = "{\"entities\": [{\"type\": \""+type+"\",\"isPattern\": \"true\",\"id\": \".*\"}], " +
                   "\"restriction\": { \"scopes\": [{\"type\" : \"FIWARE_Location\",\"value\" : { " +
                   "\"circle\": {\"centerLatitude\": \""+lat+"\",\"centerLongitude\": \""+lng+"\",\"radius\": \""+radius+"\"}}}]}";


        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log("Get context broker items with longitude, latitude and radius succeeded!");
                    //var json = JSON.parse(xhr.responseText);
                    console.log(xhr.responseText);
                } else if (xhr.status === 404) {
                    console.log("Get context broker item with longitude, latitude and radius failed: " + xhr.responseText);
                }
            }
        };
        xhr.onerror = function (e) {
            console.log("Failed to get context broker item with longitude, latitude and radius: " + e.error);
        };

        xhr.open("POST", _cburl + "/ngsi10/queryContext?limit=1000", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("X-Auth-Token", _cbtoken);
        xhr.send(json);
    },

    runTests : function() {

      console.log("ContextBrokerClient runTests(): Find examples here.");
      // Testing
      /*cbclient.getContextBrokerItems("TESTPOI", ".*"); //Get all context elements with type TESTPOI
      cbclient.getContextBrokerItems("TESTPOI", "PO.*"); //Get all context elements with type TESTPOI which id starts with PO

      cbclient.getContextBrokerItemById("TESTPOI"); //Get context element by it´s ID


      var attributes = [{ "name"  : "temperature",  // First element
                         "type"  : "float",
                         "value" : 23 },
                       { "name"  : "comment",  // Second Element
                         "type"  : "string",
                         "value" : "my comment" }]
      ;

      cbclient.createContextBrokerItem("POITEST", "POI1", attributes); //Create context element: type = POITEST, ID = POI1, attributes = attribute array

      */
    }

});
