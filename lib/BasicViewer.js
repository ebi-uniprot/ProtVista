"use strict";

var d3 = require("d3");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var TooltipFactory = require("./TooltipFactory");

var BasicViewer = function(features, container, fv, width, height, clip) {
    var basicViewer = this;

    var layout = new NonOverlappingLayout(features, height);
    layout.calculate();

    var featurePlot = function() {
        var series,
            shapes;

        var featurePlot = function(selection) {
            selection.each(function(data) {
                series = d3.select(this);
                shapes = series.selectAll('.feature')
                    .data(data);

                shapes.enter().append('path')
                    .append('title')
                    .text( function(d){
                        return (d.type.label.toUpperCase())
                            + ', Position ' + d.begin + (d.end ? ' - ' + d.end : '');
                    });

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
                        return 'feature up_pftv_' + d.type.name.toLowerCase();
                    })
                    .classed('up_pftv_activeFeature', function(d) {
                        return d === fv.selectedFeature;
                    })
                    .on('click', function(d){
                        TooltipFactory.createTooltip(d, fv.sequence);
                        basicViewer.selectFeature(d, this);
                    });

                shapes.exit().remove();
            });
        };
        return featurePlot;
    };


    var series = featurePlot();

    var svg = container
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(fv.zoom);

    var drawArea = svg.append('g')
        .attr('clip-path','url(#' + clip + ')');
    var dataSeries = drawArea
        .datum(features)
        .call(series);

    this.update = function() {
        dataSeries.call(series);
    };

    this.selectFeature = function(feature, elem) {
        var selectedElem = d3.select(elem);
        fv.selectedFeature = (feature === fv.selectedFeature) ? undefined : feature;
        var selectedPath = selectedElem.classed('up_pftv_activeFeature');
        d3.selectAll('svg path.up_pftv_activeFeature').classed('up_pftv_activeFeature', false);
        var clazz = selectedElem.attr('class'); //it is not active anymore
        selectedElem.classed('up_pftv_activeFeature', !selectedPath);
        fv.aaViewer.selectFeature(clazz);
        fv.dispatcher.featureSelected({feature: fv.selectedFeature, color: selectedElem.style("fill")});
    };

    return this;
};

module.exports = BasicViewer;