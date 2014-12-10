var _ = require("underscore");
var d3 = require("d3");
var FTVUtils = require("./pftv-aux-utils");
var ProteinCategoryFTViewer = require("./pftv-aux-proteinCategoryFTViewer");
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

module.exports = CenteredProteinCategoryFTViewer = function(options){
    constructor(this, options);
};
/**
 * Private zone
 */
/*
 * Private variables.
 * */
 /**
 * Private methods.
 */
var
    /**
     * Constructor, creates a generic category viewer and sets up options for this module.
     * @params options Configuration options.
     */
    constructor = function (self, options) {
        var proteinCategoryHelper = new ProteinCategoryFTViewer(options);
        //listen to the generic component events and propagate them
        proteinCategoryHelper.on("featureOn", function(object) {
            self.trigger("featureOn", object);
        });
        proteinCategoryHelper.on("featureOff", function(object) {
            self.trigger("featureOff", object);
        });
        proteinCategoryHelper.on("featureSelected", function(object) {
            self.trigger("featureSelected", object);
        });
        proteinCategoryHelper.on("featureUnselected", function(object) {
            self.trigger("featureUnselected", object);
        });
        proteinCategoryHelper.on("featureClicked", function(object) {
            self.trigger("featureClicked", object);
        });
        proteinCategoryHelper.on("categoryOpen", function(object) {
            self.trigger("categoryOpen", object);
        });
        proteinCategoryHelper.on("categoryClose", function(object) {
            self.trigger("categoryClose", object);
        });
        //additional painting stuff
        _paintFeatures(proteinCategoryHelper);
    },
    /**
     * @private
     * */
    _paintFeatures = function(proteinCategoryHelper) {
        //var categoryArray = proteinCategoryHelper._instanceArray;   //INSTANCE
        var types = FTVUtils.getTrackTypes(proteinCategoryHelper.opt.category);
        _.each(types, function(type) {
            var typeClass = FTVUtils.ftTypeToClass(type.type);
            _.each(type.locations, function(location) {
                proteinCategoryHelper._featureSVGGroup.selectAll("#" + proteinCategoryHelper.opt.target + " path." + typeClass + "." + location.locationType)
                    .attr("d", function (feature) {
                        //INSTANCE var categoryElement = categoryArray[d3.select(this).attr("index")];
                        if (feature.color == undefined) {
                            feature.color = d3.select(this).style("fill");
                        }
                        proteinCategoryHelper.calculatePosition(location.locationType, feature);
                        return FTVUtils.getShape(location.locationType, feature, proteinCategoryHelper._pixelPerAA, proteinCategoryHelper.opt.useShapes, typeClass);
                    })
                ;
            });
        });
    }
;
/*
 * Public zone
 */
//        //*****
//        // Public methods
//        //*****
//        /**
//         * Zooms in or out the features displayed.
//         * @param moveToAA Zoom and then move to the given amino acid.
//         */
//        CenteredProteinCategoryFTViewer.prototype.zoomInOut = function zoomInOut(moveToAA) {
//            proteinCategoryHelper.zoomInOut(moveToAA);
//        },
//
//        /**
//         * Translates a category to a given coordinate.
//         * @param xMove Starting coordinate for translation, meaning the first amino acid to be displayed.
//         */
//        CenteredProteinCategoryFTViewer.prototype.translate = function translate(xMove) {
//            proteinCategoryHelper.translate(xMove);
//        },
//
//        /**
//         * Opens a category so the arrow on the left changes to pointer-down;
//         * an event informing category, component container, and category div background is raised.
//         */
//        CenteredProteinCategoryFTViewer.prototype.open = function open() {
//            proteinCategoryHelper.open();
//        },
//
//        /**
//         * Closes a category do the arrow on the left changes to pointer-right;
//         * an event informing category and component target is raised.
//         */
//        CenteredProteinCategoryFTViewer.prototype.close = function close() {
//            proteinCategoryHelper.close();
//        },

require('biojs-events').mixin(CenteredProteinCategoryFTViewer.prototype);