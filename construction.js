function Construction(type, position) {
    this.id = universe.getNewId();
    this.type = type;
    this.isConstruction = true;
    this.group = universe.constructionTypes[this.type].group;
    this.detailShape = null;
    this.colorSpin = 0;
    this.colorSpinDirection = 1;
    this.level = 0;
    this.isFinished = false;
    this.rotatingBlock = null;

    this.color = universe.constructionTypes[this.type].color;

    this.partsBuiltSinceLastUpdate = 0;
    this.maxLevels = universe.constructionTypes[type].levels ?
            universe.constructionTypes[type].levels.length : 1;

    this.height = 2;
    this.minZ = -1;
    this.maxZ = this.height / 2;
    
    var blocks = universe.constructionBlueprints.getBlocks(this.type);
    if (blocks.length >= 1) {
        this.makeShapeFromBlocks(position, blocks);
    }
    else {
        this.makeCylinderShape(position);
    }
    
    universe.snapToGrid(this.shape);
    universe.scene.add(this.shape);
    universe.playSound('throw-stone');
};

Construction.prototype.makeShapeFromBlocks = function(position, blocks) {
    this.shape = new THREE.Object3D();
    this.shape.position.x = position.x;
    this.shape.position.y = position.y;
    this.shape.position.z = 0;

    for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        var properties = block.properties;
        var chanceToInclude = properties.chanceToInclude ?
                properties.chanceToInclude : 100;
        if ( Misc.chance(chanceToInclude) ) {

            var color = [properties.r, properties.g, properties.b];
            if (!this.color) { this.color = color; }
            var materialProps = {color: color.toRgbString()};
            if (properties.alpha !== undefined) {
                materialProps.transparent = true;
                materialProps.opacity = properties.alpha;
            }
            var material = new THREE.MeshLambertMaterial(materialProps);
            
            var sizeX = universe.constructionBlueprints.blockSize;
            var sizeY = universe.constructionBlueprints.blockSize;
            var sizeZ = universe.constructionBlueprints.blockSize;
            
            var factor = .3;
            if (properties.isThinner) {
                sizeX *= factor;
                sizeY *= factor;
            };
            if (properties.isNarrower) {
                sizeX *= factor;
                sizeZ *= factor;
            };
            if (properties.isTaller) {
                sizeZ *= 1.5;
            };
            
            if (properties.isBigger) {
                sizeX *= 1.3;
                sizeY *= 1.3;
                sizeZ *= 1.3;
            };
            
            if (properties.multiplierZ) {
                sizeZ *= properties.multiplierZ;
            }

            var geometry;
            if (properties.isBigWheel) {
                var radius = .7;
                var tubeDiameter = .2;
                var radialSegments = 4;
                var tubularSegments = 10;
                geometry = new THREE.TorusGeometry(radius, tubeDiameter,
                        radialSegments, tubularSegments);
            }
            else if (properties.isRound) {
                var widthSegments = 4;
                var heightSegments = 4;
                geometry = new THREE.SphereGeometry(sizeX,
                        widthSegments, heightSegments);
            }
            else if (properties.isOctahedron) {
                geometry = new THREE.OctahedronGeometry(sizeZ);
            }   
            else {
                geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
            }
            
            var blockShape = new THREE.Mesh(geometry, material);
            blockShape.castShadow = true;
            blockShape.position.x = block.position.x;
            blockShape.position.y = block.position.y;
            blockShape.position.z = block.position.z;
            if (properties.isSlightlyLower) {
                blockShape.position.z -= .04;
            }
            else if (properties.isSlightlyHigher) {
                blockShape.position.z += .04;
            }
            if (properties.isLower) {
                blockShape.position.z -= universe.constructionBlueprints.blockSize / 2;
            }

            if (properties.isBigWheel) {
                blockShape.rotation.x = Math.PI / 2;
            }
            if (properties.isRotating) {
                this.rotatingBlock = blockShape;
            }

            this.shape.add(blockShape);
        }
    }
};

