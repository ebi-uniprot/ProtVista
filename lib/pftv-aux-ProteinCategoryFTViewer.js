var _ = require("underscore");
var d3 = require("d3");
var jQuery = require("jquery");
//var biojs_events = require("biojs-events");
var FTVUtils = require("./pftv-aux-utils.js");

/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

/**
 @class pftv-aux-proteinCategoryFTViewer
 */
var pftv_aux_proteinCategoryFTViewer;
/**
 * Private zone
 */

/*
 * Public zone
 */
pftv_aux_proteinCategoryFTViewer = (function(){
    var self = {
        //instances array, class level
        _instanceArray: new Array(),
        //this instance index, instance level (unique for each instance)
        _instanceIndex: undefined,
        /**
         * Constructor, it loads the default values for the options, registers the new instance,
         * and clones objects that should be kept at instance level such as this.opt and this._ftPosAndHeight
         * @params options Configuration options, it will keep the default ones and will rewrite the ones passed as parameter
         */
        constructor: function (options) {
            this._instanceArray.push(this);
            this._instanceIndex = this._instanceArray.length-1;
            this._instanceArray[this._instanceIndex].opt = jQuery.extend(true, {}, this.opt);
            this._instanceArray[this._instanceIndex]._ftPosAndHeight = jQuery.extend(true, {}, this._ftPosAndHeight);
            if (this._instanceArray[this._instanceIndex].opt.clickable == true) {
                this._instanceArray[this._instanceIndex].opt.clickableStyle = true;
            }
            //debug
            //console.log(this._instanceArray);
            //console.log(this.opt);
            this._init();
            this._initPainting();
        },

        /**
         * Default variables for the options.
         * width: 600
         * ,darkBackground: true
         * ,useShapes: true
         * ,useTooltips: false
         * ,clickable: true
         * ,clickableStyle: true
         * ,collapsible: false
         * ,zoomable: true
         * ,ftHeight: 10
         * ,transparency: 0.5
         */
        opt: {
            target: "YourOwnDivId"
            ,width: 600
            ,darkBackground: true
            ,useShapes: true
            ,useTooltips: false
            ,clickable: true
            ,clickableStyle: true
            ,collapsible: false
            ,zoomable: true
            ,ftHeight: 10
            ,transparency: 0.5
            ,sequence: "abc"
            ,category: {}
            ,categoryIndex: 0
            ,typeIndex: undefined
        },

        //*****
        // Public methods
        //*****
        /**
         * Zooms in or out the features displayed.
         * @param moveToAA Zoom and then move to the given amino acid.
         */
        zoomInOut: function(moveToAA) {
            if (this._zoomed === false) {//it is zoomed out, then zoom it in, i.e, go to detailed view
                this._svgWidthWithMargin = this.opt.width - FTVUtils.getTitlesWidth();
                var tempWidth = this.opt.sequenceLength * FTVUtils.getMaxPixelAA() + this._margin.left + this._margin.right;
                this._xScale = d3.scale.linear()
                    .domain([1, this.opt.sequenceLength + 1])
                    .range([this._margin.left, tempWidth - this._margin.right]);
                this._pixelPerAA = this._xScale(2) - this._xScale(1);
                this._featuresDiv.style("width", this._svgWidthWithMargin + "px");
                this._featureSVG.attr("width", this._svgWidthWithMargin);
                this._zoomed = true;
            } else {// it is zoomed in then zoom out, i.e., i.e., go to overview
                this._svgWidthWithMargin = this.opt.width - FTVUtils.getTitlesWidth();// - FTVUtils.getZoomTextGap();
                this._initScale();
                this._featuresDiv.style("width", this._svgWidthWithMargin + "px");
                this._featureSVG.attr("width", this._svgWidthWithMargin);
                this._zoomed = false;
            }
            this._paintFeatures();
            if (moveToAA != undefined) {
                this.translate(moveToAA);
            } else {
                this._featureSVGGroup.attr("transform", "translate(0," + this._svgBottomGap + ")");
            }
            //TODO event???
        },

        /**
         * Translates a category to a given coordinate.
         * @param xMove Starting coordinate for translation, meaning the first amino acid to be displayed.
         */
        translate: function(xMove) {
            if (this._zoomed === false) {//it is zoomed out, nothing to move, go to (0,0)
                this._featureSVGGroup.attr("transform", "translate(0," + this._svgBottomGap + ")");
            } else if (xMove != undefined) {//it is zoomed in, move to AA if d3Panning is false, otherwise to coordinate X
                //what is the maximum pixel to be the first one (most to the left) displayed on the visible portion of the category?
                var usablePixels = this._svgWidthWithMargin - this._margin.left - this._margin.right - FTVUtils.getMaxPixelAA();
                var visibleAA = usablePixels / FTVUtils.getMaxPixelAA();
                var firstMaxVisibleAA = this.opt.sequence.length - visibleAA;
                var firstMaxVisiblePixel = -(this._xScale(firstMaxVisibleAA));// - FTVUtils.getMaxPixelAA());
                var xPan = -(this._xScale(xMove) - this._margin.left);
                //console.log("xMove " + xMove + " scale " + this._xScale(xMove) + " xPan " + xPan + " firstMaxVisiblePixel " + firstMaxVisiblePixel);
                if ((firstMaxVisiblePixel <= xPan) && (xPan <= 0)) {
                    this._featureSVGGroup.attr("transform", "translate(" + xPan + "," + this._svgBottomGap + ")");
                } else if (firstMaxVisiblePixel > xPan) {
                    this._featureSVGGroup.attr("transform", "translate(" + firstMaxVisiblePixel + "," + this._svgBottomGap + ")");
                } else {
                    this._featureSVGGroup.attr("transform", "translate(0," + this._svgBottomGap + ")");
                }
            }
            //TODO event???
        },

        /**
         * Opens a category so the arrow on the left changes to pointer-down;
         * an event informing category, component container, and category div background is raised.
         */
        open: function() {
            if (this.opt.collapsible == true) {
                var text = this._categoryRowTitleDiv.text();
                if (text.charAt(0) === this._arrowRight) { //it is closed, it makes sense to open it
                    this._categoryRowTitleDiv.text(this._arrowDown + " " + FTVUtils.getTrackTitle(this.opt.category));
                    this.trigger('categoryOpen', {category: this.opt.category, target: this.opt.target, darkBackground: this.opt.darkBackground});
                }
            }
        },

        /**
         * Closes a category do the arrow on the left changes to pointer-right;
         * an event informing category and component target is raised.
         */
        close: function() {
            if (this.opt.collapsible == true) {
                var text = this._categoryRowTitleDiv.text();
                if (text.charAt(0) != this._arrowRight) { //it is not closed, it makes sense to close it
                    this._categoryRowTitleDiv.text(this._arrowRight + " " + FTVUtils.getTrackTitle(this.opt.category));
                    this.trigger('categoryClose', {category: this.opt.category, target: this.opt.target});
                }
            }
        },

        /*
         * Private variables
         * */
        _zoomed: false, //has been zoom applied?
        //Selected elements, instance level.
        _currentSelectedFeature: undefined,
        _currentSelectedSVG: undefined,
        //Height required to display the features in the SVG, instance level
        _svgWidthWithMargin: 600,
        _height: 32,
        _sequenceLine: 31,
        //Margins and gaps, class level (they do not change)
        _gapToBridge: 5,
        _gapToShape: 10,
        _svgBottomGap: 0, //margin-bottom, but works better with translation
        _margin: undefined,
        //_margin: {top: 7, right: 7, bottom: 3, left: 7},
        //Graphical elements, instance level
        _xScale: undefined,
        _pixelPerAA: undefined,
        _categoryRowTitleDiv: undefined,
        _featuresDiv: undefined,
        _featureSVG: undefined,
        _featureSVGGroup: undefined,
        _tooltipdiv: undefined,
        //y position and height for different location classes, based on the height, instance level (cloned)
        _ftPosAndHeight: {
            position: {yLine: 31, hLine: 20, y: 10},
            bridge: {y: 31, h: 15},
            continuous: {y: 31, h: 10}
        },
        //arrows
        _arrowRight: "\u25BA",
        _arrowDown: "\u25BC",

        /*
         * Private methods
         * */
        /**
         *  Initializes the private variables.
         *  @private
         * */
        _init: function() {
            this._margin = {top: 0, right: FTVUtils.getMarginLeftRight().right, bottom: 0, left: FTVUtils.getMarginLeftRight().left};
            this.opt.sequenceLength = this.opt.sequence.length;
            this._svgWidthWithMargin = this.opt.width - FTVUtils.getTitlesWidth();// - FTVUtils.getZoomTextGap();
            this._initScale();
            this._initSequenceLine();
            this._height = this._sequenceLine + this._margin.bottom;

            //Calculate general positions according to location types
            this._ftPosAndHeight.continuous.y = this._sequenceLine;
            this._ftPosAndHeight.continuous.h = this.opt.ftHeight;
            if (this.opt.useShapes) {
                this._ftPosAndHeight.position.y = this._sequenceLine - this._gapToShape;
                this._ftPosAndHeight.position.yLine = this._sequenceLine;
                this._ftPosAndHeight.position.hLine = this.opt.ftHeight + this._gapToShape;
            } else{
                this._ftPosAndHeight.position.y = this._sequenceLine;
                this._ftPosAndHeight.position.h = this.opt.ftHeight + this._gapToShape;
            }
            this._ftPosAndHeight.bridge.y = this._sequenceLine;
            this._ftPosAndHeight.bridge.h = this.opt.ftHeight + this._gapToBridge;
        },
        /**
         * Initializes the scale.
         * @private
         */
        _initScale: function() {
            this._xScale = d3.scale.linear().
                domain([1, this.opt.sequenceLength+1]).
                range([this._margin.left, this._svgWidthWithMargin - this._margin.right]);
            this._pixelPerAA = this._xScale(2) - this._xScale(1);
            //No more than FTVUtils.getMaxPixelAA() otherwise it will look too big
            if (this._pixelPerAA > FTVUtils.getMaxPixelAA()) {
                this._svgWidthWithMargin =  this._margin.left + (this.opt.sequenceLength * FTVUtils.getMaxPixelAA()) + this._margin.right;
                this._xScale = d3.scale.linear().
                    domain([1, this.opt.sequenceLength+1]).
                    range([this._margin.left, this._svgWidthWithMargin - this._margin.right]);
            }
            this._pixelPerAA = this._xScale(2)-this._xScale(1);
        },
        /**
         * Initializes the sequence line y position.
         * For rectangles and bridges we need 3 extra pixels while for shapes we need 4; it should be just 2 for the borders but
         * @private
         */
        _initSequenceLine: function() {
            if (this.opt.useShapes) {
                if (this._categoryContains(FTVUtils.getFTLocation().position)) {//we have shapes
                    if (this._categoryContains(FTVUtils.getFTLocation().continuous))  {//also rectangles
                        if (this._categoryContains(FTVUtils.getFTLocation().bridge)) {//also bridges
                            this._svgBottomGap = -1;
                        } else {//but not bridges
                            this._gapToShape = this._gapToBridge;
                            this._svgBottomGap = -1;
                        }
                    } else {//not rectangles
                        if (this._categoryContains(FTVUtils.getFTLocation().bridge)) {//but bridges
                            this._svgBottomGap = -1;
                        } else {//not bridges either
                            this._gapToShape = this._gapToBridge;
                            this._svgBottomGap = 0;
                        }
                    }
                    //the extra space that shapes will take when zoomed in
                    this._sequenceLine = this.opt.ftHeight + this._gapToShape + FTVUtils.getMaxShapeSize() + 6;// + this._margin.top + Math.floor(FTVUtils.getMaxShapeSize()/2);
                } else if (this._categoryContains(FTVUtils.getFTLocation().bridge)) {//no shapes but bridges (and possible rectangles)
                    this._sequenceLine = this.opt.ftHeight + this._gapToBridge + 4;// + this._margin.top;
                    this._svgBottomGap = -1;
                } else { //only rectangles
                    this._sequenceLine = this.opt.ftHeight + 4; //this._margin.top;
                    this._svgBottomGap = -1.5;
                }
            } else {
                if (this._categoryContains(FTVUtils.getFTLocation().bridge)) {//bridges (and possibly rectangles)
                    this._sequenceLine = this.opt.ftHeight + this._gapToBridge + 4; //+ this._margin.top;
                    this._svgBottomGap = -1;
                } else { //only rectangles
                    this._sequenceLine = this.opt.ftHeight + 4; //we need 2 extra pixels for borders, but 3 actually looks better
                    this._svgBottomGap = -1.5;
                }
            }
            var titleHeight = FTVUtils.getTrackMode(this.opt.category) === "category"
                ? FTVUtils.calculateTextHeightDIV(FTVUtils.getTrackTitle(this.opt.category), "categoryTitle", FTVUtils.getTitlesWidth(this.opt.collapsible))
                : FTVUtils.calculateTextHeightDIV(FTVUtils.getTrackTitle(this.opt.category), "categoryTitleNoCollapsible", FTVUtils.getTitlesWidth(this.opt.collapsible));
            var titleNeededHeight = Math.max(FTVUtils.getMinimumTitlesHeight(), titleHeight + FTVUtils.getTitlesPadding());
            if (this._sequenceLine < titleNeededHeight) {
                this._sequenceLine = titleNeededHeight;
            }
        },
        /**
         * Initializes the graphical variables.
         */
        _initPainting: function() {
            var svgExtra = 0;
            var categoryExtra = svgExtra + 2;
            var divExtra = svgExtra + 4;
            var target = d3.select("#" + this.opt.target);
            //tooltip
            this._tooltipdiv = d3.select("#" + this.opt.target).append("div")
                .attr("class", "tooltip")
                .style("opacity", 1e-6);
            //category container, i.e., category row
            var categoryRow = target.append("div")
                    .attr("class", "category")
                    .style("height", (this._height + divExtra) + "px")
                ;
            var self = this;
            //category title
            this._categoryRowTitleDiv = categoryRow.append("div")
                .attr("class", function() {
                    if (self.opt.collapsible === true) {
                        return "categoryTitle";
                    } else {
                        return "categoryTitleNoCollapsible";
                    }
                })
                .text(function() {
                    if (self.opt.collapsible === true) {
                        return self._arrowRight + " " + FTVUtils.getTrackTitle(self.opt.category);
                    } else {
                        return "" + FTVUtils.getTrackTitle(self.opt.category);
                    }
                })
                .style("width", FTVUtils.getTitlesWidth(this.opt.collapsible) + "px")
                .style("height", (this._height + categoryExtra - FTVUtils.getTitlesPadding()*2) + "px")
                .style("cursor", function() {
                    if (self.opt.collapsible == true) {
                        return "pointer";
                    }
                })
                .on("click", function() {
                    if (self.opt.collapsible == true) {
                        var text = d3.select(this).text();
                        if (text.charAt(0) == self._arrowRight) {
                            self.open();
                        } else {
                            self.close();
                        }
                    }
                })
            ;
            //features div
            this._featuresDiv = categoryRow.append("div")
                .attr("class", function() {
                    if (self.opt.darkBackground === true) {
                        return ("categoryFeaturesDark categoryFeatures");
                    } else {
                        return ("categoryFeaturesLight categoryFeatures");
                    }
                })
                .style("width", this._svgWidthWithMargin + "px")
                .style("height", (this._height + categoryExtra) + "px")
            ;
            //zoom
            var selfIndex = this._instanceIndex;
            //features SVG
            this._featureSVG = this._featuresDiv//d3.select("#" + this.opt.target + " > div.features" )
                .append("svg")
                .attr("index", function () {
                    return selfIndex;
                })
                .attr("width", this._svgWidthWithMargin)
                .attr("height", this._height + svgExtra);
            this._featureSVGGroup = this._featureSVG
                .append("g").attr("transform", "translate(0," + this._svgBottomGap + ")");
            this._paintFeatures();
        },
        /**
         *
         * @private
         */
        _paintFeatures: function() {
            this._featureSVGGroup.selectAll("path").remove();
            var selfArray = this._instanceArray;
            var selfIndex = this._instanceIndex;
            var self = selfArray[selfIndex];
            var types = FTVUtils.getTrackTypes(this.opt.category);
            _.each(types, function(type, posType) {
                var typeClass = FTVUtils.ftTypeToClass(type.type);
                // We are selecting everything inside the target div that is a path with class typeClass...
                // if we have the same class more than once, it will not work, see d3 enter, remove, update.
                _.each(type.locations, function(location, posLoc) {
                    var locationType = location.locationType;
                    self._featureSVGGroup.selectAll("#" + self.opt.target + " path." + typeClass + "." + locationType)
                        .data(location.features).enter().append("path")
                        .attr("class", function (feature) {
                            if (feature.color != undefined) {
                                d3.select(this).style("fill", feature.color);
                                d3.select(this).style("stroke", feature.color);
                            }
                            return locationType + " " + typeClass;
                        })
                        .attr("id", function (feature) {
                            return feature.ftid + "_index_" + selfIndex;
                        })
                        .attr("index", function (feature, position) {
                            feature.categoryIndex = self.opt.categoryIndex;
                            feature.typeIndex = self.opt.typeIndex != undefined ? self.opt.typeIndex : posType;
                            feature.locationIndex = posLoc;
                            feature.featureIndex = position;
                            return selfIndex;
                        })
                        .attr("tooltip", function (feature) {
                            return FTVUtils.getFeatureTooltipText(type, locationType, feature, self);
                        })
                        .style("fill-opacity", function (feature) {
                            //var self = selfArray[d3.select(this).attr("index")];
                            if (feature.selected == true) {
                                return 1;
                            } else {
                                return self.opt.transparency;
                            }
                        })
                        .style("cursor", function () {
                            if ((self.opt.clickable == true) || (self.opt.clickableStyle == true)) {
                                return "pointer";
                            }
                        })
                        .on("mouseover", function (feature) {
                            var elem = d3.select(this);
                            elem.style("fill-opacity", 1);
                            if (self.opt.useTooltips == true) {
                                FTVUtils.mouseover(self._tooltipdiv, elem.attr("tooltip"));
                            }
                            self.trigger('featureOn', {feature: feature, svgElem: this});
                        })
                        .on("mousemove", function (feature) {
                            if (self.opt.useTooltips == true) {
                                FTVUtils.mousemove(self._tooltipdiv);
                            }
                        })
                        .on("mouseout", function (feature) {
                            var elem = d3.select(this);
                            if (feature.selected != true) {
                                elem.style("fill-opacity", self.opt.transparency);
                            }
                            if (self.opt.useTooltips == true) {
                                FTVUtils.mouseout(self._tooltipdiv);
                            }
                            self.trigger('featureOff', {feature: feature, svgElem: this});
                        })
                        .on("click", function (feature) {
                            self.trigger('featureClicked', {feature: feature, svgElemID: this.id});
                            if (self.opt.clickable == true) {
                                if (feature.selected == true) { //we are clicking the same, deselect
                                    feature.selected = false; //colour will be changed on the mouseout
                                    self._currentSelectedFeature.selected = false;
                                    self._currentSelectedFeature = undefined;
                                    self._currentSelectedSVG = undefined;
                                    self.trigger('featureUnselected', {feature: feature, svgElemID: this.id});
                                } else { //we are clicking on another one, deselect the previous one, select the current one
                                    if (self._currentSelectedFeature != undefined) {//there was a previous selection, deselect it
                                        d3.select(self._currentSelectedSVG).style("fill-opacity", self.opt.transparency);
                                        self._currentSelectedFeature.selected = false;
                                        self.trigger('featureUnselected', {feature: self._currentSelectedFeature, svgElemID: self._currentSelectedSVG.id});
                                        self._currentSelectedFeature = undefined;
                                        self._currentSelectedSVG = undefined;
                                    }
                                    //color was changed on the mouseover and will not be restore on the mouseout
                                    feature.selected = true;
                                    //d3.select(this).attr("selected", "true");
                                    self._currentSelectedFeature = feature;
                                    self._currentSelectedSVG = this;
                                    self.trigger('featureSelected', {feature: feature, svgElemID: this.id});
                                }
                            }
                        })
                    ;
                });
            });
        },

        /*
         * Informs (true or false) whether a category contains any feature with a given location class.
         * */
        _categoryContains: function(ftClass) {
            var types = FTVUtils.getTrackTypes(this.opt.category);
            var existence = _.some(types, function(type) {
                return _.some(type.locations, function(location) {
                    return location.locationType === ftClass;
                });
            });
            return existence;
        },
        /*
         * Calculates (x,y) coordinate for a feature. It takes into account the location class for the feature and
         * whether or not shapes are used for FT-SingleAA. For rectangles-like features it calculates also de height
         * and width while for other shapes it calculates also the (x,y) coordinate for the attached line
         * as well as its height
         * */
        _calculatePosition: function(locationType, feature) {
            var scaledStart = this._xScale(FTVUtils.getStart(feature));
            var scaledEnd = this._xScale(FTVUtils.getEnd(feature));
            feature.x = scaledStart;
            if (FTVUtils.equalsNoCase(locationType, FTVUtils.getFTLocation().continuous)) {
                feature.y = this._ftPosAndHeight.continuous.y;
                feature.width = scaledEnd - scaledStart + this._pixelPerAA;
                feature.height = this._ftPosAndHeight.continuous.h;
            } else if (FTVUtils.equalsNoCase(locationType, FTVUtils.getFTLocation().position)) {
                feature.y = this._ftPosAndHeight.position.y;
                if (this.opt.useShapes) {
                    feature.xLine = scaledStart + ((scaledEnd+this._pixelPerAA) - scaledStart)/2;
                    feature.x = feature.xLine;
                    feature.yLine = this._ftPosAndHeight.position.yLine;
                    feature.hLine = this._ftPosAndHeight.position.hLine;
                    feature.y = feature.yLine - feature.hLine;
                } else {
                    feature.y = this._ftPosAndHeight.position.y;
                    feature.width = scaledEnd - scaledStart + this._pixelPerAA;
                    feature.height = this._ftPosAndHeight.position.h;
                }
            } else if (FTVUtils.equalsNoCase(locationType, FTVUtils.getFTLocation().bridge)) {
                feature.y = this._ftPosAndHeight.bridge.y;
                feature.width = scaledEnd - scaledStart + this._pixelPerAA;
                feature.height = this._ftPosAndHeight.bridge.h;
            }
        }
    };
    return self;
})(this);

require('biojs-events').mixin(pftv_aux_proteinCategoryFTViewer.prototype);

module.exports = pftv_aux_proteinCategoryFTViewer;