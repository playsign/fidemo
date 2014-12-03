
if (server.IsRunning())
{
    var avatarAssets = me.Component(25, "AvatarAssets")
    if (avatarAssets && avatarAssets.materialRefs)
    {
        // TODO Could use DynamicMaterial if/when implemented to WebRocket.
        var r = me.mesh.materialRefs;
        r[0] = avatarAssets.materialRefs[Math.floor((Math.random()*avatarAssets.materialRefs.length))];
        me.mesh.materialRefs = r;
    }
}
