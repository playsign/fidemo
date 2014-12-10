
var FiwareDemo = IApplication.$extend(
{
    __init__ : function()
    {
        console.log("FIWARE Demo");
        this.$super("FIWARE Demo");

        this.subscribeEvent(TundraSDK.framework.client.onConnected(this, this.onConnected));
        this.subscribeEvent(TundraSDK.framework.client.onDisconnected(this, this.onDisconnected));
        this.subscribeEvent(TundraSDK.framework.frame.onUpdate(this, this.onUpdate));

        /* red test pilar with three.js code directly
        var dmat = new THREE.MeshBasicMaterial({color: 0xFF0000});
        var dcubegeom = new THREE.CubeGeometry(3, 8, 3);
        var dcube = new THREE.Mesh(dcubegeom, dmat);
        dcube.scale.set(4, 18, 4);
        TundraSDK.framework.renderer.scene.add(dcube)
        this.dcube = dcube;
        this.move = 1;
        */

        /* using tundra apis to create an entity (for networking, but this is local)
        var scene = TundraSDK.framework.scene;
        var ECEnt = scene.createLocalEntity(); // 100, ["Name"]);
        this.log.debug("Created entity", ECEnt);
        
        var plc = ECEnt.createLocalComponent("Placeable");
        plc.setScale(50, 50, 50)
        var mesh = ECEnt.createLocalComponent("Mesh", "cube");
        mesh.meshRef = "suzanne.js";
        scene.addEntity(ECEnt);
        this.ECEnt = ECEnt
        */        
        this.buildingAnimator = null;
    },

    onConnected : function()
    {
        this.log.debug("Connected to server");
    },

    onDisconnected : function()
    {
        this.log.debug("Disconnected from server"); 
    },

    onUpdate : function(frametime)
    {
        /*
        var x = this.dcube.position.x;
        if (Math.abs(this.dcube.position.x) > 150) { //stupid simple bounce
            this.move = -this.move;
        }
        this.dcube.position.x = x + this.move;

        //and let the monkey dance too
        if (this.mesh) {
            this.mesh.position.z = this.dcube.position.x;
        }

        //.. and the tundra ent monkey
        if (this.ECEnt) {
            this.ECEnt.placeable.setPosition(0, 0, -this.dcube.position.x);
        }
        */
       if (this.buildingAnimator != null)
           this.buildingAnimator.Update(frametime);
           
    },

    onKeyEvent : function(event)
    {
    },

    onMouseMove : function(event)
    {
    }
});
