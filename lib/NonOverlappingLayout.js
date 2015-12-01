/*jslint node: true */
/*jshint laxbreak: true */
'use strict';

var _ = require('underscore');

var Row = function() {
    var row = this;
    row.rowFeatures = [];

    row.featureOverlap = function(feature, d, ftEnd, dEnd) {
        var featureBeginOverlap = (Number(feature.begin) >= Number(d.begin)) &&
            (Number(feature.begin) <= Number(dEnd));
        var featureEndOverlap = (Number(ftEnd) >= Number(d.begin)) && (Number(ftEnd) <= Number(dEnd));
        return featureBeginOverlap || featureEndOverlap;
    };

    row.dOverlap = function(feature, d, ftEnd, dEnd) {
        var dBeginOverlap = (Number(d.begin) >= Number(feature.begin)) && (Number(d.begin) <= Number(ftEnd));
        var dEndOverlap = (Number(dEnd) >= Number(feature.begin)) && (Number(dEnd) <= Number(ftEnd));
        return dBeginOverlap || dEndOverlap;
    };

    row.containsOverlap = function(feature) {
        return _.some(row.rowFeatures, function(d) {
            var ftEnd = (feature.end) ? feature.end : feature.begin;
            var dEnd = (d.end) ? d.end : d.begin;
            return row.featureOverlap(feature, d, ftEnd, dEnd) || row.dOverlap(feature, d, ftEnd, dEnd);
        });
    };

    row.addFeature = function(feature) {
        row.rowFeatures.push(feature);
    };
};

var NonOverlappingLayout = function(features, totalHeight) {
    var nonOverlappingLayout = this;
    nonOverlappingLayout.padding = 1;
    nonOverlappingLayout.minHeight = 15;
    nonOverlappingLayout.rowHeight = 0;
    nonOverlappingLayout.rows = [];

    nonOverlappingLayout.totalHeight = totalHeight;

    nonOverlappingLayout.calculate = function(){
        nonOverlappingLayout.rowHeight = (
            (nonOverlappingLayout.totalHeight / nonOverlappingLayout.rows.length < nonOverlappingLayout.minHeight)
            ? nonOverlappingLayout.totalHeight /nonOverlappingLayout.rows.length : nonOverlappingLayout.minHeight )
            - 2 * nonOverlappingLayout.padding;
    };

    _.each(features, function(feature){
        var added = _.some(nonOverlappingLayout.rows, function(row){
            if(!row.containsOverlap(feature)) {
                row.addFeature(feature);
                return true;
            }
        });
        if(!added) {
            var row = new Row();
            row.addFeature(feature);
            nonOverlappingLayout.rows.push(row);
        }
    });
};

NonOverlappingLayout.prototype.getYPos = function(feature) {
    var nonOverlappingLayout = this;
    var yPos,
        yOffset = (nonOverlappingLayout.totalHeight /nonOverlappingLayout.rows.length > nonOverlappingLayout.minHeight)
            ? (nonOverlappingLayout.totalHeight - (nonOverlappingLayout.rows.length * nonOverlappingLayout.minHeight))/2
            : 0;
    _.each(nonOverlappingLayout.rows, function(row, i) {
        _.each(row.rowFeatures, function(currFeature){
            if(currFeature === feature) {
                yPos = (i * (nonOverlappingLayout.rowHeight + 2 * nonOverlappingLayout.padding)
                + yOffset);
            }
        });
    });
    return yPos;
};

NonOverlappingLayout.prototype.getRows = function() {
    return this.rows;
};

NonOverlappingLayout.prototype.getFeatureHeight = function() {
    return this.rowHeight;
};

module.exports = NonOverlappingLayout;