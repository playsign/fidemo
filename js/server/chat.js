// Tundra's default ChatApplication used as the base.

var Msg =
{
    // client -> server
    ClientSendMessage : "ClientSendMessage",
    ClientSendPrivateMessage : "ClientSendPrivateMessage",
    ServerUpdateUserList : "ServerUpdateUserList",
    // server -> clients
    ServerSendMessage : "ServerSendMessage",
    RemoveUserFromList : "RemoveUserFromList",
    UpdateUserList : "UpdateUserList",
    // server -> client
    ServerSendPrivateMessage : "ServerSendPrivateMessage"
};

function Noop() {}

function UsernameForClient(connection)
{
    var username = connection.Property("username");
    return (username !== undefined && username.length > 0 ? username : "Unnamed user");
}

function ServerControl()
{
    me.Action(Msg.ClientSendMessage).Triggered.connect(this, this.OnClientMessage);
    me.Action(Msg.ClientSendPrivateMessage).Triggered.connect(this, this.OnPrivateOnClientMessage);
    me.Action(Msg.ServerUpdateUserList).Triggered.connect(this, this.ServerUpdateUserList);
    server.UserConnected.connect(this, this.OnUserConnected);
    server.UserDisconnected.connect(this, this.OnUserDisconnected);
}

ServerControl.prototype.OnUserConnected = function(cid, connection)
{
    Noop(cid);
    var msg = UsernameForClient(connection) + " connected.";
    me.Exec(EntityAction.Peers, Msg.ServerSendMessage, msg);
};

ServerControl.prototype.OnUserDisconnected = function(cid, connection)
{
    Noop(cid);
    var msg = UsernameForClient(connection) + " disconnected.";

    me.Exec(EntityAction.Peers, Msg.ServerSendMessage, msg);
    me.Exec(EntityAction.Peers, Msg.RemoveUserFromList, UsernameForClient(connection));
};

// Receive incoming messages from client 
// and pass it to all clients
ServerControl.prototype.OnClientMessage = function(senderName, msg)
{
    if (msg.length > 0)
    {
        var message = (senderName + ": " + msg);
        me.Exec(EntityAction.Peers, Msg.ServerSendMessage, message);
    }
};

ServerControl.prototype.OnPrivateOnClientMessage = function(senderName, receiverName, msg)
{
    if (msg.length > 0)
    {
        var users = server.AuthenticatedUsers();
        for(var i = 0; i < users.length; i++)
            if (users[i].Property("username") === receiverName)
                users[i].Exec(me, Msg.ServerSendPrivateMessage, senderName + ": " + msg);
    }
};

ServerControl.prototype.ServerUpdateUserList = function(user)
{
    me.Exec(EntityAction.Peers, Msg.UpdateUserList, user);
};

if (server.IsRunning())
{
    console.LogInfo("Starting Chat Server");
    chatControl = new ServerControl();
}
