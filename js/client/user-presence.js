
var UserPresenceApplication = IApplication.$extend(
{
    __init__ : function()
    {
        this.$super("UserPresenceApplication");

        this.fw = TundraSDK.framework;
        this.updateSub = null;
        this.camera = null;
        this.lastCamPos = new THREE.Vector3(Infinity, Infinity, Infinity);

        // Wait for UserPresenceApplications's creation.
        this.fw.scene.onEntityCreated(this, this.onEntityCreated);
    },

    onEntityCreated : function(entity)
    {
        if (entity.id == 6) // TODO Not the nicest way
        {
            console.log("UserPresenceApplication ready!");
            this.entity = entity;
            this.updateSub = this.fw.frame.onUpdate(this, this.sendCameraUpdate);
        }
    },

    sendCameraUpdate : function()
    {
        // if (!this.camera || !this.camera.placeable)
            // this.camera = TODO
        // TODO Use ViziCamera?
        // TODO Do we want to raycast for real or do ray-plane intersection test instead?
        if (this.entity && this.camera && this.camera.placeable)
        {
            var renderer = this.fw.renderer;
            var hit = renderer.raycast(renderer.windowSize.width/2, renderer.windowSize.height/2 /*TODO Configurable layer?*/);
            if (hit.entity)
            {
                var newPos = hit.pos.clone();
                if (!this.lastCamPos.equals(newPos))
                {
                    this.entity.exec(EntityAction.Server, "UserPresencePositionUpdate", [JSON.stringify({ x : newPos.x, y : newPos.y, z : newPos.z })]);
                    this.lastCamPos = newPos;
                }
            }
        }
    },

    onScriptDestroyed : function()
    {
        if (this.updateSub)
            TundraSDK.framework.events.unsubscribe(this.updateSub);
    },
});
