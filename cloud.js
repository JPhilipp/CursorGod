function Cloud() {
    this.directionX = Misc.chance() ? -1 : 1;
    this.speed = Misc.getRandom(.4, .6);
    this.maxX = 20;
    this.maxY = 14;
    
    var color = [200,240,255];
    var material = new THREE.MeshLambertMaterial({
            color: color.toRgbString(),
            transparent: true, opacity: .035,
            blending: THREE.AdditiveBlending    
        });
    var segments = 8;
    var geometry = new THREE.BoxGeometry(8, 6, 1, segments, segments, segments);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = false;
    this.shape.receiveShadow = false;
    ObjectHelper.randomizeVerticesAllAxis(this.shape, .5);

    this.shape.position.x = Misc.getRandomInt(-this.maxX, this.maxX);
    this.shape.position.y = Misc.getRandomInt(-this.maxY, this.maxY);
    this.shape.position.z = 7;

    universe.scene.add(this.shape);
};

Cloud.prototype.update = function() {
    var speed = this.directionX * this.speed * universe.tick;
    this.shape.position.x += speed;

    if (this.directionX > 0) {
        if (this.shape.position.x > this.maxX) {
            this.shape.position.x = -this.maxX;
            this.shape.position.y = Misc.getRandomInt(-this.maxY, this.maxY);
        }
    }
    else if (this.directionX < 0) {
        if (this.shape.position.x < -this.maxX) {
            this.shape.position.x = this.maxX;
            this.shape.position.y = Misc.getRandomInt(-this.maxY, this.maxY);
        }
    }
};
