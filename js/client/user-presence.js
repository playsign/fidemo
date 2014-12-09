
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
        // Monitor for UserPresence (entity with "AvatarData" DC) creations.
        this.fw.scene.onComponentCreated(this, this.onComponentCreated);
        
        this.fw.scene.onEntityAction(this, this.onEntityAction);

        // Hook to frame update to process smoothed movements
        this.movements = {}
        this.updateSub = this.fw.frame.onUpdate(this, this.runSmoothedMovements);
    },

    onEntityCreated : function(entity)
    {
        if (entity.id == 4) // TODO Not the nicest way, but there is no guarantee that the name would be set here.
        {
            console.log("UserPresenceApplication ready!");
            this.entity = entity;

        }
    },

    onComponentCreated : function(entity, component)
    {
        if (component.typeId == 25 && component.name == "AvatarData" && component.color !== undefined)
        {
            if (entity.mesh)
            {
                entity.mesh.onMeshLoaded(this, function(parentEntity, meshComponent, meshAsset)
                {
                    var material = meshAsset.getSubmesh(0).material.clone();
                    material.color = component.color.toThreeColor();
                    meshAsset.getSubmesh(0).material = material;
                });
            }
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
        if (this.updateSub)
            TundraSDK.framework.events.unsubscribe(this.updateSub);
    },
    
    onEntityAction : function(action)
    {
        if (action.name == "UserPresenceSmoothedMove")
        {
            var param = JSON.parse(action.parameters[0]);
            param.et = 0;
            this.movements[param.id] = param;
        }
    },
    
    runSmoothedMovements : function(delta)
    {
        for (var id in this.movements)
        {
            var m = this.movements[id];
            var entity = this.fw.scene.entityById(m.id);
            if (entity)
            {
                m.et += delta;
                var t = m.et / m.t;
                if (t > 1.0)
                    t = 1.0;

                t = Math.sin((t-0.5)*Math.PI)*0.5+0.5; // Movement curve, can be tweaked later
                var tr = entity.placeable.transform;
                tr.pos.x = t * m.ex + (1-t) * m.sx;
                tr.pos.y = t * m.ey + (1-t) * m.sy;
                tr.pos.z = t * m.ez + (1-t) * m.sz;

                entity.placeable.setAttribute("transform", tr, AttributeChange.LocalOnly);
            }
            if (!entity || m.et > m.t)
            {
                //console.log("Del movement " + id);
                delete this.movements[id];
            }
        }
    },
});
