/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var ViewerHelper = require("./ViewerHelper");
var Constants = require("./Constants");

var BasicViewer = function(catTitle, features, container, fv) {
    var basicViewer = this;
    basicViewer.height = 40;
    var width = fv.width;

    basicViewer.layout = new NonOverlappingLayout(features, basicViewer.height);
    basicViewer.layout.calculate();

    var featurePlot = function() {
        var series,
            shapes;

        var featurePlot = function(selection) {
            selection.each(function(data) {
                series = d3.select(this);
                shapes = series.selectAll('.up_pftv_feature')
                    .data(data);

                shapes.enter().append('path')
                    .attr('name', function(d, index) {
                        d.internalId = d.internalId === undefined ? catTitle + '_' + index : d.internalId;
                        return d.internalId;
                    })
                    .attr('class',function(d) {
                        return 'up_pftv_feature up_pftv_' + d.type.toLowerCase();
                    })
                    .filter(function(d) {
                        return d.color || Constants.getTrackInfo(d.type).color;
                    })
                    .style('fill', function(d) {
                        return d.color ? d.color
                            : Constants.getTrackInfo(d.type).color ? Constants.getTrackInfo(d.type).color
                            : 'black';
                    })
                    .style('stroke', function(d) {
                        return d.color ? d.color
                            : Constants.getTrackInfo(d.type).color ? Constants.getTrackInfo(d.type).color
                            : 'black';
                    })
                ;

                shapes
                    .attr('d', function(d) {
                        return FeatureFactory.getFeature(
                            d.type,
                            fv.xScale(2) - fv.xScale(1),
                            basicViewer.layout.getFeatureHeight(),
                            (d.end) ? d.end - d.begin + 1 : 1);
                    })
                    .attr('transform',function(d) {
                        return 'translate('+fv.xScale(d.begin)+ ',' + basicViewer.layout.getYPos(d) + ')';
                    })
                ;
                ViewerHelper.addEventsClassAndTitle(catTitle, shapes, fv, container);
                shapes.exit().remove();
            });
        };
        return featurePlot;
    };

    var series = featurePlot();
    var svg = ViewerHelper.createSVG(container, width, basicViewer.height, fv);

    var drawArea = svg.append('g')
        .classed('up_pftv_category-viewer-group', true);

    var dataSeries = drawArea
        .datum(features)
        .call(series);

    this.update = function() {
        dataSeries.call(series);
        ViewerHelper.updateHighlight(fv);
    };

    this.updateData = function(data) {
        var basicViewer = this;
        basicViewer.layout = new NonOverlappingLayout(data, basicViewer.height);
        basicViewer.layout.calculate();
        dataSeries.datum(data);
        this.update();
    };

    return this;
};

module.exports = BasicViewer;
