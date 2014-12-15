"use strict";

var LabelCull = function(globalData) {
    this.labels = [];
    this.globalData = globalData;
    this.unimportantHidden = false;
    this.cameraYThreshold = 800;
};

LabelCull.prototype = {
    
    Reset: function() {
        this.labels = [];
    },
    
    Update: function(frameTime){
        var delta = frameTime;
        if (this.globalData && this.globalData.world) {
            var camY = this.globalData.world.camera.camera.position.y;
            if (!this.unimportantHidden && camY >= this.cameraYThreshold) {
                this.unimportantHidden = true;
                _.each(this.labels, function(label) {
                    label.visible = false;
                });
            }
            if (this.unimportantHidden && camY < this.cameraYThreshold) {
                this.unimportantHidden = false;
                _.each(this.labels, function(label) {
                    label.visible = true;
                });
            }
            //console.log("y " + this.globalData.world.camera.camera.position.y);
        }
        
    },
    
    Add: function(label) {
        this.labels.push(label);
        
    }

};