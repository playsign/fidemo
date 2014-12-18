// Tundra's default ChatApplication used as the base.

var Msg =
{
    // client -> server
    ClientSendMessage : "ClientSendMessage",
    ClientSendPrivateMessage : "ClientSendPrivateMessage",
    ServerUpdateUserList : "ServerUpdateUserList",
    SetUsername : "SetUsername", // New addition for FIDEMO.
    // client -> peers
    NewUserConnected : "NewUserConnected",
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
    me.Action(Msg.SetUsername).Triggered.connect(this, this.OnSetUsername);

    server.UserConnected.connect(this, this.OnUserConnected);
    server.UserDisconnected.connect(this, this.OnUserDisconnected);
}

ServerControl.prototype.OnUserConnected = function(cid, connection)
{
    Noop(cid);
    var msg = UsernameForClient(connection) + " connected.";
    me.Exec(4/*EntityAction.Peers*/, Msg.ServerSendMessage, msg);
};

ServerControl.prototype.OnUserDisconnected = function(cid, connection)
{
    Noop(cid);
    var msg = UsernameForClient(connection) + " disconnected.";

    me.Exec(4/*EntityAction.Peers*/, Msg.ServerSendMessage, msg);
    me.Exec(4/*EntityAction.Peers*/, Msg.RemoveUserFromList, UsernameForClient(connection), connection.id); // NOTE Connection ID new addition
};

// Receive incoming messages from client 
// and pass it to all clients
ServerControl.prototype.OnClientMessage = function(senderName, msg)
{
    if (msg.length > 0)
    {
        var message = (senderName + ": " + msg);
        me.Exec(4/*EntityAction.Peers*/, Msg.ServerSendMessage, message);
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
    me.Exec(4/*EntityAction.Peers*/, Msg.UpdateUserList, user);
};

ServerControl.prototype.OnSetUsername = function(newUsername, connectionId)
{
    var connection = server.GetUserConnection(parseInt(connectionId));
    if (!connection)
    {
        console.LogError("ServerControl.OnSetUsername: user connection for ID " + connectionId + " not found.");
        return;
    }

    var oldUsername = connection.Property("username");
    connection.SetProperty("username", newUsername);
    var msg = oldUsername + " is now known as " + newUsername + ".";
    me.Exec(4/*EntityAction.Peers*/, Msg.ServerSendMessage, msg);
    me.Exec(4/*EntityAction.Peers*/, Msg.RemoveUserFromList, oldUsername, connection.id);
    me.Exec(4/*EntityAction.Peers*/, Msg.NewUserConnected, newUsername, connection.id);

    // TODO This would cleaner design in avatar application but for now done here for simplicity.
    var avatar = scene.EntityByName("UserPresence" + connectionId);
    if (avatar)
        avatar.description = newUsername;
};

if (server.IsRunning())
{
    console.LogInfo("Starting Chat Server");
    chatControl = new ServerControl();
}
