var IssueItem = function(id, latLon, status) {
    this.id = id;
    this.latLon = latLon;
    this.status = status;
};

IssueItem.prototype = {
    icon: function() {
        return IssueItem.Icons.get(this.issue_status);
    }
};

IssueItem.parse = function(jsonData) {
    var id = jsonData.service_request_id;
    var latLon = new VIZI.LatLon(jsonData.lat, jsonData.long);
    var status = jsonData.status;
    return new IssueItem(id, latLon, status);
};

IssueItem.Icons = {
    OPEN: "data/2d/icon_notfixed.png",
    INPROGRESS: "data/2d/icon_inprogress.png",
    CLOSED: "data/2d/icon_fixed.png",
    UNKNOWN: "data/2d/icon_notfixed.png",
    
    get: function(status) {
        if (status === "open")
            return IssueItem.Icons.OPEN;
        else if (status === "inprogress")
            return IssueItem.Icons.INPROGRESS;
        else if (status === "closed")
            return IssueItem.Icons.CLOSED;
        else
            return IssueItem.Icons.UNKNOWN;
    }
};

var HelsinkiIssues = function() {};

HelsinkiIssues.RequestIssues = function( lat, long, radius, callback ) {
    var fullUrl = "https://asiointi.hel.fi/palautews/rest/v1/requests.json?lat=" + lat + "&long=" + long + "&radius=" + radius;
    console.log("Requesting Helsinki issues url: " + fullUrl);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", fullUrl, true);

    // Listen to state change and when request is finished store the issues
    // and trigger callback function using a signal.
    var that = this;
    var readySignal = new signals.Signal();
    readySignal.addOnce(callback);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4)
        {
            if (xhr.status === 200) {
                console.log("Get Helsinki issue items succeeded!");
                var issueItems = JSON.parse(xhr.responseText);

                var issues = [];
                for(var i in issueItems)
                    issues.push(IssueItem.parse(issueItems[i]));

                readySignal.dispatch(issues);

                readySignal = null;
                that = null;
            }
            else if (xhr.status === 404) {
                console.error("Get get helsinki issue items failed: " + xhr.responseText);
                readySignal.dispatch([]);
            }
        }
    };
    xhr.send(null);
};
