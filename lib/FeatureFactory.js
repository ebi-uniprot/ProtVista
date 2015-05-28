'use strict';

var d3 = require('d3');
var _ = require('underscore');

var Feature = {},
	height = 10,
	pixelPerAA = 10,
	dictionary = {
		metal: "diamond",
		site: "chevron",
		binding: "catFace",
		act_site: "circle",
		mod_res: "triangle",
		lipid: "wave",
		carbohyd: "hexagon",
		non_std: "pentagon",
		init_met: "arrow",
		non_ter: "doubleBar",
		non_cons: "doubleBar"
	};

var FeatureFactory = function() {
	return {
		getFeature: function(type, width) {
			var featureType = dictionary[type.toLowerCase()];

			// error if the constructor doesn't exist
			if (typeof Feature[featureType] !== 'function') {
				console.log(featureType + ' doesn\'t exist');
			}

			return Feature[featureType](width);
		}
	}
}();


Feature.rectangle = function(width, container) {
	var shape = 'M0,0' 
				+ 'L' + width + ',0' 
				+ 'L' + width + ',' + height
				+ 'L0,' + height
				+ 'Z';
	return shape;
}

Feature.bridge = function(width) {
    var shape = 'M0,0'
            + 'L0,' + height
            + 'L' + width + ',' + height
            + 'L' + width + ',0';
    return shape;
}

Feature.link = function(width) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var gap = 6*this.scaleFactor;
    if (pixelPerAA > this.minShapeSize) {
        gap = this.pixelScale(gap, pixelPerAA);
    }
    feature.shape = ' M ' + xLine + ' ' + yLine //line
        + ' L ' + (xLine-thick) + ' ' + yLine //line
        + ' L ' + (xLine-thick) + ' ' + y //line
        + ' L ' + x + ' ' + y //line
        //+ 'L' + (x) + ',' + (y-gap*2) //shape
        //+ 'L' + x + ',' + y //shape
        + ' L ' + (xLine+thick) + ' ' + y //line
        + ' L ' + (xLine+thick) + ' ' + yLine //line
        + ' Z';
    return feature.shape;
}

Feature.diamond = function(feature, pixelPerAA, thick, doubleLink) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var gap = 6*this.scaleFactor;
    if (pixelPerAA > this.minShapeSize) {
        gap = this.pixelScale(gap, pixelPerAA);
    }
    var shape = ' L ' + (x-gap) + ' ' + (y-gap) //diamond
        + ' L ' + x + ' ' + (y-(gap*2)) //diamond
        + ' L ' + (x+gap) + ' ' + (y-gap); //diamond
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    } else {
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    }
    return feature.shape;
}

Feature.chevron = function(feature, pixelPerAA, thick, doubleLink) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var gap = 6*this.scaleFactor;
    if (pixelPerAA > this.minShapeSize) {
        gap = this.pixelScale(gap, pixelPerAA);
    }
    var shape = ' L ' + (x-gap) + ' ' + (y-gap) //shape
        + ' L ' + (x-gap) + ' ' + (y-(gap*2)) //shape
        + ' L ' + x + ' ' + (y-gap) //shape
        + ' L ' + (x+gap) + ' ' + (y-(gap*2)) //shape
        + ' L ' + (x+gap) + ' ' + (y-gap); //shape
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    } else {
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    }
    return feature.shape;
}

Feature.catFace = function(feature, pixelPerAA, thick, doubleLink) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var chin = this.pixelScale(3*this.scaleFactor, pixelPerAA);
    var side = this.pixelScale(6*this.scaleFactor, pixelPerAA);
    var upperSide = this.pixelScale(12*this.scaleFactor, pixelPerAA);
    var chick = this.pixelScale(2*this.scaleFactor, pixelPerAA);
    var upperChick = this.pixelScale(4*this.scaleFactor, pixelPerAA);
    var shape = ' L ' + (x-chin) + ' ' + y //shape
        + ' L ' + (x-side) + ' ' + (y-upperChick) //shape
        + ' L ' + (x-side) + ' ' + (y-upperSide) //shape
        + ' L ' + (x-chick) + ' ' + (y-side) //shape
        + ' L ' + (x+chick) + ' ' + (y-side) //shape
        + ' L ' + (x+side) + ' ' + (y-upperSide) //shape
        + ' L ' + (x+side) + ' ' + (y-upperChick) //shape
        + ' L ' + (x+chin) + ' ' + (y); //shape
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    } else {
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    }
    return feature.shape;
}

Feature.triangle = function(feature, pixelPerAA, thick, doubleLink) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var gap = this.pixelScale(6*this.scaleFactor, pixelPerAA);
    var shape = ' L ' + (x-gap) + ' ' + y //shape
        + ' L ' + x + ' ' + (y-(gap*2)) //shape
        + ' L ' + (x+gap) + ' ' + y ; //shape
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    } else {
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    }
    return feature.shape;
}

