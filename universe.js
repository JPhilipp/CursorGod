'use strict';
var universe = null;

window.onload = function() {
    universe = new Universe();
    universe.init();
};

function render() {
    requestAnimationFrame(render);
    universe.update();
    universe.renderer.render(universe.scene, universe.camera);
}

function Universe() {
    this.name = 'Cursor God';
    this.version = 5;
    
    this.useSuperSpeed = false;
    this.soundIsOn = true;
    
    console.log(this.name, this.version);
    this.isLive = location.href.indexOf('://cursorgod.com') >= 0;
    if (this.isLive) {
        this.useSuperSpeed = false;
        this.soundIsOn = true;
    }
    this.isMobile = navigator.userAgent.indexOf('iPhone') >= 0 ||
                    navigator.userAgent.indexOf('iPad') >= 0 ||
                    navigator.userAgent.indexOf('Android') >= 0;

    if (!this.isMobile) {
        this.overrideSpotlightToLatestToAddPenumbra();
    }
    this.isRunning = true;
    this.widthPixels = window.innerWidth;
    this.heightPixels = window.innerHeight;
    this.groundWidth = 100;
    this.groundHeight = 100;
    this.camera = null;
    this.renderer = null;
    this.scene = null;
    this.god = { position: {x: 0, y: 0, z: 0} };
    this.lastUpdateTime = new Date().getTime();
    this.gridSize = 2;
    this.miniGridSize = this.gridSize / 5;
    this.didFadeInInfo = false;
    this.idCounter = 0;
    this.humanSize = .2;
    this.minColor = 0;
    this.maxColor = 255;
    this.happyMoments = 0;
    this.happyMomentsPerSecond = 0;
    this.worldName = this.isMobile ? 'Cursor God' : 'YourWorldName';
    this.windowHasFocus = true;
    this.didShowASpecialEvent = false;
    this.urlPrefix = this.isLive ? 'http://file.cursorgod.com/' : '';
    
    this.natureSpots = [];
    this.connectors = [];
    this.constructions = [];
    this.builders = [];
    this.citizens = [];
    this.gridHover = null;
    this.stones = [];
    this.movables = [];
    this.animals = [];
    this.clouds = [];
    this.glows = [];
    this.specialEventActors = [];
    this.secondsSinceStart = 0;
    this.secondsSinceStartLast = this.secondsSinceStart;

    this.specialBuildings = [{}, {}];
    this.secondsUntilSpecialBuildings = null;
    this.specialBuildingsUnlocked = false;
    
    if (this.useSuperSpeed) {
        this.secondsUntilSpecialBuildings = 2;
        this.specialBuildingsUnlocked = true;
    }
    
    this.currentGlowSelectors = [];
    this.cameraDefaultZ = 12;
    this.maxConstructionLevels = 4;
    this.constructionTypes = {};
    this.constructionStats = {};
    this.sounds = {};

    var self = this;
    this.secondsInterval = setInterval(
        function() { self.secondsSinceStart++; }, 1000
    );
};

Universe.prototype.init = function() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(90, this.widthPixels / this.heightPixels, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.widthPixels, this.heightPixels);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor('rgb(121,107,224)');
    
    document.body.appendChild(this.renderer.domElement);

    this.constructionBlueprints = new ConstructionBlueprints();
    this.initConstructionTypes();

    this.initStatsFromConstructionTypes();
    this.addInfoDisplay();
    this.updateHappyMomentsDisplay();
    if (this.isMobile) {
        jQuery('body').append('<div id="cursor"></div>');
    }

    this.initGridHover();
    this.initNatures();
    this.initClouds();
    this.initBuilders();

    THREE.ImageUtils.crossOrigin = '';
    var textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = '';
    var texture = textureLoader.load(this.urlPrefix + 'images/ground.png?v=4');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(80, 80);

    var geometry = new THREE.PlaneGeometry(this.groundWidth * 3, this.groundHeight * 3,
            this.groundWidth * 2, this.groundHeight * 2);
    var material = new THREE.MeshLambertMaterial({color: 'rgb(241,163,74)', map: texture});
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.receiveShadow = true;
    ObjectHelper.randomizeVertices(this.ground, 0, 0, .2);
    this.scene.add(this.ground);

    var intensity = 1.5;
    var distance = 125;
    this.light = new THREE.SpotLight('rgb(255,255,255)', intensity, distance);
    this.light.position.set(0, 0, 25);
    this.light.castShadow = false;
    this.light.distance = 50;
    this.scene.add(this.light);
    
    this.secondLight = new THREE.AmbientLight('rgb(104,70,30)');
    this.scene.add(this.secondLight);

    this.godLight = new THREE.SpotLight(0xffffff, 3, 6);
    this.godLight.position.set(0, 0, 5);
    this.godLight.castShadow = true;
    this.scene.add(this.godLight);

    this.camera.position.z = this.cameraDefaultZ;
    this.updateCameraPosition();

    var self = this;
    
    jQuery(function($) {
        jQuery(document).mousemove(function(event) {
            self.setGodLightFromMouse(event);
        });
    });
    
    document.ontouchmove = function(event){
        event.preventDefault();
        var touch = event.touches[0];
        if (touch) { self.setGodLightFromMouse(touch); }
    };

    if (this.isMobile) {
        jQuery(document).on('touchstart click',
            function(event) {
                var touch = event.originalEvent.touches[0];
                if (touch) { self.setGodLightFromMouse(touch); }
            }
        );
    }

    jQuery('body').bind('DOMMouseScroll mousewheel', function(e){
        if(e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
            self.scrollWheelUsed(-1);
        }
        else{
            self.scrollWheelUsed(1);
        }
    });
    
    if (!this.isMobile) {
        jQuery(document).keyup(function(event) {
            var keyCodes = {s: 83, t: 84, space: 32};
            if (event.keyCode == keyCodes.s) {
                self.toggleSoundOnOff();
            }
            else if (event.keyCode == keyCodes.t) {
                if (!self.isLive) {
                    self.useSuperSpeed = !self.useSuperSpeed;
                }
            }
            else if (event.keyCode == keyCodes.space) {
                self.changeWorldName();
            }
        });
        
        jQuery(window).focus(function() {
            self.windowHasFocus = true;
        }).blur(function() {
            self.windowHasFocus = false;
        });
    }
    
    render();
    this.playSound('wind');
};

