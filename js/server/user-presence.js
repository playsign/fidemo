
// !ref: http://meshmoon.data.s3.amazonaws.com/app/lib/class.js, Script
// !ref: http://meshmoon.data.s3.amazonaws.com/app/lib/json2.js, Script
// !ref: http://meshmoon.data.s3.amazonaws.com/app/lib/admino-utils-common-deploy.js, Script
// !ref: UserPresence.txml, Binary

engine.IncludeFile("http://meshmoon.data.s3.amazonaws.com/app/lib/class.js");
engine.IncludeFile("http://meshmoon.data.s3.amazonaws.com/app/lib/json2.js");
engine.IncludeFile("http://meshmoon.data.s3.amazonaws.com/app/lib/admino-utils-common-deploy.js");

// { x : <value>, y : <value>, z : <value>, t : <value> } JSON expected as the parameter.
// Each of the values are optional, and only defined values are updated.
// If t parameter is specified, clients will perform a smoothed move of t seconds (replicated via action)
var cUserPresencePositionUpdate = "UserPresencePositionUpdate";
// The action used for replicating a smoothed move to clients
// { id : <entityId>, sx : <value>, sy : <value>, sz : <value>, ex : <value>, ey : <value>, ez : <value>, t : <value> }
var cUserPresenceSmoothedMove = "UserPresenceSmoothedMove";


var cDefaultUserPresencePrefab = "js/server/UserPresence.txml";

SetLogChannelName(me.name);

var _p = null;

// ------------------------------------------------------------------------------------------------------------- //

var UserPresenceServer = Class.extend(
{
    init : function()
    {
        LogInfo("init");
        // Connection ID to Entity ID mapping.
        // 0 denotes an invalid connection ID.
        this.userPresences = {};

        // Settings
        this.prefabRef = cDefaultUserPresencePrefab;
        this.positionOffset = float3.inf;
        // TODO Selection layer setting for the user presence entity?
        var settings = me.Component(25, "Settings");
        if (settings)
        {
            if (settings.prefabRef !== undefined)
                this.prefabRef = settings.prefabRef;
            if (settings.positionOffset !== undefined)
                this.positionOffset = prefabRef;
        }

        server.UserConnected.connect(this, this.createUserPresence);
        server.UserDisconnected.connect(this, this.removeUserPresence);

        me.Action(cUserPresencePositionUpdate).Triggered.connect(this, function(jsonData)
        {
            this.updateUserPresencePosition(server.ActionSender().id, JSON.parse(jsonData));
        });

        var users = server.AuthenticatedUsers();
        for(var i = 0; i < users.length; ++i)
            this.createUserPresence(users[i].id, users[i]);
    },

    shutDown : function()
    {
        var users = server.AuthenticatedUsers();
        for(var i = 0; i < users.length; ++i)
            this.removeUserPresence(users[i].id, users[i]);
    },

    createUserPresence : function(id, user)
    {
        if (this.userPresences[id])
        {
            LogWarning("createUserPresence: user presence already exists for user " + id + ", removing the existing one.");
            this.removeUserPresence(id, user);
        }

        // TODO asset.RequestAsset() if wanting to use custom user presences
        var prefabAsset = asset.GetAsset/*FindAsset*/(this.prefabRef);
        if (!prefabAsset)
        {
            LogError("createUserPresence: could not find prefab by ref '" + this.prefabRef + "'.");
            return;
        }

        var prefabSource = asset.GetAsset/*FindAsset*/(this.prefabRef).DiskSource();
        var entities = scene.LoadSceneXML(prefabSource, false, false, 0);
        var userPresence = entities.length > 0 ? entities[0] : null;
        if (!userPresence)
        {
            LogError("createUserPresence: prefab '" + this.prefabRef + "' did not contain any entities.");
            return;
        }

        userPresence.name = "UserPresence" + user.id;
        userPresence.description = user.Property("username");

        this.userPresences[id] = userPresence.id;
        Log("createUserPresence: user presence created for user " + id + ".");
    },

    removeUserPresence : function(id, user)
    {
        Log("removeUserPresence: " + id);
        var userPresence = scene.EntityByName("UserPresence" + id);
        if (userPresence)
            scene.RemoveEntity(userPresence.id);
        else
            LogError("Could not find user presence by name 'UserPresence" + id + "' for user " + user.Property("username") + ".");
        this.userPresences[id] = 0;
    },

    updateUserPresencePosition : function(connectionId, pos)
    {
        var userPresenceId = this.userPresences[connectionId];
        var userPresence = (userPresenceId ? scene.EntityById(userPresenceId) : null);
        if (!userPresence || !userPresence.placeable)
            return;

        var tr = userPresence.placeable.transform;
        var oldpos = new float3(tr.pos.x, tr.pos.y, tr.pos.z);

        if (pos.x !== undefined)
            tr.pos.x = pos.x;
        if (pos.y !== undefined)
            tr.pos.y = pos.y;
        if (pos.x !== undefined)
            tr.pos.z = pos.z;

        if (this.positionOffset.IsFinite())
            tr.pos = tr.pos.Add(this.positionOffset);

        // Simple move
        if (pos.t === undefined)
        {
            userPresence.placeable.transform = tr;
        }
        // Time-based move. Client(s) will perform smoothing
        else
        {
            userPresence.placeable.updateMode = { value : 2 }; // Switch to LocalOnly for setting the pos
            userPresence.placeable.transform = tr;
            userPresence.placeable.updateMode = { value : 3 }; // Switch back to Replicated
            userPresence.Exec(4, cUserPresenceSmoothedMove, JSON.stringify({ id : userPresence.id, sx : oldpos.x, sy : oldpos.y, sz : oldpos.z, ex : tr.pos.x, ey : tr.pos.y, ez : tr.pos.z, t : pos.t }));
        }
    },
});

function OnScriptDestroyed()
{
    if (framework.IsExiting())
        return;

    if (_p)
        _p.shutDown();
    _p = null;
}

if (IsServer())
    new UserPresenceServer();

if (false) OnScriptDestroyed(); // silence JSHint
