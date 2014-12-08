
var UserPresenceApplication = IApplication.$extend(
{
    __init__ : function()
    {
        this.$super("UserPresenceApplication");

        this.fw = TundraSDK.framework;
        this.updateSub = null;
        this.plane = new THREE.Plane(new THREE.Vector3(0,-1,0), 30);
        this.lookAtRay = new THREE.Ray();
        this.lastPos = new THREE.Vector3(Infinity, Infinity, Infinity);

        // Wait for UserPresenceApplications's creation.
        this.fw.scene.onEntityCreated(this, this.onEntityCreated);
    },

    onEntityCreated : function(entity)
    {
        if (entity.id == 4) // TODO Not the nicest way, but there is no guarantee that the name would be set here.
        {
            console.log("UserPresenceApplication ready!");
            this.entity = entity;
            /*
            this.updateSub = this.fw.frame.onUpdate(this, this.sendPositionUpdate);
            */
        }
    },

    sendPositionUpdate : function(newPos, time)
    {
        if (this.entity && world.camera.camera)
        {
            if (!newPos)
            {
                this.lookAtRay.origin.copy(world.camera.camera.position);
                this.lookAtRay.direction.copy(new THREE.Vector3(0, 0, -1).applyQuaternion(world.camera.camera.quaternion));
                newPos = this.lookAtRay.intersectPlane(this.plane);
            }
            if (!this.lastPos.equals(newPos))
            {
                // console.log(newPos);
                if (time)
                    this.entity.exec(EntityAction.Server, "UserPresencePositionUpdate", [JSON.stringify({ x : newPos.x, y : newPos.y, z : newPos.z, t : time })]);
                else
                    this.entity.exec(EntityAction.Server, "UserPresencePositionUpdate", [JSON.stringify({ x : newPos.x, y : newPos.y, z : newPos.z })]);
                this.lastPos = newPos;
            }
        }
    },

    onScriptDestroyed : function()
    {
        /*
        if (this.updateSub)
            TundraSDK.framework.events.unsubscribe(this.updateSub);
        */
    },
});
