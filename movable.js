function Movable(position, type) {
    this.id = universe.getNewId();
    this.shape = null;
    this.position = position;
    this.type = type;
    
    switch (this.type) {
        case 'ship':       this.initShip();      break;
        case 'car':        this.initCar();       break;
        case 'helicopter': this.initHelicopter(); break;
    }
};

Movable.prototype.initShip = function() {
    var color = Misc.distortColors([74,128,176], 30);
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
    var size = .5;
    var geometry = new THREE.BoxGeometry(size, size, size * 2);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = true;
    
    this.height = .6;
    this.shape.position.x = this.position.x;
    this.shape.position.y = this.position.y;
    this.shape.position.z = this.height - .4;
    
    universe.scene.add(this.shape);
    this.shape.lookAt({x: 0, y: 0, z: 0});
};

Movable.prototype.initCar = function() {
    var color = Misc.distortColors([40,40,40], 40);
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
    var size = .3;
    var geometry = new THREE.BoxGeometry(size, size, size * 1.8);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = true;
    
    this.height = .4;
    this.shape.position.x = this.position.x;
    this.shape.position.y = this.position.y;
    this.shape.position.z = this.height;
    
    universe.scene.add(this.shape);
    this.shape.lookAt({x: 0, y: 0, z: 0});
};

Movable.prototype.initHelicopter = function() {
    var color = Misc.distortColors([200,200,230], 40);
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString()} );
    var size = .4;
    var geometry = new THREE.BoxGeometry(size, size, size * 1.8);
    this.shape = new THREE.Mesh(geometry, material);
    this.shape.castShadow = true;

    this.height = .6;
    this.shape.position.x = this.position.x;
    this.shape.position.y = this.position.y;
    this.shape.position.z = 2.2;

    universe.scene.add(this.shape);
    this.shape.lookAt({x: 0, y: 0, z: 0});
};

Movable.prototype.getOccupants = function() {
    var occupants = [];
    for (var i = 0; i < universe.citizens.length; i++) {
        var citizen = universe.citizens[i];
        if (citizen.movable && citizen.movable.id == this.id) {
            occupants.push(citizen);
        }
    }
    return occupants;
};
