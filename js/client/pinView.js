
//single Pin in PinView
var Pin = function(material, type, owner, latLong, objectDescription, uuid, tags, group) {
    
    this.type = type;
    this.owner = owner;
    this.uuid = uuid;
    this.latLong = latLong;
    this.modelYpos = 10;
    this.spriteYpos = 40;
    this.tags = tags; //tags can be HelsinkiIssues IssueItem or OpensSteetMap tags
    this.sprite = this.createSprite(material);
    this.isHover = false;
    if(this.tags != null && this.tags.name != null)
        this.pinName = this.tags.name;      
    this.onHighlightArea = false; //defines if pin is on highlighted area, and if it is to be shown when type of pins is shown
    this.group = group;
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
        sprite.parentPin = this;
        return sprite;
    },

    //always call show, do not use directly sprite.visible from elsewhere
    show : function() {   
        this.sprite.visible = true;
        globalData.pinView.updatePinVisible(this.sprite, true);
    },
    
    //always call hide, do not use directly sprite.visible from elsewhere
    hide : function() {
        this.sprite.visible = false;
        globalData.pinView.updatePinVisible(this.sprite, false);
    },
    
    hoverIn : function() {
       console.log("in" + this.pinName);
    },
    
    hoverOut : function() {
        console.log("out" + this.pinName);
    },
    
    //Check on which group type belongs and open popup basen on the group
    onSelect : function() {
        for(var i in globalData.pinView.pinTypes)
            if(globalData.pinView.pinTypes[i].type == this.type)
            {   
                if(globalData.pinView.pinTypes[i].group == "fix")
                {
                    globalData.lollipopMenu.openDialog(this.tags);
                    return;
                }
                else (globalData.pinView.pinTypes[i].group == "service")
                { 
                    console.log(this.pinName);
                    console.log(this.getInfofromTags());
                    return;
                }
            }
    },
    
    onTooltip : function(visible) {
        console.log("Show Tooltip " + visible);
    },
    
    getInfofromTags : function() {
    
    var keys = Object.keys(this.tags);
    //first element, if it exists, is address
    info = ParseAddress(this.tags["addr:street"], this.tags["addr:housenumber"], this.tags["addr:postcode"], this.tags["addr:city"], this.tags["addr:country"]);
    for(var key in keys)
     {
        var keyString = keys[key];
        //ignore these keys, they are handled elsewhere
        if (keyString == "addr:street" || keyString == "addr:housenumber" || 
        keyString == "addr:postcode" || keyString == "addr:city" || 
        keyString == "addr:country" || keyString == "name")
            continue;
        var value = this.tags[keyString];
        keyString = keyString.replace("_", " ");
        info += keyString +": " + value +"\n"; 
        
     }
    return info;
    },
    
};

var ParseAddress = function(street, house, postCode, city, country)
{   
    //no address
    if(street == null && house == null && postCode == null && city == null && country == null)
        return "";
        
    var address = "address :\n";
    if (street != null)
    {
        address += street;
        if (house != null)
            address += " " + house;
        address += "\n";
    }
    if (postCode != null)
       address += postCode + " ";
    if (city != null)
        address += city;
    address += "\n";
    if (country != null)
        address += country +"\n";
                 
    return address;
}

//Handles all the pins
var PinView = function(lolliPopMenu) 
{
  pinView = this;
  this.pins = [];
  this.pinTypes = [];
  this.setPinMaterials();
  this.pinSpritesVisible = [];
  this.hoverPin = null;
  this.scalePins = [];
  globalData.raycast.addObjectOwner(this);
  this.visibleGroup = "";
  this.visibleType = "";
  return this;
};

