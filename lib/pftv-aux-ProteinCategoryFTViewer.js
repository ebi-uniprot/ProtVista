var _ = require("underscore");
var d3 = require("d3");
var FTVUtils = require("./pftv-aux-utils");
var CategoryPaintingHelper = require("./pftv-aux-categoryPaintingHelper");
 
/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */
 
/**
 @class pftv-aux-proteinCategoryFTViewer
 This class aims to visualize protein feature categories and protein feature types.
 A protein feature category groups together one or more protein feature types; only these two levels are considered.
 A category can be collapsible; if so, when uncollpased all its types will be displayed in different tracks, all of them in a "nonoverlapping" style.
 A type cannot be collapsible, i.e., it is not possible to open it to further levels.

 For either categories or types, the following options are mandatory:
 element: an element that will contain this component
 ,sequence: String
 ,category: Either a category or a type

 For either categories or types, the following options are optional, if not provided, a default value will be assigned:
 width: 1200// width used to display this component, ith should be enough for title and features
 ,darkBackground: true //Two different backgrounds defined in the CSS are alternated
 ,useShapes: true //should shapes for one-single-amino-acid feature be used? regardless the value, if it is variant instance then 'useShapes' will be set to false
 ,useTooltips: false //should tooltips on mouse-over be displayed for features?
 ,clickable: true //are features clickable?
 ,clickableStyle: true //will a "click-on-me" cursor icon be used over features?
 ,collapsible: false //can this category be opened to types? regardless the value, if it is a type instance then 'collapsible' will be set to false
 ,ftHeight: 10 //features height whenever rectangles are used
 ,transparency: 0.5 //transparency for features filling
 ,styleView: "centered" //rendering style, either "centered", "centeredvariants" or "nonoverlapping" are allowed
 ,categoryIndex: 0 //if this component is used for multiple categories, what category is this instance showing?

 For types, the following options are optional, if not provided, a default value will be assigned:
 categoryIndex: 0 //if this component is used for multiple types belonging to the same category, what type is this instance showing?

 For categories, the option "category" should provide a label "category", and array of types "types".
 If the category corresponds to a Natural Variant category, it should have a label "category", and an array of variants "variants"

 For types, the option "category" should provide a type id "type", a label "label", and an array of "locations".

 For more information about category and type objects, please refer to the dictionary provided.
 */
var ProteinCategoryFTViewer;
 
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
    //default options
    _defaultOptions = {
        width: 1200
        ,darkBackground: true
        ,useShapes: true //regardless the value, if it is variant track then 'useShapes' will be set to false
        ,useTooltips: false
        ,clickable: true
        ,clickableStyle: true
        ,collapsible: false //regardless the value, if it is a type track then 'collapsible' will be set to false
        ,ftHeight: 10
        ,transparency: 0.5
        ,styleView: "centered"
    }
    /**
     * Mandatory options that should be provided
     * target: It has a default value but the real one must be provided
     * sequence: Protein sequence
     * category: Category with types, locations, and features
     * categoryIndex
     *
     * Optional options that should be provided
     * typeIndex: For types rather than categories
     *
     * Calculated options
     * myArrayIndex: So we will keep instances independent
     * sequenceLength:
     */

;
/**
 * Private methods.
 */