Universe.prototype.update = function() {
    var updateTime = new Date().getTime();
    this.tick = Math.abs(this.lastUpdateTime - updateTime) / 600;
    this.lastUpdateTime = updateTime;
    
    if (this.isRunning) {
        if (this.secondsSinceStart != this.secondsSinceStartLast) {
            this.secondsSinceStartLast = this.secondsSinceStart;
            this.handleSecondsInterval();
        }

        this.updateObjects(this.builders);
        this.updateObjects(this.constructions);
        this.updateObjects(this.stones);
        this.updateObjects(this.glows);
        this.updateObjects(this.citizens);
        this.updateObjects(this.animals);
        this.updateObjects(this.clouds);
        this.updateObjects(this.specialEventActors);
       
        this.removeDeadObjects(this.stones);
        this.removeDeadObjects(this.glows);
        this.removeDeadObjects(this.specialEventActors);
    }
};

Universe.prototype.handleSecondsInterval = function() {
    if (this.isRunning) {
        this.happyMoments += this.happyMomentsPerSecond;
        
        if (this.specialBuildingsUnlocked &&
                this.secondsUntilSpecialBuildings !== null) {
            this.secondsUntilSpecialBuildings--;
            if (this.secondsUntilSpecialBuildings <= 0) {
                this.secondsUntilSpecialBuildings = null;
                this.startNewSpecialBuildings();
            }
        }
        this.updateHappyMomentsDisplay();
        this.updateSpecialBuildingsDisplay();

        var seconds = 5 * 60;
        if (this.secondsSinceStart % seconds == 0) {
            if ( !this.didShowASpecialEvent || Misc.chance() ) {
                this.didShowASpecialEvent = true;
                this.startSpecialEvent();
            }
        }
    }
};

Universe.prototype.startSpecialEvent = function() {
    var eventInfos = [
        {type: 'infectedBeing', amount: 20},
        {type: 'wildAnimal',    amount: 35},
        {type: 'meteor',        amount: 1},
    ];
    var info = eventInfos.getRandomItem();
    var direction = Misc.chance() ? -1 : 1;
    for (var i = 0; i < info.amount; i++) {
        this.specialEventActors.push( new SpecialEventActor(info.type, direction) );
    }
};

Universe.prototype.toggleSoundOnOff = function() {
    this.soundIsOn = !this.soundIsOn;
    var sentence = 'sound is now ' +
            (this.soundIsOn ? 'on' : 'off');
    this.addSpeech(null, sentence, true);
};

Universe.prototype.changeWorldName = function() {
    var vowels = ['a','e','i','o','u'];
    var consonants = ['b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','y','z'];
    var maxParts = 3;
    if      ( Misc.chance(20) ) { maxParts--; }
    else if ( Misc.chance(10) ) { maxParts++; }
    
    this.worldName = '';
    for (var i = 0; i < maxParts; i++) {
        this.worldName += consonants.getRandomItem() +
                         vowels.getRandomItem();
    }
    jQuery('#worldNameValue').html( Misc.htmlEscape(this.worldName) );
    this.makeHtmlElementGlow('#worldNameValue', true);
    jQuery('#worldNameValue').css('fontSize', '130%');
};

Universe.prototype.scrollWheelUsed = function(direction) {
    var multiplierZ = this.camera.position.z <= 20 ? 1 : 2;
    this.camera.position.z += direction * multiplierZ;
    this.updateCameraPosition();
};

Universe.prototype.updateCameraPosition = function() {
    var minZ = 1, maxZ = 26, rotationStartsAtZ = 15;
    if (this.camera.position.z < rotationStartsAtZ) {
        var amount = rotationStartsAtZ - this.camera.position.z;
        this.camera.rotation.x = (rotationStartsAtZ - this.camera.position.z) / 8;
        this.camera.position.y = -amount;
    }
    else {
        this.camera.rotation.x = 0;
        this.camera.position.y = 0;
    }
    this.camera.position.z = Misc.keepInLimits(this.camera.position.z, minZ, maxZ);
};

Universe.prototype.subtractFromStats = function(category, subCategory) {
    this.constructionStats[category][subCategory]--;
    var id = '#statsValue_' + category + '_' + subCategory;
    jQuery(id).html(this.constructionStats[category][subCategory]);
};

Universe.prototype.increaseHappyMomentsPerSecond = function(amount) {
    this.happyMomentsPerSecond += amount;
    this.makeHtmlElementGlow('#happyMomentsPerSecondValue');
};

Universe.prototype.multiplyHappyMomentsPerSecond = function(amount) {
    if (amount === undefined) { amount = 1.175; }
    this.happyMomentsPerSecond *= amount;
    this.makeHtmlElementGlow('#happyMomentsPerSecondValue');
};

Universe.prototype.updateHappyMomentsDisplay = function() {
    if (this.happyMoments >= 1) {
        jQuery('#happyMomentsValue').html(
                Misc.htmlEscape( Misc.abbreviateNumber(this.happyMoments) ) );
    }
    else {
        jQuery('#happyMomentsValue').html('0');
    }
    
    jQuery('#happyMomentsPerSecondValue').html(
            Misc.htmlEscape( Misc.abbreviateNumber(this.happyMomentsPerSecond) ) );
};

