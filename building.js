function Building(type, position) {
    this.id = universe.getNewId();
    this.type = type;
    this.isBuilding = true;
    this.detailShape = null;
    this.colorSpin = 0;
    this.colorSpinDirection = 1;

    this.level = 0;
    this.isFinished = false;

    var sides = universe.buildingTypes[this.type].sides;
    this.color = universe.buildingTypes[this.type].color;

    this.blocksBuiltSinceLastUpdate = 0;

    var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );

    this.height = 2;
    this.minZ = -1;
    this.maxZ = this.height / 2;
    
    var heightSegments = 3;
    var geometry = new THREE.CylinderGeometry(.5, 1.5, this.height,
            sides, heightSegments);
    this.shape = new THREE.Mesh(geometry, material);

    this.shape.castShadow = true;
    var max = 18;
    this.shape.position.x = position.x;
    this.shape.position.y = position.y;
    this.shape.position.z = this.minZ;
    this.shape.rotation.x = Math.PI / 2;
    
    universe.snapToGrid(this.shape);
    universe.scene.add(this.shape);
};

Building.prototype.addBlock = function() {
    this.blocksBuiltSinceLastUpdate++;
};

Building.prototype.update = function() {
    if (!this.isFinished && this.blocksBuiltSinceLastUpdate > 0) {
        var buildingSpeed = .0005;
        if (universe.useSuperSpeed) { buildingSpeed *= 250; }
        if (this.level >= 1) {
            buildingSpeed /= (this.level + 1);
        }

        this.shape.position.z += (buildingSpeed * this.blocksBuiltSinceLastUpdate) *
                universe.tick;
        this.blocksBuiltSinceLastUpdate = 0;
        
        if (this.shape.position.z > this.maxZ) {
            this.shape.position.z = this.maxZ;
            this.isFinished = true;
        }

        var oldLevel = this.level;
        this.level = ( (this.shape.position.z - this.minZ) / (this.maxZ - this.minZ) ) *
                universe.maxBuildingLevels;
        this.level = Math.floor(this.level);
        
        if (oldLevel != this.level) {
            universe.increaseHappyMomentsPerSecond();

            if (oldLevel != 0) {
                var levelNameOld = this.getLevelName(oldLevel);
                universe.subtractFromStats(this.type, levelNameOld);
            }

            var levelName = this.getLevelName(this.level);
            universe.addToBuildingStats(this.type, levelName, this.level);
            this.stopAllWhoBuildOnMe( Misc.camelCaseToWords(levelName) );
            universe.buildConnectorIfNeeded(this);
            universe.playSound('building-finished');
            
            if (this.level == 1) {
                universe.addCitizen();
            }
            else if (this.level == universe.maxBuildingLevels) {
                this.addDetail();
            }
        }
    }
    
    if (this.detailShape) { this.updateDetail(); }
};

