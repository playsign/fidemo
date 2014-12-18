"use strict";

var PriceMap = function(latLonMin, latLonMax, resolution) {
    this.latLongMin = latLonMin;;
    this.latLongMax = latLonMax;

    this.resolution = resolution;
    this.totalSize = this.resolution * this.resolution;
    this.data = [];
    for(var i = 0; i < this.totalSize; i++)
        this.data[i] = 0.0;
};

PriceMap.prototype = {
    LatLonToPoint: function(lat, lon) {
        var point = {x:0,y:0};
        if (lat >= this.latLongMax.lat)
            point.x = 1.0;
        else if(lat <= this.latLongMin.lat)
            point.x = 0.0;
        else
            point.x = (lat - this.latLongMin.lat)/(this.latLongMax.lat - this.latLongMin.lat);

        if (lon >= this.latLongMax.lon)
            point.y = 1.0;
        else if(lon <= this.latLongMin.lon)
            point.y = 0.0;
        else
            point.y = (lon - this.latLongMin.lon)/(this.latLongMax.lon - this.latLongMin.lon);

        return point;
    },

    PointToLatLon: function(point){
        var x, y, lat, lon;
        if (point.x < 0.0)
            x = 0.0;
        else if (point.x > 1.0)
            x = 1.0;
        else
            x = point.x;

        if (point.y < 0.0)
            y = 0.0;
        else if (point.y > 1.0)
            y = 1.0;
        else
            y = point.y;

        lat = this.latLongMin.lat + x * (this.latLongMax.lat - this.latLongMin.lat);
        lon = this.latLongMin.lon + y * (this.latLongMax.lon - this.latLongMin.lon);
        return new VIZI.LatLon(lat, lon);
    },

    SetValue: function(lat, lon, value) {
        var p = this.LatLonToPoint(lat, lon);
        var x = Math.round(p.x * this.resolution);
        var y = Math.round(p.y * this.resolution);
        this._setValue(x, y, value);
    },

    GetValue: function(lat, lon) {
        var p = this.LatLonToPoint(lat, lon);
        var x = Math.round(p.x * this.resolution);
        var y = Math.round(p.y * this.resolution);
        return this._getValue(x, y, value);
    },
    
    _setValue: function(x, y, value) {
        this.data[x + (this.resolution * y)] = value;
    },
    
    _getValue: function(x, y, value) {
        return this.data[x + (this.resolution * y)];
    }
};