Universe.prototype.addToConstructionStats = function(category, subCategory, isFinalLevel) {
    var unlockedNewStat = this.constructionStats[category][subCategory] == null;
    if (unlockedNewStat) {
        this.constructionStats[category][subCategory] = 0;
        var amount;
        if (!isFinalLevel) { amount = 1.075; }
        this.multiplyHappyMomentsPerSecond(amount);

        if ( !this.specialBuildingsUnlocked && isFinalLevel &&
                this.getAllBasicConstructionsUnlockedAtHighestLevel() ) {
            this.specialBuildingsUnlocked = true;
            this.startSpecialBuildingsCountdown();
        }
    }

    this.constructionStats[category][subCategory]++;
    this.updateStatsValueDisplay(category, subCategory, unlockedNewStat);
    
    var specialBuildingsRunning = this.specialBuildings[0].type ||
            this.specialBuildings[1].type;
    if (specialBuildingsRunning) {
        var finishedCount = this.markSpecialEventAsFinishedIfNeeded(category);
        if (finishedCount == this.specialBuildings.length) {
            for (var i = 0; i < this.specialBuildings.length; i++) {
                this.specialBuildings[i] = {};
                this.startSpecialBuildingsCountdown();
            }
        }
    }
};

Universe.prototype.markSpecialEventAsFinishedIfNeeded = function(category) {
    var finishedCount = 0;
    
    for (var i = 0; i < this.specialBuildings.length; i++) {
        var specialBuilding = this.specialBuildings[i];
        if (specialBuilding.type == 'construction' && specialBuilding.subtype == category &&
                !specialBuilding.isFinished) {
            specialBuilding.isFinished = true;
            var html = '<span class="emptyIcon">&#8211;</span>';
            jQuery('#specialRecipe' + i).html(html);
        }
        if (specialBuilding.isFinished) { finishedCount++; }
     }

    return finishedCount;
};

Universe.prototype.startSpecialBuildingsCountdown = function() {
    this.secondsUntilSpecialBuildings = this.useSuperSpeed ? 3 : 15;
};

Universe.prototype.updateStatsValueDisplay = function(category, subCategory, updateLabelToo) {
    var idValue = '#statsValue_' + category + '_' + subCategory;
    var value = this.constructionStats[category][subCategory];
    value += '&nbsp;&check;';
    jQuery(idValue).html(value);
    this.makeHtmlElementGlow(idValue);

    if (updateLabelToo) {
        var idLabel = '#statsLabel_' + category + '_' + subCategory;
        var label = this.constructionTypes[category].group == 'basicBuilding' ?
                subCategory : category;
        label = Misc.camelCaseToWords(label);
        label = Misc.replaceAll(label, ' and ', '+');
        jQuery(idLabel).html( Misc.htmlEscape(label) );
    }
};

Universe.prototype.getAllBasicConstructionsUnlockedAtHighestLevel = function(event) {
    var lockedFound = false;

    for (var category in this.constructionStats) {
        for (var subCategory in this.constructionStats[category]) {
            if (this.constructionTypes[category].group == 'basicBuilding') {
                var value = this.constructionStats[category][subCategory];
                if (value === null) {
                    lockedFound = true;
                    break;
                }
            }
        }
        if (lockedFound) { break; }
    }

    return !lockedFound;
};

Universe.prototype.initConstructionTypes = function(event) {
    var min = 160, max = this.maxColor;
    
    this.constructionTypes = {
        worship: {
            levels: ['altar', 'ceremonyHut', 'megaTemple', 'talkTower'],
            group: 'basicBuilding',
            sides:  3,
            color:  [max, max, max],
            detail: 'gem'
        },
        residential: {
            levels: ['hut', 'house', 'skyscraper', 'utopiaSimulator'],
            group: 'basicBuilding',
            recipe: ['forest'],
            sides:  4,
            color:  [max, min, min],
            detail: 'pole'
        },
        commerce: {
            levels: ['salesCarpet', 'shop', 'giantMall', 'replicatorHub'],
            group: 'basicBuilding',
            recipe: ['residential'],
            sides:  5,
            color:  [min, min, max],
            detail: 'door'
        },
        entertainment: {
            levels: ['woodenBox', 'theaterStage', 'cinemaCenter', 'vrComplex'],
            group: 'basicBuilding',
            recipe: ['residential', 'commerce'],
            sides:  6,
            color:  [min, max, min],
            detail: 'screen'
        },
        industry: {
            levels: ['craftingTable', 'craftingHouse', 'plantHub', 'robotFactory'],
            group: 'basicBuilding',
            recipe: ['water'],
            sides:  7,
            color:  [min, min, min],
            detail: 'chimney'
        },
        'management': {
            levels: ['overseerSpot', 'meetingHut', 'townHall', 'superintelligence'],
            group: 'basicBuilding',
            recipe: ['residential', 'industry'],
            sides:  8,
            color:  [max, max, min],
            detail: 'spikes'
        },
        'services': {
            levels: ['shamanHut', 'healthDept', 'docsAndCopsAndFireDept', 'allInOneBots'],
            group: 'basicBuilding',
            recipe: ['residential', 'management'],
            sides:  9,
            color:  [max, min, max],
            detail: 'platform'
        },
        'stadium': {
            group: 'specialConstruction',
        },
        'park': {
            group: 'specialConstruction',
        },
        'bank': {
            group: 'specialConstruction',
        },
        'museum': {
            group: 'specialConstruction',
        },
        'waterPark': {
            group: 'specialConstruction',
        },
        'bigWell': {
            group: 'specialConstruction',
        },
        'powerGenerator': {
            group: 'specialConstruction',
        },
        'casino': {
            group: 'specialConstruction',
        },
        'funFair': {
            group: 'specialConstruction',
        },
        'mysteryBuild': {
            group: 'specialConstruction',
        },
        'club': {
            group: 'specialConstruction',
        },
        'grandHotel': {
            group: 'specialConstruction',
        },
        'spa': {
            group: 'specialConstruction',
        },
        'scienceLab': {
            group: 'specialConstruction',
        },
        'school': {
            group: 'specialConstruction',
        },
        'university': {
            group: 'specialConstruction',
        },
        'conventionCenter': {
            group: 'specialConstruction',
        },
        'monument': {
            group: 'specialConstruction',
        },
        'beachResort': {
            group: 'specialConstruction',
        },
        'foodCourt': {
            group: 'specialConstruction',
        },
        'skiResort': {
            group: 'specialConstruction',
        },
    };
};

