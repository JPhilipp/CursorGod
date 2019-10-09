function Stone(position, targetPosition, subtype) {
    this.subtype = subtype;

    var color = Misc.cloneObject(universe.constructionTypes[this.subtype].color);
    if (!color) { color = [0, 0, 0]; }
    color = Misc.distortColors(color, 30);
    
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
    var size = Misc.getRandom(.12, .15);
    var geometry = new THREE.BoxGeometry(size, size, size);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.position.x = position.x;
    this.shape.position.y = position.y;
    this.shape.position.z = .35;
    this.targetPosition = targetPosition.clone();
    
    var distortion = .15
    this.targetPosition.x += Misc.getRandom(-distortion, distortion);
    this.targetPosition.y += Misc.getRandom(-distortion, distortion);
    this.targetPosition.z = .15;

    this.energy = 100;
    this.didReachTarget = false;
    
    this.shape.lookAt(this.targetPosition);
    
    universe.scene.add(this.shape);
};

Stone.prototype.update = function() {
    if (this.didReachTarget) {
        this.shape.position.z -= 1 * universe.tick;
        if (this.shape.position.z <= -.5) { this.energy = 0; }
    }
    else {
        this.didReachTarget = ObjectHelper.followTargetStraight(
            this.shape.position, this.targetPosition, 2 * universe.tick
        );
    }
};
