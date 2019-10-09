function Connector(position, type, subtype, isLeftRight, neigbhorItem) {
    this.id = universe.getNewId();
    this.type = type;
    this.subtype = subtype;
    this.isLeftRight = isLeftRight;
    this.neigbhorItemColor = neigbhorItem.color;
    
    this.position = position.clone();

    this.shapes =  [];

    switch (this.type) {
        case 'pipe':  this.initPipeShapes();  break;
        case 'road':  this.initRoadShapes();  break;
        case 'grass': this.initGrassShapes(); break;
        case 'haven': this.initHavenShapes(); break;
    }
    universe.multiplyHappyMomentsPerSecond();
};

Connector.prototype.initPipeShapes = function() {
    var color = universe.constructionTypes[this.subtype].color;
    if (!color) { color = Misc.cloneObject(this.neigbhorItemColor); }
    if (!color) { color = [100,100,100]; }
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString() });

    var radius = .075;
    var radiusSegments = 8;
    var heightSegments = 1;
    var height = 4;
    var geometry = new THREE.CylinderGeometry(radius, radius, height,
            radiusSegments, heightSegments);
    var shape = new THREE.Mesh(geometry, material);

    shape.position.x = this.position.x;
    shape.position.y = this.position.y;
    shape.position.z = .4;
    shape.castShadow = true;
    shape.receiveShadow = true;
    if (this.isLeftRight) { shape.rotation.z = Math.PI / 2; }

    var i = 0;
    this.shapes[i] = shape;
    universe.scene.add(this.shapes[i]);

    universe.addAnimalGroup('bird', this);
};

Connector.prototype.initRoadShapes = function() {
    var material = new THREE.MeshLambertMaterial({
        color: 'rgb(100,100,100)'
    });

    var segments = 1;
    var thickness = .3;
    var length = 4;
    var height = .35;
    var geometry = new THREE.BoxGeometry(thickness, length, height,
            segments, segments, segments);
    var shape = new THREE.Mesh(geometry, material);

    var distance = .4;
    shape.position.x = this.position.x;
    shape.position.y = this.position.y;
    shape.position.z = 0;
    shape.castShadow = false;
    shape.receiveShadow = true;
    if (this.isLeftRight) {
        shape.rotation.z = Math.PI / 2;
    }

    var i = 0;
    this.shapes[i] = shape;
    universe.scene.add(this.shapes[i]);
    
    universe.addMovable(shape.position, 'car');
};

Connector.prototype.initGrassShapes = function() {
    for (var i = 1; i <= 10; i++) {
        var size = Misc.getRandom(.7, .9);
        var segments = 4;
        var green = Misc.getRandomInt(90, 120);
        var color = Misc.distortColors([109, 168, 79], 20);
        var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
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
    
    universe.addAnimalGroup('groundFeeder', this);
};

Connector.prototype.initHavenShapes = function() {
    for (var i = 1; i <= 15; i++) {
        var size = Misc.getRandom(.4, 1.2);
        var segments = 4;
        var green = Misc.getRandomInt(90, 120);
        var color = Misc.distortColors([166, 108, 79], 20);
        var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
        var geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        var shape = new THREE.Mesh(geometry, material);

        var spread = 1;
        shape.position.x = this.position.x + Misc.getRandom(-spread, spread);
        shape.position.y = this.position.y + Misc.getRandom(-spread, spread);
        shape.position.z = .2;
        shape.receiveShadow = true;

        this.shapes[i] = shape;
        universe.scene.add(this.shapes[i]);
    }
    universe.addMovable(this.position, 'ship');
};
