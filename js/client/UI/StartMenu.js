"use strict";

var StartMenu = function(id) {
    this.id = id;
    this._init();
};

StartMenu.prototype = {
    _init: function() {
        var self = this;
        
        //$("body").append("<div id='" + this.id + "' title='" + this.header + "'></div>");
        $("#" + this.id).dialog({
            autoOpen: true,
            draggable: true,
            resizable: true,
            width: 820,
            height: 576,
            close: function() {
                self.close();
            }
        });
        
        // Workaround for other scripts stealing the clicks.
        //$("#" + this.id).mousedown(function(e) { e.preventDefault(); e.stopPropagation(); });
        //$("#" + this.id).mouseup(function(e) { this.focus(); e.preventDefault(); e.stopPropagation(); });
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