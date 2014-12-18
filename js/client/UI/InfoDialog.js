"use strict";

var InfoDialog = function(id, data) {
    this.id = id;
    this.useRating = false;
    
    this._init();
    this.enableRating(this.useRating);
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
    },
	
    enableRating: function(enabled) {
        var mode = enabled ? 'enabled' : 'disabled';
        $("#top-content-right").children().attr(mode, mode);
        this.enableRating = enabled;
    }
};