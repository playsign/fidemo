"use strict";

var StartMenu = function(id) {
    this.id = id;
    this._init();
};

StartMenu.prototype = {
    _init: function() {
        var self = this;
        
        $("#" + this.id).dialog({
            autoOpen: true,
            draggable: true,
            resizable: false,
            width: 820,
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