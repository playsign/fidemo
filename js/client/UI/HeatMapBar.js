"use strict";

var HeatMapBar = function() {
    this.id = "heatmap-bar";
    this._init();
};

HeatMapBar.prototype = {
    _init: function() {
        $("#" + this.id).dialog({
            autoOpen: false,
            draggable: false,
            resizable: false,
            width: 170,
            height: 380,
            position:{
                my: 'right top+300',
                at: 'right top',
                of: 'body'
            }
        });
        
        var $obj = $("#" + this.id);
        $obj.dialog({ });
        $obj.parents(".ui-dialog")
          .css("border", "0 none")
          .css("background", "transparent")
          .find(".ui-dialog-titlebar").remove();
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