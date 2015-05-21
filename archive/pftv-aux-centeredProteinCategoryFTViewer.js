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
 @class pftv-aux-centeredProteinCategoryFTViewer
 */
var CenteredProteinCategoryFTViewer;
 
module.exports = CenteredProteinCategoryFTViewer = function(){};
/**********
 * Private zone
 **********/
/* ----------
 * Private variables.
 * ---------- */
/* ----------
 * Private methods.
 * ---------- */
 
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
CenteredProteinCategoryFTViewer.paintFeatures = function(categoryViewer) {
    var types = FTVUtils.getTrackTypes(categoryViewer.opt.category);
    _.each(types, function(type) {
        var typeClass = FTVUtils.stringToClass(type.type);
        _.each(type.locations, function(location) {
            var locationType = FTVUtils.stringToClass(location.locationType);
            categoryViewer._featureSVGGroup.selectAll("path." + typeClass + "." + locationType)
                .attr("d", function (feature) {
                    if (feature.color == undefined) {
                        feature.color = d3.select(this).style("fill");
                    }
                    categoryViewer._calculatePosition(location.locationType, feature);
                    return FTVUtils.getShape(location.locationType, feature, categoryViewer._pixelPerAA, categoryViewer.opt.useShapes, typeClass);
                })
            ;
        });
    });
};