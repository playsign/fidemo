
var Msg =
{
    // client -> server
    ClientSendMessage : "ClientSendMessage",
    ClientSendPrivateMessage : "ClientSendPrivateMessage", // TODO private messaging not implemented yet
    ServerUpdateUserList : "ServerUpdateUserList",
    // client -> peers
    NewUserConnected : "NewUserConnected",
    // server -> clients
    ServerSendMessage : "ServerSendMessage",
    RemoveUserFromList : "RemoveUserFromList",
    UpdateUserList : "UpdateUserList",
    // server -> client
    ServerSendPrivateMessage : "ServerSendPrivateMessage" // TODO private messaging not  implemented yet
};

function noop() {}

/** This chat application should be compatible with the realXtend Tundra's example ChatApplication. */
var ChatApplication = IApplication.$extend(
{
    __init__ : function()
    {
        this.$super("Chat");
        this.fw = TundraSDK.framework;

        this.eventSubscriptions = [];

        // Wait for ChatApplication's creation.
        this.fw.scene.onEntityCreated(this, this.onEntityCreated);
    },

    onEntityCreated : function(entity)
    {
        if (entity.id == 5) // TODO
        {
            console.log("ChatApplication ready!");
            this.entity = entity;

            this.username = this.fw.client.loginProperties.username;
            this.initUi();

            this.eventSubscriptions.push(this.fw.frame.onUpdate(this, this.onUpdate));
            this.eventSubscriptions.push(this.fw.ui.onClearFocus(this, this.onClearFocus));
            this.eventSubscriptions.push(this.entity.onEntityAction(this, this.onEntityAction));
            this.entity.exec(EntityAction.Peers, Msg.NewUserConnected, this.username, this.fw.client.connectionId);
            this.addUser(this.username, this.fw.client.connectionId);
        }
    },

    onScriptDestroyed : function()
    {
        this.removeUi();
    },

    initUi : function()
    {
        var that = this;

        this.ui = {};
        this.ui.floatingMessages = [];
        this.ui.floatingTime = 0.0;

        // Main container div
        this.ui.container = $("<div/>", { id : "chat-container" });
        this.ui.container.css({
            "background-color" : "transparent",
            "max-width"        : 600,
            "max-height"       : 34
        });
        this.ui.container.height(34);

        // Chat input field
        this.ui.textField = $("<input/>", { id : "chat-input-field" });
        this.ui.textField.height(20);
        this.ui.textField.width(300);
        this.ui.textField.css({
            "background-image"    : "url(" + this.fw.asset.getLocalAssetPath("../../img/chat-bubbles_20x20.png") + ")",
            "background-repeat"   : "no-repeat",
            "background-position" : "left center",
            "padding"             : 0,
            "padding-left"        : 24,
            "margin"              : 0,
            "border"              : "1px solid grey",
            "border-right"        : 0,
            "border-top-left-radius" : 3,
            "border-bottom-left-radius" : 3
        });

        // Press enter on chat text input
        this.ui.textField.keypress(function(e) {
            var keyCode = (e.keyCode ? e.keyCode : e.which);
            if (keyCode == 13)
            {
                that.sendMessage();
                e.preventDefault();
                e.stopPropagation();
            }
        });
        // Workaround for other scripts stealing the clicks to line edit.
        this.ui.textField.mousedown(function(e) { e.preventDefault(); e.stopPropagation(); });
        this.ui.textField.mouseup(function(e) { that.ui.textField.focus(); e.preventDefault(); e.stopPropagation(); });

        // Toggle chat log button
        this.ui.buttonLog = $("<button/>", {
            id     : "chat-button-toggle-log",
            title  : "Text chat history",
            type   : "button"
        });
        this.ui.buttonLog.tooltip();
        this.ui.buttonLog.width(34);
        this.ui.buttonLog.height(22);
        this.ui.buttonLog.css({
            "background-image"    : "url(" + that.fw.asset.getLocalAssetPath("../../img/chat-off.png") + ")",
            "background-color"    : "transparent",
            "background-repeat"   : "no-repeat",
            "background-position" : "left center",
            "padding"             : 0,
            "margin"              : 0,
            "border"              : 0,
            "max-width"           : 34,
            "max-height"          : 22
        });

        this.ui.buttonLog.hover(
            function () {
                $("#" + this.id).css("background-image", "url(" + that.fw.asset.getLocalAssetPath("../../img/chat-roll.png") + ")");
            },
            function () {
                $("#" + this.id).css("background-image", "url(" + that.fw.asset.getLocalAssetPath("../../img/chat-off.png") + ")");
        });
        this.ui.buttonLog.mousedown(function() {
            $("#" + this.id).css("background-image", "url(" + that.fw.asset.getLocalAssetPath("../../img/chat-on.png") + ")");
        });
        this.ui.buttonLog.mouseup(function() {
            $("#" + this.id).css("background-image", "url(" + that.fw.asset.getLocalAssetPath("../../img/chat-off.png") + ")");
        });

        this.ui.buttonLog.click(function(e) {
            that.toggleChatLog();
            e.preventDefault();
            e.stopPropagation();
        });

        // Toggle userlist button
        this.ui.buttonUserlist = $("<button/>", {
            id     : "chat-button-toggle-userlist",
            title  : "User list",
            type   : "button"
        });
        this.ui.buttonUserlist.tooltip();
        this.ui.buttonUserlist.width(36);
        this.ui.buttonUserlist.height(22);
        this.ui.buttonUserlist.css({
            "background-image"    : "url(" + this.fw.asset.getLocalAssetPath("../../img/chat-userlist-off.png") + ")",
            "background-color"    : "transparent",
            "background-repeat"   : "no-repeat",
            "background-position" : "left center",
            "padding"             : 0,
            "margin"              : 0,
            "border"              : 0,
            "max-width"           : 36,
            "max-height"          : 22
        });

        this.ui.buttonUserlist.hover(
            function () {
                $("#" + this.id).css("background-image", "url(" + that.fw.asset.getLocalAssetPath("../../img/chat-userlist-rollover.png") + ")");
            },
            function () {
                $("#" + this.id).css("background-image", "url(" + that.fw.asset.getLocalAssetPath("../../img/chat-userlist-off.png") + ")");
        });

        this.ui.buttonUserlist.mousedown(function() {
            $("#" + this.id).css("background-image", "url(" + that.fw.asset.getLocalAssetPath("../../img/chat-userlist-on.png") + ")");
        });
        this.ui.buttonUserlist.mouseup(function() {
            $("#" + this.id).css("background-image", "url(" + that.fw.asset.getLocalAssetPath("../../img/chat-userlist-off.png") + ")");
        });

        this.ui.buttonUserlist.click(function(e) {
            that.toggleUserlist();
            e.preventDefault();
            e.stopPropagation();
        });

        // Chat log
        this.ui.chatLog = $("<div/>", { id : "chat-log" });
        this.ui.chatLog.css({
            "background-color" : "rgba(247, 247, 247, 0.8)",
            "border"           : "1px solid grey",
            "border-bottom"    : 0,
            "border-top-right-radius" : 3,
            "font-family"      : "Arial",
            "font-size"        : "11pt",
            "min-width"        : 400,
            "max-width"        : 400,
            "max-height"       : 150,
            "overflow"         : "auto"
        });
        this.ui.chatLog.height(0);
        this.ui.chatLog.hide();

        // Userlist
        this.ui.userlist = $("<div/>", { id : "chat-userlist" });
        this.ui.userlist.css({
            "background-color" : "rgba(247, 247, 247, 0.8)",
            "border"           : "1px solid grey",
            "border-bottom"    : 0,
            "border-top-right-radius" : 3,
            "min-width"        : 300,
            "max-width"        : 300,
            "max-height"       : 150,
            "overflow"         : "auto"
        });
        this.ui.userlist.height(0);
        this.ui.userlist.hide();

        this.ui.container.append(this.ui.textField);
        this.ui.container.append(this.ui.buttonLog);
        this.ui.container.append(this.ui.buttonUserlist);
        this.ui.container.append(this.ui.chatLog);
        this.ui.container.append(this.ui.userlist);

        this.fw.ui.createTaskbar(true);
        this.fw.ui.taskbar.append(this.ui.container);
        this.fw.ui.addAction();

        this.eventSubscriptions.push(this.fw.ui.onWindowResize(this, this.onWindowResize));
        this.onWindowResize();
    },

    removeUi : function()
    {
        if (this.ui)
        {
            if (this.ui.container)
                this.ui.container.remove();
            if (this.ui.floatingMessages)
                for (var i = 0; i < this.ui.floatingMessages.length; i++)
                    this.ui.floatingMessages[i].remove();
        }
        this.ui = {};
        // TODO unsub from frame update
    },

    onUpdate : function(frametime)
    {
        if (this.ui.floatingMessages && this.ui.floatingMessages.length > 0)
        {
            this.ui.floatingTime += frametime;
            if (this.ui.floatingTime >= 15.0)
            {
                this.ui.floatingTime = 0.0;

                var item = this.ui.floatingMessages.splice(0,1)[0];
                item.fadeOut(1000, function() {
                    item.remove();
                    item = null;
                });
            }
        }
    },

    onClearFocus : function()
    {
        this.ui.textField.blur();
    },

    onWindowResize : function(/*width, height*/)
    {
        // Input and buttons
        this.ui.container.position({
            my : "left center",
            at : "left center",
            of : this.fw.ui.taskbar
        });

        this.ui.textField.position({
            my : "left",
            at : "left+4",
            of : this.ui.container
        });

        this.ui.buttonLog.position({
            my : "left",
            at : "right",
            of : this.ui.textField
        });

        this.ui.buttonUserlist.position({
            my : "left",
            at : "right+4",
            of : this.ui.buttonLog
        });

        var logVisible = this.ui.chatLog.is(":visible");
        var listVisible = this.ui.userlist.is(":visible");

        // Chat log
        if (logVisible)
        {
            this.ui.chatLog.position({
                my : "left bottom",
                at : "left top",
                of : this.fw.ui.taskbar
            });
        }

        // Userlist
        if (listVisible)
        {
            this.ui.userlist.position({
                my : "left bottom",
                at : logVisible ? "left+400 top" : "left top",
                of : this.fw.ui.taskbar
            });
        }

        // Floating messages
        if (this.ui.floatingMessages.length > 0)
        {
            var previousItem = null;
            for (var i = this.ui.floatingMessages.length - 1; i >= 0; i--)
            {
                var floatingMessage = this.ui.floatingMessages[i];

                if (logVisible)
                {
                    if (!listVisible)
                        floatingMessage.fadeOut(200);
                    else
                        floatingMessage.hide();
                }
                else
                {
                    floatingMessage.fadeIn(500);
                    floatingMessage.position({
                        my : "left bottom-4",
                        at : previousItem !== null ? "left top" : !listVisible ? "left+4 top" : "right+4 bottom",
                        of : previousItem !== null ? previousItem : !listVisible ? this.fw.ui.taskbar : this.ui.userlist
                    });
                    previousItem = floatingMessage;
                }
            }
        }
    },

    toggleChatLog : function()
    {
        var isVisible = this.ui.chatLog.is(":visible");
        if (!isVisible)
        {
            this.ui.chatLog.height(0);
            this.ui.chatLog.show();
        }

        var that = this;

        this.ui.chatLog.animate(
        {
            height: !isVisible ? 150 : 0
        },
        {
            duration : 450,
            easing   : "swing",
            progress : function() {
                that.onWindowResize();
            },
            complete : !isVisible ?
                function () {
                    that.ui.chatLog.animate({ scrollTop: that.ui.chatLog.prop("scrollHeight") }, 350);
                    that.onWindowResize();
                } :
                function () {
                    that.ui.chatLog.prop({ scrollTop: 0 });
                    that.ui.chatLog.hide();
                    that.onWindowResize();
                }
        });
    },

    toggleUserlist : function()
    {
        var isVisible = this.ui.userlist.is(":visible");
        if (!isVisible)
        {
            this.ui.userlist.height(0);
            this.ui.userlist.show();
        }

        var that = this;

        this.ui.userlist.animate(
        {
            height: !isVisible ? 150 : 0
        },
        {
            duration : 450,
            easing   : "swing",
            progress : function() {
                that.onWindowResize();
            },
            complete : !isVisible ?
                function () {
                    that.onWindowResize();
                } :
                function () {
                    that.ui.userlist.hide();
                    that.onWindowResize();
                }
        });
    },

    sendMessage : function()
    {
        if (this.entity)
            this.entity.exec(EntityAction.Server, Msg.ClientSendMessage, [this.username, escape(this.ui.textField.val()), "true"]);
        this.ui.textField.val("");
    },

    onEntityAction : function(entityAction)
    {
        if (entityAction.name === Msg.ServerSendMessage)
            this.showServerMessage(entityAction.parameters[0]);
        else if (entityAction.name == Msg.NewUserConnected)
            this.addUser(entityAction.parameters[0], parseInt(entityAction.parameters[1]));
        else if (entityAction.name == Msg.RemoveUserFromList)
            this.removeUser(entityAction.parameters[0], parseInt(entityAction.parameters[1]));
    },

    addUser : function(username, connId)
    {
        var item = $("<div/>", {
            id : "chat-useritem-" + connId,
            text : username,
            connectionId : connId
        });

        item.css({
            "border"           : 0,
            "font-family"      : "Arial",
            "font-size"        : "16px",
            "padding"          : 5,
            "padding-left"     : 6
        });

        if (connId === this.fw.client.connectionId)
        {
            item.css("font-weight", "bold");
            this.ui.userlist.prepend(item);
        }
        else
            this.ui.userlist.append(item);
    },

    removeUser : function(username, connId)
    {
        noop(username);
        this.ui.userlist.children().each(function()
        {
            var item = $(this);
            if (parseInt(item.attr("connectionId")) === connId)
            {
                item.remove();
                item = null;
                return;
            }
        });
    },

    checkTimeFormat : function(num)
    {
        return (num > 10 ? num.toString() : "0" + num.toString());
    },

    showServerMessage : function(msg)
    {
        var currentdate = new Date();
        var dateStr = this.checkTimeFormat(currentdate.getHours()) + ":" + this.checkTimeFormat(currentdate.getMinutes()) + ":" + this.checkTimeFormat(currentdate.getSeconds());
        dateStr = "<span style=\"font-family:Courier New;font-size:9pt;color:rgb(20,20,20);\">[" + dateStr + "] </span>";

        var username = (msg.indexOf(":") !== -1 ? msg.split(":")[0] : "server");
        var message = (msg.indexOf(":") !== -1 ? msg.split(":")[1] : msg);
        // var username = msg.split(" ")[0];
        // var username = msg.split(":")[0];
        // var message = unescape(msg.split(":")[1]);
        message = unescape(message);
        // var prefix;
        // if (username == this.username)
            // prefix = dateStr + "<span style=\"font-weight:bold;color:#3251FF;\">" + username + "</span> ";
        // else
            // prefix = dateStr + "<span style=\"font-weight:bold;color:#FF1C14;\">" + username + "</span> ";

        // var fullMessage = "";
        // if (username != this.lastSender)
        // {
            // fullMessage = prefix + message;
            // this.lastSender = username;
        // }
        // else
            // fullMessage = dateStr + message;

        fullMessage = dateStr + msg;

        this.ui.chatLog.html(this.ui.chatLog.html() + fullMessage + "<br>");

        this.createFloatie(username, message, true);

        this.ui.chatLog.animate({ scrollTop: this.ui.chatLog.prop("scrollHeight") }, 350);
    },

    createFloatie : function(username, message, isMessage)
    {
        // Create floating messages
        var floating = $("<div/>", { });

        floating.css({
            "border"           : "0px",
            "border-radius"    : 4,
            "padding"          : 3,
            "padding-left"     : 5,
            "padding-right"    : 5,
            "position"         : "absolute",
            "width"            : "auto",
            "font-family"      : "Arial",
            "font-size"        : "14px",
            "color"            : "rgb(56,56,56)",
            "background-color" : "rgba(248, 248, 248, 0.7)"
        });

        if (isMessage)
            floating.html("<span style=\"color:" + (username == this.username ? "rgb(50,100,255);" : "rgb(255,32,12);") + ";\">" + username + "</span> " + message);
        else
            floating.html(message);

        floating.hide();

        this.ui.container.append(floating);
        this.ui.floatingMessages.push(floating);

        // Cap messages to 15
        if (this.ui.floatingMessages.length > 15)
        {
            this.ui.floatingTime = 20.0;
            this.onUpdate(0);
        }

        this.onWindowResize();

        if (!isMessage || this.fw.ui.tabActive || username === this.username)
            return;

        try
        {
            $.titleAlert("New Chat Message...", {
                requireBlur : false,
                stopOnFocus : true,
                duration : 0,
                interval : 1000
            });
        }
        catch(e) {}
    }
});

noop(ChatApplication);
