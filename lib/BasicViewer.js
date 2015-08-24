/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var ViewerFactory = require("./ViewerFactory");

var BasicViewer = function(features, container, fv) {
    var height = 40;
    var width = fv.width;

    var layout = new NonOverlappingLayout(features, height);
    layout.calculate();

    var featurePlot = function() {
        var series,
            shapes;

        var featurePlot = function(selection) {
            selection.each(function(data) {
                series = d3.select(this);
                shapes = series.selectAll('.up_pftv_feature')
                    .data(data);

                shapes.enter().append('path');

                shapes
                    .attr('d', function(d) {
                        return FeatureFactory.getFeature(
                            d.type.name,
                            fv.xScale(2) - fv.xScale(1),
                            layout.getFeatureHeight(),
                            (d.end) ? d.end - d.begin + 1 : 1);
                    })
                    .attr('name', function(d) {
                        return d.internalId;
                    })
                    .attr('transform',function(d) {
                        return 'translate('+fv.xScale(d.begin)+ ',' + layout.getYPos(d) + ')';
                    })
                    .attr('class',function(d) {
                        return 'up_pftv_feature up_pftv_' + d.type.name.toLowerCase();
                    })
                ;
                ViewerFactory.addEventsClassAndTitle(shapes, fv, container);
                shapes.exit().remove();
            });
        };
        return featurePlot;
    };


    var series = featurePlot();
    var svg = ViewerFactory.createSVG(container, width, height, fv);

    var drawArea = svg.append('g')
        .classed('up_pftv_category-viewer-group', true);

    var dataSeries = drawArea
        .datum(features)
        .call(series);

    this.update = function() {
        dataSeries.call(series);
        if (fv.selectedFeature) {
            ViewerFactory.updateShadow(fv.selectedFeature, fv);
        }
    };

    return this;
};

module.exports = BasicViewer;