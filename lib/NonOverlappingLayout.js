/*jslint node: true */
/*jshint laxbreak: true */
'use strict';

var _ = require('underscore');

var NonOverlappingLayout = function(features, totalHeight) {
    var nonOverlappingLayout = this,
        rows = [],
        rowHeight = 0,
        padding = 1,
        minHeight = 15;

    nonOverlappingLayout.totalHeight = totalHeight;

    var Row = function() {
        var row = this;

        row.rowFeatures = [];

        row.containsOverlap = function(feature) {
            return _.some(row.rowFeatures, function(d) {
                var ftEnd = (feature.end) ? feature.end : feature.begin;
                var dEnd = (d.end) ? d.end : d.begin;
                return (((Number(feature.begin) >= Number(d.begin) && Number(feature.begin) <= Number(dEnd))
                        || (Number(ftEnd) >= Number(d.begin) && Number(ftEnd) <= Number(dEnd))
                     ) ||
                    ((Number(d.begin) >= Number(feature.begin) && Number(d.begin) <= Number(ftEnd))
                      || (Number(dEnd) >= Number(feature.begin) && Number(dEnd) <= Number(ftEnd)))
                    );
            });
        };

        row.addFeature = function(feature) {
            row.rowFeatures.push(feature);
        };
    };

    nonOverlappingLayout.calculate = function(){
        rowHeight = ((nonOverlappingLayout.totalHeight /rows.length < minHeight)? nonOverlappingLayout.totalHeight /rows.length : minHeight ) - 2 * padding;
    };

    nonOverlappingLayout.getYPos = function(feature) {
        var yPos,
            yOffset = (nonOverlappingLayout.totalHeight /rows.length > minHeight) ? (nonOverlappingLayout.totalHeight - (rows.length*minHeight))/2 : 0;
        _.each(rows, function(row, i) {
            _.each(row.rowFeatures, function(currFeature){
                if(currFeature === feature) {
                    yPos = (i * (rowHeight + 2*padding)
                        + yOffset);
                }
            });
        });
        return yPos;
    };

    nonOverlappingLayout.getRows = function() {
        return rows;
    };

    nonOverlappingLayout.getFeatureHeight = function() {
        return rowHeight;
    };

    _.each(features, function(feature){
        var added = _.some(rows, function(row){
            if(!row.containsOverlap(feature)) {
                row.addFeature(feature);
                return true;
            }
        });
        if(!added) {
            var row = new Row();
            row.addFeature(feature);
            rows.push(row);
        }
    });
};

module.exports = NonOverlappingLayout;