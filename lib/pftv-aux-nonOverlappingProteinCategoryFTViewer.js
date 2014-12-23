var _ = require("underscore");
var d3 = require("d3");
var FTVUtils = require("./pftv-aux-utils");
/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

/**
 @class pftv-aux-nonOverlappingProteinCategoryFTViewer
 */
var NonOverlappingProteinCategoryFTViewer;

module.exports = NonOverlappingProteinCategoryFTViewer = function(){};
/**********
 * Private zone
 **********/
/* ----------
 * Private variables.
 * ---------- */
/* ----------
 * Private methods.
 * ---------- */
/**
 * Organize features belonging to one type in non-overlapping tracks
 * @param type
 * @param features
 * @private
 */
var
    /**
     * Organize features belonging to one type in non-overlapping tracks.
     * @param type Type containing locations with all features.
     * @param location Containing all features.
     * @param categoryViewer The actual viewer displaying the features.
     * @private
     */
    _organizeTracks = function(type, locations, categoryViewer) {
        var tracks = new Array();
        var trackShapes = new Array();
        var gap = 0;//3
        _.each(locations, function(location) {
            var features = location.features;
            _.each(features, function(feature) {
                var found = false;
                var start = FTVUtils.getStart(feature);
                var end = FTVUtils.getEnd(feature);
                if (feature.xLine !== undefined) {//is a shape
                    for (var j = 0; j < trackShapes.length; j++) {
                        var overlapping = false;
                        for (var m = 0; m < trackShapes[j].length; m++) {
                            var trackStart = FTVUtils.getStart(trackShapes[j][m]);
                            var trackEnd = FTVUtils.getEnd(trackShapes[j][m]);
                            if ( ((start-gap) < trackStart) && ((end+gap) <= trackStart) ) { //starts and ends before
                                overlapping = false;
                            } else if ((start-gap) >= trackEnd) { //starts after
                                overlapping = false;
                            } else {
                                overlapping = true;
                                break;
                            }
                        }
                        if (!overlapping) {//console.log('tracks j ' + j);
                            feature.track = j;
                            trackShapes[j][trackShapes[j].length] = feature;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {//console.log('tracks.length ' + tracks.length);
                        feature.track = trackShapes.length;
                        trackShapes[trackShapes.length] = new Array(feature);
                    }
                } else {//is a rectangle or bridge
                    for (var j = 0; j < tracks.length; j++) {
                        var overlapping = false;
                        for (var m = 0; m < tracks[j].length; m++) {
                            var trackStart = FTVUtils.getStart(tracks[j][m]);
                            var trackEnd = FTVUtils.getEnd(tracks[j][m]);
                            if (start === end) {
                                if ( (start < trackStart) && (end < trackEnd) ) { //starts and ends before
                                    overlapping = false;
                                } else if (start > trackEnd) { //starts after
                                    overlapping = false;
                                } else {
                                    overlapping = true;
                                    break;
                                }
                            } else {
                                if ( (start < trackStart) && (end <= trackStart) ){ //starts and ends before
                                    overlapping = false;
                                } else if ( (start >= trackEnd) && (end > trackStart )) {
                                    overlapping = false;
                                } else {
                                    overlapping = true;
                                    break;
                                }
                            }
                        }
                        if (!overlapping) {//console.log('tracks j ' + j);
                            feature.track = j;
                            tracks[j][tracks[j].length] = feature;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {//console.log('tracks.length ' + tracks.length);
                        feature.track = tracks.length;
                        tracks[tracks.length] = new Array(feature);
                    }
                }
            });
        });

        type.numberTracks = Math.max(tracks.length, trackShapes.length);

        if (trackShapes.length !== 0) {//shapes
            type.baseHeight = categoryViewer.opt.ftHeight + categoryViewer._gapToShape + FTVUtils.getMaxShapeSize();
        } else {//rectangles
            if (categoryViewer.categoryContains(FTVUtils.getFTLocation().bridge)) {
                type.baseHeight = categoryViewer._gapToBridge + categoryViewer.opt.ftHeight;
            } else {
                if (type.numberTracks != 1) {
                    categoryViewer._svgBottomGap = -FTVUtils.getTitlesPadding();
                    categoryViewer._featureSVGGroup.attr("transform", "translate(0," + categoryViewer._svgBottomGap + ")");
                    type.baseHeight = categoryViewer.opt.ftHeight;
                } else {
                    type.baseHeight = categoryViewer.opt.ftHeight;
                }
            }
        }
    }
;
/**********
 * Public zone
 **********/
/* ----------
 * Public variables.
 * ---------- */
/* ----------
 * Public methods
 * ---------- */
//*****
/**
 * Some additional painting to that already done by the category painter.
 * @param categoryViewer Viewer that actually takes care of category features display.
 * */
NonOverlappingProteinCategoryFTViewer.paintFeatures = function(categoryViewer) {
    var types = FTVUtils.getTrackTypes(categoryViewer.opt.category);
    _.each(types, function(type) {
        var hasShapes = false;
        var typeClass = FTVUtils.ftTypeToClass(type.type);
        if (categoryViewer._stylingOpt._tracksCalculated !== true) {
            _organizeTracks(type, type.locations, categoryViewer);
        }
        if (type.numberTracks !== 1) {
            var height = (type.numberTracks * (type.baseHeight)) + 7;//+4
            var titleHeight = FTVUtils.getTrackMode(categoryViewer.opt.category) === "category"
                ? FTVUtils.calculateTextHeightDIV(FTVUtils.getTrackTitle(categoryViewer.opt.category), FTVUtils.ID_CLASS_PREFIX + "categoryTitle", FTVUtils.getTitlesWidth(false))
                : FTVUtils.calculateTextHeightDIV(FTVUtils.getTrackTitle(categoryViewer.opt.category), FTVUtils.ID_CLASS_PREFIX + "categoryTitleNoCollapsible", FTVUtils.getTitlesWidth(false));
            var titleNeededHeight = Math.max(FTVUtils.getMinimumTitlesHeight(), titleHeight);
            if (height < titleNeededHeight) {
                height = titleNeededHeight;
            }
            var innerDivCategory = d3.select("#" + categoryViewer.opt.target + " div." + FTVUtils.ID_CLASS_PREFIX + "category")
                .style("height", (height+4) + "px"); //+4
            innerDivCategory.selectAll("div").style("height", (height+2-FTVUtils.getTitlesPadding()*2) + "px");
            innerDivCategory.selectAll("div." + FTVUtils.ID_CLASS_PREFIX + "categoryFeatures").style("height", (height+2) + "px");
            categoryViewer._featureSVG.attr("height", height);
        }
        _.each(type.locations, function(location) {
            var locationType = FTVUtils.ftTypeToClass(location.locationType);
            categoryViewer._featureSVGGroup.selectAll("#" + categoryViewer.opt.target + " path." + typeClass + "." + locationType)
                .attr("d", function (feature) {
                    if (feature.color == undefined) {
                        feature.color = d3.select(this).style("fill");
                    }
                    categoryViewer.calculatePosition(location.locationType, feature);
                    return FTVUtils.getShape(location.locationType, feature, categoryViewer._pixelPerAA, categoryViewer.opt.useShapes, typeClass);
                })
                .attr("transform", function(feature) {
                    //only rectangles and bridges can be relocated by transformation
                    if (FTVUtils.equalsNoCase(location.locationType, FTVUtils.getFTLocation().continuous)) {
                        return ("translate (0, " + (feature.track * type.baseHeight) + ")");
                    } else if (FTVUtils.equalsNoCase(location.locationType, FTVUtils.getFTLocation().bridge)) {
                        return ("translate (0, " + (feature.track * type.baseHeight) + ")");
                    } else {
                        hasShapes = true;
                        return ("translate (0, " + (feature.track * (FTVUtils.getMaxPixelAA()+1)) + ")");
                        //return ("translate (0, 0)");   //TODO what if we have shapes exactly in the same position?
                    }
                })
            ;
        });
    });
    categoryViewer._stylingOpt._tracksCalculated = true;
};
