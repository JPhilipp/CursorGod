function Glow(position) {
    var color = [255,255,255];
    
    var material = new THREE.MeshLambertMaterial( {color: color.toRgbString(), transparent: true, opacity: .8} );
    var radius = 1.25;
    var segments = 6;
    var geometry = new THREE.CircleGeometry(radius, segments);
    this.shape = new THREE.Mesh(geometry, material);
    
    this.shape.position.x = position.x;
    this.shape.position.y = position.y;
    this.shape.position.z = .35;
    this.energy = 100;

    universe.scene.add(this.shape);
    this.scale = 1;
};

Glow.prototype.update = function() {
    this.scale += .6 * universe.tick;
    this.shape.rotation.z -= .5 * universe.tick;
    this.shape.scale.set(this.scale, this.scale, this.scale);
    this.shape.material.opacity -= .3 * universe.tick;
    if (this.shape.material.opacity <= 0) {
        this.shape.material.opacity = 0;
        this.energy = 0;
    }
};
