/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var TooltipFactory = require("./TooltipFactory");

var ViewerFactory = function() {
    return {
        createSVG: function(container, width, height, fv, clazz) {
            var svg = container
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .on('click', function() {
                    if (!fv.overFeature) {
                        if (fv.selectedFeature ) {
                            ViewerFactory.selectFeature(fv.selectedFeature, fv.selectedFeatureElement, fv);
                        }
                    }
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
    var clazz = selectedElem.attr('class');
    selectedElem.classed('up_pftv_activeFeature', !selectedPath);
    fv.aaViewer.selectFeature(clazz);//TODO this should be moved to a selectFeature in FeaturesViewer.js
    fv.aaViewer2.selectFeature(clazz);
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
        })
        .append('title')
            .text( function(d){
                var text = d.type.label.toUpperCase();
                text += (d.description ? ', \nDescription: ' + d.description : '');
                text += ', \nPosition: ' + d.begin + (d.end ? ' - ' + d.end : '');
                if (d.alternativeSequence) {
                    var original = fv.sequence.substring(+d.begin - 1, +d.begin - 1 + d.alternativeSequence.length);
                    text += ', \nConflict: ' +  original + ' > ' + d.alternativeSequence;
                }
                if (d.mutation) {
                    var original = fv.sequence.substring(+d.begin - 1, +d.begin - 1 + d.mutation.length);
                    text += ', \nMutation: ' +  original + ' > ' + d.mutation;
                }
                return (text);
            })
    ;
};

ViewerFactory.getManualFeatures = function(evidenceMapping, variations) {
    var manual = _.map(variations, function(variation) {
        if (variation.variants.length === 0) {
            return variation;
        } else {
            var manualFT = _.filter(variation.variants, function(feature) {
                if (feature.sp === true) {
                    return true;
                } else {
                    return _.intersection(evidenceMapping.manual, _.pluck(feature.evidences, 'code')).length != 0;
                }
            });
            return _.extend({}, {
                internalId: variation.internalId,
                normal: variation.normal,
                pos: variation.pos,
                type: variation.type,
                variants: manualFT
            });
        }
    });
    return manual;
};

ViewerFactory.getAutomaticFeatures = function(evidenceMapping, variations) {
    var auto = _.map(variations, function(variation) {
        if (variation.variants.length === 0) {
            return variation;
        } else {
            var autoFT = _.filter(variation.variants, function(feature) {
                return _.intersection(evidenceMapping.automatic, _.pluck(feature.evidences, 'code')).length != 0;
            });
            return _.extend({}, {
                internalId: variation.internalId,
                normal: variation.normal,
                pos: variation.pos,
                type: variation.type,
                variants: autoFT
            });
        }
    });
    return auto;
};

module.exports = ViewerFactory;