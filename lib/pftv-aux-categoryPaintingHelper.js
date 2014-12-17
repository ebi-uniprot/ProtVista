var CenteredProteinCategoryFTViewer = require("./pftv-aux-centeredProteinCategoryFTViewer");
var NonOverlappingCategoryFTViewer = require("./pftv-aux-nonOverlappingProteinCategoryFTViewer");
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
	if (style === "centered") {
		CenteredProteinCategoryFTViewer.paintFeatures(categoryViewer);
	} else if (style === "nonoverlapping") {
		NonOverlappingCategoryFTViewer.paintFeatures(categoryViewer);
	} else {
		CenteredProteinCategoryFTViewer.paintFeatures(categoryViewer);
	}
};