Construction.prototype.makeCylinderShape = function(position) {
    var sides = universe.constructionTypes[this.type].sides;
    var material = new THREE.MeshLambertMaterial( {color: this.color.toRgbString()} );
    
    var heightSegments = 3;
    var geometry = new THREE.CylinderGeometry(.5, 1.5, this.height,
            sides, heightSegments);
    this.shape = new THREE.Mesh(geometry, material);

    this.shape.castShadow = true;
    this.shape.position.x = position.x;
    this.shape.position.y = position.y;
    this.shape.position.z = this.minZ;
    this.shape.rotation.x = Math.PI / 2;
};

Construction.prototype.addPart = function() {
    this.partsBuiltSinceLastUpdate++;
};

Construction.prototype.update = function() {
    if (!this.isFinished && this.partsBuiltSinceLastUpdate > 0) {
        var constructionSpeed = .00025;
        if (universe.useSuperSpeed) { constructionSpeed *= 250; }

        this.shape.position.z += (constructionSpeed * this.partsBuiltSinceLastUpdate) *
                universe.tick;
        this.partsBuiltSinceLastUpdate = 0;
        
        if (this.shape.position.z > this.maxZ) {
            this.shape.position.z = this.maxZ;
            this.isFinished = true;
        }

        var oldLevel = this.level;
        this.level = ( (this.shape.position.z - this.minZ) / (this.maxZ - this.minZ) ) *
                this.maxLevels;
        this.level = Math.floor(this.level);
        
        if (oldLevel != this.level) {
            if (oldLevel != 0) {
                var levelNameOld = this.getLevelName(oldLevel);
                universe.subtractFromStats(this.type, levelNameOld);
            }

            var isFinalLevel = this.level == this.maxLevels;
            var levelName = this.getLevelName(this.level);
            universe.addToConstructionStats(this.type, levelName, isFinalLevel);
            
            var levelNameToSpeak = this.maxLevels == 1 ? this.type : levelName;
            this.stopAllWhoBuildOnMe( Misc.camelCaseToWords(levelNameToSpeak) );

            universe.buildConnectorIfNeeded(this);

            if (this.level == 1) {
                var citizensPerBuild = 4;
                for (var n = 1; n <= citizensPerBuild; n++) {
                    universe.addCitizen();
                }
            }
            if (isFinalLevel) {
                this.addDetail();
                universe.addGlow(this.shape.position);
                universe.playSound('construction-finished');
            }
        }
    }
    
    if (this.detailShape) { this.updateDetail(); }
    if (this.rotatingBlock) {
        this.rotatingBlock.rotation.z += .5 * universe.tick;
    }
};

Construction.prototype.addDetail = function() {
    switch (universe.constructionTypes[this.type].detail) {
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

Construction.prototype.updateDetail = function() {
    var shape = this.detailShape;
    var speed = .5 * universe.tick;
    switch (universe.constructionTypes[this.type].detail) {
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

Construction.prototype.updateColorSpin = function(level) {
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

Construction.prototype.getLevelName = function(level) {
    var name = null;
    if (level >= 1) {
        var levels = universe.constructionTypes[this.type].levels;
        name = levels[level - 1];
    }
    return name;
};

Construction.prototype.stopAllWhoBuildOnMe = function(levelNameToSpeak) {
    var didSpeak = false;
    for (var i = 0; i < universe.builders.length; i++) {
        var builder = universe.builders[i];
        if (builder.currentlyWorkedOnConstruction &&
                builder.currentlyWorkedOnConstruction.id == this.id) {

            builder.currentlyWorkedOnConstruction = null;

            if (!didSpeak) {
                didSpeak = true;
                var builtWords = ['completed', 'built', 'made', 'constructed'];
                var builtWord = builtWords.getRandomItem();
                var sentence = 'we ' + builtWord + ' ' + Misc.prefixAorAn(levelNameToSpeak);
                builder.speak(sentence);
            }

        }
    }
};
