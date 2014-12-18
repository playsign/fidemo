"use strict";

var InfoDialog = function(id) {
    this.id = id;
    this._init();
};

InfoDialog.prototype = {
    _init: function() {
        var self = this;
        
        $("#" + this.id).dialog({
            autoOpen: true,
            draggable: true,
            resizable: false,
            width: 756,
            height: 576,
            close: function() {
                self.close();
            }
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