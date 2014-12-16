
var Pin = function(material, type, owner, latLong, objectDescription, uuid, tags) {
    
    this.type = type;
    this.owner = owner;
    this.uuid = uuid;
    this.latLong = latLong;
    this.modelYpos = 10;
    this.spriteYpos = 40;
    this.sprite = this.createSprite(material);
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
};

var PinView = function() {
  pinView = this;
  this.pins = [];
  this.pinMaterials = [];
  this.setPinMaterials();
  return this;
};

PinView.prototype = {
  
    showPin : function(type, owner, latLong, objectDescription, uuid, tags) {
    
        //Loop trough existing pins, if already created, show it and return
        for(var i in this.pins)
        {
            if(this.pins[i].uuid == uuid)
            {
                this.pins[i].show();
                return;
            }
        }
        //if pin doesn't exist, create it
        for(var i in this.pinMaterials)
            if (this.pinMaterials[i].type == type)
            {
                var pin = new Pin(this.pinMaterials[i].material, type, owner, latLong, objectDescription, uuid, tags);
                this.pins[this.pins.length] = pin;
                owner.add(pin.sprite);
                return;
            }
        
        console.log("pin not found with uuid : " + uuid + " or pinMaterial with type :" + type + " doesn't exist");
    },

    removePin : function() {

    },
    
    //Hide pin by owner ( BluepintOutput)
    hidePinsByOwner : function(owner){
       
       if(owner != null)
        {
            for(var i in this.pins)
                if(this.pins[i].owner == owner)
                    this.pins[i].sprite.visible = false;
        }
    },
    
    //Hide pin by type (string)
    hidePinsByType : function(type){
       
       if(type != null)
        {
            for(var i in this.pins)
                if(this.pins[i].type == type)
                    self.pins[i].sprite.visible = false;
        }
    },
    

    filterPins : function(type, visible) {

    },

    //when adding new types of pin, add materials here
    setPinMaterials : function() {
    
        var pinMaterialCafe = {};
        pinMaterialCafe.type = "cafe";
        var pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_cafe.png");
        pinMaterialCafe.material = new THREE.SpriteMaterial({
          map: pinMap,
          color: 0xffffff,
          fog: true
        });
        this.pinMaterials[this.pinMaterials.length] = pinMaterialCafe;
        
        var pinMaterialBar = {};
        pinMaterialBar.type = "bar";
        pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_bar.png");
        pinMaterialBar.material = new THREE.SpriteMaterial({
          map: pinMap,
          color: 0xffffff,
          fog: true
        });
        this.pinMaterials[this.pinMaterials.length] = pinMaterialBar;
        
        var pinMaterialRestaurant = {};
        pinMaterialRestaurant.type = "restaurant";
        pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_restaurant.png");
        pinMaterialRestaurant.material = new THREE.SpriteMaterial({
          map: pinMap,
          color: 0xffffff,
          fog: true
        });
        this.pinMaterials[this.pinMaterials.length] = pinMaterialRestaurant;
        
        var pinMaterialShop = {};
        pinMaterialShop.type = "shop";
        pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_shop.png");
        pinMaterialShop.material = new THREE.SpriteMaterial({
          map: pinMap,
          color: 0xffffff,
          fog: true
        });
        this.pinMaterials[this.pinMaterials.length] = pinMaterialShop;
        
        var pinMaterialEducation = {};
        pinMaterialEducation.type = "education";
        pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_public.png");
        pinMaterialEducation.material = new THREE.SpriteMaterial({
          map: pinMap,
          color: 0xffffff,
          fog: true
        });
        this.pinMaterials[this.pinMaterials.length] = pinMaterialEducation;
        
        var pinMaterialHospital = {};
        pinMaterialHospital.type = "hospital"; 
           pinMap = THREE.ImageUtils.loadTexture("data/2d/icon_hospital.png");
        pinMaterialHospital.material = new THREE.SpriteMaterial({
          map: pinMap,
          color: 0xffffff,
          fog: true
        });
        this.pinMaterials[this.pinMaterials.length] = pinMaterialHospital;  
    },
};