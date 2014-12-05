var _ = require("underscore");
var d3 = require("d3");
var FTVUtils = require("./pftv-aux-utils.js");
var categoryViewer = require("./pftv-aux-proteinCategoryFTViewer.js");

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
var pftv_aux_centeredCat;
/**
 * Private zone
 */

/*
 * Public zone
 */
pftv_aux_centeredCat = (function(){
    var self = {
        /**
         * Constructor, creates a generic category viewer and sets up options for this module.
         * @params options Configuration options.
         */
        constructor:function (options) {
            var myself = this;
            //listen to the generic component events and propagate them
            categoryViewer.on("featureOn", function(object) {
                myself.trigger("featureOn", object);
            });
            categoryViewer.on("featureOff", function(object) {
                myself.trigger("featureOff", object);
            });
            categoryViewer.on("featureSelected", function(object) {
                myself.trigger("featureSelected", object);
            });
            categoryViewer.on("featureUnselected", function(object) {
                myself.trigger("featureUnselected", object);
            });
            categoryViewer.on("featureClicked", function(object) {
                myself.trigger("featureClicked", object);
            });
            categoryViewer.on("categoryOpen", function(object) {
                myself.trigger("categoryOpen", object);
            });
            categoryViewer.on("categoryClose", function(object) {
                myself.trigger("categoryClose", object);
            });
            //use categoryViewer to init everything
            categoryViewer.constructor(options);
            //now do any additional thing
            this._paintFeatures();
        },
        /**
         * Default variables for the options, see also generic component pftv-aux-proteinCategoryFTViewer.
         */
        opt: {},
        //*****
        // Public methods
        //*****
        /**
         * Zooms in or out the features displayed.
         * @param moveToAA Zoom and then move to the given amino acid.
         */
        zoomInOut: function(moveToAA) {
            categoryViewer.zoomInOut(moveToAA);
        },

        /**
         * Translates a category to a given coordinate.
         * @param xMove Starting coordinate for translation, meaning the first amino acid to be displayed.
         */
        translate: function(xMove) {
            categoryViewer.translate(xMove);
        },

        /**
         * Opens a category so the arrow on the left changes to pointer-down;
         * an event informing category, component container, and category div background is raised.
         */
        open: function() {
            categoryViewer.open();
        },

        /**
         * Closes a category do the arrow on the left changes to pointer-right;
         * an event informing category and component target is raised.
         */
        close: function() {
            categoryViewer.close();
        },
        /**
         * @private
         * */
        _paintFeatures: function() {
            var categoryArray = categoryViewer._instanceArray;
            var types = FTVUtils.getTrackTypes(categoryViewer.opt.category);
            _.each(types, function(type) {
                var typeClass = FTVUtils.ftTypeToClass(type.type);
                _.each(type.locations, function(location) {
                    categoryViewer._featureSVGGroup.selectAll("#" + categoryViewer.opt.target + " path." + typeClass + "." + location.locationType)
                        .attr("d", function (feature) {
                            var categoryElement = categoryArray[d3.select(this).attr("index")];
                            if (feature.color == undefined) {
                                feature.color = d3.select(this).style("fill");
                            }
                            categoryElement._calculatePosition(location.locationType, feature);
                            return FTVUtils.getShape(location.locationType, feature, categoryElement._pixelPerAA, categoryElement.opt.useShapes, typeClass);
                        })
                    ;
                });
            });
        }
    };
    return self;
})(this);

require('biojs-events').mixin(pftv_aux_centeredCat.prototype);

module.exports = pftv_aux_centeredCat;