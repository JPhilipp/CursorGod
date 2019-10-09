function Misc() {
}

Misc.prefixAorAn = function(s) {
    var wordsWithPrefixA = ['utopia'];
    var vowels = ['a', 'e', 'i', 'o', 'u'];
    var firstLetter = s.charAt(0);
    var prefix = vowels.indexOf(firstLetter) >= 0 ? 'an' : 'a';
    
    var sLower = s.toLowerCase();
    for (var i = 0; i < wordsWithPrefixA.length; i++) {
        var thisWord = wordsWithPrefixA[i];
        if ( sLower.indexOf(wordsWithPrefixA[i]) === 0 ) {
            prefix = 'a';
            break;
        }
    }

    return prefix + ' ' + s;
};

Misc.abbreviateNumber = function(value) {
    var abbreviation = '';

    if (value == 0) {
        abbreviation = 0;
    }
    else if (value < 1) {
        abbreviation = parseFloat(value).toFixed(1);
    }
    else if (value < 1000000) {
        abbreviation = Math.round(value).toLocaleString();
    }
    else {
        var length = String( Math.floor(value) ).length;
        var decimalPlaces = 3;
        if      (length <=  9) { abbreviation = parseFloat( parseFloat(value /                1000000).toFixed(decimalPlaces) ) + ' million';     }
        else if (length <= 12) { abbreviation = parseFloat( parseFloat(value /             1000000000).toFixed(decimalPlaces) ) + ' billion';     }
        else if (length <= 15) { abbreviation = parseFloat( parseFloat(value /          1000000000000).toFixed(decimalPlaces) ) + ' trillion';    }
        else if (length <= 18) { abbreviation = parseFloat( parseFloat(value /       1000000000000000).toFixed(decimalPlaces) ) + ' quadrillion'; }
        else if (length <= 21) { abbreviation = parseFloat( parseFloat(value /    1000000000000000000).toFixed(decimalPlaces) ) + ' quintillion'; }
        else if (length <= 24) { abbreviation = parseFloat( parseFloat(value / 1000000000000000000000).toFixed(decimalPlaces) ) + ' sextillion';  }
        else                   { abbreviation += 'wow'; }
    }

    return abbreviation;
},

Misc.cloneObject = function(obj) {
    if (null == obj || 'object' != typeof obj) { return obj; }
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime( obj.getTime() );
        return copy;
    }
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) { copy[i] = Misc.cloneObject(obj[i]); }
        return copy;
    }
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) { if (obj.hasOwnProperty(attr)) copy[attr] = Misc.cloneObject(obj[attr]); }
        return copy;
    }
};
    
Misc.htmlEscape = function(s) {
    s = String(s);
    s = Misc.replaceAll(s, '&', '&amp;');
    s = Misc.replaceAll(s, '"', '&quot;');
    s = Misc.replaceAll(s, "'", '&#39;');
    s = Misc.replaceAll(s, '<', '&lt;');
    s = Misc.replaceAll(s, '>', '&gt;');
    return s;
};

Misc.camelCaseToWords = function(s) {
    var s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
    return s.toLowerCase();
};
    
Misc.replaceAll = function(s, sFind, sReplace) {
    sFind = sFind.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    return s.replace(new RegExp(sFind, 'g'), sReplace);
};

Misc.chance = function(chanceInPercent) {
    if (chanceInPercent === undefined) { chanceInPercent = 50; }
    return chanceInPercent == 0 ? false : Misc.getRandomInt(0, 100) <= chanceInPercent;
};

Misc.getRandomInt = function(min, max) {
    return parseInt( Math.floor( ( (max + 1 - min) * Math.random() ) + min ) );
};

Misc.getRandom = function(min, max) {
    return min + (max - min) * Math.random();
};

Misc.keepInLimits = function(v, min, max) {
    if (min !== null && min !== undefined && v < min) { v = min; }
    if (max !== null && max !== undefined && v > max) { v = max; }
    return v;
};

Misc.distort = function(value, amount) {
    var distorted = value;
    if (amount != 0) {
        if (amount >= 1) { distorted = value * 1 + Misc.getRandomInt(-amount, amount) * 1; }
        else { distorted = value * 1 + Misc.getRandom(-amount, amount) * 1; }
    }
    return distorted;
};

Misc.getDistance = function(point1, point2) {
    var xfactor = point2.x - point1.x;
    var yfactor = point2.y - point1.y;
    return Math.sqrt( (xfactor * xfactor) + (yfactor * yfactor) );
};

Misc.isIOs = function() {
    return navigator.userAgent.toLowerCase().indexOf('iphone') != -1 || navigator.userAgent.toLowerCase().indexOf('ipad') != -1;
};

Misc.getPercent = function(all, part) {
    var percent;
    if (part <= 0) { percent = 0; }
    else if (part >= all) { percent = 100; }
    else { percent = (part / all) * 100; }
    return percent;
};

Misc.distortColors = function(array, distortion) {
    return Misc.distortArray(array, distortion, 0, 255);
};

Misc.distortArray = function(array, distortion, optionalMin, optionalMax) {
    for (var i = 0; i < array.length; i++) {
        array[i] += Misc.getRandomInt(-distortion, distortion);
        array[i] = Misc.keepInLimits(array[i], optionalMin, optionalMax);
    }
    return array;
};

Array.prototype.getRandomItem = function() {
    var i = Misc.getRandomInt(0, this.length - 1);
    return this[i];
};

Array.prototype.contains = function(v) {
    var doesContain = false, max = this.length;
    for (var i = 0; i < max && !doesContain; i++) {
        if (this[i] == v) { doesContain = true; }
    }
    return doesContain;
};

Array.prototype.clone = function() {
    var arr = [];
    var max = this.length;
    for (var i = 0; i < max; i++) {
        arr[i] = this[i];
    }
    return arr;
};

Array.prototype.remove = function(from, to) {
    var rest = this.slice( (to || from) + 1 || this.length );
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

Array.prototype.toRgbString = function() {
    return 'rgb(' + this.join(',') + ')';
};