Universe.prototype.initStatsFromConstructionTypes = function() {
    this.constructionStats = {};
    for (var type in this.constructionTypes) {
        this.constructionStats[type] = {};
        if (!this.constructionTypes[type].levels) {
            this.constructionTypes[type].levels = ['default'];
        }
        var levels = this.constructionTypes[type].levels;
        for (var i = 0; i < levels.length; i++) {
            var level = levels[i];
            this.constructionStats[type][level] = null;
        }
    }
};

Universe.prototype.getMainInfoHtml = function() {
    var html = '';
    
    html += '<div class="mainInfo">';
    html += '<div class="mainInfoInner">';

    html += '<div class="worldName">';
    html += '<span id="worldNameValue" ';
    if (this.isMobile) {
        html += 'style="text-decoration: underline" ';
        html += 'onclick="universe.tappedWorldName()" ';
    }
    else {
        html += 'onmouseover="universe.hoveredWorldName()" ';
        html += 'onmouseout="universe.unhoveredWorldName()" ';
    }
    html += '">';
    html += Misc.htmlEscape(this.worldName);
    html += '</span>';
    html += '</div>';

    html += '<div id="moreInfo">';
    if (this.isMobile) {
        var appStoreURL = 'https://itunes.apple.com/us/app/manyland/id657739357';
        html += "You are Cursor God, and and people will follow your very tap. ";
        html += "Thanks to the makers of Browsers, WebGL + ThreeJS. ";
        html += "Please check out pixel sandbox universe ";
        html += "<a href=\"" + appStoreURL + "\">Manyland</a> if you like this.";
    }
    else {
        html += "You are Cursor God, and don't need to click anywhere... people will follow your very presence. ";
        html += "(Looking at Cookie Clicker interaction I wondered, could this <em>be</em> any simpler?) ";
        html += "Press Space to change world name and S to toggle sound. ";
        html += "Thanks to the makers of Browsers, WebGL, ThreeJS + FreeSound.org. ";
        html += "Please check out pixel sandbox universe ";
        html += "Manyland.com if you like this. ";
    }
    html += 'Sound credits are at credits.txt.';
    html += "<br/>- Greetings, philipp.lenssen@gmail.com";
    html += '</div>';

    html += '<div class="happyMoments">';
    html += '<span id="happyMomentsValue">&nbsp;</span><br/>happy moments';
    html += '</div>';

    html += '<div class="happyMomentsPerSecond">Per second: ';
    html += '<span id="happyMomentsPerSecondValue">&nbsp;</span>';
    html += '</span>';
    html += '</div>';
            
    html += '</div>';
    html += '</div>';
    
    return html;
}

Universe.prototype.getStatsCategoryHeadline = function(category, optionalSpecialIndex) {
    var html = '';

    var recipe = this.constructionTypes[category].recipe;
    var group = this.constructionTypes[category].group;    
    var categoryLabel = group == 'basicBuilding' ?
            category : group;
    categoryLabel = Misc.camelCaseToWords(categoryLabel);

    html += '<div class="categoryHeadline">';

    var icon = this.getIconHtml(category);
    if (icon != '') {
        html += icon + ' ';
    }
    else {
        html += '<span class="emptyCategoryIcon">&nbsp;</span>';
    }

    html += Misc.htmlEscape(categoryLabel);
    html += '<br/>';
    html += '<span class="recipe"';
    if (optionalSpecialIndex !== undefined) {
        html += ' id="specialRecipe' + optionalSpecialIndex + '"';
    }
    html += '>';
    if (recipe && recipe.length >= 1) {
        html += 'near ';
        for (var i = 0; i < recipe.length; i++) {
            if (i >= 1) { html += '<span class="recipePlus">+</span>'; }
            html += this.getIconHtml(recipe[i]);
        }
    }
    else {
        html += '<span class="emptyIcon">built anywhere</span>';
    }
    html += '</span>';
    html += '</div>';
    
    return html;
}
            
Universe.prototype.addInfoDisplay = function() {
    var html = '';
    var usedVerboseRecipe = false;

    html += this.getMainInfoHtml();

    for (var category in this.constructionStats) {
        if (this.constructionTypes[category].group == 'basicBuilding') {
            html += '<div class="statsPart category_' + category + '">';
            html += '<div class="statsPartInner">';

            html += this.getStatsCategoryHeadline(category);

            var level = 0;
            for (var subCategory in this.constructionStats[category]) {
                level++;
                var doHideName = (level == 4 && category != 'worship') ||
                        ['industry', 'management', 'services', 'monument'].indexOf(category) >= 0;
                html += this.getSubCategoryHtml(category, subCategory, doHideName);
            }

            html += '</div>';
            html += '</div>';
        }
    }

    for (var i = 1; i <= this.specialBuildings.length; i++) {
        html += '<div class="statsPart specialBuilding">';
        html += '<div class="statsPartInner" id="specialBuilding' + i + '">';
        html += '<span class="unlockNote">?</span>';
        html += '</div>';
        html += '</div>';
    }

    jQuery('body').append('<div id="info">' + html + '</div>');
};

Universe.prototype.getSubCategoryHtml = function(category, subCategory, doHideName) {
    var html = '';
    
    var subCategoryLabel = subCategory == 'default' ?
            category : subCategory;
    
    subCategoryLabel = Misc.camelCaseToWords(subCategoryLabel);
    subCategoryLabel = Misc.replaceAll(subCategoryLabel, ' and ', '+');

    var value = this.constructionStats[category][subCategory];
    var idLabel = 'statsLabel_' + category + '_' + subCategory;
    var idValue = 'statsValue_' + category + '_' + subCategory;

    if (doHideName) { subCategoryLabel = '?'; }

    html += '<div>';
    if (subCategoryLabel) {
        html += '<span id="' + idLabel + '">' + Misc.htmlEscape(subCategoryLabel) + '</span>: ';
    }
    var value = this.constructionStats[category][subCategory];
    html += '<span class="statsSubCategoryValue" id="' + idValue + '">' +
            (value === null ? '-' : value) +
            '</span>';
    html += '</div>';
    
    return html;
};

