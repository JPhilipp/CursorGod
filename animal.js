function Animal(type, home, color) {
    this.type = type;
    this.speed = Misc.getRandom(.3, .5);
    this.home = home;
    this.activity = 'idling';
    this.targetPosition = null;

    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
    var size = universe.humanSize * 1.2;
    if (this.type == 'bird') { size = .05; }
    var segments = 2;
    var geometry = new THREE.BoxGeometry(size, size, size * 2,
            segments, segments, segments);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = true;

    var max = 10;
    this.shape.position.x = Misc.getRandomInt(-max, max);
    this.shape.position.y = 10;
    this.shape.position.z = this.type == 'groundFeeder' ? .2 : 5;
    
    if (this.type == 'groundFeeder') {
        ObjectHelper.randomizeVerticesAllAxis(this.shape, .1);
    }

    universe.scene.add(this.shape);
};

Animal.prototype.update = function() {
    var speed = this.speed * universe.tick;
    if (universe.useSuperSpeed) { speed *= 10; }

    switch (this.activity) {
        case 'idling':
            if (this.type == 'groundFeeder') {
                this.activity = Misc.chance(5) ? 'lookForWater' : 'lookForHomeTarget';
            }
            else {
                this.activity = 'lookForHomeTarget';
            }
            break;
        
        case 'lookForWater':
            var water = universe.getNearestItemOfType(
                    this.home.position, universe.natureSpots, 'water');
            if (water) {
                this.targetPosition = new THREE.Vector3(
                        water.position.x, water.position.y, this.shape.position.z);
                var distortion = .3;
                this.targetPosition.x = Misc.distort(this.targetPosition.x, distortion);
                this.targetPosition.y = Misc.distort(this.targetPosition.y, distortion);
            }
            this.activity = 'moveToTarget';
            break;
            
        case 'lookForHomeTarget':
            this.targetPosition = new THREE.Vector3(
                    this.home.position.x, this.home.position.y, this.shape.position.z);
            var distortion = .9;
            if (this.type == 'bird') { distortion = 3; }
            this.targetPosition.x = Misc.distort(this.targetPosition.x, distortion);
            this.targetPosition.y = Misc.distort(this.targetPosition.y, distortion);
            this.activity = 'moveToTarget';
            break;
            
        case 'moveToTarget':
            ObjectHelper.followTarget(this.shape.position, this.targetPosition,
                    speed);
            this.shape.lookAt(this.targetPosition);
            if ( this.shape.position.distanceTo(this.targetPosition) <= .25 ) {
                this.activity = 'idling';
            }
            break;
    }
};
