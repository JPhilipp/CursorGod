function Citizen() {
    this.id = universe.getNewId();

    this.activity = 'idling';
    this.movable = null;
    this.speed = Misc.getRandom(.3, .5);
    this.targetPosition = null;
    this.idlingCountdown = null;
    this.normalZ = .25;

    var color = Misc.distortColors([128,128,128], 70);
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
    var size = universe.humanSize;
    var segments = 2;
    var geometry = new THREE.BoxGeometry(size * 2, size, size,
            segments, segments, segments);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = true;

    var max = 10;
    this.shape.position.x = Misc.getRandomInt(-max, max);
    this.shape.position.y = 10;
    this.shape.position.z = this.normalZ;
   
    ObjectHelper.randomizeVerticesAllAxis(this.shape, .035);

    universe.scene.add(this.shape);
};

Citizen.prototype.update = function() {
    var speed = this.speed * universe.tick;
    if (universe.useSuperSpeed) { speed *= 10; }

    switch (this.activity) {
        case 'idling':
            if (this.idlingCountdown == null) { this.idlingCountdown = 100; }
            this.shape.position.z = this.normalZ;

            this.idlingCountdown -= speed * 10;
            if (this.idlingCountdown <= 0) {
                this.idlingCountdown = null;
                var activities = ['lookForMovable', 'lookForConstruction'];
                this.activity = activities.getRandomItem();
            }
            break;

        case 'lookForConstruction':
            var posOnGridPreference;
            if ( Misc.chance() ) {
                posOnGridPreference = this.shape.position.clone();
                universe.snapPositionToGrid(posOnGridPreference);
            }
            var construction = universe.getRandomConstructionOfMinLevel(1, posOnGridPreference);
            
            if (construction) {
                this.activity = 'moveToConstruction';
                this.targetPosition = construction.shape.position.clone();
                this.targetPosition.z = this.shape.position.z;
            }
            else {
                this.activity = 'idling';
            }
            break;

        case 'moveToConstruction':
            ObjectHelper.followTarget(this.shape.position, this.targetPosition,
                    speed);
            this.shape.lookAt(this.targetPosition);
            if ( this.shape.position.distanceTo(this.targetPosition) <= .5 ) {
                this.activity = 'findNewTargetRightHere';
            }
            break;
            
        case 'findNewTargetRightHere':
            var fuzzy = .35;
            this.targetPosition.x = this.shape.position.x + Misc.getRandom(-fuzzy, fuzzy);
            this.targetPosition.y = this.shape.position.y + Misc.getRandom(-fuzzy, fuzzy);
            this.activity = 'moveToTargetRightHere';
            break;
        
        case 'moveToTargetRightHere':
            var didReach = ObjectHelper.followTargetStraight(
                    this.shape.position, this.targetPosition, speed * .75, .1
                    );
            if (didReach) {
                this.activity = Misc.chance(80) ?
                        'findNewTargetRightHere' : 'idling';
            }
            break;

        case 'lookForMovable':
            this.movable = universe.getNearestFreeMovable(this.shape.position);
            if (this.movable) {
                this.activity = 'moveToMovable';
            }
            else {
                this.activity = 'idling';
            }
            break;

        case 'moveToMovable':
            ObjectHelper.followTarget(this.shape.position, this.movable.shape.position,
                    speed);
            if ( this.shape.position.distanceTo(this.movable.shape.position) <= .5 ) {
                this.shape.position.z = this.movable.type == 'helicopter' ?
                        2.4 : this.movable.height - .1;
                
                this.targetPosition = new THREE.Vector3(0, 0, this.shape.position.z);
                if (this.movable.type == 'ship') {
                    var water = universe.getRandomNatureSpot('water');
                    if (water) {
                        this.targetPosition.x = water.position.x;
                        this.targetPosition.y = water.position.y;
                    }
                }
                else if (this.movable.type == 'helicopter') {
                    var construction = universe.getRandomConstructionOfMinLevel(universe.maxConstructionLevels);
                    if (construction) {
                        this.targetPosition.x = construction.shape.position.x;
                        this.targetPosition.y = construction.shape.position.y;
                    }
                    else {
                        this.activity = 'idling';
                        this.movable = null;
                        this.targetPosition = null;
                    }
                }
                else {
                    var max = 15;
                    this.targetPosition.x = Misc.getRandomInt(-max, max);
                    this.targetPosition.y = Misc.getRandomInt(-max, max);
                }
                this.activity = 'steerMovable';
            }
            break;

        case 'steerMovable':
            var speedFactor = 2;
            if      (this.movable.type == 'ship')       { speedFactor = .5; }
            else if (this.movable.type == 'helicopter') { speedFactor = .5; }
            
            ObjectHelper.followTarget(this.shape.position, this.targetPosition,
                    speed * speedFactor);
            this.movable.shape.position.x = this.shape.position.x;
            this.movable.shape.position.y = this.shape.position.y;
            this.movable.shape.position.z = this.shape.position.z - .3;
            var distanceToTarget = this.shape.position.distanceTo(this.targetPosition);
            if (distanceToTarget <= .25) {
                this.movable = null;
                this.activity = 'idling';
            }
            else if (distanceToTarget >= 1.5) {
                this.shape.lookAt(this.targetPosition);
                this.movable.shape.lookAt(this.targetPosition);
            }
            break;
            
        case 'lookForConstruction':
            break;
    }
};
