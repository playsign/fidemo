function debugObject(lat, lng) {
    var dmat = new THREE.MeshBasicMaterial({color: 0x0000FF});
    var dcubegeom = new THREE.CubeGeometry(3, 8, 3);
    var dcube = new THREE.Mesh(dcubegeom, dmat);
    var dgeocoord = new VIZI.LatLon(lat, lng);
    
    var dscenepoint = world.project(dgeocoord);
    dcube.position.x = dscenepoint.x;
    dcube.position.y = dscenepoint.z; 
    dcube.position.z = dscenepoint.y; //defaults to 0 when no altitude
    dcube.scale.set(4, 18, 4);
    world.scene.add(dcube)
    return dcube;
}
