function ObjectHelper() {
}

ObjectHelper.randomizeVerticesAllAxis = function(shape, amount) {
    this.randomizeVertices(shape, amount, amount, amount);
};

ObjectHelper.toNativeColor = function(oneOfRGB) {
    var nativeColor = 0;
    if (oneOfRGB > 0) { nativeColor = oneOfRGB / 255; }
    return nativeColor;
};

ObjectHelper.randomizeVertices = function(shape, amountX, amountY, amountZ) {
    var vertices = shape.geometry.vertices;
    for (var i = 0; i < vertices.length; i++) {
        var vertice = vertices[i];
        if (amountX) { vertice.x += Misc.getRandom(-amountX, amountX); }
        if (amountY) { vertice.y += Misc.getRandom(-amountY, amountY); }
        if (amountZ) { vertice.z += Misc.getRandom(-amountZ, amountZ); }
    }
};

ObjectHelper.followTargetStraight = function(pos, targetPos, speed, distanceConsideredReached) {
    var didReach = false;
    
    if (distanceConsideredReached === undefined) {
        distanceConsideredReached = .15;
    }

    var distance = pos.distanceTo(targetPos);
    didReach = distance <= distanceConsideredReached;
    if (!didReach) {
        var subtractedVector = new THREE.Vector3();
        subtractedVector = subtractedVector.subVectors(pos, targetPos);

        pos.y -= speed * (subtractedVector.y / distance);
        pos.x -= speed * (subtractedVector.x / distance);
        pos.z -= speed * (subtractedVector.z / distance);
    }

    return didReach;
};

ObjectHelper.followTarget = function(pos, targetPos, speed) {
    var coordinates = ['x', 'y', 'z'];
    for (var i = 0; i < coordinates.length; i++) {
        var c = coordinates[i];
        if (pos[c] < targetPos[c]) {
            pos[c] += speed;
            if (pos[c] > targetPos[c]) { pos[c] = targetPos[c]; }
        }
        else if (pos[c] > targetPos[c]) {
            pos[c] -= speed;
            if (pos[c] < targetPos[c]) { pos[c] = targetPos[c]; }
        }
    }
};
