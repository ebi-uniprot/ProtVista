'use strict';

var d3 = require('d3');
var _ = require('underscore');

var symbolSize = 10,
	gapRegion = 0,
	gapShape = 0,
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
		ca_bind:'rectangle',
		disulfid:'bridge',
		crosslink:'bridge',
		turn:'rectangle',
		chain:'rectangle',
		mutagen:'rectangle',
		conflict:'rectangle',
		helix:'rectangle',
		repeat:'rectangle',
		region:'rectangle',
		signal:'rectangle',//CHECK
		peptide:'rectangle',//CHECK
		strand:'rectangle',//CHECK
		topo_dom:'rectangle',//CHECK
		transmem:'rectangle',//CHECK
		motif:'rectangle',//CHECK
		domain:'rectangle',//CHECK
		compbias:'rectangle',//CHECK
		missense:'variant',//CHECK
		ms_del:'variant',//CHECK
		insdel:'variant',//CHECK
		stop_lost:'variant',//CHECK
		stop_gained:'variant',//CHECK
		init_codon:'variant'//CHECK		
	};

var Feature = function() {
	var feature = this;
	return feature;
};

var FeatureFactory = function() {
	return {
		getFeature: function(type, aaWidth, height, length) {
			var feature,
				featureType = dictionary[type.toLowerCase()],
				width = aaWidth * length;
			
			gapShape = length === 1 ? 0 : width/length/2,
			gapRegion = width/length/2;
				
			// if the constructor doesn't exist, rectangle is used by default
			if (typeof Feature[featureType] !== 'function') {
				console.log(type + ' doesn\'t exist');
				featureType = 'rectangle';
			}
			
			
			Feature[featureType].prototype = new Feature();
			feature = Feature[featureType](width, height, length);

			return feature;
		}
	};
}();

/**
 * Returns a rectangle. 
 * 0,0 is in the middle, so we first move to the starting of the aa at gapRegion,0.  
 * @param {Object} width Feature width.
 * @param {Object} height Feature height.
 * @param {Object} length Feature length.
 */
Feature.rectangle = function(width, height, length) {
	return 'M' + -(gapRegion) + ',0' 
			+ 'L' + (width-gapRegion) + ',0' 
			+ 'L' + (width-gapRegion) + ',' + height
			+ 'L' + -(gapRegion) + ',' + height
			+ 'Z';
};

/**
 * Returns a bridge. 
 * 0,0 is in the middle, so we first move to the starting of the aa at gapRegion,0.  
 * @param {Object} width Feature width.
 * @param {Object} height Feature height.
 * @param {Object} length Feature length.
 */
Feature.bridge = function(width, height, length) {
    if (length !== 1) {
    	shape = 'M' + -(gapRegion) + ',' + height
	            + 'L' + -(gapRegion) + ',0'
	            + 'L' + (width-gapRegion) + ',0'             
	            + 'L' + (width-gapRegion) + ',' + height
	            + 'L' + (width-gapRegion) + ',2'
	            + 'L' + -(gapRegion) + ',2Z'
        ;	
    } else {
    	shape = 'M' + -(gapRegion) + ',' + height
    			+ 'L' + -(ggapRegionap) + ',' + (height/2)
				+ 'L0,' + (height/2)
				+ 'L0,0'
				+ 'L0,' + (height/2)
				+ 'L' + (width-gapRegion) + ',' + (height/2)
				+ 'L' + (width-gapRegion) + ',' + height
				+ 'Z'
		;    	
    }    
    return shape;
};

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

/**
 * Returns a diamond.
 * 0,0 is in the middle, so we first move to the starting of the aa at gapShape,0. 
 * @param {Object} width Feature width.
 * @param {Object} height Feature height.
 * @param {Object} length Feature length.
 */
