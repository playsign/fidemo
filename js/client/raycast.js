var Raycast = function(world)
{
  this.world = world;
  this.objectOwners = [];
  this.mouseDownX = 0;
  this.mouseDownY = 0;
  return this;
};

//add owner of objects that need to be checked for raycast
Raycast.prototype = {

addObjectOwner : function(objectOwner) {
    //priority for objectOwners : first items added to objectOwners, will receive raycast
    this.objectOwners[this.objectOwners.length] = objectOwner;
    },
 
    
    onMouseMove : function(x, y) {
        var raycastHit = false;
        for(var i in this.objectOwners)
        {
            if(!raycastHit)
            {
                if(this.objectOwners[i].getRaycastObjects() != null)
                {
                    var intersections = this.doRaycast(x, y, this.objectOwners[i].getRaycastObjects());
                    if(intersections != null)
                        this.objectOwners[i].hoverObjects(intersections);
                    if(intersections.length > 0)
                        raycastHit = true;
                }
            }
            else
                this.objectOwners[i].hoverObjects([]);
        }    
    },
    
    onMouseDown : function(x, y) {
        this.mouseDownX = x;
        this.mouseDownY = y;
    },
    
    onMouseUp : function(x, y) {
    if (x == this.mouseDownX && y == this.mouseDownY) {
   if(!this.doSelectionRaycast(x,y))
        globalData.lollipopMenu.onLollipopAreaMoveCheck(x,y);
        }
    },

    doRaycast : function(x, y, objects) {
    // create a Ray with origin at the mouse position
    // and direction into the scene (camera direction)
    var vector = new THREE.Vector3(x, y, 1);
    vector.unproject(this.world.camera.camera);
    var pLocal = new THREE.Vector3(0, 0, -1);
    var pWorld = pLocal.applyMatrix4(this.world.camera.camera.matrixWorld);
    var ray = new THREE.Raycaster(pWorld, vector.sub(pWorld).normalize());

    var initialRes = ray.intersectObjects(objects);
    if (initialRes.length > 0)
    {
      // Three.js seems to be buggy with sprite raycast (ray hits too far away) Therefore retry with reduced scales
      var objectsPass2 = [];
      var origScales = [];
      for (var i = 0; i < initialRes.length; ++i)
      {
        var obj = initialRes[i].object;
        objectsPass2.push(obj);
        var s = new THREE.Vector3();
        s.copy(obj.scale);
        origScales.push(s);
        obj.scale.set(s.x * 0.5, s.y * 0.5, s.z * 0.5);
      }

      var improvedRes = ray.intersectObjects(objectsPass2);

      // Restore original scales before returning the improved result
      for (var i = 0; i < objectsPass2.length; ++i)
        objectsPass2[i].scale.set(origScales[i].x, origScales[i].y, origScales[i].z);

      return improvedRes;
    }
    else
      return initialRes;
  },
  
    doSelectionRaycast : function(x, y) {
    for(var i in this.objectOwners)
    {
            if(this.objectOwners[i].getRaycastObjects() != null)
            {
                var intersections = this.doRaycast(x, y, this.objectOwners[i].getRaycastObjects());
                if(intersections.length > 0)
                {
                    this.objectOwners[i].onMouseClick(intersections);
                    return true;
                }
            }
    }
    return false;
    },

    planeRaycast : function(x, y) {/*
    var vector = new THREE.Vector3(x, y, 1);
    vector.unproject(this.world.camera.camera);
    var pLocal = new THREE.Vector3(0, 0, -1);
    var pWorld = pLocal.applyMatrix4(this.world.camera.camera.matrixWorld);
    var ray = new THREE.Ray(pWorld, vector.sub(pWorld).normalize());
    var intersectPoint = ray.intersectPlane(globalData.lollipopMenu.worldPlane, null);
    return intersectPoint;*/
  },
  };
  