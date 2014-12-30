"use strict";

var InfoPopup = function(id, tags) {
    this.id = id.toString();
    this.tags = tags;
    this.OnRelease = new signals.Signal();
    this.dialog = null;
    
    this.name = this._readTag("name");
    this.country = this._readTag("addr:country");
    this.city = this._readTag("addr:city");
    this.postcode = this._readTag("addr:postcode");
    this.houseNumber = this._readTag("addr:housenumber");
    this.street = this._readTag("addr:street");
    
    this.wheelchair = this._readTag("wheelchair") == "" ? "" : "Wheelchair: " + this._readTag("wheelchair");
    this.shop = this._readTag("shop") == "" ? "" : " (" + this._readTag("shop") + ")";
    this.website = this._readTag("website");
    
    this.header = this.name == "" ? this.shop : this.name + " " + this.shop;
    //console.log(this.tags);
    
    this._init();
};

InfoPopup.prototype = {
    _init: function() {
        var self = this;
        
        var address_txt = this.street == "" ? "" : "<p>" + this.street + " " + this.houseNumber + "</p>";
        var postcode_txt = this.postcode != "" || this.city != "" ? "<p>" + this.postcode + " " + this.city + "</p>" : "";
        var wheelchair_txt = this.wheelchair == "" ? "" : "<p>" + this.wheelchair + "</p>";
        var website_txt = this.website == "" ? "" : "<a href='" + this.website + "' target='_blank'>" + this.website + "</a>";
        
        $("body").append(
        "<div id='" + this.id + "' title='" + this.header + "' class='ui-widget + info-content'>" +
            "<div id='info-content'>" +
              "<div id='address-area'>" +
                "<h2>" + this.name + "</h2>" +
                address_txt +
                postcode_txt +
                "<br>" +
              "</div>" +
              "<div id='details-area'>" +
                wheelchair_txt +
                website_txt +
              "</div>" +
            "</div>" +
        "</div>");
        
        this.dialog = $("#" + this.id).dialog({
            width: 500,
            height: "auto",
            close: function(/*ev, ui*/) {
               self.close();
            }
        });
    },
    
    _release: function() {
        $("#" + this.id).remove();
        this.OnRelease.dispatch(this);
    },
    
    _readTag: function(id) {
        var value = this.tags[id];
        if (value == null)
            value = "";
        return value;
    },
    
    open: function() {
        $("#" + this.id).dialog("open");
    },
    
    close: function() {
        $("#" + this.id).dialog("close");
    }
};