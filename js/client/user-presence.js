
var UserPresenceApplication = IApplication.$extend(
{
    __init__ : function()
    {
        this.$super("UserPresenceApplication");

        this.fw = TundraSDK.framework;
        this.updateSub = null;
        this.camera = null;
        this.lastCamPos = new THREE.Vector3(Infinity, Infinity, Infinity);
        this.plane = new THREE.Plane(new THREE.Vector3(0,-1,0), 30);
        this.lookAtRay = new THREE.Ray();

        // Wait for UserPresenceApplications's creation.
        this.fw.scene.onEntityCreated(this, this.onEntityCreated);
    },

    onEntityCreated : function(entity)
    {
        if (entity.id == 4) // TODO Not the nicest way, but there is no guarantee that the name would be set here.
        {
            console.log("UserPresenceApplication ready!");
            this.entity = entity;
            this.updateSub = this.fw.frame.onUpdate(this, this.sendCameraUpdate);
        }
    },

    sendCameraUpdate : function()
    {
        if (this.entity && world.camera.camera)
        {
            this.lookAtRay.origin.copy(world.camera.camera.position);
            this.lookAtRay.direction.copy(new THREE.Vector3(0, 0, -1).applyQuaternion(world.camera.camera.quaternion));
            var newPos = this.lookAtRay.intersectPlane(this.plane);
            if (!this.lastCamPos.equals(newPos))
            {
                // console.log(newPos);
                this.entity.exec(EntityAction.Server, "UserPresencePositionUpdate", [JSON.stringify({ x : newPos.x, y : newPos.y, z : newPos.z })]);
                this.lastCamPos = newPos;
            }
        }
    },

    onScriptDestroyed : function()
    {
        if (this.updateSub)
            TundraSDK.framework.events.unsubscribe(this.updateSub);
    },
});
