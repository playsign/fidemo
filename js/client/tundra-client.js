
var FiwareDemo = ICameraApplication.$extend(
{
    __init__ : function()
    {
        this.$super("FIWARE Demo");

      	this.subscribeEvent(TundraSDK.framework.client.onConnected(this, this.onConnected));
        this.subscribeEvent(TundraSDK.framework.client.onDisconnected(this, this.onDisconnected));
        this.subscribeEvent(TundraSDK.framework.frame.onUpdate(this, this.onUpdate));
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