Building.prototype.addDetail = function() {
    switch (universe.buildingTypes[this.type].detail) {
        case 'screen':
            var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );
            var geometry = new THREE.BoxGeometry(1, .2, .6);
            this.detailShape = new THREE.Mesh(geometry, material);
            this.detailShape.position.x = this.shape.position.x;
            this.detailShape.position.y = this.shape.position.y - 1;
            this.detailShape.position.z = this.maxZ - .1;
            break;
            
        case 'door':
            var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );
            var geometry = new THREE.BoxGeometry(.5, 1, 1);
            this.detailShape = new THREE.Mesh(geometry, material);
            this.detailShape.position.x = this.shape.position.x;
            this.detailShape.position.y = this.shape.position.y - .9;
            this.detailShape.position.z = .2;
            break;
            
        case 'platform':
            var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );
            var geometry = new THREE.BoxGeometry(1.5, 1.5, .15);
            this.detailShape = new THREE.Mesh(geometry, material);
            this.detailShape.position.x = this.shape.position.x;
            this.detailShape.position.y = this.shape.position.y;
            this.detailShape.position.z = 1.25;
            this.detailShape.rotation.z = Math.PI / 4;
            universe.addMovable(this.shape.position, 'helicopter');
            break;
    
        case 'pole':
            var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );
            var radius = .1, height = 1.5, sides = 3, heightSegments = 1;
            var geometry = new THREE.CylinderGeometry(radius, radius, height, sides, heightSegments);
            this.detailShape = new THREE.Mesh(geometry, material);
            this.detailShape.position.x = this.shape.position.x;
            this.detailShape.position.y = this.shape.position.y;
            this.detailShape.position.z = this.maxZ + height - .2;
            this.detailShape.rotation.x = Math.PI / 2;
            break;
            
        case 'spikes':
            var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );
            var radius = .1, height = 1.8, sides = 3, heightSegments = 1;
            var geometry = new THREE.CylinderGeometry(radius, radius, height, sides, heightSegments);
            this.detailShape = new THREE.Mesh(geometry, material);
            this.detailShape.position.x = this.shape.position.x;
            this.detailShape.position.y = this.shape.position.y;
            this.detailShape.position.z = this.maxZ + height - 1;
            this.detailShape.rotation.z = Math.PI / 2;
            break;
            
        case 'gem':
            var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );
            var radius = .25;
            var geometry = new THREE.IcosahedronGeometry(radius);
            this.detailShape = new THREE.Mesh(geometry, material);
            this.detailShape.position.x = this.shape.position.x;
            this.detailShape.position.y = this.shape.position.y;
            this.detailShape.position.z = 2.2;
            break;
            
        case 'bigGem':
            var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );
            var radius = .5;
            var geometry = new THREE.IcosahedronGeometry(radius);
            this.detailShape = new THREE.Mesh(geometry, material);
            this.detailShape.position.x = this.shape.position.x;
            this.detailShape.position.y = this.shape.position.y;
            this.detailShape.position.z = 2.5;
            break;
            
        case 'chimney':
            var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );
            var radius = .25, height = 2.25, sides = 5, heightSegments = 1;
            var geometry = new THREE.CylinderGeometry(radius, radius, height, sides, heightSegments);
            this.detailShape = new THREE.Mesh(geometry, material);
            this.detailShape.position.x = this.shape.position.x - 1;
            this.detailShape.position.y = this.shape.position.y;
            this.detailShape.position.z = .5;
            this.detailShape.rotation.x = Math.PI / 2;
            break;
    }
    
    if (this.detailShape) { universe.scene.add(this.detailShape); }
};

Building.prototype.updateDetail = function() {
    var shape = this.detailShape;
    var speed = .5 * universe.tick;
    switch (universe.buildingTypes[this.type].detail) {
        case 'screen':
            this.updateColorSpin();
            shape.material.color.r = ObjectHelper.toNativeColor(this.colorSpin);
            break;
            
        case 'pole':
            shape.rotation.y += speed;
            break;
            
        case 'bigGem':
            this.updateColorSpin();
            shape.material.color.g = ObjectHelper.toNativeColor(this.colorSpin);
            shape.rotation.z += speed;
            break;
    }
};

Building.prototype.updateColorSpin = function(level) {
    this.colorSpin += 40 * this.colorSpinDirection * universe.tick;
    if (this.colorSpinDirection < 0) {
        if (this.colorSpin <= universe.minColor) {
            this.colorSpin = universe.minColor;
            this.colorSpinDirection = 1;
        }
    }
    else if (this.colorSpinDirection > 0) {
        if (this.colorSpin >= universe.maxColor) {
            this.colorSpin = universe.maxColor;
            this.colorSpinDirection = -1;
        }
    }
};

Building.prototype.getLevelName = function(level) {
    var name = null;
    if (level >= 1) {
        var levels = universe.buildingTypes[this.type].levels;
        name = levels[level - 1];
    }
    return name;
};

Building.prototype.stopAllWhoBuildOnMe = function(levelNameToSpeak) {
    var didSpeak = false;
    for (var i = 0; i < universe.builders.length; i++) {
        var builder = universe.builders[i];
        if (builder.currentlyWorkedOnBuilding &&
                builder.currentlyWorkedOnBuilding.id == this.id) {

            builder.currentlyWorkedOnBuilding = null;
            
            if (!didSpeak) {
                didSpeak = true;
                var builtWords = ['completed', 'finished', 'built', 'made', 'constructed'];
                var builtWord = builtWords.getRandomItem();
                var sentence = 'we ' + builtWord + ' ' + Misc.prefixAorAn(levelNameToSpeak);
                builder.speak(sentence);
            }

        }
    }
};
