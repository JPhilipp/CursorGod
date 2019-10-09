function SpecialEventActor(type, direction) {
    this.id = universe.getNewId();
    this.type = type;
    this.direction = direction;
    this.shape = null;
    this.speed = .5;
    this.nearEdgeOfPlane = 60;
    this.activity = null;
    
    switch (this.type) {
        case 'infectedBeing': this.initInfectedBeing(); break;
        case 'wildAnimal':    this.initWildAnimal(); break;
        case 'meteor':        this.initMeteor(); break;
        case 'ufo':           this.initUfo(); break;
    }
};

SpecialEventActor.prototype.initInfectedBeing = function() {
    var color = Misc.distortColors([48,179,66], 40);
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
    var size = universe.humanSize;
    var segments = 2;
    var geometry = new THREE.BoxGeometry(size * 2, size, size,
            segments, segments, segments);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = true;

    var variationY = 2;
    this.shape.position.x = this.nearEdgeOfPlane * -this.direction +
            Misc.getRandomInt(-.25, .25);
    this.shape.position.y = Misc.getRandomInt(-variationY, variationY);
    this.shape.position.z = .25;

    this.speed = 2.3 + Misc.getRandom(0, .3);
    this.targetPosition = new THREE.Vector3(
            this.nearEdgeOfPlane * this.direction,
            this.shape.position.y,
            this.shape.position.z);
    this.targetPosition.y += Misc.getRandomInt(-variationY, variationY);
    this.shape.lookAt(this.targetPosition);

    ObjectHelper.randomizeVerticesAllAxis(this.shape, .035);
    universe.scene.add(this.shape);
};

SpecialEventActor.prototype.initWildAnimal = function() {
    var color = Misc.distortColors([191,132,36], 30);
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
    var size = universe.humanSize * 1.2;
    var segments = 2;
    var geometry = new THREE.BoxGeometry(size, size, size * 2,
            segments, segments, segments);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = true;

    this.normalZ = .1;
    
    var variationY = 1;
    this.shape.position.x = this.nearEdgeOfPlane * -this.direction +
            Misc.getRandomInt(-4, 4);
    this.shape.position.y = Misc.getRandomInt(-variationY, variationY);
    this.shape.position.z = .25;
    
    this.speed = 3.5 + Misc.getRandom(0, .4);
    this.targetPosition = new THREE.Vector3(
            this.nearEdgeOfPlane * this.direction,
            this.shape.position.y,
            this.shape.position.z);
    this.targetPosition.y += Misc.getRandomInt(-variationY, variationY);
    this.shape.lookAt(this.targetPosition);

    ObjectHelper.randomizeVerticesAllAxis(this.shape, .1);
    universe.scene.add(this.shape);
};

SpecialEventActor.prototype.initMeteor = function() {
    var color = [84,46,13];
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
    var radius = 1.5;
    var widthSegments = 12;
    var heightSegments = 12;
    var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = true;

    var variation = 8;
    this.shape.position.x = Misc.getRandomInt(-variation, variation);
    this.shape.position.y = Misc.getRandomInt(-variation, variation);
    this.shape.position.z = 30;
    
    this.speed = 8;
    this.targetPosition = new THREE.Vector3(
            -this.shape.position.x, this.shape.position.y, .5);

    ObjectHelper.randomizeVerticesAllAxis(this.shape, .3);
    this.activity = 'fall';
    universe.scene.add(this.shape);
};

SpecialEventActor.prototype.update = function() {
    var speed = this.speed * universe.tick;

    switch (this.type) {
        case 'wildAnimal':
            this.shape.position.z = this.normalZ + .1 +
                    Math.cos(this.shape.position.x * 2) * .2;
            var didReach = ObjectHelper.followTargetStraight(
                    this.shape.position, this.targetPosition, speed
            );
            if (didReach) { this.energy = 0; }
            break;
            
        case 'infectedBeing':
            var didReach = ObjectHelper.followTargetStraight(
                    this.shape.position, this.targetPosition, speed
            );
            if (didReach) { this.energy = 0; }
            break;
            
        case 'meteor':
            if (this.activity == 'fall') {
                var didReach = ObjectHelper.followTargetStraight(
                        this.shape.position, this.targetPosition, speed
                );
                this.shape.rotation.x -= speed * .3;
                if (didReach) {
                    this.activity = 'sink';
                }
            }
            else if (this.activity == 'sink') {
                this.shape.position.z -= speed * .05;
                if (this.shape.position.z < -2.5) {
                    this.energy = 0;
                }
            }
            break;
    }
   
};
