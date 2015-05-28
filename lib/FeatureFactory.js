'use strict';

var d3 = require('d3');
var _ = require('underscore');

var height = 10,
	symbolSize = 10,
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
		non_cons: "doubleBar",
		ca_bind:'rectangle',//CHECK
		disulfid:'rectangle',//CHECK
		turn:'rectangle',//CHECK
		ms_del:'rectangle',//CHECK
		insdel:'rectangle',//CHECK
		stop_gained:'rectangle'//CHECK
	};

var Feature = function() {
	var feature = this;
	return feature;
}

var FeatureFactory = function() {
	return {
		getFeature: function(type, width) {
			var feature,
				featureType = dictionary[type.toLowerCase()];

			// error if the constructor doesn't exist
			if (typeof Feature[featureType] !== 'function') {
				console.log(featureType + ' doesn\'t exist');
			}

			Feature[featureType].prototype = new Feature();
			feature = Feature[featureType](width)

			return feature;
		}
	}
}();


Feature.rectangle = function(width) {
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
            + 'L' + width+ ',' + height
            + 'L' + width + ',0';
    return shape;
}

// Feature.link = function(width) {
//     var x = feature.x;
//     var y = feature.y;
//     var xLine = feature.xLine;
//     var yLine = feature.yLine;
//     var gap = 6*this.scaleFactor;
//     if (pixelPerAA > this.minShapeSize) {
//         gap = this.pixelScale(gap, pixelPerAA);
//     }
//     feature.shape = ' M ' + xLine + ' ' + yLine //line
//         + ' L ' + (xLine-thick) + ' ' + yLine //line
//         + ' L ' + (xLine-thick) + ' ' + y //line
//         + ' L ' + x + ' ' + y //line
//         //+ 'L' + (x) + ',' + (y-gap*2) //shape
//         //+ 'L' + x + ',' + y //shape
//         + ' L ' + (xLine+thick) + ' ' + y //line
//         + ' L ' + (xLine+thick) + ' ' + yLine //line
//         + ' Z';
//     return feature.shape;
// }

Feature.diamond = function() {
	var centerx = symbolSize/2;
	return 'M0,0'
			+ 'L' + centerx + ',' + centerx
			+ 'L0,' + symbolSize
			+ 'L' + -centerx + ',' + centerx + 'Z';
}

Feature.chevron = function() {
	var centerx = symbolSize/2;
	return 'M' + -centerx + ',0'
			+ 'L0,' + centerx
			+ 'L' + centerx + ',0'
			+ 'L' + centerx +',' + centerx
			+ 'L0,' + symbolSize
			+ 'L' + -centerx + ',' + centerx
			+ 'Z';
}

Feature.catFace = function() {
    return 'M0,0';
}

Feature.triangle = function() {
	var centerx = symbolSize/2;

	return 'M0,0'
			+ 'L' + centerx + ',' + symbolSize
			+ 'L' + -centerx + ',' + symbolSize
			+ 'Z';
}

Feature.wave = function() {
	var r = Math.sqrt(symbolSize / Math.PI);
	return 'M' + -symbolSize/2 + ',' + symbolSize/3
		    + "A" + r + "," + r + " 0 1,1 0," + symbolSize/3
		    + "A" + r + "," + r + " 0 1,0 " + symbolSize/2 + ',' + symbolSize/3
		    + "Z";
}

var getPolygon = function(N){
	var r = symbolSize/2;
	var polygon = 'M '
	for(var i=0; i < N;i++) {
		polygon += r * Math.cos(2*Math.PI*i/N) + ',' + (r * Math.sin(2*Math.PI*i/N)+r)  + ' ';
	};
	polygon += ' Z';
	return polygon;
}

Feature.hexagon = function() {
	return getPolygon(6);
}

Feature.pentagon = function() {
	return getPolygon(5);
}

Feature.circle = function() {
  var r = Math.sqrt(symbolSize / Math.PI);
  var centerx = symbolSize/2;
  return "M0,0"
      + "A" + r + "," + r + " 0 1,1 0," + symbolSize
      + "A" + r + "," + r + " 0 1,1 0,0"
      + "Z";
}

Feature.arrow = function(width) {
	//TODO
}

Feature.doubleBar = function() {
	//TODO
}

module.exports = FeatureFactory;