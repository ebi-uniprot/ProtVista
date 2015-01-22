var FTVUtils = require("./pftv-aux-utils");
var CenteredProteinCategoryFTViewer = require("./pftv-aux-centeredProteinCategoryFTViewer");
var NonOverlappingCategoryFTViewer = require("./pftv-aux-nonOverlappingProteinCategoryFTViewer");
var CenteredProteinVariantFTViewer = require("./pftv-aux-centeredProteinVariantFTViewer");
/*
 * biojs-vis-proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

/**
@class pftv-aux-categoryPaintingHelper
 */
var  CategoryPaintingHelper;

module.exports = CategoryPaintingHelper = function(){};

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
CategoryPaintingHelper.paintFeatures = function(categoryViewer) {
	var style = categoryViewer.opt.styleView.toLowerCase();
	if (style === FTVUtils.styleViews.centered) {
		CenteredProteinCategoryFTViewer.paintFeatures(categoryViewer);
	} else if (style === FTVUtils.styleViews.nonOverlapping) {
		NonOverlappingCategoryFTViewer.paintFeatures(categoryViewer);
	} else if (style === FTVUtils.styleViews.centeredVariants) {
        CenteredProteinVariantFTViewer.paintFeatures(categoryViewer);
    } else if (style === FTVUtils.styleViews.nonOverVariants) {

    } else {
		CenteredProteinCategoryFTViewer.paintFeatures(categoryViewer);
	}
};