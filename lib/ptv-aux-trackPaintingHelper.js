var LayoutGlobal = require('./ptv-layout-global');
/* TODO
var CenteredProteinCategoryFTViewer = require("./pftv-aux-centeredProteinCategoryFTViewer");
var NonOverlappingCategoryFTViewer = require("./pftv-aux-nonOverlappingProteinCategoryFTViewer");
var VariantProteinCategoryFTViewer = require("./pftv-aux-variantProteinCategoryFTViewer");
*/
/*
 * biojs-vis-proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

/**
@class ptv-aux-trackPaintingHelper
 */
var  TrackPaintingHelper;

module.exports = TrackPaintingHelper = function(){};

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
/**
 * Delegates the features painting to the centered, non-overlapping, or variant painter component depending on the styleView.
 * @param categoryViewer Viewer that actually takes care of category features display, it contains all the options and features/variants.
 */
TrackPaintingHelper.paintFeatures = function(categoryViewer) {
	/*var style = categoryViewer._styleView.toLowerCase();
	if (style === FTVUtils.styleViews.centered) {
		CenteredProteinCategoryFTViewer.paintFeatures(categoryViewer);
	} else if (style === FTVUtils.styleViews.nonOverlapping) {
		NonOverlappingCategoryFTViewer.paintFeatures(categoryViewer);
	} else if (style === FTVUtils.styleViews.variants) {
        VariantProteinCategoryFTViewer.paintFeatures(categoryViewer);
    } else {
		CenteredProteinCategoryFTViewer.paintFeatures(categoryViewer);
	}*/
};

/**
 * Return an array with all the types contained by a category.
 * @param categoryViewer Viewer that actually takes care of category features display, it contains all the options and features/variants.
 * @returns {*}
 */
TrackPaintingHelper.getTypes = function(categoryViewer) {
    var style = categoryViewer._styleView.toLowerCase();
    if (style === LayoutGlobal.STYLE_VIEWS.variants) {
        // TODO return VariantProteinCategoryFTViewer.getTypes(categoryViewer);
    } else {
        return categoryViewer.opt.category.types;
    }
};