Universe.prototype.getIconHtml = function(type) {
    var html = '';
    if (!this.constructionTypes[type] ||
            this.constructionTypes[type].group == 'basicBuilding') {
        var typeLabel = Misc.htmlEscape( type.toUpperCase() );
        html = '<span class="icon" id="icon_' + Misc.htmlEscape(type) + '" ' +
                'title="' + typeLabel + '"/>';
    }    
    return html;
};

Universe.prototype.tappedWorldName = function() {
    jQuery('#moreInfo').slideToggle();
};

Universe.prototype.hoveredWorldName = function() {
    jQuery('#moreInfo').slideDown();
};

Universe.prototype.unhoveredWorldName = function() {
    jQuery('#moreInfo').slideUp();
};

Universe.prototype.setGodLightFromMouse = function(event) {
    var vector = new THREE.Vector3();
    var mouseX = event.clientX;
    var mouseY = event.clientY;
    
    var cutOffY = 120;
    if (mouseY < cutOffY) {
        mouseY = cutOffY;
        this.isRunning = false;
    }
    else {
        this.isRunning = true;
    }

    vector.set(
              (mouseX / window.innerWidth) * 2 - 1,
            - (mouseY / window.innerHeight) * 2 + 1,
            0.5 );
    vector.unproject(this.camera);
    var dir = vector.sub(this.camera.position).normalize();
    var distance = - this.camera.position.z / dir.z;
    var pos = this.camera.position.clone().add( dir.multiplyScalar(distance) );

    if (this.isMobile) {
        jQuery('#cursor').css('left', mouseX + 'px');
        jQuery('#cursor').css('top',  mouseY + 'px');
    }

    this.god.position.x = pos.x;
    this.god.position.y = pos.y;

    this.godLight.position.x = this.god.position.x;
    this.godLight.position.y = this.god.position.y;

    this.gridHover.position.x = pos.x;
    this.gridHover.position.y = pos.y;
    this.snapToGrid(this.gridHover);
};

Universe.prototype.initNatures = function() {
    var positionsAdded = {};
    this.initForests(positionsAdded);
    this.initWaters(positionsAdded);
};

Universe.prototype.initClouds = function() {
    var max = 5;
    for (var i = 0; i < max; i++) {
        this.clouds.push( new Cloud() );
    }
};

Universe.prototype.initForests = function(positionsAdded) {
    for (var i = 0; i < 20; i++) {
        var position = new THREE.Vector3(0, 0, 0);
        var spread = 18;
        position.x = Misc.getRandom(-spread, spread);
        position.y = Misc.getRandom(-spread, spread);
        this.snapPositionToGrid(position);
        
        var positionId = position.x + '_' + position.y;
        if (!positionsAdded[positionId]) {
            positionsAdded[positionId] = true;
            this.natureSpots.push( new Nature(position, 'forest') );
        }
    }
};

Universe.prototype.addCitizen = function() {
    this.citizens[this.citizens.length] = new Citizen();
};

Universe.prototype.addAnimalGroup = function(type, home) {
    var max = Misc.getRandomInt(1, 3);
    var color = Misc.distortColors([170,170,170], 128);
    for (var i = 0; i < max; i++) {
        color = Misc.distortColors(color, 20);
        this.animals[this.animals.length] = new Animal(type, home, color);
    }
};

Universe.prototype.addMovable = function(position, type) {
    this.movables[this.movables.length] = new Movable(position, type);
};

Universe.prototype.initWaters = function(positionsAdded) {
    var spread = 5;
    var position = new THREE.Vector3(0, 0, 0);;
    position.x = Misc.chance() ? -spread : spread;
    position.y = Misc.chance() ? -spread : spread;
    
    for (var i = 0; i < 20; i++) {
        if ( Misc.chance() ) {
            position.x += Misc.chance() ? -this.gridSize : this.gridSize;
        }
        else {
            position.y += Misc.chance() ? -this.gridSize : this.gridSize;
        }
        this.snapPositionToGrid(position);

        var positionId = position.x + '_' + position.y;
        if (!positionsAdded[positionId]) {
            positionsAdded[positionId] = true;
            this.natureSpots.push( new Nature(position, 'water') );
        }
    }
};

Universe.prototype.initBuilders = function() {
    for (var i = 0; i < 100; i++) {
        this.builders[i] = new Builder();
    }
    var guaranteedNearBuilder = this.builders[0];
    guaranteedNearBuilder.shape.position.x = Misc.getRandomInt(-2, 2);
    guaranteedNearBuilder.shape.position.y = 6;
};

Universe.prototype.initGridHover = function() {
    var material = new THREE.MeshLambertMaterial({
            color: 'rgb(255,255,255)', transparent: true, opacity: .1,
            blending: THREE.AdditiveBlending
        });
    var segments = 3;
    var geometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize,
            segments, segments);            
    this.gridHover = new THREE.Mesh(geometry, material);
    this.gridHover.position.z = .5;
    this.snapToGrid(this.gridHover);
    this.scene.add(this.gridHover);
};

Universe.prototype.getNewConstruction = function(position, type) {
    var index = this.constructions.length;
    this.snapPositionToGrid(position);
    this.constructions.push( new Construction(type, position) );
    return this.constructions[index];
};

Universe.prototype.snapToGrid = function(obj) {
    return this.snapPositionToGrid(obj.position);
};

