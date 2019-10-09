function Builder() {
    this.id = universe.getNewId();

    this.foundGod = false;
    this.currentlyWorkedOnConstruction = null;
    
    var offset = 1;
    this.normalZ = .25;
    this.targetOffset = {
        x: Misc.getRandom(-offset, offset),
        y: Misc.getRandom(-offset, offset)
        };
    this.speed = Misc.getRandom(.2, .4);
    
    var color = [];
    for (var i = 1; i <= 3; i++) {
        color.push( Misc.chance() ? 70 : 160 );
    }
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );

    var size = universe.humanSize;
    var segments = 3;
    var geometry = new THREE.BoxGeometry(
            size * 2 + Misc.getRandom(-.1, .1), size, size,
            segments, segments, segments);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = true;
    var max = 18;
    this.shape.position.x = Misc.getRandomInt(-max, max) * 5;
    this.shape.position.y = Misc.getRandomInt(-max, max) * 5;
    if (this.shape.position.x == 0 && this.shape.position.y == 0) {
        this.shape.position.x = -max;
    }
    this.shape.position.z = this.normalZ;
    
    this.isStarterOfConstruction = false;

    this.throwCountdownMax = 100;
    this.throwCountdown = 0;
    
    ObjectHelper.randomizeVerticesAllAxis(this.shape, .035);

    universe.scene.add(this.shape);
};

Builder.prototype.update = function() {
    if (this.currentlyWorkedOnConstruction) {
        this.currentlyWorkedOnConstruction.addPart();
        
        this.throwCountdown -= 25 * universe.tick;
        if (this.throwCountdown <= 0) {
            this.throwCountdown = this.throwCountdownMax;
            universe.throwStone(this.shape.position,
                    this.currentlyWorkedOnConstruction.shape.position,
                    this.currentlyWorkedOnConstruction.type,
                    this.isStarterOfConstruction);
            this.shape.position.z = this.normalZ + .5;
        }
        
        if (this.shape.position.z > 0) {
            this.shape.position.z -= 2 * universe.tick;
            if (this.shape.position.z < 0) {
                this.shape.position.z = 0;
            }
        }
    }
    else if (universe.windowHasFocus) {
        this.move();
    }
};

Builder.prototype.move = function() {
    var shape = this.shape;
    var speed = this.speed * universe.tick;
    if (universe.useSuperSpeed) { speed *= 10; }
    
    var radius = .75;
    var reached = {x: false, y: false};
    
    var myPos = shape.position, godPos = universe.god.position;
    
    if (myPos.x + this.targetOffset.x < godPos.x - radius) {
        myPos.x += speed;
    }
    else if (myPos.x + this.targetOffset.x > godPos.x + radius) {
        myPos.x -= speed;
    }
    else {
        reached.x = true;
    }

    if (myPos.y + this.targetOffset.y < godPos.y - radius) {
        myPos.y += speed;
    }
    else if (myPos.y + this.targetOffset.y > godPos.y + radius) {
        myPos.y -= speed;
    }
    else {
        reached.y = true;
    }

    shape.lookAt(godPos);
    
    if (reached.x && reached.y) {
        if (!this.foundGod) {
            this.speakGodSentence();
            this.foundGod = true;
        }
        else if (!this.currentlyWorkedOnConstruction) {
            this.startNewConstructionIfNothingClose();
        }
    }
};

Builder.prototype.startNewConstructionIfNothingClose = function() {
    if (!this.currentlyWorkedOnConstruction) {
        var pos = universe.god.position;
        var centerItem = universe.getItemAt(pos);
        if (centerItem) {
            if (centerItem.isConstruction && !centerItem.isFinished) {
                this.currentlyWorkedOnConstruction = centerItem;
                this.isStarterOfConstruction = false;
            }
        }
        else {
            var surroundingTypes = universe.getSurroundingTypesAt(pos);
            var type = universe.getConstructionTypeBasedOnSurrounding(surroundingTypes);
            this.currentlyWorkedOnConstruction = universe.getNewConstruction(pos, type);
            var constructionGroup = this.currentlyWorkedOnConstruction.group;
            var self = this;
            var sentence = 'we will start building ' +
                    Misc.prefixAorAn( Misc.camelCaseToWords(this.currentlyWorkedOnConstruction.type) ) +
                    (constructionGroup == 'basicBuilding' ? ' place ' : ' ') +
                    'here!';
            var delayMS = constructionGroup == 'basicBuilding' ? 3000 : 100;
            setTimeout( function() { self.speak(sentence); }, delayMS );
            this.throwCountdown = 10;
            this.isStarterOfConstruction = true;
        }
    }
};

Builder.prototype.speakGodSentence = function() {
    var godSentences = [
        'cursor god!',
        'you are my cursor god!',
        'my cursor god!',
        'cursor god, i worship you!',
        'command me, cursor god!',
        'it must be cursor god!',
        "it's a sign!",
        'a cursor god appeared!',
        'a cursor in the sky!',
        'oh my cursor god!',
    ];

    if (!universe.didFadeInInfo) {
        universe.didFadeInInfo = true;
        setTimeout(
            function() {
                jQuery('#info').animate( {top: '8px'}, 1500 );
            }, 1500 );

        this.speak(godSentences[0], true);
        universe.playSound('god');
    }
    else {
        this.speak( godSentences.getRandomItem() );
    }
    universe.increaseHappyMomentsPerSecond(.1);
};

Builder.prototype.speak = function(text, doEmphasize) {
    var position = universe.getScreenPosition(this.shape);
    universe.addSpeech(position, text, doEmphasize);
};
