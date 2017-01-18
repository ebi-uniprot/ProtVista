/*jslint node: true */
/*jshint laxbreak: true */
'use strict';

var d3 = require('d3');
var _ = require('underscore');

var symbolSize = 10,
    gapRegion = 0,
    gapShape = 0,
    dictionary = {
        //molecular processing
        chain:'rectangle',
        transit: 'rectangle',
        init_met: "arrow",
        propep: 'rectangle',
        peptide:'rectangle',
        signal:'rectangle',
        //structural
        helix:'rectangle',
        strand:'rectangle',
        turn:'rectangle',
        //domains & sites
        region:'rectangle',
        coiled: 'rectangle',
        motif:'rectangle',
        repeat:'rectangle',
        ca_bind:'rectangle',
        dna_bind: 'rectangle',
        domain:'rectangle',
        zn_fing: 'rectangle',
        np_bind: 'rectangle',
        metal: "diamond",
        site: "chevron",
        binding: "catFace",
        act_site: "circle",
        //ptms
        mod_res: "triangle",
        lipid: "wave",
        carbohyd: "hexagon",
        disulfid:'bridge',
        crosslnk:'bridge',
        //seqInfo
        compbias:'rectangle',
        conflict:'rectangle',
        non_cons: "doubleBar",
        non_ter: "doubleBar",
        unsure: 'rectangle',
        non_std: "pentagon",
        //mutagenesis
        mutagen:'rectangle',
        //topology
        topo_dom:'rectangle',
        transmem:'rectangle',
        intramem:'rectangle',
        //variants
        var_seq:'variant',
        variant:'variant',
        missense:'variant',//CHECK
        ms_del:'variant',//CHECK
        insdel:'variant',//CHECK
        stop_lost:'variant',//CHECK
        stop_gained:'variant',//CHECK
        init_codon:'variant',//CHECK
        //proteomics
        unique:'rectangle',
        non_unique:'rectangle'
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
            gapShape = length === 1 ? 0 : width/length/2;
            //again a gap is needed for regions
            gapRegion = aaWidth/2;
            // if the constructor doesn't exist, rectangle is used by default
            if (typeof Feature[featureType] !== 'function') {
                featureType = 'rectangle';
            }

            Feature[featureType].prototype = new Feature();
            feature = Feature[featureType](width, height, length);

            return feature;
        },
        isContinuous: function(type) {
            type = type.toLowerCase();
            if ((type === 'disulfid') || (type === 'crosslnk')) {
                return false;
            }
            return true;
        }
    };
}();

Feature.rectangle = function(width, height) {
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

var getMiddleLine = function(centerx, width) {
    return 'M' + (centerx+gapShape) + ',' + centerx
            + 'L' + (width/2+gapShape) + ',' + centerx
            + 'M' + (-centerx+gapShape) + ',' + centerx
            + 'L' + (-width/2+gapShape) + ',' + centerx;
};

Feature.diamond = function(width, height, length) {
    var centerx = symbolSize/2;
    var shape = 'M' + gapShape + ',0'
            + 'L' + (centerx+gapShape) + ',' + centerx
            + 'L' + gapShape + ',' + symbolSize
            + 'L' + (-centerx+gapShape) + ',' + centerx;
    return length !== 1
        ? shape + 'L' + gapShape + ',0Z' + getMiddleLine(centerx, width)
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

Feature.wave = function(width, height, length) {
    var rx = symbolSize/4;
    var ry = symbolSize/2;
    var shape = 'M' + (-symbolSize/2+gapShape) + ',' + ry
            + "A" + rx + "," + ry + " 0 1,1 " + gapShape + "," + ry
            + "A" + rx + "," + ry + " 0 1,0 " + (symbolSize/2+gapShape) + ',' + ry;
    return length !== 1
        ? shape + getMiddleLine(ry, width) + 'Z'
        : shape + 'Z';
};

var getPolygon = function(N, width, length){
    var r = symbolSize/2;
    var polygon = 'M ';
    for(var i=0; i < N;i++) {
        polygon += (r * Math.cos(2*Math.PI*i/N) + gapShape) + ',' + (r * Math.sin(2*Math.PI*i/N)+r)  + ' ';
    }
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

Feature.circle = function(width, height, length) {
  var r = Math.sqrt(symbolSize / Math.PI);
  var shape = "M" + gapShape + ",0"
      + "A" + r + "," + r + " 0 1,1 " + gapShape + "," + symbolSize
      + "A" + r + "," + r + " 0 1,1 " + gapShape + ",0";
  return length !== 1
        ? shape + getMiddleLine(symbolSize/2, width) + 'Z'
        : shape + 'Z';
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

};

module.exports = FeatureFactory;
