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
 @class pftv-aux-proteinCategoryFTViewer
 */
var ProteinCategoryFTViewer;// = require("biojs-events");

module.exports = ProteinCategoryFTViewer = function(options){
    _constructor(this, options);
};
/**
 * Private zone
 */
/*
 * Private variables.
 * */
var
    //instances array, class level
    _instanceArray = new Array(),
    //this instance index, instance level (unique for each instance)
    _instanceIndex = undefined,
    //arrows
    _arrowRight = "\u25BA",
    _arrowDown = "\u25BC",
    _defaultFTPosAndHeight = {
        position: {yLine: 31, hLine: 20, y: 10},
        bridge: {y: 31, h: 15},
        continuous: {y: 31, h: 10}
    },
    _defaultOptions = {
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
    }
;
/**
 * Private methods.
 */
var
    /**
     * Constructor, it loads the default values for the options.
     * @param self This instance.
     * @params options Configuration options, it will keep the default ones and will rewrite the ones passed as parameter.
     * @private
     */
    _constructor = function (self, options) {
        //make sure every new instance remains independent
        _instanceArray.push(self);
        _instanceIndex = _instanceArray.length-1;
        _instanceArray[_instanceIndex].opt = _.extend(_.extend({}, _defaultOptions), options);
        _instanceArray[_instanceIndex].opt.myArrayIndex = _instanceIndex;
        _instanceArray[_instanceIndex]._ftPosAndHeight = _.extend({}, _defaultFTPosAndHeight);
        if (_instanceArray[_instanceIndex].opt.clickable === true) {
            _instanceArray[_instanceIndex].opt.clickableStyle = true;
        }
        //init layout and paint all
        _init(self);
        _initPainting(self);
    },
    /**
     * Initializes the layout.
     * @param self This instance.
     * @private
     */
    _init = function(self) {
        self._margin = {top: 0, right: FTVUtils.getMarginLeftRight().right, bottom: 0, left: FTVUtils.getMarginLeftRight().left};
        self.opt.sequenceLength = self.opt.sequence.length;
        self._svgWidthWithMargin = self.opt.width - FTVUtils.getTitlesWidth();// - FTVUtils.getZoomTextGap();
        _initScale(self);
        _initSequenceLine(self);
        self._height = self._sequenceLine + self._margin.bottom;

        //Calculate general positions according to location types
        self._ftPosAndHeight.continuous.y = self._sequenceLine;
        self._ftPosAndHeight.continuous.h = self.opt.ftHeight;
        if (self.opt.useShapes) {
            self._ftPosAndHeight.position.y = self._sequenceLine - self._gapToShape;
            self._ftPosAndHeight.position.yLine = self._sequenceLine;
            self._ftPosAndHeight.position.hLine = self.opt.ftHeight + self._gapToShape;
        } else{
            self._ftPosAndHeight.position.y = self._sequenceLine;
            self._ftPosAndHeight.position.h = self.opt.ftHeight + self._gapToShape;
        }
        self._ftPosAndHeight.bridge.y = self._sequenceLine;
        self._ftPosAndHeight.bridge.h = self.opt.ftHeight + self._gapToBridge;
    },
    /**
     * Initializes the scale.
     * @param self This instance.
     * @private
     */
    _initScale = function(self) {
        self._xScale = d3.scale.linear().
            domain([1, self.opt.sequenceLength+1]).
            range([ self._margin.left, self._svgWidthWithMargin - self._margin.right]);
        self._pixelPerAA = self._xScale(2) - self._xScale(1);
        //No more than FTVUtils.getMaxPixelAA() otherwise it will look too big
        if ( self._pixelPerAA > FTVUtils.getMaxPixelAA()) {
            self._svgWidthWithMargin =  self._margin.left + (self.opt.sequenceLength * FTVUtils.getMaxPixelAA()) + self._margin.right;
            self._xScale = d3.scale.linear().
                domain([1, self.opt.sequenceLength+1]).
                range([ self._margin.left, self._svgWidthWithMargin - self._margin.right]);
        }
        self._pixelPerAA = self._xScale(2)- self._xScale(1);
    },
    /**
     * Initializes the sequence line y position.
     * For rectangles and bridges we need 3 extra pixels while for shapes we need 4; it should be just 2 for the borders.
     * @param self This instance.
     * @private
     */
    _initSequenceLine = function(self) {
        if (self.opt.useShapes) {
            if ( _categoryContains(self, FTVUtils.getFTLocation().position)) {//we have shapes
                if ( _categoryContains(self, FTVUtils.getFTLocation().continuous))  {//also rectangles
                    if ( _categoryContains(self, FTVUtils.getFTLocation().bridge)) {//also bridges
                        self._svgBottomGap = -1;
                    } else {//but not bridges
                        self._gapToShape = self._gapToBridge;
                        self._svgBottomGap = -1;
                    }
                } else {//not rectangles
                    if ( _categoryContains(self, FTVUtils.getFTLocation().bridge)) {//but bridges
                        self._svgBottomGap = -1;
                    } else {//not bridges either
                        self._gapToShape = self._gapToBridge;
                        self._svgBottomGap = 0;
                    }
                }
                //the extra space that shapes will take when zoomed in
                self._sequenceLine = self.opt.ftHeight + self._gapToShape + FTVUtils.getMaxShapeSize() + 6;// + _margin.top + Math.floor(FTVUtils.getMaxShapeSize()/2);
            } else if ( _categoryContains(self, FTVUtils.getFTLocation().bridge)) {//no shapes but bridges (and possible rectangles)
                self._sequenceLine = self.opt.ftHeight + self._gapToBridge + 4;// + _margin.top;
                self._svgBottomGap = -1;
            } else { //only rectangles
                self._sequenceLine = self.opt.ftHeight + 4; // _margin.top;
                self._svgBottomGap = -1.5;
            }
        } else {
            if ( _categoryContains(self, FTVUtils.getFTLocation().bridge)) {//bridges (and possibly rectangles)
                self._sequenceLine = self.opt.ftHeight + self._gapToBridge + 4; //+ _margin.top;
                self._svgBottomGap = -1;
            } else { //only rectangles
                self._sequenceLine = self.opt.ftHeight + 4; //we need 2 extra pixels for borders, but 3 actually looks better
                self._svgBottomGap = -1.5;
            }
        }
        var titleHeight = FTVUtils.getTrackMode(self.opt.category) === "category"
            ? FTVUtils.calculateTextHeightDIV(FTVUtils.getTrackTitle(self.opt.category), "categoryTitle", FTVUtils.getTitlesWidth(self.opt.collapsible))
            : FTVUtils.calculateTextHeightDIV(FTVUtils.getTrackTitle(self.opt.category), "categoryTitleNoCollapsible", FTVUtils.getTitlesWidth(self.opt.collapsible));
        var titleNeededHeight = Math.max(FTVUtils.getMinimumTitlesHeight(), titleHeight + FTVUtils.getTitlesPadding());
        if ( self._sequenceLine < titleNeededHeight) {
            self._sequenceLine = titleNeededHeight;
        }
    },
    /*
     * Informs (true or false) whether a category contains any feature with a given location class.
     * @param self This instance.
     * @param ftClass Feature location type.
     * @private
     * */
    _categoryContains = function(self, ftClass) {
        var types = FTVUtils.getTrackTypes(self.opt.category);
        var existence = _.some(types, function(type) {
            return _.some(type.locations, function(location) {
                return location.locationType === ftClass;
            });
        });
        return existence;
    },
    /**
     * Initializes the graphical variables.
     * @param self This instance.
     * @private
     */
    _initPainting = function(self) {
        var svgExtra = 0;
        var categoryExtra = svgExtra + 2;
        var divExtra = svgExtra + 4;
        var target = d3.select("#" + self.opt.target);
        //tooltip
        self._tooltipdiv = d3.select("#" + self.opt.target).append("div")
            .attr("class", "tooltip")
            .style("opacity", 1e-6);
        //category container, i.e., category row
        var categoryRow = target.append("div")
                .attr("class", "category")
                .style("height", ( self._height + divExtra) + "px")
            ;
        //category div
        _initCategoryTitle(self, categoryRow, categoryExtra);
        //features div
        _initFeaturesDiv(self, categoryRow, categoryExtra, svgExtra);
        _paintFeatures(self);
    },
    /**
     * Initializes the title for this category/type.
     * @param self This instance.
     * @param categoryRow Div object containing the category row.
     * @param categoryExtra Extra space in pixels required in the height.
     * @private
     */
    _initCategoryTitle = function(self, categoryRow, categoryExtra) {
        self._categoryRowTitleDiv = categoryRow.append("div")
            .attr("class", function() {
                if (self.opt.collapsible === true) {
                    return "categoryTitle";
                } else {
                    return "categoryTitleNoCollapsible";
                }
            })
            .text(function() {
                if (self.opt.collapsible === true) {
                    return _arrowRight + " " + FTVUtils.getTrackTitle(self.opt.category);
                } else {
                    return "" + FTVUtils.getTrackTitle(self.opt.category);
                }
            })
            .style("width", FTVUtils.getTitlesWidth(self.opt.collapsible) + "px")
            .style("height", ( self._height + categoryExtra - FTVUtils.getTitlesPadding()*2) + "px")
            .style("cursor", function() {
                if (self.opt.collapsible == true) {
                    return "pointer";
                }
            })
            .on("click", function() {
                if (self.opt.collapsible == true) {
                    var text = d3.select(this).text();
                    if (text.charAt(0) == _arrowRight) {
                        self.open();
                    } else {
                        self.close();
                    }
                }
            })
        ;
    },
    /**
     * Initializes the features div and features svg.
     * @param self This instance.
     * @param categoryRow Div object containing the category row.
     * @param categoryExtra Extra space in pixels required in the height.
     * @param svgExtra Extra space for the SVG container (div).
     * @private
     */
    _initFeaturesDiv = function(self, categoryRow, categoryExtra, svgExtra) {
        self._featuresDiv = categoryRow.append("div")
            .attr("class", function() {
                if (self.opt.darkBackground === true) {
                    return ("categoryFeaturesDark categoryFeatures");
                } else {
                    return ("categoryFeaturesLight categoryFeatures");
                }
            })
            .style("width", self._svgWidthWithMargin + "px")
            .style("height", ( self._height + categoryExtra) + "px")
        ;
        //features SVG
        self._featureSVG = self._featuresDiv
            .append("svg")
            .attr("index", function () {
                return self.opt.myArrayIndex;
             })
            .attr("width", self._svgWidthWithMargin)
            .attr("height", self._height + svgExtra);
        self._featureSVGGroup = self._featureSVG
            .append("g").attr("transform", "translate(0," + self._svgBottomGap + ")");
    },
    /**
     * Paints the features for this category/type.
     * @param self This instance.
     * @private
     */
    _paintFeatures = function(self) {
        self._featureSVGGroup.selectAll("path").remove();
        var types = FTVUtils.getTrackTypes(self.opt.category);
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
                    .attr("id", function (feature, position) {
                        return feature.ftid + "_index_" + self.opt.myArrayIndex;
                    })
                    .attr("index", function (feature, position) {
                         feature.categoryIndex = self.opt.categoryIndex;
                         feature.typeIndex = self.opt.typeIndex != undefined ? self.opt.typeIndex : posType;
                         feature.locationIndex = posLoc;
                         feature.featureIndex = position;
                         return self.opt.myArrayIndex;
                     })
                    .attr("tooltip", function (feature) {
                        return FTVUtils.getFeatureTooltipText(type, locationType, feature, self);
                    })
                    .style("fill-opacity", function (feature) {
                        if (feature.selected === true) {
                            return 1;
                        } else {
                            return self.opt.transparency;
                        }
                    })
                    .style("cursor", function () {
                        if ((self.opt.clickable === true) || (self.opt.clickableStyle === true)) {
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
    }
;
/**
 * Public zone.
 */
/**
 * Public variables.
 */
//Options
ProteinCategoryFTViewer.prototype.opt = undefined;
ProteinCategoryFTViewer.prototype._ftPosAndHeight = undefined;
//SVG group
ProteinCategoryFTViewer.prototype._featureSVGGroup = undefined;
//Zoom, has it been applied?
ProteinCategoryFTViewer.prototype._zoomed = false;
//Selected elements
ProteinCategoryFTViewer.prototype._currentSelectedFeature = undefined;
ProteinCategoryFTViewer.prototype._currentSelectedSVG = undefined;
//Height required to display the features in the SVG
ProteinCategoryFTViewer.prototype._svgWidthWithMargin = 600;
ProteinCategoryFTViewer.prototype._height = 32;
ProteinCategoryFTViewer.prototype._sequenceLine = 31;
//Margins and gaps
ProteinCategoryFTViewer.prototype._gapToBridge = 5;
ProteinCategoryFTViewer.prototype._gapToShape = 10;
ProteinCategoryFTViewer.prototype._svgBottomGap = 0;
ProteinCategoryFTViewer.prototype._margin = undefined;
//Graphical elements
ProteinCategoryFTViewer.prototype._xScale = undefined;
ProteinCategoryFTViewer.prototype._pixelPerAA = undefined;
ProteinCategoryFTViewer.prototype._categoryRowTitleDiv = undefined;
ProteinCategoryFTViewer.prototype._featuresDiv = undefined;
ProteinCategoryFTViewer.prototype._featureSVG = undefined;
ProteinCategoryFTViewer.prototype._tooltipdiv = undefined;

//*****
// Public methods
//*****

/*
 * Calculates (x,y) coordinate for a feature. It takes into account the location class for the feature and
 * whether or not shapes are used for FT-SingleAA. For rectangles-like features it calculates also de height
 * and width while for other shapes it calculates also the (x,y) coordinate for the attached line
 * as well as its height
 * @param locationType
 * @param feature
 */
ProteinCategoryFTViewer.prototype.calculatePosition = function calculatePosition(locationType, feature) {
    var self = this;
    var scaledStart = self._xScale(FTVUtils.getStart(feature));
    var scaledEnd = self._xScale(FTVUtils.getEnd(feature));
    feature.x = scaledStart;
    if (FTVUtils.equalsNoCase(locationType, FTVUtils.getFTLocation().continuous)) {
        feature.y = self._ftPosAndHeight.continuous.y;
        feature.width = scaledEnd - scaledStart + self._pixelPerAA;
        feature.height = self._ftPosAndHeight.continuous.h;
    } else if (FTVUtils.equalsNoCase(locationType, FTVUtils.getFTLocation().position)) {
        feature.y = self._ftPosAndHeight.position.y;
        if (self.opt.useShapes) {
            feature.xLine = scaledStart + ((scaledEnd+ self._pixelPerAA) - scaledStart)/2;
            feature.x = feature.xLine;
            feature.yLine = self._ftPosAndHeight.position.yLine;
            feature.hLine = self._ftPosAndHeight.position.hLine;
            feature.y = feature.yLine - feature.hLine;
        } else {
            feature.y = self._ftPosAndHeight.position.y;
            feature.width = scaledEnd - scaledStart + self._pixelPerAA;
            feature.height = self._ftPosAndHeight.position.h;
        }
    } else if (FTVUtils.equalsNoCase(locationType, FTVUtils.getFTLocation().bridge)) {
        feature.y = self._ftPosAndHeight.bridge.y;
        feature.width = scaledEnd - scaledStart + self._pixelPerAA;
        feature.height = self._ftPosAndHeight.bridge.h;
    }
};

/**
 * Zooms in or out the features displayed.
 * @param moveToAA Zoom and then move to the given amino acid.
 */
ProteinCategoryFTViewer.prototype.zoomInOut = function zoomInOut(moveToAA) {
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
        this.trigger('zoomIn', {});
    } else {// it is zoomed in then zoom out, i.e., i.e., go to overview
        this._svgWidthWithMargin = this.opt.width - FTVUtils.getTitlesWidth();// - FTVUtils.getZoomTextGap();
        _initScale(this);
        this._featuresDiv.style("width", this._svgWidthWithMargin + "px");
        this._featureSVG.attr("width", this._svgWidthWithMargin);
        this._zoomed = false;
        this.trigger('zoomOut', {});
    }
    _paintFeatures(this);
    if (moveToAA != undefined) {
        this.translate(moveToAA);
    } else {
        this._featureSVGGroup.attr("transform", "translate(0," + this._svgBottomGap + ")");
    }
};

/**
 * Translates a category to a given coordinate.
 * @param xMove Starting coordinate for translation, meaning the first amino acid to be displayed.
 */
ProteinCategoryFTViewer.prototype.translate = function translate(xMove) {
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
};

/**
 * Opens a category so the arrow on the left changes to pointer-down;
 * an event informing category, component container, and category div background is raised.
 */
ProteinCategoryFTViewer.prototype.open = function open() {
    if (this.opt.collapsible === true) {
        var text = this._categoryRowTitleDiv.text();
        if (text.charAt(0) === _arrowRight) { //it is closed, it makes sense to open it
            this._categoryRowTitleDiv.text(_arrowDown + " " + FTVUtils.getTrackTitle(this.opt.category));
            this.trigger('categoryOpen', {category: this.opt.category, target: this.opt.target, darkBackground: this.opt.darkBackground});
        }
    }
};

/**
 * Closes a category do the arrow on the left changes to pointer-right;
 * an event informing category and component target is raised.
 */
ProteinCategoryFTViewer.prototype.close = function close() {
    if (this.opt.collapsible == true) {
        var text = this._categoryRowTitleDiv.text();
        if (text.charAt(0) != _arrowRight) { //it is not closed, it makes sense to close it
            this._categoryRowTitleDiv.text(_arrowRight + " " + FTVUtils.getTrackTitle(this.opt.category));
            this.trigger('categoryClose', {category: this.opt.category, target: this.opt.target});
        }
    }
};

// Mixin utility
ProteinCategoryFTViewer.prototype.mixin = function mixin(proto) {
    require('biojs-events').mixin(proto);
    var exports = ['_pixelPerAA', '_featureSVGGroup', 'opt', 'calculatePosition', 'zoomInOut', 'translate', 'open', 'close'];
    _.each(exports, function(name) {
        proto[name] = this[name];
    }, this);
    return proto;
};

require('biojs-events').mixin(ProteinCategoryFTViewer.prototype);