var
    /**
     * Constructor, it loads the default values for the options and initializes some class attributes.
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
        _instanceArray[_instanceIndex]._ftPosAndHeight = {
            position: {yLine: 31, hLine: 20, y: 10},
            bridge: {y: 31, h: 15},
            continuous: {y: 31, h: 10}
        };
        _instanceArray[_instanceIndex]._stylingOpt = {};
        if (_instanceArray[_instanceIndex].opt.clickable === true) {
            _instanceArray[_instanceIndex].opt.clickableStyle = true;
        }
        if (FTVUtils.isVariantsTrack(self.opt.category)) {
            self.opt.useShapes = false;
        }
        if (FTVUtils.getTrackMode(self.opt.category) === FTVUtils.trackModes.type) {
            self.opt.collapsible = false;
        }
        self._hasBeenOpen = false;
        //init layout and paint all
        _createContainers(self);
        _init(self);
        _initPainting(self);
    },
    /**
     * Create a container inside self.opt.element for this category/type; if this is a category and collapsible, it also creates a secondary container for the category types.
     * @param self
     * @private
     */
    _createContainers = function(self) {
        var targetID = FTVUtils.ID_CLASS_PREFIX + (new Date().getTime());
        if (self.opt.element == undefined) {
            d3.select("body").append("div").attr("id", targetID);
            self.opt.element = document.getElementById(targetID);
        }
        self.opt.categoryIndex = self.opt.categoryIndex == undefined ? 0 : self.opt.categoryIndex;
        if (FTVUtils.getTrackMode(self.opt.category) === FTVUtils.trackModes.category) {
            targetID = targetID  + "_category_" + self.opt.categoryIndex;
            d3.select(self.opt.element).append("div").attr("id", targetID);
            self.opt.collapsedElement = document.getElementById(targetID);
            if (self.opt.collapsible === true) {
                d3.select(self.opt.element).append("div").attr("id", targetID + "_myTypes");
                self.opt.uncollapsedElement = document.getElementById(targetID + "_myTypes");
            }
        } else {
            self.opt.typeIndex = self.opt.typeIndex == undefined ? 0 : self.opt.typeIndex;
            targetID = targetID  + "_category_" + self.opt.categoryIndex + "_type_" + self.opt.typeIndex;
            d3.select(self.opt.element).append("div").attr("id", targetID);
            self.opt.collapsedElement = document.getElementById(targetID);
        }
        self.opt.target = targetID;
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
        } else {
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
            if (self._categoryContains(FTVUtils.getFTLocation().position)) {//we have shapes
                if (self._categoryContains(FTVUtils.getFTLocation().continuous))  {//also rectangles
                    if (self._categoryContains(FTVUtils.getFTLocation().bridge)) {//also bridges
                        self._svgBottomGap = -1;
                    } else {//but not bridges
                        self._gapToShape = self._gapToBridge;
                        self._svgBottomGap = -1;
                    }
                } else {//not rectangles
                    if (self._categoryContains(FTVUtils.getFTLocation().bridge)) {//but bridges
                        self._svgBottomGap = -1;
                    } else {//not bridges either
                        self._gapToShape = self._gapToBridge;
                        self._svgBottomGap = 0;
                    }
                }
                //the extra space that shapes will take when zoomed in
                self._sequenceLine = self.opt.ftHeight + self._gapToShape + FTVUtils.getMaxShapeSize() + 6;// + _margin.top + Math.floor(FTVUtils.getMaxShapeSize()/2);
            } else if (self._categoryContains(FTVUtils.getFTLocation().bridge)) {//no shapes but bridges (and possible rectangles)
                self._sequenceLine = self.opt.ftHeight + self._gapToBridge + 4;// + _margin.top;
                self._svgBottomGap = -1;
            } else { //only rectangles
                self._sequenceLine = self.opt.ftHeight + 4; // _margin.top;
                self._svgBottomGap = -1.5;
            }
        } else {
            if (self._categoryContains(FTVUtils.getFTLocation().bridge)) {//bridges (and possibly rectangles)
                self._sequenceLine = self.opt.ftHeight + self._gapToBridge + 4; //+ _margin.top;
                self._svgBottomGap = -1;
            } else { //only rectangles
                self._sequenceLine = self.opt.ftHeight + 4; //we need 2 extra pixels for borders, but 4 actually looks better
                self._svgBottomGap = -1.5;
            }
        }
        var titleHeight = FTVUtils.getTrackMode(self.opt.category) === "category"
            ? FTVUtils.calculateTextHeightDIV(FTVUtils.getTrackTitle(self.opt.category), FTVUtils.ID_CLASS_PREFIX + "categoryTitle", FTVUtils.getTitlesWidth(self.opt.collapsible))
            : FTVUtils.calculateTextHeightDIV(FTVUtils.getTrackTitle(self.opt.category), FTVUtils.ID_CLASS_PREFIX + "categoryTitleNoCollapsible", FTVUtils.getTitlesWidth(self.opt.collapsible));
        var titleNeededHeight = Math.max(FTVUtils.getMinimumTitlesHeight(), titleHeight + FTVUtils.getTitlesPadding());
        if ( self._sequenceLine < titleNeededHeight) {
            self._sequenceLine = titleNeededHeight;
        }
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
            .classed(FTVUtils.ID_CLASS_PREFIX + "tooltip", true)
            .style("opacity", 1e-6);
        //category container, i.e., category row
        var categoryRow = target.append("div")
                .classed(FTVUtils.ID_CLASS_PREFIX + "category", true)
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
                    return FTVUtils.ID_CLASS_PREFIX + "categoryTitle";
                } else {
                    return FTVUtils.ID_CLASS_PREFIX + "categoryTitleNoCollapsible";
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
                    return (FTVUtils.ID_CLASS_PREFIX + "categoryFeaturesDark " + FTVUtils.ID_CLASS_PREFIX + "categoryFeatures");
                } else {
                    return (FTVUtils.ID_CLASS_PREFIX + "categoryFeaturesLight " + FTVUtils.ID_CLASS_PREFIX + "categoryFeatures");
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
        if (FTVUtils.isVariantsTrack(self.opt.category)) {
            //TODO variants
        } else {
            _paintRegularFeatures(self);
        }
        //Paint anything additional depending on style view
        CategoryPaintingHelper.paintFeatures(self);
    },
    /**
     * Paints all kind of features but variants.
     * @param self
     * @private
     */
    _paintRegularFeatures = function(self) {
        var types = FTVUtils.getTrackTypes(self.opt.category);
        _.each(types, function(type, posType) {
            var typeClass = FTVUtils.stringToClass(type.type);
            // We are selecting everything inside the target div that is a path with class typeClass...
            // if we have the same class more than once, it will not work, see d3 enter, remove, update.
            _.each(type.locations, function(location, posLoc) {
                var locationType = FTVUtils.stringToClass(location.locationType);
                self._featureSVGGroup.selectAll("#" + self.opt.target + " path." + typeClass + "." + locationType)
                    .data(function() {
                        //if (location.filteredFeatures != undefined) {
                        //    return location.filteredFeatures;
                        //} else {
                            return location.features;
                        //}
                    }).enter().append("path")
                    .attr("class", function (feature) {
                        if (feature.color != undefined) {
                            d3.select(this).style("fill", feature.color);
                            d3.select(this).style("stroke", feature.color);
                        }
                        return locationType + " " + typeClass;
                    })
                    .attr("id", function (feature) {
                        return FTVUtils.ID_CLASS_PREFIX + feature.ftid + "_index_" + self.opt.myArrayIndex;
                    })
                    .attr("index", function (feature, position) {
                        feature.categoryIndex = self.opt.categoryIndex;
                        feature.typeIndex = self.opt.typeIndex != undefined ? self.opt.typeIndex : posType;
                        feature.locationIndex = posLoc;
                        feature.featureIndex = position;
                        return self.opt.myArrayIndex;
                    })
                    .attr("tooltip", function (feature) {
                        return FTVUtils.getFeatureTooltipText(type, location.locationType, feature, self);
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
                        self._onMouseOverFeature(self, this, feature);
                    })
                    .on("mousemove", function () {
                        if (self.opt.useTooltips == true) {
                            FTVUtils.mousemove(self._tooltipdiv);
                        }
                    })
                    .on("mouseout", function (feature) {
                        self._onMouseOutFeature(self, this, feature);
                    })
                    .on("click", function(feature) {
                        self._onClickFeature(self, this, feature);
                    })
                ;
            });
        });
    },
    /**
     * Zooms in/out the features;
     * if an amino acid position is specified, after zooming-in features are translated to that aa;
     * if triggerEvent is true the zoom event is triggered;
     * if propagateToTypes is true then zoomInOut is propagated to types (without recursive propagation)
     * this function is provided so the triggerEvent parameter can be hidden in the public method.
     * @param self
     * @param moveToAA
     * @param triggerEvent
     * @param propagateToTypes
     * @private
     */
    _zoomInOut = function (self, moveToAA, triggerEvent, propagateToTypes) {
        if ((propagateToTypes === true) && (self._instances.length !== 0)) {
            _.each(self._instances, function(instance) {
                instance._zoomed = self._zoomed;
                instance._currentFirstVisibleAA = self._currentFirstVisibleAA;
                _zoomInOut(instance, moveToAA, false, false);
            });
        }
        if (self._zoomed === false) {//it is zoomed out, then zoom it in, i.e, go to detailed view
            self._svgWidthWithMargin = self.opt.width - FTVUtils.getTitlesWidth();
            var tempWidth = self.opt.sequenceLength * FTVUtils.getMaxPixelAA() + self._margin.left + self._margin.right;
            self._xScale = d3.scale.linear()
                .domain([1, self.opt.sequenceLength + 1])
                .range([self._margin.left, tempWidth - self._margin.right]);
            self._pixelPerAA = self._xScale(2) - self._xScale(1);
            self._featuresDiv.style("width", self._svgWidthWithMargin + "px");
            self._featureSVG.attr("width", self._svgWidthWithMargin);
            self._zoomed = true;
            if (triggerEvent !== false) {
                self.trigger('zoomIn', {category: self.opt.category});
            }
        } else {// it is zoomed in then zoom out, i.e., i.e., go to overview
            self._svgWidthWithMargin = self.opt.width - FTVUtils.getTitlesWidth();
            _initScale(self);
            self._featuresDiv.style("width", self._svgWidthWithMargin + "px");
            self._featureSVG.attr("width", self._svgWidthWithMargin);
            self._zoomed = false;
            if (triggerEvent !== false) {
                self.trigger('zoomOut', {category: self.opt.category});
            }
        }
        _paintFeatures(self);
        if (moveToAA != undefined) {
            _translate(self, moveToAA, false);
        } else {
            self._featureSVGGroup.attr("transform", "translate(0," + self._svgBottomGap + ")");
            self._currentFirstVisibleAA = 0;
        }
    },
    /**
     * Translates the features to a given amino acid position;
     * depending on propagateToTypes parameter value, translation will be or not propagated to types
     * (when this function is called from _zoomInOut there is not need to propagate because zoom is propagated there --zoom calls translation);
     *  this function is provided so the propagateToTypes parameter will be avoided in the public method.
     * @param self
     * @param moveToAA
     * @param propagateToTypes
     * @private
     */
    _translate = function (self, moveToAA, propagateToTypes) {
        if (self._zoomed === false) {//it is zoomed out, nothing to move, go to (0,0)
            self._featureSVGGroup.attr("transform", "translate(0," + self._svgBottomGap + ")");
            self._currentFirstVisibleAA = 0;
        } else if ((moveToAA != undefined) && (moveToAA !== self._currentFirstVisibleAA)) {//it is zoomed in, move to AA
            //what is the maximum pixel to be the first one (most to the left) displayed on the visible portion of the category?
            var usablePixels = self._svgWidthWithMargin - self._margin.left - self._margin.right - FTVUtils.getMaxPixelAA();
            var visibleAA = usablePixels / FTVUtils.getMaxPixelAA();
            var firstMaxVisibleAA = self.opt.sequence.length - visibleAA;
            var firstMaxVisiblePixel = -(self._xScale(firstMaxVisibleAA));// - FTVUtils.getMaxPixelAA());
            var xPan = -(self._xScale(moveToAA) - self._margin.left);
            if ((firstMaxVisiblePixel <= xPan) && (xPan <= 0)) {
                self._featureSVGGroup.attr("transform", "translate(" + xPan + "," + self._svgBottomGap + ")");
            } else if (firstMaxVisiblePixel > xPan) {
                self._featureSVGGroup.attr("transform", "translate(" + firstMaxVisiblePixel + "," + self._svgBottomGap + ")");
            } else {
                self._featureSVGGroup.attr("transform", "translate(0," + self._svgBottomGap + ")");
            }
            self._currentFirstVisibleAA = moveToAA;
        }
        if (propagateToTypes === true) {
            _.each(self._instances, function(instance) {
                instance._zoomed = self._zoomed;
                instance._currentFirstVisibleAA = self._currentFirstVisibleAA;
                instance.translate(moveToAA);
            });
        }
    },
    /**
     * Opens a category and displays the types; if this category has not been previously open, it creates the type instances;
     * it also propagates zoom, translation, and selection from the category to the types.
     * @param self Category instance.
     * @private
     */
    _openCategory = function(self) {
        //hide category features
        var d3CollapsedElement = d3.select(self.opt.collapsedElement);
        _showHideElements(d3CollapsedElement, "div." + FTVUtils.ID_CLASS_PREFIX + "categoryFeatures", "none", true);
        //show type features
        var d3UncollapsedElement = d3.select(self.opt.uncollapsedElement);
        _showHideElements(d3UncollapsedElement, "div." + FTVUtils.ID_CLASS_PREFIX + "category", self._categoryDivDisplay, false);

        //create the features if not previously shown
        if (self._hasBeenOpen !== true) {
            self._hasBeenOpen = true;
            _.each(self.opt.category.types, function(type, posType) {
                var myInstance = new ProteinCategoryFTViewer({
                    element: self.opt.uncollapsedElement
                    ,darkBackground: self.opt.darkBackground
                    ,width: self.opt.width
                    ,useShapes: self.opt.useShapes
                    ,useTooltips: self.opt.useTooltips
                    ,clickable: self.opt.clickable
                    ,clickableStyle: self.opt.clickableStyle
                    ,collapsible: false
                    ,ftHeight: self.opt.ftHeight
                    ,transparency: self.opt.transparency
                    ,sequence: self.opt.sequence
                    ,category: self.opt.category.types[posType]
                    ,categoryIndex: self.opt.categoryIndex
                    ,typeIndex: posType
                    ,styleView: FTVUtils.styleViews.nonOverlapping
                });
                self.opt.category.types[posType] = myInstance.opt.category;
                self._instances.push(myInstance);
                //propagates zoom and translation
                if (self._zoomed === true) {
                    myInstance._zoomed = false;
                    myInstance._currentFirstVisibleAA = 0;
                    _zoomInOut(myInstance, self._currentFirstVisibleAA, false, false);
                } else {
                    myInstance._zoomed = self._zoomed;
                    myInstance._currentFirstVisibleAA = self._currentFirstVisibleAA;
                }
                if ((self._currentSelectedFeature != undefined) && (self._currentSelectedFeature.typeIndex === posType)){
                    d3.select(self._currentSelectedSVG).style("fill-opacity", self.opt.transparency);
                    self._currentSelectedSVG = document.getElementById(FTVUtils.ID_CLASS_PREFIX + self._currentSelectedFeature.ftid + "_index_" + myInstance.opt.myArrayIndex);
                    d3.select(self._currentSelectedSVG).style("fill-opacity", 1);
                }
            });
        } else {//types exist, only selection should be updated
            if (self._currentSelectedFeature != undefined) {
                var myInstance = _.find(self._instances, function(type, posType) {
                    return self._currentSelectedFeature.typeIndex === posType;
                });
                if (myInstance != undefined) {
                    d3.select(self._currentSelectedSVG).style("fill-opacity", self.opt.transparency);
                    self._currentSelectedSVG = document.getElementById(FTVUtils.ID_CLASS_PREFIX + self._currentSelectedFeature.ftid + "_index_" + myInstance.opt.myArrayIndex);
                    d3.select(self._currentSelectedSVG).style("fill-opacity", 1);
                }
            }
        }
    },
    /**
     * Closes types so only the category overview is displayed; it also propagates selection done in the types.
     * @param self Category instance.
     * @private
     */
    _closeCategory = function(self) {
        //show category features
        var d3CollapsedElement = d3.select(self.opt.collapsedElement);
        _showHideElements(d3CollapsedElement, "div." + FTVUtils.ID_CLASS_PREFIX + "categoryFeatures", self._categoryDivDisplay, false);
        //hide type features
        var d3UncollapsedElement = d3.select(self.opt.uncollapsedElement);
        _showHideElements(d3UncollapsedElement, "div." + FTVUtils.ID_CLASS_PREFIX + "category", "none", true);
        //propagate selection from types to category
        if (self._currentSelectedFeature != undefined) {
            d3.select(self._currentSelectedSVG).style("fill-opacity", self.opt.transparency);
            self._currentSelectedSVG = document.getElementById(FTVUtils.ID_CLASS_PREFIX + self._currentSelectedFeature.ftid + "_index_" + self.opt.myArrayIndex);
            d3.select(self._currentSelectedSVG).style("fill-opacity", 1);
        }
    },
    /**
     * Shows or hides an element using the display option, and assigns the class hidden to the element;
     * the coherence between display and hidden options are left to the caller.
     * @param element
     * @param selector
     * @param display
     * @param hidden
     * @private
     */
    _showHideElements = function(element, selector, display, hidden) {
        element.selectAll(selector)
            .style("display", display)
            .classed(FTVUtils.ID_CLASS_PREFIX + "hiddenCategory", hidden)
        ;
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
ProteinCategoryFTViewer.prototype._stylingOpt = undefined;
//SVG group
ProteinCategoryFTViewer.prototype._featureSVGGroup = undefined;
//Zoom and translation state (propagate on opening)
ProteinCategoryFTViewer.prototype._zoomed = false;
ProteinCategoryFTViewer.prototype._currentFirstVisibleAA = 0;
//Selected elements (propagate on opening)
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
//Has been this track already opened/uncollapsed?
ProteinCategoryFTViewer.prototype._hasBeenOpen = false;
//type instances (if category is collapsible it will be used)
ProteinCategoryFTViewer.prototype._instances = [];

 
//*****
// Protected methods
//*****
/**
 * Paints the features for this category/type.
 * @param self This instance.
 * @param caller Element that called this method.
 * @param feature Clicked feature.
 * @protected
 */
ProteinCategoryFTViewer.prototype._onClickFeature = function _onClickFeature(self, caller, feature, triggerEvent) {
    if (triggerEvent !== false) {
        self.trigger('featureClicked', {feature: feature, svgElemID: caller.id});
    }
    if (self.opt.clickable === true) {
        if (feature.selected === true) { //we are clicking the same, deselect
            feature.selected = false; //colour will be changed on the mouseout
            self._currentSelectedFeature.selected = false;
            self._currentSelectedFeature = undefined;
            self._currentSelectedSVG = undefined;
            if (triggerEvent !== false) {
                self.trigger('featureUnselected', {feature: feature, svgElemID: caller.id});
            }
        } else { //we are clicking on another one, deselect the previous one, select the current one
            if (self._currentSelectedFeature != undefined) {//there was a previous selection, deselect it
                d3.select(self._currentSelectedSVG).style("fill-opacity", self.opt.transparency);
                self._currentSelectedFeature.selected = false;
                if (triggerEvent !== false) {
                    self.trigger('featureUnselected', {feature: self._currentSelectedFeature, svgElemID: self._currentSelectedSVG.id});
                }
                self._currentSelectedFeature = undefined;
                self._currentSelectedSVG = undefined;
            }
            //color was changed on the mouseover and will not be restore on the mouseout
            feature.selected = true;
            self._currentSelectedFeature = feature;
            self._currentSelectedSVG = caller;
            if (triggerEvent !== false) {
                self.trigger('featureSelected', {feature: feature, svgElemID: caller.id});
            }
        }
        console.log(self._currentSelectedFeature);
        console.log(self._currentSelectedSVG);
    }
};
/**
 * Paints the features for this category/type.
 * @param self This instance.
 * @param caller Element that called this method.
 * @param feature Mouse out feature.
 * @protected
 */
ProteinCategoryFTViewer.prototype._onMouseOutFeature = function _onMouseOutFeature(self, caller, feature) {
    var elem = d3.select(caller);
    if (feature.selected != true) {
        elem.style("fill-opacity", self.opt.transparency);
    }
    if (self.opt.useTooltips == true) {
        FTVUtils.mouseout(self._tooltipdiv);
    }
    self.trigger('featureOff', {feature: feature, svgElem: caller});
};
/**
 * Paints the features for this category/type.
 * @param self This instance.
 * @param caller Element that called this method.
 * @param feature Mouse ver feature.
 * @protected
 */
ProteinCategoryFTViewer.prototype._onMouseOverFeature = function _onMouseOverFeature(self, caller, feature) {
    var elem = d3.select(caller);
    elem.style("fill-opacity", 1);
    if (self.opt.useTooltips == true) {
        FTVUtils.mouseover(self._tooltipdiv, elem.attr("tooltip"));
    }
    self.trigger('featureOn', {feature: feature, svgElem: caller});
};
/*
 * Calculates (x,y) coordinate for a feature. It takes into account the location class for the feature and
 * whether or not shapes are used for FT-SingleAA. For rectangles-like features it calculates also de height
 * and width while for other shapes it calculates also the (x,y) coordinate for the attached line
 * as well as its height
 * @param locationType (without any prefix, just as it comes from the JSON file)
 * @param feature
 * @protected
 */
ProteinCategoryFTViewer.prototype._calculatePosition = function _calculatePosition(locationType, feature) {
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

/*
 * Informs (true or false) whether a category contains any feature with a given location class.
 * @param self This instance.
 * @param ftClass Feature location type.
 * @protected
 * */
ProteinCategoryFTViewer.prototype._categoryContains = function _categoryContains(ftClass) {
    if (FTVUtils.isVariantsTrack(this.opt.category)) {
        return false; //Variants do not have location classes for features.
    } else {
        var types = FTVUtils.getTrackTypes(this.opt.category);
        var existence = _.some(types, function(type) {
            return _.some(type.locations, function(location) {
                return (location.locationType) === ftClass;
            });
        });
        return existence;
    }
};

//*****
// Public methods
//*****
/**
 * Zooms in or out the features displayed.
 * @param moveToAA Zoom and then move to the given amino acid.
 */
ProteinCategoryFTViewer.prototype.zoomInOut = function zoomInOut(moveToAA) {
    _zoomInOut(this, moveToAA, true, true);
};
 
/**
 * Translates a category to a given coordinate.
 * @param moveToAA First amino acid to be displayed.
 */
ProteinCategoryFTViewer.prototype.translate = function translate(moveToAA) {
    _translate(this, moveToAA, true);
};
 
/**
 * Opens a category so the arrow on the left changes to pointer-down;
 * an event informing category, component container, and category div background is raised.
 */
ProteinCategoryFTViewer.prototype.open = function open() {
    if (this.opt.collapsible === true) {
        var text = this._categoryRowTitleDiv.text();
        if (text.charAt(0) === _arrowRight) { //it is closed >, it makes sense to open it
            this._categoryRowTitleDiv.text(_arrowDown + " " + FTVUtils.getTrackTitle(this.opt.category));
            _openCategory(this);
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
        if (text.charAt(0) != _arrowRight) { //it is not closed ^, it makes sense to close it
            this._categoryRowTitleDiv.text(_arrowRight + " " + FTVUtils.getTrackTitle(this.opt.category));
            _closeCategory(this);
            this.trigger('categoryClose', {category: this.opt.category, target: this.opt.target});
        }
    }
};

/**
 * Applies filters.
 * @param filters Filters that should be applied. So far the only filter supported is "evidence".
 * For instance: {
 *     evidence: {manual: true/false, automatic: true/false, unknown: true/false},
 *     another_filter_not_yet_supported: {xxx: true/false, yyy: true/false}
 * }
 */
ProteinCategoryFTViewer.prototype.filter = function filter(filters) {
    if (filters == undefined) {
        return;
    }
    var types = FTVUtils.getTrackTypes(this.opt.category);
    _.each(types, function(type, posType) {
        _.each(type.locations, function(location, posLoc) {
            location.filteredFeatures = [];
            _.each(location.features, function(feature, posFT) {
                if (filters.evidence != undefined) {
                    if ((filters.evidence.manual === true) && (FTVUtils.isManualEvidence(feature.evidence))){
                        location.filteredFeatures.push(feature);
                    }
                    if ((filters.evidence.automatic === true) && (FTVUtils.isAutomaticEvidence(feature.evidence))){
                        location.filteredFeatures.push(feature);
                    }
                    if ((filters.evidence.unknown === true) && (FTVUtils.isUnknownEvidence(feature.evidence))){
                        location.filteredFeatures.push(feature);
                    }
                }
            });
        });
    });
    _paintFeatures(this);
    this.trigger('filter', {category: this.opt.category, filters: filters});
};
 
require('biojs-events').mixin(ProteinCategoryFTViewer.prototype);