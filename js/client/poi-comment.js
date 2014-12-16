
var PoiComment = IApplication.$extend({

    __init__ : function()
    {
        console.log("POI comments");
        this.$super("POI comments");

        var that = this;
        this.ui = {};

        $.getScript("//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js")
        .done(function() {
            WebFont.load({
                google: {
                    families: ['Source Sans pro']
                }
            });
        })
        .fail(function(jqxhr, settings, exception) {
            console.error(exception);
        });

        //Count ui messages
        this.ui.messageCount = 0;
        this.ui.itemid = "PoiComment";

        this.ui.ccontainer = $("<div/>", {
            id : "comment-container",
            text : "",
            css : {
                "color" : "red",
                "position" : "absolute",
                "bottom" : 50,
                "right" : 20,
                "background-color": "#f1f1f1",
                "padding": 10,
                "border-radius": 3,
                "width": 250,
                "min-height": 300,
                "font-family": "Source Sans Pro, Trebuchet MS, sans-serif",
                "font-size" : "13px",
                "border" : "1px solid #c0c0c0"
            }
        });

        this.ui.cheader = $("<div/>", {
            id : "comment-header",
            text : "POI Comments",
            css : {
                "color" : "black",
                "float" : "left",
                "min-height" : 30,
                "width" : "100%",
                "background-color" : "f1f1f1",
                "border-bottom" : "1px solid #c0c0c0",
                "font-size" : "14px",
                "font-weight" : "bold"
            }
        });

        this.ui.ccomments = $("<div/>", {
            id : "comment-messages",
            text : "",
            css : {
                "float" : "left",
                "max-height": 220,
                "overflow-y": "scroll"
            }
        });

        this.ui.ctextarea = $("<textarea/>", {
            id : "comment-input-field",
            css : {
                "padding"             : 3,
                "margin"              : 0,
                "border"              : "1px solid grey",
                "border-radius" : 3,
                "height" : 75,
                "width" : "90%",
                "margin-top": 5,
                "font-family": "Source Sans Pro, Trebuchet MS, sans-serif"
            }
        });

        // Workaround for other scripts stealing the clicks to line edit.
        this.ui.ctextarea.mousedown(function(e) { e.preventDefault(); e.stopPropagation(); });
        this.ui.ctextarea.mouseup(function(e) { this.focus(); e.preventDefault(); e.stopPropagation(); });

        this.ui.caddcommentbutton = $("<button/>", {
            id     : "comment-button",
            title  : "Add comment",
            type   : "submit",
            text : "Add comment",
            css : {
                "padding"             : 3,
                "margin"              : 3,
                "border"              : "1px solid #c0c0c0",
                "font-family": "Source Sans Pro, Trebuchet MS, sans-serif",
                "font-weight" : "bold",
                "border-radius" : 5,
                "padding" : 5
            }
        });

        // Press enter on chat text input
        this.ui.ctextarea.keypress(function(e) {
            var keyCode = (e.keyCode ? e.keyCode : e.which);
            if (keyCode == 13)
            {
                that.createPoiComment();
                e.preventDefault();
                e.stopPropagation();
            }
        });

        this.ui.caddcommentbutton.click(function(e) {
            that.createPoiComment();
            e.preventDefault();
            e.stopPropagation();
        });

        this.ui.cclosebutton = $("<button/>", {
            text : "Close",
            id : "comment-close",
            type : "submit",
            title : "Close",
            css : {
                "padding"             : 3,
                "margin"              : 3,
                "border"              : "1px solid #c0c0c0",
                "font-family": "Source Sans Pro, Trebuchet MS, sans-serif",
                "font-weight" : "bold",
                "border-radius" : 5,
                "padding" : 5,
                "float" : "right",
                "vertical-align" :  "middle"
            }
        });

        this.ui.cheader.append(this.ui.cclosebutton);
        this.ui.ccontainer.append(this.ui.cheader);
        this.ui.ccontainer.append(this.ui.ccomments);
        this.ui.ccontainer.append(this.ui.ctextarea);
        this.ui.ccontainer.append(this.ui.caddcommentbutton);
        this.ui.ccontainer.hide();

        //Create simple div to open/close comment window
        this.ui.toggleComments = $("<div/>", {
            id : "comment-toggler",
            text : "CB test",
            css : {
                "color" : "Black",
                "position" : "absolute",
                "bottom" : 50,
                "right" : 20,
                "background-color": "#f1f1f1",
                "padding": 5,
                "border-radius": 30,
                "width": 40,
                "height": 40,
                "font-family": "Source Sans Pro, Trebuchet MS, sans-serif",
                "font-size" : "13px",
                "border" : "3px solid #666666",
                "text-align" : "center",
                "font-weight" : "bold"
            }
        });

        this.ui.toggleComments.click(function(e) {
            if (that.ui.ccontainer.css('display') !== 'none')
            {
                that.ui.toggleComments.show();
                that.ui.ccontainer.hide();
            }
            else
            {
                that.openCommentPoi(that.ui.itemid);
            }
            e.preventDefault();
            e.stopPropagation();

        });

        this.ui.cclosebutton.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            that.ui.ccontainer.hide();
            that.ui.toggleComments.show();
        });

        TundraSDK.framework.ui.addWidgetToScene(this.ui.toggleComments);
        TundraSDK.framework.ui.addWidgetToScene(this.ui.ccontainer)

    },

    openCommentPoi : function(itemid)
    {
        if (itemid === "") {
            console.log("Please give poi id");
            return;
        }

        this.ui.itemid = itemid;

        //Clear UI before load
        this.ui.ccomments.empty();
        this.loadPoiComments(this.ui.itemid);
        this.ui.toggleComments.hide();
        this.ui.ccontainer.show();

    },

    createPoiComment : function()
    {
        var txt = this.ui.ctextarea.val();
        if (txt === "")
        {
            return;
        }

        var dt = new Date();
        //Find if exists
        var json = cbclient.getContextBrokerItemById("PoiComment");
        if (json === undefined || json === null || json === "")
        {

            //Create cb item
            var attributes = [{ "name"  : dt.getTime(),  // First element
                         "type"  : "string",
                         "value" : txt }];

            if (cbclient.createContextBrokerItem("PoiComment", this.ui.itemid, attributes))
            {
                this.ui.messageCount++;
                this.addUiComment(this.ui.messageCount, txt);
                this.ui.ctextarea.val("");
                return true;
            }

            return false;
        }
        else
        {
            //Update existing attributes
            var newattr = [{"name" : ""+dt.getTime()+"", "type" : "string", "value" : txt}];
            if (cbclient.createContextBrokerItem("PoiComment", this.ui.itemid, newattr))
            {
                this.ui.messageCount++;
                this.addUiComment(this.ui.messageCount, txt);
                this.ui.ctextarea.val("");
                return true;
            }

            return false;

        }
    },

    loadPoiComments : function(itemid)
    {
        //Empty message count
        this.ui.messageCount = 0;

        //Load poi comments and add to widget.
        var json = cbclient.getContextBrokerItems(itemid, itemid);
        if (json === "")
            return;

        var obj = JSON.parse(json);
        var attrs = obj.contextResponses[0].contextElement.attributes;
        for (var i in attrs)
        {
            var value = attrs[i].value;
            if (value !== "")
            {
                this.addUiComment(i, value);
                this.ui.messageCount++;
            }
        }

    },

    addUiComment : function(indx, comment)
    {
        var bcolor = "#a8cc76";
        var flo = "left";
        if (indx % 2 === 0 )
        {
            bcolor = "#dddddd";
            flo = "right";
        }

        var ccomment = $("<div/>", {
            id : "comment"+indx,
            text : comment,
            css : {
                "color" : "black",
                "float" : "left",
                "min-height" : 30,
                "width" : 220,
                "float" : flo,
                "background-color" : bcolor,
                "margin-top" : "3px",
                "margin-bottom" : "3px",
                "padding" : 5,
                "border-radius": 3
            }
        });

        this.ui.ccomments.append(ccomment);
    }

})
