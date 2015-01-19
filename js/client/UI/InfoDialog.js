"use strict";

var DebugPoiStorage = function() {
    this.data = {};
};

DebugPoiStorage.prototype = {
    readPoiData : function(id, callback) {
        var comments = [];
        
        if (this.data[id] === undefined) {
            callback(comments);
            return;
        }
        
        var data = this.data[id];
        var obj = {
            attributes:[]
        };
        
        for(var i = 0; i < data.length; ++i)
            obj.attributes.push(data[i]);

        var attrs = obj.attributes;
        for (var j = 0; j < attrs.length; ++j)
        {
            var comment = {};
            comment.comment = attrs[j].value;
            if (attrs[j].metadatas)
            {
                for (var k = 0; k < attrs[j].metadatas.length; ++k)
                    comment[attrs[j].metadatas[k].name] = attrs[j].metadatas[k].value;
            }
            comments.push(comment);
        }
        
        if (callback)
            callback(comments);
    },
    
    writePoiData : function(id, name, stars, comment) {
        var dt = new Date();
        var dateString = dt.getFullYear() + "/" + (dt.getMonth()+1) + "/" + dt.getDate() + " " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        
        if (this.data[id] === undefined)
            this.data[id] = [];
        
        this.data[id].push({
            "name": dt.getTime().toString(), "type": "string", "value": comment,
            "metadatas": [
                {"name": "username", "type": "string", "value": name},
                {"name": "date", "type": "string", "value": dateString},
                {"name": "stars", "type": "float", "value": stars}
            ]
        });
    }
};

var debugPoi = new DebugPoiStorage();

var CommentInfo = function(name, time, stars, comment) {
    this.name = name;
    this.time = time;
    this.stars = stars;
    this.comment = comment;
};

var InfoPopup = function(id, name, tags) {
    this.id = "comments-" + id.toString();
    this.username = name;
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
    
    this.commentCount = 0;
    this.comments = {};
    
    this.commentsMessagesVisible = false;
    
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
              "<br>" +
              "<div id='comment-container'>" +
                "<div id='comment-header'>" + 
                  "<p style='display:inline-block; width:400px;;'>comments</p>" +
                "</div>" +
                "<div id='comment-messages' class='comment-messages-display'>" +
                "</div>" +
                "<textarea id='comment-input-field'></textarea>" +
                "<button id='comment-button' type='submit'>Add comment</button>" +
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
        
        $("#comment-button").click(function() {
            self.onAddComment();
        });
        
        this.clearComments();
        this.readComments();
    },
    
    _escapeHtml: function(string) {
        var entityMap = {
          "&": "&amp;", "<": "&lt;",
          ">": "&gt;", '"': '&quot;',
          "'": '&#39;', "/": '&#x2F;'
        };
        
        return String(string).replace(/[&<>"'\/]/g, function (s) {
           return entityMap[s];
        });
    },
    
    _createComment: function(name, time, stars, comment) {
        this.comments[name] = new CommentInfo(name, time, stars, comment);
        this.commentCount++;
        return this.comments[name];
    },
    
    _addCommentDiv: function(commentInfo) {
        var messagesArea = $("#comment-messages");
        messagesArea.show();
        
        this.commentCount++;
        $("#comment-messages").prepend(
            "<div id='comment-" + this.commentCount + "' class='comment-left'>" +
                "<p style='font-weight: bold;'>" + this._escapeHtml(commentInfo.name) + " " + this._escapeHtml(commentInfo.time) + "</p>" +
                "<p>" + this._escapeHtml(commentInfo.comment) + "</p>" +
            "</div>");
    },
    
    _release: function() {
        $("#" + this.id).remove();
        this.OnRelease.dispatch(this);
    },
    
    _readTag: function(id) {
        var value = this.tags[id];
        if (value === undefined)
            value = "";
        return value;
    },
    
    clearComments: function() {
        var messagesArea = $("#comment-messages");
        messagesArea.hide();
        messagesArea.empty();
        this.commentCount = 0;
        this.comments = {};
    },
    
    readComments: function() {
        var self = this;
        
        // TODO! replace debugPoi line with getPoiComments when ContextBroker is working again
        debugPoi.readPoiData(this.id, function(comments) {
        //getPoiComments(this.id, function(comments) {
            self.clearComments();
            var info;
            
            for (var i = 0; i < comments.length; ++i) {
                info = self._createComment(comments[i].username, comments[i].date, comments[i].stars, comments[i].comment);
                self._addCommentDiv(info);
            }
            if (comments.length > 0)
                self.setMessagesAreaVisible(true);
            else
                self.setMessagesAreaVisible(false);
        });
    },
    
    sendComment: function(commentInfo) {
        var self = this;
        
        // TODO! replace debugPoi line with createPoiComment when ContextBroker is working again
        debugPoi.writePoiData(this.id, commentInfo.name, commentInfo.stars, commentInfo.comment);
        //createPoiComment(this.id, commentInfo.name, commentInfo.stars, commentInfo.comment);
        
        // Dirty way to wait that new comment is being added to ContextBroker before we refresh the comments area.
        setTimeout(function() {
            self.readComments();
        }, 1000);
    },
    
    setMessagesAreaVisible: function(visible) {
        var messagesArea = $("#comment-messages");
        if (visible === true)
            messagesArea.show();
        else
             messagesArea.hide();
        
        this.commentsMessagesVisible = visible;
    },
    
    showComments: function() {
        $("#comment-container").show();
    },
    
    hideComments: function() {
        $("#comment-container").hide();
    },
    
    onAddComment: function() {
        var commentText = this._escapeHtml($("#comment-input-field").val());
        $("#comment-input-field").val('');
        if (commentText != null && commentText.length > 0) {
            var commentInfo = this._createComment(this.username, "Missing", 0, commentText);
            //this._addCommentDiv(commentInfo);
            this.sendComment(commentInfo);
        }
    },
    
    open: function() {
        $("#" + this.id).dialog("open");
    },
    
    close: function() {
        $("#" + this.id).dialog("close");
        this._release();
    }
};