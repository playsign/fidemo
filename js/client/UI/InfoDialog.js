"use strict";

var InfoDialog = function(id, data) {
    //this.id = id;
	this.OnRelease = new signals.Signal;
    
    this._init();
};

InfoDialog.prototype = {
    _init: function() {
        var self = this;
        
        $("#" + this.id).dialog({
            autoOpen: true,
            draggable: true,
            resizable: false,
            width: 450,
            height: 400,
            close: function() {
                self.close();
            },
        });
    },
    
    _release: function() {
        $("#" + this.id).remove();
    },
    
    open: function() {
        $("#" + this.id).dialog("open");
    },
    
    close: function() {
        $("#" + this.id).dialog("close");
    }
};