Universe.prototype.snapPositionToGrid = function(position) {
    position.x = Math.round(position.x / this.gridSize) * this.gridSize;
    position.y = Math.round(position.y / this.gridSize) * this.gridSize;
    position.z = position.z;
    return position;
};

Universe.prototype.snapPositionToMiniGrid = function(position) {
    position.x = Math.round(position.x / this.miniGridSize) * this.miniGridSize;
    position.y = Math.round(position.y / this.miniGridSize) * this.miniGridSize;
    return position;
};

Universe.prototype.updateObjects = function(objects) {
    for (var i = 0; i < objects.length; i++) { objects[i].update(); }
};

Universe.prototype.removeDeadObjects = function(objects) {
    for (var i = objects.length - 1; i >= 0; i--) {
        if (objects[i].energy !== undefined && objects[i].energy <= 0) {
            objects[i].shape.killMe = true;
        }
    }

    for (var i = this.scene.children.length - 1; i >= 0; i--) {
        var obj = this.scene.children[i];
        if (obj.killMe) {
            this.scene.remove(obj);
        }
    }

    for (var i = objects.length - 1; i >= 0; i--) {
        if (objects[i].energy <= 0) {
            objects.splice(i, 1);
        }
    }
};

Universe.prototype.getScreenPosition = function(obj) {
    var vector = new THREE.Vector3();

    var widthHalf = 0.5 * this.renderer.context.canvas.width;
    var heightHalf = 0.5 * this.renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(this.camera);

    vector.x =  (vector.x * widthHalf) + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;

    return {x: vector.x, y: vector.y};
};

Universe.prototype.getNearestFreeMovable = function(position) {
    var movable = null;
    var lowestDistance = null;
    for (var i = 0; i < this.movables.length; i++) {
        var occupants = this.movables[i].getOccupants();
        if (occupants.length == 0) {
            var distance = position.distanceTo(this.movables[i].shape.position);
            if (!lowestDistance || distance < lowestDistance) {
                lowestDistance = distance;
                movable = this.movables[i];
            }
        }
    }
    return movable;
};

Universe.prototype.getNearestItemOfType = function(position, items, type) {
    var item = null;
    var lowestDistance = null;
    for (var i = 0; i < items.length; i++) {
        if (items[i].type == type) {
            var otherPosition = items[i].position;
            if (!otherPosition) { otherPosition = items[i].shape.position; }
            var distance = position.distanceTo(otherPosition);
            if (!lowestDistance || distance < lowestDistance) {
                lowestDistance = distance;
                item = items[i];
            }
        }
    }
    return item;
};

Universe.prototype.getRandomConstructionOfMinLevel = function(minLevel, orthogonalPositionPreference) {
    var construction = null;
    var candidates = [];
    var candidatesAtPosition = [];
    
    for (var i = 0; i < this.constructions.length; i++) {
        var thisConstruction = this.constructions[i];
        if (thisConstruction.level >= minLevel) {
            candidates.push(thisConstruction);

            if (orthogonalPositionPreference) {
                var constructionPos = thisConstruction.position ?
                        thisConstruction.position : thisConstruction.shape.position;
                if (constructionPos.x == orthogonalPositionPreference.x ||
                        constructionPos.y == orthogonalPositionPreference.y) {
                    candidatesAtPosition.push(thisConstruction);
                }
            }
        }
    }
    
    if (candidates.length >= 1) {
        if (candidatesAtPosition.length >= 1) {
            construction = candidatesAtPosition.getRandomItem();
        }
        else {
            construction = candidates.getRandomItem();
        }
    }
    
    return construction;
};

Universe.prototype.getRandomNatureSpot = function(type) {
    var item = null;
    var candidates = [];
    for (var i = 0; i < this.natureSpots.length; i++) {
        if (this.natureSpots[i].type == type) {
            candidates.push(this.natureSpots[i]);
        }
    }
    if (candidates.length >= 1) { item = candidates.getRandomItem(); }
    return item;
};

Universe.prototype.getSurroundingTypesAt = function(position, arraysToInclude) {
    var types = [];
    var gridPosition = Misc.cloneObject(position);
    gridPosition = this.snapPositionToGrid(gridPosition);
    for (var x = -1; x <= 1; x++) {
        for (var y = -1; y <= 1; y++) {
            if ( !(x == 0 && y == 0) ) {
                var position = new THREE.Vector3(0, 0, 0);
                position.x = gridPosition.x + x * this.gridSize;
                position.y = gridPosition.y + y * this.gridSize;
                var item = this.getItemAt(position, arraysToInclude);
                if (item) {
                    types.push(item.type);
                }
            }
        }
    }
    return types;
};

Universe.prototype.getItemAt = function(position, arraysToInclude) {
    var item = null;
    var gridPosition = Misc.cloneObject(position);
    gridPosition = this.snapPositionToGrid(gridPosition);
    if (!arraysToInclude) {
        arraysToInclude = [this.constructions, this.natureSpots, this.connectors];
    }

    for (var arraysI = 0; arraysI < arraysToInclude.length; arraysI++) {
        var thisArray = arraysToInclude[arraysI];
        for (var i = 0; i < thisArray.length; i++) {
            var thisItem = thisArray[i];
            var position = thisItem.position ?
                    thisItem.position : thisItem.shape.position;
            if (position.x == gridPosition.x && position.y == gridPosition.y) {
                item = thisItem;
                break;
            }
        }
    }
    return item;
};

Universe.prototype.getItemsAt = function(gridPosition, arraysToInclude) {
    var items = [];

    for (var arraysI = 0; arraysI < arraysToInclude.length; arraysI++) {
        var thisArray = arraysToInclude[arraysI];
        for (var i = 0; i < thisArray.length; i++) {
            var thisItem = thisArray[i];
            var position = thisItem.position ?
                    thisItem.position : thisItem.shape.position;
            if (position.x == gridPosition.x && position.y == gridPosition.y) {
                items.push(thisItem);
            }
        }
    }
    return items;
};