Feature.wave = function(feature, pixelPerAA, thick, doubleLink) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var hillX = this.pixelScale(3*this.scaleFactor, pixelPerAA);//1
    var lowerHillY = this.pixelScale(4*this.scaleFactor, pixelPerAA);//1
    var sideX = this.pixelScale(6*this.scaleFactor, pixelPerAA);//3
    var sideY = this.pixelScale(6*this.scaleFactor, pixelPerAA);//4
    var upperHillY = this.pixelScale(12*this.scaleFactor, pixelPerAA);//6
    var shape = ' L ' + (x-hillX) + ' ' + (y-lowerHillY) //shape
        + ' L ' + (x-sideX) + ' ' + y //shape
        + ' L ' + (x-sideX) + ' ' + (y-sideY) //shape
        + ' L ' + (x-hillX) + ' ' + (y-upperHillY) //shape
        + ' L ' + (x) + ' ' + (y-lowerHillY) //shape
        + ' L ' + (x+hillX) + ' ' + (y-upperHillY) //shape
        + ' L ' + (x+sideX) + ' ' + (y-sideY) //shape
        + ' L ' + (x+sideX) + ' ' + (y) //shape
        + ' L ' + (x+hillX) + ' ' + (y-lowerHillY) ; //shape
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    } else {
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    }
    return feature.shape;
}

Feature.hexagon = function(feature, pixelPerAA, thick, doubleLink) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var topBottomX = this.pixelScale(2*this.scaleFactor, pixelPerAA);
    var middleX = this.pixelScale(6*this.scaleFactor, pixelPerAA);
    var middleY = this.pixelScale(3*this.scaleFactor, pixelPerAA);
    var topY = this.pixelScale(6*this.scaleFactor, pixelPerAA);
    var shape = ' L ' + (x-topBottomX) + ' ' + y //shape
        + ' L ' + (x-middleX) + ' ' + (y-middleY) //shape
        + ' L ' + (x-topBottomX) + ' ' + (y-topY) //shape
        + ' L ' + (x+topBottomX) + ' ' + (y-topY) //shape
        + ' L ' + (x+middleX) + ' ' + (y-middleY) //shape
        + ' L ' + (x+topBottomX) + ' ' + (y) ; //shape
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    } else {
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    }
    return feature.shape;
}

Feature.pentagon = function(feature, pixelPerAA, thick, doubleLink) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var edge = this.pixelScale(6*this.scaleFactor, pixelPerAA);
    var topX = this.pixelScale(3*this.scaleFactor, pixelPerAA);
    var topY = this.pixelScale(12*this.scaleFactor, pixelPerAA);
    var shape = 'L ' + (x-edge) + ' ' + (y-edge) //shape
        + ' L ' + (x-topX) + ' ' + (y-topY) //shape
        + ' L ' + (x+topX) + ' ' + (y-topY) //shape
        + ' L ' + (x+edge) + ' ' + (y-edge) ; //shape
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    } else {
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    }
    return feature.shape;
}

Feature.circle = function(width) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var topY = this.pixelScale(12*this.scaleFactor, pixelPerAA);
    var radius = pixelPerAA/2;
    if (pixelPerAA <= this.minShapeSize) {
        radius = this.minShapeSize/2;
    }
    var shape = 'M ' + (x) + ' ' + (y-topY-2) //shape
        + 'a ' + radius + ' ' + radius + ' 0 1 0 0.02 0' ; //shape
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = shape
            + ' M ' + x + ' ' + y //shape
            + ' L ' + (xLine-pixelPerAA/2) + ' ' + yLine //left line
            + ' L ' + x + ' ' + y //line & shape
            + ' L ' + (xLine+pixelPerAA/2) + ' ' + yLine //right line
            + ' L ' + x + ' ' + y //line & shape
            + ' Z';
    } else {
        feature.shape = shape
            + ' M ' + x + ' ' + y //line
            + ' L ' + (x-thick) + ' ' + y //line
            + ' L ' + (xLine-thick) + ' ' + yLine //line
            + ' L ' + (xLine+thick) + ' ' + yLine //line
            + ' L ' + (x+thick) + ' ' + y //line
            + ' Z';
    }
    return feature.shape;
}

Feature.arrow = function(feature, pixelPerAA, thick, doubleLink) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var middleX = this.pixelScale(6*this.scaleFactor, pixelPerAA);
    var middleY = this.pixelScale(10*this.scaleFactor, pixelPerAA);
    var topY = this.pixelScale(12*this.scaleFactor, pixelPerAA);
    var shape = 'L' + (x-middleX) + ',' + (y-middleY) //shape
        + 'L' + (x) + ',' + (y-topY) //shape
        + 'L' + (x+middleX) + ',' + (y-middleY) ; //shape
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    } else {
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    }
    return feature.shape;
}

Feature.doubleBar = function(feature, pixelPerAA, thick, doubleLink) {
    var x = feature.x;
    var y = feature.y;
    var xLine = feature.xLine;
    var yLine = feature.yLine;
    var leftRightX = this.pixelScale(6*this.scaleFactor, pixelPerAA);
    var topY = this.pixelScale(12*this.scaleFactor, pixelPerAA);
    var shape = 'L' + (x-leftRightX) + ',' + (y) //shape
        + 'L' + (x) + ',' + (y-topY) //shape
        + 'L' + (x+leftRightX) + ',' + (y-topY) ; //shape
    if (doubleLink === true) { //no thick will be taken into account here
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    } else {
        feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
    }
    return feature.shape;
}

module.exports = FeatureFactory;