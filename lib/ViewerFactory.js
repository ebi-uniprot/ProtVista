/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var TooltipFactory = require("./TooltipFactory");
var FeatureFactory = require("./FeatureFactory");

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
            svg.append('g').append('path')
                .classed('up_pftv_shadow', true)
                .attr('d', 'M-1,-1')
                .attr('transform', 'translate(-1,-1)')
                .attr('height', height);

            return svg;
        }
    };
}();

ViewerFactory.shadowPath = function (feature, fv, height) {
    var aaWidth = fv.xScale(2) - fv.xScale(1);
    var gapRegion = aaWidth/2;
    var width = aaWidth * (feature.end ? feature.end - feature.begin + 1 : 1);
    var path;
    if (!feature.type) {
        path = 'M-1,-1';
    } else if (FeatureFactory.isContinuous(feature.type.name)) {
        path = 'M' + -(gapRegion) + ',0'
            + 'L' + (-gapRegion+width) + ',0'
            + 'L' + (-gapRegion+width) + ',' + height
            + 'L' + -(gapRegion) + ',' + height
            + 'Z';
    } else {
        path = 'M' + -(gapRegion) + ',0'
            + 'L' + (-gapRegion+width) + ',0'
            + 'L' + (-gapRegion+width) + ',' + height
            + 'L' + (-gapRegion+width-aaWidth) + ',' + height
            + 'L' + (-gapRegion+width-aaWidth) + ',0'
            + 'L' + (-gapRegion+aaWidth) + ',0'
            + 'L' + (-gapRegion+aaWidth) + ',' + height
            + 'L' + (-gapRegion) + ',' + height
            + 'Z';
    }
    return path;
};

ViewerFactory.updateShadow = function(feature, fv) {
    var xTranslate = fv.xScale(feature.begin);
    d3.selectAll('.up_pftv_shadow')
        .attr('d', function() {
            var height = d3.select(this).attr('height');
            return ViewerFactory.shadowPath(feature, fv, height);
        })
        .attr('transform', 'translate(' + xTranslate + ',0)');
};

ViewerFactory.selectFeature = function(feature, elem, fv) {
    var selectedElem = d3.select(elem);
    var previousSelection = {feature: fv.selectedFeature, elem: fv.selectedFeatureElement};
    if (feature === fv.selectedFeature) {
        fv.selectedFeature = undefined;
        fv.selectedFeatureElement = undefined;
        d3.selectAll('.up_pftv_shadow')
            .attr('d', 'M-1,-1')
            .attr('transform', 'translate(-1,-1)');
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
        if (previousSelection.elem) {
            d3.select(previousSelection.elem).classed('up_pftv_activeFeature', false);
        }
        fv.dispatcher.featureSelected({feature: fv.selectedFeature, color: selectedElem.style("fill")});
    }
};

ViewerFactory.addEventsClassAndTitle = function(elements, fv, container) {
    elements
        .classed('up_pftv_activeFeature', function(d) {
            return d === fv.selectedFeature;
        })
        .on('click', function(d){
            TooltipFactory.createTooltip(fv, d, container);
            ViewerFactory.selectFeature(d, this, fv);
        })
        .on('mouseover', function() {
            fv.overFeature = true;
        })
        .on('mouseout', function() {
            fv.overFeature = false;
        });
};

module.exports = ViewerFactory;