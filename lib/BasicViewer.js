"use strict";

var d3 = require("d3");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var TooltipFactory = require("./TooltipFactory");

var BasicViewer = function(features, container, fv, width) {
    var basicViewer = this;

    var height = 40;

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
                        return 'up_pftv_feature up_pftv_' + d.type.name.toLowerCase();
                    })
                    .classed('up_pftv_activeFeature', function(d) {
                        return d === fv.selectedFeature;
                    })
                    .on('click', function(d){
                        TooltipFactory.createTooltip(d, fv.sequence, container);
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

    var shadowG = svg.append('g').append('rect')
        .classed('up_pftv_shadow', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', height)
        .attr('width', 0);

    var drawArea = svg.append('g')
        .classed('up_pftv_category-viewer-group', true);
    var dataSeries = drawArea
        .datum(features)
        .call(series);

    var updateShadow = function(feature, elem) {
        var selectedElem = d3.select(elem);
        var aaWidth = fv.xScale(2) - fv.xScale(1);
        var width = aaWidth * (feature.end ? feature.end - feature.begin + 1 : 1);
        var gapRegion = aaWidth/2;
        var transform = selectedElem.attr('transform');
        transform = transform.substring(0, transform.indexOf(','));
        d3.selectAll('.up_pftv_shadow')
            .attr('x', -(gapRegion))
            .attr('width', width)
            .attr('transform', transform + ',0)');
    };

    this.update = function() {
        dataSeries.call(series);
        if (fv.selectedFeature) {
            updateShadow(fv.selectedFeature, fv.selectedFeatureElement);
        }
    };

    this.selectFeature = function(feature, elem) {
        var selectedElem = d3.select(elem);
        if (feature === fv.selectedFeature) {
            fv.selectedFeature = undefined;
            fv.selectedFeatureElement = undefined;
            d3.selectAll('.up_pftv_shadow')
                .attr('x', 0)
                .attr('width', 0)
                .attr('transform', 'translate(0,0)');
        } else {
            fv.selectedFeature = feature;
            fv.selectedFeatureElement = elem;
            updateShadow(feature, elem);
        }
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