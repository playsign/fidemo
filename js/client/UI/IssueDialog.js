"use strict";

var IssueDialog = function(id, item) {
    this.id = id;
	this.data = item;
	this.OnRelease = new signals.Signal;
    
    this._init();
};

IssueDialog.prototype = {
    _init: function() {
		var self = this;
		var image_str = "";
		var item = this.data;
		if (item.media != null)
			image_str = "<img src='" + item.media + "' alt='Mountain View' style='width:auto;height:220px;'>";
			
		$("body").append("<div id='" + item.id + "' title='" + item.header + "'>" +
							 "<p>" + item.description + "</p>" + image_str +
						 "</div>");
		
		this.currentDialog = $("#" + item.id).dialog({
			  width: 500,
			  height: "auto",
			  close: function(ev, ui) {
				self.close();
			  }
			});
    },
    
    _release: function() {
        $("#" + this.id).remove();
		this.OnRelease.dispatch(this);
    },
    
    open: function() {
        $("#" + this.id).dialog("open");
    },
    
    close: function() {
        $("#" + this.id).dialog("close");
		this._release();
    }
};