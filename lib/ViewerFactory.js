/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var TooltipFactory = require("./TooltipFactory");

var ViewerFactory = function() {
    var mousedownXY = {x: -1, y: -1}, mouseupXY = {x: -2, y: -2};
    return {
        createSVG: function(container, width, height, fv, clazz) {
            var svg = container
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .on('mousedown', function() {
                    mousedownXY = {x: d3.event.pageX, y: d3.event.pageY};
                    mouseupXY = {x: -2, y: -2};
                })
                .on('mouseup', function() {
                    mouseupXY = {x: d3.event.pageX, y: d3.event.pageY};
                    if ((mousedownXY.x === mouseupXY.x) && (mousedownXY.y === mouseupXY.y)
                        && !fv.overFeature && fv.selectedFeature ) {
                        ViewerFactory.selectFeature(fv.selectedFeature, fv.selectedFeatureElement, fv);
                    }
                    mousedownXY = {x: -1, y: -1};
                })
                .call(fv.zoom);

            if (clazz) {
                svg.attr('class', clazz);
            }
            svg.append('g').append('rect')
                .classed('up_pftv_shadow', true)
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', height)
                .attr('width', 0);

            return svg;
        }
    };
}();

ViewerFactory.updateShadow = function(feature, fv) {
    var aaWidth = fv.xScale(2) - fv.xScale(1);
    var width = aaWidth * (feature.end ? feature.end - feature.begin + 1 : 1);
    var gapRegion = aaWidth/2;
    var xTranslate = fv.xScale(feature.begin);
    d3.selectAll('.up_pftv_shadow')
        .attr('x', -(gapRegion))
        .attr('width', width)
        .attr('transform', 'translate(' + xTranslate + ',0)');
};

ViewerFactory.selectFeature = function(feature, elem, fv) {
    var selectedElem = d3.select(elem);
    var previousSelection = {feature: fv.selectedFeature, elem: fv.selectedFeatureElement};
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
        this.updateShadow(feature, fv);
    }
    var selectedPath = selectedElem.classed('up_pftv_activeFeature');
    d3.selectAll('svg path.up_pftv_activeFeature').classed('up_pftv_activeFeature', false);
    //it is not active anymore
    selectedElem.classed('up_pftv_activeFeature', !selectedPath);
    fv.updateFeatureSelector();
    if (previousSelection.feature) {
        fv.dispatcher.featureDeselected(
            {feature: previousSelection.feature, color: d3.select(previousSelection.elem).style("fill")}
        );
    }
    if (feature !== previousSelection.feature) {
        fv.dispatcher.featureSelected({feature: fv.selectedFeature, color: selectedElem.style("fill")});
    }
};

ViewerFactory.addEventsClassAndTitle = function(elements, fv, container) {
    elements
        .classed('up_pftv_activeFeature', function(d) {
            return d === fv.selectedFeature;
        })
        .on('click', function(d){
            TooltipFactory.createTooltip(d, fv.sequence, container);
            ViewerFactory.selectFeature(d, this, fv);
        })
        .on('mouseover', function() {
            fv.overFeature = true;
        })
        .on('mouseout', function() {
            fv.overFeature = false;
        });
    elements.selectAll('title')
        .data(function(d) {
            return [d]
        }).enter()
        .append('title')
            .text(function(d){
                var text = d.type.label.toUpperCase();
                text += ', Position: ' + d.begin + (d.end ? ' - ' + d.end : '');
                return (text);
            })
    ;
};

module.exports = ViewerFactory;