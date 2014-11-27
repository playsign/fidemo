
var FiwareDemo = ICameraApplication.$extend(
{
    __init__ : function()
    {
        console.log("FIWARE Demo");
        this.$super("FIWARE Demo");

      	this.subscribeEvent(TundraSDK.framework.client.onConnected(this, this.onConnected));
        this.subscribeEvent(TundraSDK.framework.client.onDisconnected(this, this.onDisconnected));
        this.subscribeEvent(TundraSDK.framework.frame.onUpdate(this, this.onUpdate));

        var dmat = new THREE.MeshBasicMaterial({color: 0xFF0000});
        var dcubegeom = new THREE.CubeGeometry(3, 8, 3);
        var dcube = new THREE.Mesh(dcubegeom, dmat);
        dcube.scale.set(4, 18, 4);
        TundraSDK.framework.renderer.scene.add(dcube)
        this.dcube = dcube;
        this.move = 1;

        var scene = TundraSDK.framework.scene;
        var ECEnt = scene.createLocalEntity(100, ["Name", "Placeable", "Camera"]);

        this.log.debug("Created entity", ECEnt);

        var mesh = ECEnt.createLocalComponent("Mesh", "cube");
        mesh.meshRef = "cube.json";
        scene.addEntity(ECEnt);
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
        var x = this.dcube.position.x;
        if (Math.abs(this.dcube.position.x) > 150) { //stupid simple bounce
            this.move = - this.move;
        }
        this.dcube.position.x = x + this.move;
    },

    onKeyEvent : function(event)
    {
    },

    onMouseMove : function(event)
    {
    }
});