Feature.diamond = function(width, height, length) {
	var centerx = symbolSize/2;	
	var shape = 'M' + gapShape + ',0'
			+ 'L' + (centerx+gapShape) + ',' + centerx
			+ 'L' + gapShape + ',' + symbolSize
			+ 'L' + (-centerx+gapShape) + ',' + centerx
			+ 'L' + gapShape + ',0';
	if (length !== 1) {
		shape = shape			
			+ 'L' + (centerx+gapShape) + ',' + centerx
			+ 'L' + (width/2+gapShape) + ',' + centerx
			+ 'L' + (-width/2+gapShape) + ',' + centerx
			+ 'L' + (-centerx+gapShape) + ',' + centerx
		;
	}	
	return shape + 'Z';
};

/**
 * Returns a chevron.
 * 0,0 is in the middle, so we first move to the starting of the aa at gapShape,0. 
 * @param {Object} width Feature width.
 * @param {Object} height Feature height.
 * @param {Object} length Feature length.
 */
Feature.chevron = function() {
	var centerx = symbolSize/2;
	var shape = 'M' + (-centerx+gapShape) + ',0'
			+ 'L' + gapShape + ',' + centerx
			+ 'L' + (centerx+gapShape) + ',0'
			+ 'L' + (centerx+gapShape) +',' + centerx
			+ 'L' + gapShape + ',' + symbolSize
			+ 'L' + (-centerx+gapShape) + ',' + centerx;
	if (length !== 1) {
		
	}			
	return shape + 'Z';
};

Feature.catFace = function() {
	var centerx = symbolSize/2;
	var step = symbolSize/10;	
	if (length === 0) {
		
	} else {
		
	}
    var shape = 'M' + -centerx + ',0'
		+ 'L' + -centerx + ',' + (6*step)
		+ 'L' + -(2*step) + ',' + symbolSize
		+ 'L' + (2*step) + ',' + symbolSize
		+ 'L' + centerx + ',' + (6*step)
		+ 'L' + centerx + ',0'
		+ 'L' + (2*step) + ',' + (4*step)
		+ 'L' + -(2*step) + ',' + (4*step)
		+'Z'
	;
    return shape;
};

Feature.triangle = function() {
	var centerx = symbolSize/2;
	if (length === 0) {
		
	} else {
		
	}
	return 'M0,0'
			+ 'L' + centerx + ',' + symbolSize
			+ 'L' + -centerx + ',' + symbolSize
			+ 'Z';
};

Feature.wave = function() {
	var r = Math.sqrt(symbolSize / Math.PI);
	return 'M' + -symbolSize/2 + ',' + symbolSize/3
	if (length === 0) {
		
	} else {
		
	}
		    + "A" + r + "," + r + " 0 1,1 0," + symbolSize/3
		    + "A" + r + "," + r + " 0 1,0 " + symbolSize/2 + ',' + symbolSize/3
		    + "Z";
};

var getPolygon = function(N){
	var r = symbolSize/2;
	var polygon = 'M ';
	for(var i=0; i < N;i++) {
		polygon += r * Math.cos(2*Math.PI*i/N) + ',' + (r * Math.sin(2*Math.PI*i/N)+r)  + ' ';
	};
	polygon += ' Z';
	return polygon;
};

Feature.hexagon = function() {
	return getPolygon(6);
};

Feature.pentagon = function() {
	return getPolygon(5);
};

Feature.circle = function() {
  var r = Math.sqrt(symbolSize / Math.PI);
  var centerx = symbolSize/2;
  return "M0,0"
      + "A" + r + "," + r + " 0 1,1 0," + symbolSize
      + "A" + r + "," + r + " 0 1,1 0,0"
      + "Z";
};

Feature.arrow = function(width, height) {
	var step = symbolSize/10;	
	var shape = 'M0,0'
		+ 'L' + -(step) + ',0'
		+ 'L' + -(5*step) + ',' + (4*step)
		+ 'L' + -(step) + ',' + height
		+ 'L0,' + height
		+ 'L' + (4*step) + ',' + (4*step)
		+ 'Z'
	;
	return shape;
};

Feature.doubleBar = function() {
	var centerx = symbolSize/2;	
	var shape = 'M0,0'
		+ 'L' + -centerx + ',' + symbolSize
		+ 'L0' + ',' + symbolSize
		+ 'L' + centerx + ',0'
		+ 'Z';
		
	return shape;
};

Feature.variant = function() {
	//TODO
};

module.exports = FeatureFactory;