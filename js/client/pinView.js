
var Pin = function(material, type, owner, latLong, objectDescription, uuid, tags) {
    
    this.type = type;
    this.owner = owner;
    this.uuid = uuid;
    this.latLong = latLong;
    this.modelYpos = 10;
    this.spriteYpos = 40;
    this.sprite = this.createSprite(material);
    this.onHighlightArea = false; //defines if pin is on highlighted area, and if it is to be shown when type of pins is shown
   // this.sprite.visible = false;
   // this.show();
    return this;
};

Pin.prototype = {
    createSprite : function(material) {
    
        if(material == null)
        {   
            console.log("material for pin not given");
            return null;
        }   
        var sprite = new THREE.Sprite(material);        
        sprite.scale.set(25, 25, 25);

        var dscenepoint = this.owner.world.project(this.latLong);

        sprite.position.x = dscenepoint.x;
        sprite.position.y = this.spriteYpos;
        sprite.position.z = dscenepoint.y;
        
        return sprite;
    },

    show : function() {
        this.sprite.visible = true;
    },

    hide : function() {
        this.sprite.visible = false;
    },
    
    onTooltip : function() {
    
    },
    
    onSelect : function() {
    
    },
};

var PinView = function(lolliPopMenu) 
{
  pinView = this;
  this.pins = [];
  this.pinTypes = [];
  this.setPinMaterials(); 
  return this;
};

PinView.prototype = {
  
    addPin : function(type, owner, latLong, objectDescription, uuid, tags) 
    {
        //Loop trough existing pins, if already created, show it and return
        for(var i in this.pins)
        {
            if(this.pins[i].uuid == uuid)
            {
                this.pins[i].show();
                this.pins[i].onHighlightArea = true;
                return;
            }
        }
        //if pin doesn't exist, create it
        for(var i in this.pinTypes)
            if (this.pinTypes[i].type == type)
            {
                var pin = new Pin(this.pinTypes[i].material, type, owner, latLong, objectDescription, uuid, tags);
                this.pins[this.pins.length] = pin;
                pin.onHighlightArea = true;
                owner.add(pin.sprite);
                return;
            }
        
        console.log("pin not found with uuid : " + uuid + " or pinMaterial with type :" + type + " doesn't exist");
    },

    removePin : function() {

    },
    
    //Hide pin by owner ( BluepintOutput)
    hidePinsByOwner : function(owner)
    {    
       if(owner != null)
        {
            for(var i in this.pins)
                if(this.pins[i].owner == owner)
                {
                    this.pins[i].onHighlightArea = false;
                    this.pins[i].hide();
                }
        }
    },
    
    //set pins visible by group
    setPinsByGroupVisible : function(group, visible)
    {
       var pinTypeGroup = this.getPinTypeGroup(group);
       for(var type in pinTypeGroup)
       {
            for(var i in this.pins)
            {     
                if(this.pins[i].type == pinTypeGroup[type].type && this.pins[i].onHighlightArea)
                {
                    if(visible)
                        this.pins[i].show();
                    else
                        this.pins[i].hide();
                }
            }
        }
    },
    
    //Show pins by type (string)
    showPinsByType : function(types)
    {
       for(var type in types)
        {
            for(var i in this.pins)
                if(this.pins[i].onHighlightArea && this.pins[i].type == types[type])
                    this.pins[i].show();
        }
    },

    hideAllPinsOnAreaExceptType : function(type) 
    {
        if(type != null)
        {
            for(var i in this.pins)
                if(this.pins[i].type != type)
                    this.pins[i].hide();
                else if(this.pins[i].onHighlightArea)
                    this.pins[i].show();
        }
    },
    
    //selection is selected icon in LollipopMenu, selectionState is count of continious selects on icon
    selectionUpdate : function(selection, selectionState)
    {   
        var groupName = "";
        if(selection == 2)
            groupName = "service";
        else
            this.setPinsByGroupVisible("service", false); 
        
        var selectionGroup = this.getPinTypeGroup(groupName);
        if(selectionGroup.length == 0)
        {
            console.log("No selection group for gicen selection");
            return;
        }
        //show all
        if(selectionState == 0)
          this.setPinsByGroupVisible(groupName, true);

        //hide all & reset selectionState to 0
        else if(selectionGroup.length <= selectionState)
        {
            this.setPinsByGroupVisible(groupName, false);
            selectionState = 0;
            return selectionState;
        }
        //show next type from group
        else
            this.hideAllPinsOnAreaExceptType(selectionGroup[selectionState].type); 
        
        selectionState++;
        return selectionState;
    },
    
    getPinTypeGroup : function(groupName)
    {
        var selectionGroup = [];
            for(var i in this.pinTypes)   
            if(this.pinTypes[i].group == groupName)
                selectionGroup[selectionGroup.length] = this.pinTypes[i];
         return selectionGroup;
    },

    //when adding new types of pin, add materials here
    setPinMaterials : function()
    {
        this.addPinType("service", "cafe", "data/2d/icon_cafe.png");
        this.addPinType("service", "bar", "data/2d/icon_bar.png");
        this.addPinType("service", "restaurant", "data/2d/icon_restaurant.png");
        this.addPinType("service", "shop", "data/2d/icon_shop.png");   
        this.addPinType("service", "education", "data/2d/icon_public.png");
        this.addPinType("service", "hospital", "data/2d/icon_hospital.png");       
    },
    
    addPinType : function(group, type, icon)
    {
        pinType = {};
        pinType.type = type;
        pinType.group = "service";
        var pinMap = THREE.ImageUtils.loadTexture(icon);
        pinType.material = new THREE.SpriteMaterial({
          map: pinMap,
          color: 0xffffff,
          fog: true
        });
        this.pinTypes[this.pinTypes.length] = pinType;
    },
};