PinView.prototype = {

      getRaycastObjects : function() {
        return this.pinSpritesVisible;
    },
    
    onMouseClick : function(intersections) {
        if(intersections && intersections.length > 0)
                intersections[0].object.parentPin.onSelect();
    },
    
    hoverObjects : function(intersections) {
        if(intersections)
        {   if(intersections.length > 0)
            {
                this.checkHoverPin(intersections[0].object.parentPin);
            }
            else
               this.checkHoverPin(null);
        }
        else
            this.checkHoverPin(null);
    },

    checkHoverPin : function(pin){
    
        //set null
        if(pin == null && this.hoverPin != null) 
        {
            this.hoverPin.hoverOut();
            this.hoverPin = null;
        }

        else if(pin != null && this.hoverPin == null) //first time setup
        {
            this.hoverPin = pin;
            this.hoverPin.hoverIn();
        }  
        //change hoverPin
        else if(pin != this.hoverPin && this.hoverPin != null)
        {
            this.hoverPin.hoverOut();
            this.hoverPin = pin;
            this.hoverPin.hoverIn();
        }
    },
    
    addScalePin : function(pin) {
        for(var i in this.scalePins)
        {    
            if(this.scalePins[i] == pin)
                return;
        }
        this.scalePins[this.scalePins.length] = pin;
    },
    
     removeScalePin : function(pin) {
        for(var i in this.scalePins)
            if(this.scalePins[i] == pin)
                this.scalePins.splice(i,1);
    },
    
    onTick : function(delta) {
        for(var i in this.scalePins)
        {
            if( this.scalePins[i] != null)
                this.scalePins[i].updateTween(delta);
            if( this.scalePins[i] != null)
                this.scalePins[i].updateScale(delta);
        }
    },
    
    updatePinVisible : function(sprite, visible) 
    {
        for(var i in this.pinSpritesVisible)
        {
            if(this.pinSpritesVisible[i] == sprite)
                if(visible)   
                    return; //pinSprite already in visible list, do nothing
                else
                {
                   // console.log("delete");
                    this.pinSpritesVisible.splice(i,1);

                    return;
                }
        }
        if(visible)
            this.pinSpritesVisible[this.pinSpritesVisible.length] = sprite;
       
    },
  
    addPin : function(type, owner, latLong, objectDescription, uuid, tags) 
    {
        //Loop trough existing pins, if already created, show it and return
        for(var i in this.pins)
        {
            if(this.pins[i].uuid == uuid)
            {
                if(this.pins[i].group == this.visibleGroup || this.visibleGroup == "all")
                {   if(this.pins[i].type == this.visibleType || this.visibleType == "all")
                    {
                        this.pins[i].show();
                        this.pins[i].onHighlightArea = true;
                    }
                }
                else
                    this.pins[i].onHighlightArea = true;
                return;
            }
        }
        //if pin doesn't exist, create it
        for(var i in this.pinTypes)
            if (this.pinTypes[i].type == type)
            {
                var pin = new Pin(this.pinTypes[i].material, type, owner, latLong, objectDescription, uuid, tags, this.pinTypes[i].group);
                this.pins[this.pins.length] = pin;
                pin.onHighlightArea = true;
                owner.add(pin.sprite);
                
                if(this.pinTypes[i].group == this.visibleGroup || this.visibleGroup == "all")

                    if(type == this.visibleType || this.visibleType == "all")
                    {   
                        pin.show();
                        return;
                    }
               //hide pin if it was not in visible group/type
                pin.hide();
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
        this.visibleGroup = "none";
        this.visibleType = "none";
        if(selection == 2)
             this.visibleGroup = "service";
        else
            this.setPinsByGroupVisible("service", false); 
        if(selection == 3)
             this.visibleGroup = "fix";
        else
            this.setPinsByGroupVisible("fix", false); 
        
        var selectionGroup = this.getPinTypeGroup( this.visibleGroup);
        if(selectionGroup.length == 0)
        {
            console.log("No selection group for given selection");
            return;
        }
        //show all (by default, if fix group is selected, show them all & ignore selectionstate)
        if(selectionState == 0 || this.visibleGroup == "fix")
        {
            this.setPinsByGroupVisible( this.visibleGroup, true);
            this.visibleType = "all";    
        }

        //hide all & reset selectionState to 0
        else if(selectionGroup.length <= selectionState)
        {
            this.setPinsByGroupVisible( this.visibleGroup, false);
            selectionState = 0;
            return selectionState;
        }
        //show next type from group
        else
        {
            this.visibleType = selectionGroup[selectionState].type;
            this.hideAllPinsOnAreaExceptType(this.visibleType); 
        }
        
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
        
        this.addPinType("fix", "open", "data/2d/icon_notfixed.png");
        this.addPinType("fix", "inprogress", "data/2d/icon_fixinprogress.png");   
        this.addPinType("fix", "closed", "data/2d/icon_fixed.png");
        this.addPinType("fix", "unknown", "data/2d/icon_notfixed.png");  
    },
    
    addPinType : function(group, type, icon)
    {
        pinType = {};
        pinType.type = type;
        pinType.group = group;
        var pinMap = THREE.ImageUtils.loadTexture(icon);
        pinType.material = new THREE.SpriteMaterial({
          map: pinMap,
          color: 0xffffff,
          fog: true
        });
        this.pinTypes[this.pinTypes.length] = pinType;
    },
};