Universe.prototype.buildConnectorIfNeeded = function(construction) {
    var arraysToCheckForDirectNeighbor = [this.constructions, this.natureSpots, this.connectors];
    var arraysToCheckForIndirectNeighbor = [this.constructions, this.natureSpots];

    for (var x = -1; x <= 1; x++) {
        for (var y = -1; y <= 1; y++) {
            if ( (x == 0 || y == 0) && !(x == 0 && y == 0) ) {
                var directNeighborPos = new THREE.Vector3(0, 0, 0);
                directNeighborPos.x = construction.shape.position.x + x * this.gridSize;
                directNeighborPos.y = construction.shape.position.y + y * this.gridSize;
                directNeighborPos = this.snapPositionToGrid(directNeighborPos);

                var directNeighbor = this.getItemAt(directNeighborPos,
                        arraysToCheckForDirectNeighbor);
                if (!directNeighbor) {
                    var indirectNeighborPos = new THREE.Vector3(0, 0, 0);
                    indirectNeighborPos.x = construction.shape.position.x + x * (2 * this.gridSize);
                    indirectNeighborPos.y = construction.shape.position.y + y * (2 * this.gridSize);
                    indirectNeighborPos = this.snapPositionToGrid(indirectNeighborPos);

                    
                    var indirectNeighbor = this.getItemAt(indirectNeighborPos,
                            arraysToCheckForIndirectNeighbor);
                    if (indirectNeighbor) {
                        var type;
                        if (indirectNeighbor.isConstruction) {
                            type = indirectNeighbor.type == construction.type ?
                                    'pipe' : 'road';
                        }
                        else if (indirectNeighbor.type == 'forest') {
                            type = 'grass';
                        }
                        else if (indirectNeighbor.type == 'water') {
                            type = 'haven';
                        }

                        var isLeftRight = y == 0;
                        var subtype = construction.type;
                        var index = this.connectors.length;
                        this.connectors[index] = new Connector(
                                directNeighborPos,
                                type,
                                subtype,
                                isLeftRight,
                                indirectNeighbor);
                    }
                    
                }
            }
        }
    }
};

Universe.prototype.throwStone = function(position, targetPosition, subtype, isStarterOfConstruction) {
    var max = 50;
    if (this.stones.length < max) {
        var i = this.stones.length;
        this.stones[i] = new Stone(position, targetPosition, subtype);
    }
};

Universe.prototype.addGlow = function(position) {
    this.glows.push( new Glow(position) );
};

Universe.prototype.playSound = function(name) {
    if (this.soundIsOn) {
        if (!this.sounds[name]) {
            var soundPath = this.urlPrefix + 'sounds/' + name + '.mp3';
            this.sounds[name] = new Audio(soundPath);
        }
        this.sounds[name].play();
    }
};

Universe.prototype.getConstructionTypesOfGroupAsArray = function(group) {
    var types = [];
    for (var category in this.constructionTypes) {
        if (!group || this.constructionTypes[category].group == group) {
            types.push(category);
        }
    }
    return types;
};

Universe.prototype.getConstructionsOfGroup = function(group) {
    var constructions = [];
    for (var i = 0; i < this.constructions.length; i++) {
        if (this.constructions[i].group == group) {
            constructions.push(this.constructions[i]);
        }
    }
    return constructions;
};

Universe.prototype.getConstructionTypeBasedOnSurrounding = function(surroundingTypes) {
    var bestType = null;
    var bestSpecialTypeRecipeAmount = null;

    for (var type in this.constructionTypes) {
        var group = this.constructionTypes[type].group;
        var doInclude = this.constructionTypes[type].group == 'basicBuilding';
        var isFromSpecial = false;
        if (!doInclude) {
            for (var i = 0; i < this.specialBuildings.length && !doInclude; i++) {
                var specialBuilding = this.specialBuildings[i];
                doInclude = specialBuilding.type == 'construction' &&
                        specialBuilding.subtype == type && !specialBuilding.isFinished;
                isFromSpecial = true;
            }
        }
        if (doInclude) {
            var recipe = this.constructionTypes[type].recipe;
            var remainingRecipeTodos = null;
            if (recipe) {
                remainingRecipeTodos = Misc.cloneObject(recipe);
                for (var i = 0; i < surroundingTypes.length; i++) {
                    var surrounding = surroundingTypes[i];
                    var index = remainingRecipeTodos.indexOf(surrounding);
                    if (index >= 0) {
                        remainingRecipeTodos.splice(index, 1);
                    }
                }
            }
            
            if (!remainingRecipeTodos || remainingRecipeTodos.length == 0) {
                if (isFromSpecial) {
                    var recipeAmount = recipe ? recipe.length : 0;
                    if (bestSpecialTypeRecipeAmount === null ||
                            recipeAmount > bestSpecialTypeRecipeAmount) {
                        bestSpecialTypeRecipeAmount = recipeAmount;
                        bestType = type;
                    }
                }
                else {
                    bestType = type;
                }
            }
        }
    }

    return bestType;
};

Universe.prototype.startNewSpecialBuildings = function() {
    var usedTypes = [];
    for (var i = 0; i < this.specialBuildings.length; i++) {
        var constructionTypes = this.getConstructionTypesOfGroupAsArray('specialConstruction');
        if (constructionTypes) {
            var constructionType;
            var tries = 0;
            while ( !constructionType || usedTypes.indexOf(constructionType) >= 0 ) {
                constructionType = constructionTypes.getRandomItem();
                
                if (tries++ >= 1000) { break; };
            }
            usedTypes.push(constructionType);
            this.constructionTypes[constructionType].recipe = i == 0 ?
                    [] : this.getRandomPossibleRecipe();
            this.specialBuildings[i] = {
                type: 'construction',
                subtype: constructionType,
                isFinished: false
            };
        }
    }
    this.updateSpecialBuildingsDisplay(true);
    this.makeHtmlElementGlow('.specialBuilding');
    this.playSound('new-special');
};

