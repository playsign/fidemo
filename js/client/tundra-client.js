
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
    },

    onKeyEvent : function(event)
    {
    },

    onMouseMove : function(event)
    {
    }
});
