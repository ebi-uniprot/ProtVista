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
			
			//0,0 is in the middle, so we first move to the starting of the aa at gapShape,0.
			gapShape = length === 1 ? 0 : width/length/2,
			//again a gap is needed for regions 
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

Feature.rectangle = function(width, height, length) {
	return 'M' + -(gapRegion) + ',0' 
			+ 'L' + (width-gapRegion) + ',0' 
			+ 'L' + (width-gapRegion) + ',' + height
			+ 'L' + -(gapRegion) + ',' + height
			+ 'Z';
};

Feature.bridge = function(width, height, length) {
    if (length !== 1) {
    	return 'M' + -(gapRegion) + ',' + height
	            + 'L' + -(gapRegion) + ',0'
	            + 'L' + (width-gapRegion) + ',0'             
	            + 'L' + (width-gapRegion) + ',' + height
	            + 'L' + (width-gapRegion) + ',2'
	            + 'L' + -(gapRegion) + ',2Z';	
    } else {
    	return 'M' + -(gapRegion) + ',' + height
    			+ 'L' + -(gapRegion) + ',' + (height/2)
				+ 'L0,' + (height/2)
				+ 'L0,0'
				+ 'L0,' + (height/2)
				+ 'L' + (width-gapRegion) + ',' + (height/2)
				+ 'L' + (width-gapRegion) + ',' + height
				+ 'Z';    	
    }    
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

var getMiddleLine = function(centerx, width) {
	return 'M' + centerx + ',' + centerx
			+ 'L' + (width/2+gapShape) + ',' + centerx
			+ 'L' + (-width/2+gapShape) + ',' + centerx;
};

Feature.diamond = function(width, height, length) {
	var centerx = symbolSize/2;	
	var shape = 'M' + gapShape + ',0'
			+ 'L' + (centerx+gapShape) + ',' + centerx
			+ 'L' + gapShape + ',' + symbolSize
			+ 'L' + (-centerx+gapShape) + ',' + centerx;	
	return length !== 1 
		? shape + 'L' + gapShape + ',0' + getMiddleLine(centerx, width) + 'Z' 
		: shape + 'Z';
};

Feature.chevron = function(width, height, length) {
	var centerx = symbolSize/2;
	var shape = 'M' + gapShape + ',' + centerx
			+ 'L' + (centerx+gapShape) + ',0'
			+ 'L' + (centerx+gapShape) +',' + centerx
			+ 'L' + gapShape + ',' + symbolSize			
			+ 'L' + (-centerx+gapShape) + ',' + centerx
			+ 'L' + (-centerx+gapShape) + ',0';			
	return length !== 1 
		? shape + 'L' + gapShape + ',' + centerx + getMiddleLine(centerx, width) + 'Z'
		: shape + 'Z';
};

Feature.catFace = function(width, height, length) {
	var centerx = symbolSize/2;
	var step = symbolSize/10;	
    var shape = 'M' + (-centerx+gapShape) + ',0'
		+ 'L' + (-centerx+gapShape) + ',' + (6*step)
		+ 'L' + (-2*step+gapShape) + ',' + symbolSize
		+ 'L' + (2*step+gapShape) + ',' + symbolSize
		+ 'L' + (centerx+gapShape) + ',' + (6*step)
		+ 'L' + (centerx+gapShape) + ',0'
		+ 'L' + (2*step+gapShape) + ',' + (4*step)
		+ 'L' + (-2*step+gapShape) + ',' + (4*step);
	return length !== 1 
		? shape + 'M' + (-centerx+gapShape) + ',0' + getMiddleLine(centerx, width) + 'Z'
		: shape + 'Z';
};

Feature.triangle = function(width, height, length) {
	var centerx = symbolSize/2;
	var shape = 'M' + gapShape + ',0' 
				+ 'L' + (centerx+gapShape) + ',' + symbolSize
				+ 'L' + (-centerx+gapShape) + ',' + symbolSize;			
	return length !== 1 
		? shape + 'L' + gapShape + ',0' + getMiddleLine(centerx, width) + 'Z'
		: shape + 'Z';
};

//TODO: gap and check the bar
Feature.wave = function(width, height, length) {
	var r = Math.sqrt(symbolSize / Math.PI);
	var shape = 'M' + -(symbolSize/2) + ',' + (symbolSize/3)
		    + "A" + r + "," + r + " 0 1,1 0," + symbolSize/3
		    + "A" + r + "," + r + " 0 1,0 " + (symbolSize/2) + ',' + symbolSize/3;
    return length !== 1 
		? shape + getMiddleLine(r, width) + 'Z'
		: shape + 'Z';
};

var getPolygon = function(N, width, length){
	var r = symbolSize/2;
	var polygon = 'M ';
	for(var i=0; i < N;i++) {
		polygon += (r * Math.cos(2*Math.PI*i/N) + gapShape) + ',' + (r * Math.sin(2*Math.PI*i/N)+r)  + ' ';
	};
	return length !== 1 
		? polygon + ' ' + (r * Math.cos(0) + gapShape) + ',' + (r * Math.sin(0)+r)  + ' ' + getMiddleLine(r, width) + 'Z'
		: polygon + 'Z';	
};

Feature.hexagon = function(width, height, length) {
	return getPolygon(6, width, length);
};

Feature.pentagon = function(width, height, length) {
	return getPolygon(5, width, length);
};

//TODO gap and bar
Feature.circle = function() {
  var r = Math.sqrt(symbolSize / Math.PI);
  var centerx = symbolSize/2;
  return "M" + gapShape + ",0"
      + "A" + r + "," + r + " 0 1,1 0," + symbolSize
      + "A" + r + "," + r + " 0 1,1 0,0"
      + "Z";
};

Feature.arrow = function(width, height, length) {
	var step = symbolSize/10;	
	var shape = 'M' + gapShape + ',0'
		+ 'L' + (-step+gapShape) + ',0'
		+ 'L' + (-5*step+gapShape) + ',' + (4*step)
		+ 'L' + (-step+gapShape) + ',' + height
		+ 'L' + gapShape + ',' + height
		+ 'L' + (4*step+gapShape) + ',' + (4*step);
	return length !== 1 
		? shape + 'L' + gapShape + ',0' + getMiddleLine(symbolSize/2, width) + 'Z'
		: shape + 'Z';
};

Feature.doubleBar = function(width, height, length) {
	var centerx = symbolSize/2;	
	var shape = 'M' + gapShape + ',0'
		+ 'L' + (-centerx+gapShape) + ',' + symbolSize
		+ 'L' + gapShape + ',' + symbolSize
		+ 'L' + (centerx+gapShape) + ',0';
	return length !== 1 
		? shape + 'L' + gapShape + ',0' + getMiddleLine(symbolSize/2, width) + 'Z'
		: shape + 'Z';
};

Feature.variant = function() {
	//TODO
};

module.exports = FeatureFactory;