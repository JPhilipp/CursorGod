function Nature(position, type) {
    this.id = universe.getNewId();
    this.type = type;
    
    this.position = position.clone();
    
    this.shapes = [];
    
    switch (this.type) {
        case 'forest': this.initTreeShapes();  break;
        case 'water':  this.initWaterShapes(); break;
    }
};

Nature.prototype.initTreeShapes = function() {
    var max = Misc.getRandomInt(8, 12);
    for (var i = 0; i < max; i++) {
        var size = Misc.getRandom(.2, .4);
        var green = Misc.getRandomInt(120, 230);
        var material = new THREE.MeshLambertMaterial({color: 'rgb(118,' + green + ',50)'});
        var geometry = new THREE.OctahedronGeometry(size);
        var shape = new THREE.Mesh(geometry, material);

        var spread = 1;
        shape.position.x = this.position.x + Misc.getRandom(-spread, spread);
        shape.position.y = this.position.y + Misc.getRandom(-spread, spread);
        shape.position.z = size / 2;
        shape.castShadow = true;
        shape.receiveShadow = true;
        shape.rotation.z = Misc.getRandom(0, Math.PI / 2);

        this.shapes[i] = shape;
        universe.scene.add(this.shapes[i]);
    }
};

Nature.prototype.initWaterShapes = function() {
    var max = Misc.getRandomInt(8, 12);
    for (var i = 0; i < max; i++) {
        var size = Misc.getRandom(.7, .9);
        var segments = 4;
        var green = Misc.getRandomInt(90, 120);
        var material = new THREE.MeshLambertMaterial({color: 'rgb(89,' + green + ',207)'});
        var geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        var shape = new THREE.Mesh(geometry, material);

        var spread = 1;
        shape.position.x = this.position.x + Misc.getRandom(-spread, spread);
        shape.position.y = this.position.y + Misc.getRandom(-spread, spread);
        shape.position.z = .1;
        shape.rotation.z = Misc.getRandom(0, Math.PI / 2);
        shape.receiveShadow = true;
        ObjectHelper.randomizeVertices(shape, .1, .1, .2);

        this.shapes[i] = shape;
        universe.scene.add(this.shapes[i]);
    }
};