Universe.prototype.makeHtmlElementGlow = function(selector, doFaster) {
    if ( this.currentGlowSelectors.indexOf(selector) === -1 ) {
        var self = this;
        var rgb = '255,255,255';
        var distribution = '0 0 25px';
        var fadeInMS = 500;
        var fadeOutMS = 2000;
        if (doFaster) {
            fadeInMS = Math.round(fadeInMS * .2);
            fadeOutMS = Math.round(fadeOutMS * .2);
        }
        
        this.currentGlowSelectors.push(selector);
        jQuery(selector).css('box-shadow', distribution + ' rgba(' + rgb + ',0)');
        jQuery(selector).animate({ boxShadow: distribution + ' rgba(' + rgb + ',1)' }, fadeInMS, 'linear',
            function() {
                jQuery(selector).animate({ boxShadow: distribution + ' rgba(' + rgb + ',0)' }, fadeOutMS, 'linear',
                    function() {
                        jQuery(selector).css('box-shadow', 'none');
                        var index = self.currentGlowSelectors.indexOf(selector);
                        if (index >= 0) { self.currentGlowSelectors.splice(index, 1); }
                    }
                );
            }
        );
    }
};

Universe.prototype.updateSpecialBuildingsDisplay = function(doReplaceAll) {
    if (this.secondsUntilSpecialBuildings !== null || doReplaceAll) {
        for (var i = 0; i < this.specialBuildings.length; i++) {
            var id = '#specialBuilding' + (i + 1);
            var type = this.specialBuildings[i].type;
            var html = '';
            if (type) {
                var category = this.specialBuildings[i].subtype;
                html += this.getStatsCategoryHeadline(category, i);
                html += this.getSubCategoryHtml(category, 'default');
            }
            else {
                html += '<span class="unlockNote">';
                if (this.secondsUntilSpecialBuildings === null) {
                    html += '?';
                }
                else {
                    html += this.secondsUntilSpecialBuildings + ' seconds';
                }
                html += '</span>';
            }
            jQuery(id).html(html);
        };
    }
};

Universe.prototype.getRandomPossibleRecipe = function() {
    var recipe = [];
    var recipeCandidates = [];
    var constructions = this.getConstructionsOfGroup('basicBuilding');
    var arraysToInclude = [constructions, this.natureSpots];
    
    var centerPos = new THREE.Vector3(0, 0, 0);
    var maxPartsLength = 2;
    if      ( Misc.chance(20) ) { maxPartsLength = 1; }
    else if ( Misc.chance(20) ) { maxPartsLength = 3; }
    var scope = this.gridSize * 4;
    
    for (var minPartsLength = maxPartsLength; minPartsLength >= 1; minPartsLength--) {
        for (var x = -scope; x <= scope; x += this.gridSize) {
            for (var y = -scope; y <= scope; y += this.gridSize) {

                var thisPos = new THREE.Vector3(
                        centerPos.x + x, centerPos.y + y, 0
                );
                var item = this.getItemAt(thisPos);
                if (!item) {
                    var surroundingTypes = this.getSurroundingTypesAt(thisPos, arraysToInclude);
                    var length = surroundingTypes.length;
                    if (length >= minPartsLength && length <= maxPartsLength) {
                        recipeCandidates.push(surroundingTypes);
                    }
                }
            }
        }

        if (recipeCandidates.length >= 1) { break; }
    }
    
    if (recipeCandidates.length >= 1) {
        recipe = recipeCandidates.getRandomItem();
    }
    
    return recipe;
};

Universe.prototype.getNewId = function() {
    return ++this.idCounter;
};

Universe.prototype.addSpeech = function(position, text, doEmphasize) {
    var html = '';
    var wrapperWidth = 250;
    var id = 'speech' + Misc.getRandomInt(1, 10000000);

    if (!position) {
        position = {x: window.innerWidth / 2, y: window.innerHeight / 2};
    }
    
    var style = 'left: ' + Math.round(position.x - wrapperWidth / 2) + 'px; ' +
                'top: ' + Math.round(position.y - 10) + 'px; ';
    if (doEmphasize) {
        style += 'font-size: 130%; color: rgba(255,255,255,1); ';
    }
    
    html += '<div class="speech" id="' + id +'" style="' + style +'">';
    html += Misc.htmlEscape(text);
    html += '</div>';
    jQuery('body').append(html);

    var timeInMS = 4000;
    jQuery('#' + id).animate({top: '-=50'}, timeInMS, 'linear',
        function() {
            jQuery('#' + id).animate({top: "-=25", opacity: 0}, timeInMS / 2, 'linear',
                function() {
                    jQuery('#' + id).remove();
                }
            );
        }
    );
};

Universe.prototype.overrideSpotlightToLatestToAddPenumbra = function() {
    THREE.SpotLight = function (color, intensity, distance, angle, penumbra, decay) {
        THREE.Light.call(this, color, intensity);
        this.type = 'SpotLight';
        this.position.set(0, 1, 0);
        this.updateMatrix();
        this.target   = new THREE.Object3D();
        this.distance = distance !== undefined ? distance : 0;
        this.angle    = angle !== undefined ? angle : Math.PI / 3;
        this.penumbra = penumbra !== undefined ? penumbra : 0;
        this.decay    = decay !== undefined ? decay : 1;
        this.shadow   = new THREE.LightShadow(
            new THREE.PerspectiveCamera(50, 1, 0.5, 500)
        );
    };

    THREE.SpotLight.prototype = Object.create(THREE.Light.prototype);
    THREE.SpotLight.prototype.constructor = THREE.SpotLight;

    THREE.SpotLight.prototype.copy = function(source) {
        THREE.Light.prototype.copy.call(this, source);
        this.distance = source.distance;
        this.angle    = source.angle;
        this.penumbra = source.penumbra;
        this.decay    = source.decay;
        this.target   = source.target.clone();
        this.shadow   = source.shadow.clone();
        return this;
    };
};
