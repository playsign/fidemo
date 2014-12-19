"use strict";

var StartMenu = function(id) {
    this.id = id;
    this.OnClose = new signals.Signal;
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
        
        $("#username-button").button().click(function( event ) {
            event.preventDefault();
            self.okPressed();
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
        this.OnClose.dispatch(this);
    },
    
    okPressed: function() {
        var newUsername = $("#username-input").val();
        if (newUsername.trim().length > 0 && chat != null && chat.entity != null) {
            chat.entity.exec(EntityAction.Server, Msg.SetUsername, [ newUsername, TundraSDK.framework.client.connectionId ]);
        }
    }
};