function createPoiComment(buildingId, username, stars, comment)
{
    if (!cbclient)
    {
        console.log("Context Broker client not initialized yet, can not post comment");
        return;
    }

    var idString = "PoiComment" + buildingId
    var dt = new Date();
    // todo: formatting can be adjusted if necessary
    var dateString = dt.getFullYear() + "/" + (dt.getMonth()+1) + "/" + dt.getDate() + " " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();

    var attributes = [{"name": dt.getTime().toString(), "type": "string", "value": comment, "metadatas": [
        {"name": "username", "type": "string", "value": username},
        {"name": "date", "type": "string", "value": dateString},
        {"name": "stars", "type": "float", "value": stars}]}
    ];

    // Check if item exists
    cbclient.createContextBrokerItem("PoiComment", idString, attributes);
}

// Example use of getPoiComments:
//    getPoiComments(123, function(comments) {
//        for (var i = 0; i < comments.length; ++i)
//        {
//            console.log(comments[i].date + " " + comments[i].username + " " + comments[i].stars + " " + comments[i].comment);
//        }
//    });
function getPoiComments(buildingId, callback)
{
    if (!cbclient)
    {
        console.log("Context Broker client not initialized yet, can get commenst");
        return;
    }

    var internalCallback = function(json) {
        if (json === "")
            return;
        var obj = JSON.parse(json);

        var comments = [];

        if (obj.contextResponses)
        {
            for (var i = 0; i < obj.contextResponses.length; ++i)
            {
                var attrs = obj.contextResponses[i].contextElement.attributes;
                for (var j = 0; j < attrs.length; ++j)
                {
                    var comment = {};
                    comment.comment = attrs[j].value;
                    if (attrs[j].metadatas)
                    {
                        for (var k = 0; k < attrs[j].metadatas.length; ++k)
                            comment[attrs[j].metadatas[k].name] = attrs[j].metadatas[k].value;
                    }
                    comments.push(comment);
                }
            }
            if (callback)
                callback(comments);
        }
    };

    cbclient.getContextBrokerItems("PoiComment", "PoiComment" + buildingId, internalCallback);
}
