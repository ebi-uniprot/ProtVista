var _ = require("underscore");
var d3 = require("d3");
var FTVUtils = require("./pftv-aux-utils");
var CenteredCategory = require("./pftv-aux-centeredProteinCategoryFTViewer");
//var nonOverlapping = require("./pftv-aux-nonOverlappingProteinCategoryFTViewer.js");
/*
 * biojs-vis-proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

/**
@class biojs-vis-proteinFeaturesViewer
 */
var  ProteinFeaturesViewer;

module.exports = ProteinFeaturesViewer = function(options){
    constructor(this, options);
};

/**
 * Private zone
 */
/*
 * Private variables
 * */
var
    _defaultOptions = {
        target: "YourOwnDivId"
        ,width: 600
        ,useShapes: true
        ,useTooltips: false
        ,clickable: true
        ,zoomable: true
        ,ftHeight: 10
        ,transparency: 0.5
    },
    //display for buttons
    _buttonDisplay = "inline-block",
    //combined with the category target will be used as a property to figure out whether a category has been opened already
    _hasBeenOpenedProp = "_hasBeenOpen"
;
/*
 * Private methods
 * */
var
    /**
     * Constructor, it loads the default values for the options.
     * @params options Configuration options.
     */
    constructor = function(self, options) {
        console.log(FTVUtils.greetingsTest("me"));
        //Do we have something to show?
        var allEmpty = _.every(options.featuresModel.categories, function(category) {
            return _.every(category.types, _.isEmpty);
        });
        if (allEmpty === true) {
            d3.select("#" + options.target).text("No features available for this protein");
        } else {
            //copy the options
            self.opt = _.extend(_.extend({}, _defaultOptions), options);
            _init(self);
        }
    },

    /**
     * Initializes the private variables and layout, including div/svg for controls and categories.
     * @private
     * */
    _init = function(self) {
        d3.select("body")
            .on("click", function() {
                var origin = d3.event.target.className;
                if (typeof origin === "object") {
                    origin = origin.baseVal;
                }
                if ((origin === undefined) || (origin.indexOf("noBodyClick") === -1)) {
                    self._settingsDiv
                        .style("opacity", 1e-6)
                        .style("z-index", -1);
                }
            });
        //tooltip
        self._tooltipdiv = d3.select("#" + self.opt.target).append("div")
            .classed("tooltip", true)
            .style("opacity", 1e-6);
        self._settingsDiv = d3.select("#" + self.opt.target).append("div")
            .classed("dialog noBodyClick", true)
            .style("opacity", 1e-6)
            .style("z-index", -1);
        self._settingsDiv.append("div").classed("clickable spriteCloseX noBodyClick", true)
            .on("click", function() {
                self._settingsDiv
                    .style("opacity", 1e-6)
                    .style("z-index", -1);
            });
        self.opt.featuresModel.sequence = self.opt.featuresModel.sequence.toUpperCase();
        //setting up values
        self._rulerMargin = {
            top: FTVUtils.getMaxSeqLengthDisplay().height +  self._draggerGap,
            right: FTVUtils.getMarginLeftRight().right + FTVUtils.getZoomTextGap() - FTVUtils.getTitlesPadding()*2,
            bottom: 0,
            left: FTVUtils.getMarginLeftRight().left + FTVUtils.getTitlesPadding()*2
        };
        var sequenceScale = d3.scale.linear()
            .domain([1, self.opt.featuresModel.sequence.length + 1])
            .range([self._rulerMargin.left, (self.opt.width - FTVUtils.getTitlesWidth()) - self._rulerMargin.right]);
        self._pixelPerAA = sequenceScale(2) - sequenceScale(1);
        if ( self._pixelPerAA > FTVUtils.getMaxPixelAA()) {
            self.opt.width = self.opt.featuresModel.sequence.length * FTVUtils.getMaxPixelAA() + FTVUtils.getTitlesWidth() + self._rulerMargin.left + self._rulerMargin.right;
            sequenceScale = d3.scale.linear().
                domain([1, self.opt.featuresModel.sequence.length + 1])
                .range([self._rulerMargin.left, (self.opt.width - FTVUtils.getTitlesWidth()) - self._rulerMargin.right]);
             self._pixelPerAA = sequenceScale(2) - sequenceScale(1);
        }
        //init ruler, controls, categories, sequence
        var rulerWidthWithMargin =  _initMasterControlDiv(self);
        _initCategories(self);
        _initSecondaryControlDiv(self, rulerWidthWithMargin);
        //As the sequence is duplicated top and bottom, we have to wait until having both control divs
        _initSeqAASVG(self, rulerWidthWithMargin);
    },
    /**
     * Initializes the master control panel at the top.
     * @private
     */
    _initMasterControlDiv = function(self) {
        //div with titles, controls, and ruler
        var controlDiv = d3.select("#" + self.opt.target)
            .append("div")
            .classed("control", true)
            .style("width", self.opt.width + "px");

        //first row: accession and controls
        var controlDivUp = controlDiv.append("div")
            .classed("row", true)
            .style("width", self.opt.width + "px");
         _initAccession(self, controlDivUp);
         _initControls(self, controlDivUp);

        //second row: identifier and then ruler and aa sequence
        var controlDivDown = controlDiv.append("div")
            .classed("row", true)
            .style("width", self.opt.width + "px");
         _initIdentifier(self, controlDivDown);
        var controlDivDownRight = controlDivDown.append("div")
            .classed("cell", true)
            .style("width", (self.opt.width - FTVUtils.getTitlesWidth()) + "px");
        var rulerWidthWithMargin =  _initRulerDiv(self, controlDivDownRight);
         _initAASeqDiv(self, controlDivDownRight, rulerWidthWithMargin);
        return rulerWidthWithMargin;
    },
    /**
     * Initializes the protein accession.
     * @param controlDiv
     * @private
     */
    _initAccession = function(self, controlDivUp) {
        controlDivUp.append("div")
            .classed("cell accession", true)
            .style("width", FTVUtils.getTitlesWidth() + "px")
            .text(self.opt.featuresModel.accession);
    },
    /**
     * Initializes the controls (zoom, TODO download, upload, legend).
     * @param controlDiv
     * @private
     */
    _initControls = function(self, controlDivUp) {
        var controlDivUpRight = controlDivUp.append("div")
            .classed("cell", true)
            .style("width", (self.opt.width-FTVUtils.getTitlesWidth()) + "px");
        var leftControlDivUpRight = controlDivUpRight.append("div").classed("left", true);
        self._zoomInButton = _initZoomButton(self, self._zoomInButton, leftControlDivUpRight, "zoomInButton", "spriteZoomIn", true);
        self._zoomOutButton = _initZoomButton(self, self._zoomOutButton, leftControlDivUpRight, "zoomOutButton", "spriteZoomOut", false);
        self._moveLeftButton = _initMoveButton(self, self._moveLeftButton, leftControlDivUpRight, "moveLeftButton", "spriteMoveLeft", "move-left", "Move current display 50% left");
        self._moveRightButton = _initMoveButton(self, self._moveRightButton, leftControlDivUpRight, "moveRightButton", "spriteMoveRight", "move-right", "Move current display 50% right");
        var rightControlDivUpRight = controlDivUpRight.append("div").classed("right", true);
        self._openAllButton = _initAllButton(self, self._openAllButton, rightControlDivUpRight, "openAllButton", "spriteOpenAll", "open-all", true);
        self._closeAllButton = _initAllButton(self, self._closeAllButton, rightControlDivUpRight, "closeAllButton", "spriteCloseAll", "close-all", false);
        self._settingsButton = rightControlDivUpRight.append("div")
            .attr("id", "settingsButton")
            .classed("clickable spriteSettings noBodyClick", true)
            .style("display",  _buttonDisplay)
            .on("click", function() {
                if (self._debug === true) self._debugTrace += ", settings";
                self._settingsDiv
                    .style("opacity", 1)
                    .style("z-index", 10);
            });
        self._helpButton = rightControlDivUpRight.append("div")
            .attr("id", "helpButton")
            .classed("clickable spriteHelp", true)
            .style("display",  _buttonDisplay)
            .on("click", function() { //TODO real onclick
                if (self._debug === true) {
                    self._debugTrace += ", STOP";
                    console.log(self._debugTrace);
                    self._debugTrace = "INIT";
                }
            });
    },
    /**
     * Initializes the zoom in/out buttons.
     * @param zoomButton
     * @param leftControlDivUpRight
     * @param id
     * @param spriteId
     * @param display
     * @returns {*}
     * @private
     */
    _initZoomButton = function(self, zoomButton, leftControlDivUpRight, id, spriteId, display) {
        zoomButton = leftControlDivUpRight.append("div")
            .attr("id", id)
            .classed("clickable " + spriteId, true)
            .on("click", function() {
                if (self._debug === true) self._debugTrace += ", on-click-zoom-out-button";
                ProteinFeaturesViewer.zoomInOut();
            });
        if (display === false) {
            zoomButton.style("display", "none")
        }
        return zoomButton;
    },
    /**
     * Initializes the move right/left buttons.
     * @param moveButton
     * @param leftControlDivUpRight
     * @param id
     * @param spriteId
     * @param debugText
     * @param tooltipText
     * @private
     */
    _initMoveButton = function(self, moveButton, leftControlDivUpRight, id, spriteId, debugText, tooltipText) {
        moveButton = leftControlDivUpRight.append("div")
            .attr("id", id)
            .classed("clickable " + spriteId, true)
            .style("display", "none")
            .on("click", function() {
                if (self._zoomed === true) {
                    if (self._debug === true) self._debugTrace += ", " + debugText;
                    ProteinFeaturesViewer
                        .translate(self._slide(true));
                }
            })
            .on("mouseover", function() {
                FTVUtils.mouseover(self._tooltipdiv, tooltipText);
            })
            .on("mousemove", function() {
                FTVUtils.mousemove(self._tooltipdiv);
            })
            .on("mouseout", function() {
                FTVUtils.mouseout(self._tooltipdiv);
            })
        ;
    },
    /**
     * Initializes the open/close all buttons.
     * @param allButton
     * @param rightControlDivUpRight
     * @param id
     * @param spriteId
     * @param debugText
     * @param open
     * @private
     */
    _initAllButton = function(self, allButton, rightControlDivUpRight, id, spriteId, debugText, open) {
        allButton = rightControlDivUpRight.append("div")
            .attr("id", id)
            .classed("clickable " + spriteId, true)
            .style("display", _buttonDisplay)
            .on("click", function() {
                if (self._debug === true) {
                    self._debugTrace += ", " + debugText;
                }
                if (open === true) {
                    _.each(self._instances, function(instance) {
                        instance.open();
                    });
                } else {
                    _.each(self._instances, function(instance) {
                        instance.close();
                    });
                }
            });
    },
    /**
     * Initializes the protein identifier.
     * @param controlDivDown
     * @private
     */
    _initIdentifier = function(self, controlDivDown) {
        controlDivDown.append("div")
            .classed("cell identifier", true)
            .style("width", FTVUtils.getTitlesWidth() + "px")
            .text(self.opt.featuresModel.identifier.toUpperCase());
    },
    /**
     * Initializes all the elements related to the ruler.
     * @param controlDivDown
     * @private
     */
    _initRulerDiv = function(self, controlDivDownRight) {
        //Second row of controls: protein identifier and ruler
        var controlDivDownRightRuler = controlDivDownRight.append("div")
            .classed("row", true)
            .style("width", (self.opt.width - FTVUtils.getTitlesWidth()) + "px");
        var rulerWidthWithMargin = Math.floor((self.opt.width - FTVUtils.getTitlesWidth()) -  self._pixelPerAA);
        //init rows
        _initRulerSVG(self, controlDivDownRightRuler, rulerWidthWithMargin);
        return rulerWidthWithMargin;
    },
    /**
     * Initializes the amino acids sequence.
     * @param controlDivDown
     * @private
     */
    _initAASeqDiv = function(self, controlDivDownRight) {
        var temp = controlDivDownRight.append("div")
            .classed("row seqContainer", true)
            .style("width", (self.opt.width - FTVUtils.getTitlesWidth()) + "px");
         self._controlAASeqDivDisplay = temp.style("display");
        temp.style("display", "none");
    },
    /**
     * Initializes the categories.
     * @private
     */
    _initCategories = function(self) {
        var dark = true;
        _.each(self.opt.featuresModel.categories, function(category, posCat) {
            var internalDiv = self._settingsDiv.append("div")
                .classed("noBodyClick", true);
            internalDiv.append("input")
                .attr("id", "check_category_" + posCat)
                .classed("noBodyClick", true)
                .attr("index", posCat)
                .attr("type", "checkbox")
                .attr("checked", true)
                .on("click", function() {
                    if (ProteinFeaturesViewer.checked === true) {
                        d3.selectAll("div[id^='target_category_" + d3.select(this).attr("index") + "']")
                            .style("display", self._categoryDivDisplay); //show all categories and types
                        d3.selectAll("#target_category_" + d3.select(this).attr("index") + " div.hiddenCategory")
                            .style("display", "none"); //hide category if closed
                        d3.selectAll("div[id^='target_category_" + d3.select(this).attr("index") + "_type_']" + ".hiddenCategory")
                            .style("display", "none"); //hide types if closed
                    } else {
                        d3.selectAll("div[id^='target_category_" + d3.select(this).attr("index") + "']")
                            .style("display", "none");
                    }
                });
            internalDiv.append("span")
                .classed("noBodyClick", true)
                .text(category.category);
            var temp = d3.select("#" + self.opt.target)
                .append("div")
                .attr("id", self.opt.target + "_category_" + posCat)
                .attr("index", posCat)
                .classed("category", true);
             self._categoryDivDisplay = temp.style("display");
            _.each(category.types, function(type, posType) {
                d3.select("#" + self.opt.target)
                    .append("div")
                    .attr("id", self.opt.target + "_category_" + posCat + "_type_" + posType)
                    .classed("category " + self.opt.target + "_category_" + posCat, true)
                    .style("display", "none");
            });
            dark = posCat%2 == 0 ? true : false;
            var myInstance = new CenteredCategory({
                target: self.opt.target + "_category_" + posCat
                ,darkBackground: dark
                ,width: self.opt.width
                ,useShapes: self.opt.useShapes
                ,useTooltips: self.opt.useTooltips
                ,clickable: false
                ,zoomable: false
                ,collapsible: true
                ,ftHeight: self.opt.ftHeight
                ,transparency: self.opt.transparency
                ,sequence: self.opt.featuresModel.sequence
                ,category: self.opt.featuresModel.categories[posCat]
                ,categoryIndex: posCat
            });
            //TODO migration
            /*self.opt.featuresModel.categories[posCat] = myInstance.opt.category; //category = myInstance.opt.category;
            myInstance.opt.category[self.opt.target + "_category_" + posCat + _hasBeenOpenedProp] = false;
            myInstance.on("categoryOpen", function(obj) {
                _openCategory(obj.category, obj.target, obj.darkBackground);
            });
            myInstance.on("categoryClose", function(obj) {
                _closeCategory(obj.category, obj.target);
            });
            myInstance.on("featureClicked", function(obj) {
                _onInstanceFeatureClick(obj);
            });
            myInstance.on("featureOn", function (obj) {
                _onInstanceFeatureOn(obj);
            });
            myInstance.on("featureOff", function(obj) {
                _onInstanceFeatureOff(obj);
            }); */
            self._instances.push(myInstance);
        });
         self._settingsDiv
            .style("left", ( self._settingsButton[0][0].offsetLeft - self._settingsDiv[0][0].offsetWidth + 5) + "px")
            .style("top", ( self._settingsButton[0][0].offsetTop + self._settingsButton[0][0].offsetHeight - 5) + "px");
    },
    /**
     * Initializes the secondary control panel at the bottom, only with the sequence.
     * @private
     */
    _initSecondaryControlDiv = function(self, rulerWidthWithMargin) {
        //Secondary control, duplicated sequence
        var secondaryControlDiv = d3.select("#" + self.opt.target)
            .append("div")
            .classed("control", true)
            .style("width", self.opt.width + "px");
        //unique row: empty and ruler
        var secondaryControlDivDown = secondaryControlDiv.append("div")
            .classed("row", true)
            .style("width", self.opt.width + "px");
        secondaryControlDivDown.append("div")
            .classed("cell identifier", true)
            .style("width", FTVUtils.getTitlesWidth() + "px");
        var controlDivDownRight = secondaryControlDivDown.append("div")
            .classed("cell", true)
            .style("width", (self.opt.width - FTVUtils.getTitlesWidth()) + "px");
         _initAASeqDiv(self, controlDivDownRight, rulerWidthWithMargin);
    },
    /* Inits the sequence SVG
     * @param rulerWidthWithMargin
     * @private
     */
    _initSeqAASVG = function (self, rulerWidthWithMargin) {
        var seqAAHeight = FTVUtils.getMaxPixelAA()*3;
        d3.selectAll("div.seqContainer").append("svg")
            .classed("seqSVG", true)
            .attr("width", rulerWidthWithMargin)
            .attr("height", seqAAHeight);

        var sequenceLength = self.opt.featuresModel.sequence.length;
        var maxAminoAcidFontSize = FTVUtils.getMaxAAFontDisplay().width/2;
        var maxAAPositionFontSize = FTVUtils.calculateTextSizeSVG(sequenceLength, ".aminoAcid").width/2;
        d3.selectAll("svg.seqSVG").append("g")
            .classed("seqSVGGroup", true)
            .attr("transform", "translate(" + self._rulerMargin.left + "," + self._rulerMargin.top + ")");
        var aaResidues = d3.selectAll("g.seqSVGGroup").selectAll("text")
            .data(self.opt.featuresModel.sequence).enter()
            .append("text")
            .classed("aminoAcid", true)
            .attr("x", function (d, i) {
                return i*FTVUtils.getMaxPixelAA() + FTVUtils.getMaxPixelAA()/2 - maxAminoAcidFontSize + 2})
            .attr("width", FTVUtils.getMaxPixelAA())
            .attr("tooltip", function(d, i) {return (i+1);})
            .on("mouseover", function(d, i) {
                d3.selectAll(".aminoAcid[tooltip='" + (i+1) + "']").style("stroke", "black");
                //d3.select(this).style("stroke", "black");
                FTVUtils.mouseover(self._tooltipdiv, d3.select(this).attr("tooltip"));
            })
            .on("mousemove", function() {
                FTVUtils.mousemove(self._tooltipdiv);
            })
            .on("mouseout", function(d, i) {
                d3.selectAll(".aminoAcid[tooltip='" + (i+1) + "']").style("stroke", "none");
                FTVUtils.mouseout(self._tooltipdiv);
            });
        aaResidues.append("tspan")
            .text(function (d) {return d;});
        aaResidues.append("tspan")
            .attr("x", function (d, i) {
                return i*FTVUtils.getMaxPixelAA() + FTVUtils.getMaxPixelAA()/2 - maxAAPositionFontSize + 2})
            .attr("y", FTVUtils.getMaxPixelAA() + 2)
            .text(function (d, i) {
                if ( ((i+1) % 10) == 0) {
                    if ((i+1) == sequenceLength) {
                        return "";
                    } else {
                        return i+1;
                    }
                } else {
                    return "";
                }
            });
    },
    /* Inits the ruler SVG.
     * @param controlDivDownRightRuler
     * @param rulerWidthWithMargin
     * @private
     */
    _initRulerSVG = function(self, controlDivDownRightRuler, rulerWidthWithMargin) {
        var rulerTickHeight = 15, longRulerTickHeight = 21;
        var rulerHeight = rulerTickHeight*2 + 5;
         self._rulerWidth = rulerWidthWithMargin - self._rulerMargin.left - self._rulerMargin.right;
        //SVG
         self._rulerSVG = controlDivDownRightRuler.append("svg")
            .attr("width", rulerWidthWithMargin)
            .attr("height", rulerHeight + self._rulerMargin.top + self._rulerMargin.bottom);
        //ruler
         _initRuler(self, rulerTickHeight, longRulerTickHeight);
        //dragger
         _initDragger(self, rulerTickHeight);
    },
    /**
     * Initializes all the elements related to the ruler, e.g. ticks and numbers for the ruler.
     * @private
     */
    _initRuler = function(self, rulerTickHeight, longRulerTickHeight) {
         self._ruler =  self._rulerSVG
            .append("g")
            .attr("transform", "translate(" + self._rulerMargin.left + "," + self._rulerMargin.top + ")");

        var rulerScale = d3.scale.linear()
            .domain([1, self.opt.featuresModel.sequence.length])
            .range([0,  self._rulerWidth]);

        //How many ticks?
        var separations = 10;
        var aaPerTick = Math.ceil(self.opt.featuresModel.sequence.length / ( self._rulerWidth / separations ) );
        var ticks = Math.floor(self.opt.featuresModel.sequence.length / aaPerTick);
        var tickValues = [];
        var seqAdded = false;
        /*for (var i = 0, value = 1; i <= ticks; i++, value=value + aaPerTick) {
         if (value > self.opt.featuresModel.sequence.length) {
         break; //depending on the values an extra tick can appear, get rid of it
         }
         tickValues.push(value);
         } */
        var value = 1;
        _.range(0, ticks+1).every(function() {
            tickValues.push(value);
            value = value + aaPerTick;
            return value <= self.opt.featuresModel.sequence.length;
        });
        if (tickValues[tickValues.length-1] != self.opt.featuresModel.sequence.length) {
            tickValues.push(self.opt.featuresModel.sequence.length);
            seqAdded = true;
        }

        //Axis
        var xAxis = d3.svg.axis()
            .scale(rulerScale)
            .tickValues(tickValues)
            .outerTickSize(rulerTickHeight)
            .innerTickSize(longRulerTickHeight)
            .orient("bottom");

        var rulerAxis =  self._ruler.append("g")
            .classed("x axis", true)
            .call(xAxis);
        //ruler group
        var lastBeforeSeq = Math.floor(tickValues.length/10)*10;
        rulerAxis.selectAll(".tick")
            .classed("minor", function(d, i) {
                // maybe the previous visible one overlaps, make sure it is the previous one
                if ((seqAdded === true) && (i === lastBeforeSeq) && (lastBeforeSeq !== tickValues.length-1)) {
                    var previousText = FTVUtils.calculateTextSizeSVG(tickValues[i], "tick").width;
                    var lastText = FTVUtils.calculateTextSizeSVG(tickValues[tickValues.length-1], "tick").width;
                    var posEndPrevious = tickValues[i] * self._pixelPerAA - self._pixelPerAA + previousText/2;
                    var posEndLast = self.opt.featuresModel.sequence.length * self._pixelPerAA - self._pixelPerAA - lastText/2;
                    if (posEndPrevious >= posEndLast) {
                        return true;
                    } else {
                        return false;
                    }
                } else if ((i%10 == 0) || (i == tickValues.length-1)) {
                    return false;
                } else {
                    return true;
                }
            })
        ;
        rulerAxis.selectAll(".axis line")
            .attr("y2", function(d, i) {
                if ((i%10 == 0) || (i%5 == 0) || (i == tickValues.length-1)) {
                    return longRulerTickHeight;
                } else {
                    return rulerTickHeight;
                }
            })
        ;
    },
    /**
     * Initializes the dragger over the ruler, it will be used to pan along the categories and sequence on zoom-in.
     * @param rulerTickHeight
     * @private
     */
    _initDragger = function(self, rulerTickHeight) {
         self._dragger =  self._ruler.append("g")
            .selectAll("path").
            data([{ x: 0, y: -2 }]).enter()
            .append("path")
            .classed("rulerDragger", true)
            .classed("zoomable", true)
            .attr("width", self._rulerWidth)
            .attr("height", rulerTickHeight + self._draggerGap)
            .attr("x", function (d) { return d.x; })
            .attr("y", function (d) { return d.y; })
            .attr("d", function(d) {
                return _draggerPath(d, self._rulerWidth, rulerTickHeight + self._draggerGap);
            })
            .on("click", function() {
                if (d3.select(this).attr("class").indexOf("zoomable") != -1) {
                    var moveToAA = (d3.mouse(this)[0]+1) / self._pixelPerAA;
                    ProteinFeaturesViewer.zoomInOut(moveToAA);
                }
            })
            .call(_onRulerDragDrop(self));
    },
    /**
     * Drag and drop behaviour for the ruler.
     * @returns {*}
     * @private
     */
    _onRulerDragDrop = function(self) {
        var drag = d3.behavior.drag();
        drag
            .on("dragend", function(d) {
                self._initMouseX = undefined;
                self._initZoomSelectorX = undefined;
            })
            .on("drag", function(d) {
                if (self._zoomed) {
                    if ((self._initMouseX == undefined) || (self._initZoomSelectorX == undefined)) { //init memory variables
                        self._initMouseX = d3.event.x;
                        self._initZoomSelectorX = parseFloat(d3.select(this).attr("x"));
                    } else { //mouse is moving, then move everything with it
                        var previousX = parseFloat(d3.select(this).attr("x"));
                        //track movement on
                        var currentX = (d3.event.x - self._initMouseX) + self._initZoomSelectorX;
                        var firstMaxVisibleAA = self._rulerWidth - d3.select(this).attr("width");// + self._pixelPerAA;
                        if (currentX < 0) {
                            currentX = 0;
                        } else if (currentX > firstMaxVisibleAA) {
                            currentX = firstMaxVisibleAA;
                        }
                        d3.select(this).attr("x", d.x = currentX);
                        d3.select(this).attr("transform", "translate(" + currentX + ", " + 0 + ")");
                        d3.selectAll("g.seqSVGGroup")
                            .attr("transform",
                                "translate(" +
                                (self._rulerMargin.left - (currentX/self._pixelPerAA)*FTVUtils.getMaxPixelAA() ) + "," +
                                self._rulerMargin.top + ")"
                        );
                        var moveToAA = currentX / self._pixelPerAA + 1;
                        /*if (currentX != previousX) {  //TODO migration
                            _.each(self._instances, function(instance) {
                                instance.translate(moveToAA, false);
                            });
                        } */
                    }
                }
            });
        return drag;
    },
    /**
     * Creates the path code corresponding to the dragger and its handler.
     * The handlerHeight (8px) works fine with  self._draggerGap, if that one changes, this one should be adjusted.
     * @param datum
     * @param width
     * @param height
     * @returns {string}
     * @private
     */
    _draggerPath = function(datum, width, height) {
        var handlerHeight = 8; //this one works fine with self._draggerGap, if that one changes, this one has to be adjust
        return "M " + datum.x + ", " + datum.y
            + " L " + ((datum.x + width)/2) + ", " + datum.y
            + " L " + ((datum.x + width)/2 - handlerHeight) + ", " + (datum.y-handlerHeight)
            + " L " + ((datum.x + width)/2 + handlerHeight) + ", " + (datum.y-handlerHeight)
            + " L " + ((datum.x + width)/2) + ", " + datum.y
            + " L " + (datum.x + width) + ", " + datum.y
            + " L " + (datum.x + width) + ", " + (datum.y + height)
            + " L " + datum.x + ", " + (datum.y + height)
            + " Z";
    },
//    /**
//     * Responds to a click on a feature.
//     * @param obj
//     * @private
//     */
//    _onInstanceFeatureClick = function(self, obj) {
//        //console.log(obj.feature);
//        //console.log(obj.svgElemID);
//        //console.log(_currentSelectedFeature);
//        //console.log(_currentSelectedSVGID);
//        //console.log(self);
//        if (self.opt.clickable == true) {
//            if ( (obj.feature.selected === true)
//                || ( ( _currentSelectedFeature != undefined) && (obj.feature.ftid ===  _currentSelectedFeature.ftid) ) ) { //we are clicking the same, deselect
//                if ( self._debug === true)  self._debugTrace += ", FT-unselected-same-click-" + obj.feature.ftid;
//                obj.feature.selected = false; //colour will be changed on the mouseout, sequence will be deselected on the mouseout
//                 _currentSelectedFeature.selected = false;
//                //deselect same feature all across categories/types zoom in/out
//                d3.selectAll("path[id^='" +  _currentSelectedFeature.ftid + "_index_']").style("fill-opacity", self.opt.transparency);
//                //but leave this one highlighted as mouse is still on
//                d3.select("#" +  _currentSelectedSVGID).style("fill-opacity", 1);
//                 _currentSelectedFeature = undefined;
//                 _currentSelectedSVGID = undefined;
//                ProteinFeaturesViewer.trigger('featureUnselected', {feature: obj.feature});
//            } else { //we are clicking on another one, deselect the previous one, select the current one
//                var recentlyUnselected =  _currentSelectedFeature;
//                if ( _currentSelectedFeature != undefined) {//there was a previous selection, deselect it
//                    if ( self._debug === true)  self._debugTrace += ", FT-unselected-" +  _currentSelectedFeature.ftid;
//                    //change SVG opacity, id should be unique
//                    d3.select("#" +  _currentSelectedSVGID).style("fill-opacity", self.opt.transparency);
//                    //deselect same feature in all other svg tracks (on zoom in/out categories and tracks will be repainted with selection so more than one SVG can be selected)
//                    d3.selectAll("path[id^='" +  _currentSelectedFeature.ftid + "_index_']").style("fill-opacity", self.opt.transparency);
//                     _currentSelectedFeature.selected = false;
//                    ProteinFeaturesViewer.trigger('featureUnselected', {feature:  _currentSelectedFeature});
//                     _currentSelectedFeature = undefined;
//                     _currentSelectedSVGID = undefined;
//                }
//                if ( self._debug === true)  self._debugTrace += ", FT-selected-" + obj.feature.ftid;
//                //color was changed on the mouseover and will not be restore on the mouseout
//                obj.feature.selected = true;
//                 _currentSelectedFeature = self.opt.featuresModel.categories[obj.feature.categoryIndex]
//                    .types[obj.feature.typeIndex]
//                    .locations[obj.feature.locationIndex]
//                    .features[obj.feature.featureIndex];
//                 _currentSelectedFeature.selected = true;
//                 _currentSelectedSVGID = obj.svgElemID;
//                //select same feature in all other svg tracks (on zoom in/out categories and tracks will be repainted with selection so more than one SVG can be selected)
//                d3.selectAll("path[id^='" +  _currentSelectedFeature.ftid + "_index_']").style("fill-opacity", 1);
//                ProteinFeaturesViewer.trigger('featureSelected', {feature: obj.feature});
//                if (recentlyUnselected != undefined) {
//                    recentlyUnselected.selected = false;
//                    self.opt.featuresModel.categories[recentlyUnselected.categoryIndex]
//                        .types[recentlyUnselected.typeIndex]
//                        .locations[recentlyUnselected.locationIndex]
//                        .features[recentlyUnselected.featureIndex].selected = false;
//                     _onInstanceFeatureOff({feature: recentlyUnselected});
//                }
//            }
//        }
//    },
//    /**
//     * Highlights the amino acids in the sequence on feature on, only visible on zoomed view.
//     * @param obj
//     * @private
//     */
//    _onInstanceFeatureOn = function(self, obj) {
//        if ( self._zoomed === true) {
//            if ( self._debug === true)  self._debugTrace += ", sequence-on-" + obj.feature.ftid;
//            var end = FTVUtils.getEnd(obj.feature);
//            var start = FTVUtils.getStart(obj.feature);
//            if ((start == 1) && (end == self.opt.featuresModel.sequence.length)) {
//                d3.selectAll(".aminoAcid").style("stroke", "black");
//            } else {
//                _.each(_.range(start, end+1), function(i) {
//                    d3.selectAll(".aminoAcid[tooltip='" + (i) + "']").style("stroke", "black");
//                });
//            }
//        }
//    },
//    /**
//     * De-highlights the amino acids in the sequence on feature off, only works on zoomed view.
//     * @param obj
//     * @private
//     */
    //    _onInstanceFeatureOff = function(self, obj) {
//        if ( self._zoomed === true) {
//            if ( self._debug === true)  self._debugTrace += ", sequence-off-" + obj.feature.ftid;
//            var end = FTVUtils.getEnd(obj.feature);
//            var start = FTVUtils.getStart(obj.feature);
//            if (obj.feature.selected != true) {
//                if ((start == 1) && (end == self.opt.featuresModel.sequence.length)) {
//                    d3.selectAll(".aminoAcid").style("stroke", "none");//deselect all
//                    if ( _currentSelectedFeature != undefined) {//but select again aa for selected/clicked feature
//                        end = FTVUtils.getEnd( _currentSelectedFeature);
//                        start = FTVUtils.getStart( _currentSelectedFeature);
//                        _.each(_.range(start, end+1), function(i) {
//                            d3.selectAll(".aminoAcid[tooltip='" + (i) + "']").style("stroke", "black");
//                        });
//                    }
//                } else {
//                    if ( _currentSelectedFeature != undefined) {
//                        if (obj.feature !=  _currentSelectedFeature) {
//                            var selEnd = FTVUtils.getEnd( _currentSelectedFeature);
//                            var selStart = FTVUtils.getStart( _currentSelectedFeature);
//                            _.each(_.range(start, end+1), function(i) {
//                                if ( !((selStart <= i) && (i <= selEnd)) ) {
//                                    d3.selectAll(".aminoAcid[tooltip='" + (i) + "']").style("stroke", "none");
//                                }
//                            });
//                        }
//                    } else {
//                        _.each(_.range(start, end+1), function(i) {
//                            d3.selectAll(".aminoAcid[tooltip='" + (i) + "']").style("stroke", "none");
//                        });
//                    }
//                }
//            }
//        }
//    },
//    /**
//     * Opens a category and displays the types.
//     * NOTE: The categoryTarget is used as a class so we can select divs based on it.
//     * @private
//     */
//    _openCategory = function(category, categoryTarget, dark) {
//        /*
//        var self = this;
//        var pos = categoryTarget.lastIndexOf("_")
//            , index;
//        if (pos != -1) {
//            index = parseInt(categoryTarget.substring(pos+1));
//            if (isNaN(index)) {
//                throw "Error: Category target does not follow the expected syntax (ending in a number)";
//            }
//        } else {
//            throw "Error: Category target does not follow the expected syntax";
//        }
//        //hide main category features
//        d3.select("#" + categoryTarget + " div.categoryFeatures").style("display", "none");
//        d3.select("#" + categoryTarget + " div.categoryFeatures").classed("hiddenCategory", true);
//        //show subcategory divs only if the main category div is not hidden
//        d3.selectAll("div." + categoryTarget).classed("hiddenCategory", false);
//        if (d3.select("#" + categoryTarget).style("display") === "none") {//it is hidden
//            d3.selectAll("div." + categoryTarget).style("display", "none");
//        } else {
//            d3.selectAll("div." + categoryTarget).style("display", self._categoryDivDisplay);
//        }
//        if (category[categoryTarget +  _hasBeenOpenedProp] !== true) {
//            if ( self._debug === true)  self._debugTrace += ", open-category-first-" + category.category;
//            category[categoryTarget +  _hasBeenOpenedProp] = true;
//            _.each(category.types, function(type, posType) {
//                var myInstance = new nonOverlapping;
//                nonOverlapping.construct({
//                    target: categoryTarget + "_type_" + posType
//                    ,darkBackground: dark
//                    ,width: self.opt.width
//                    ,useShapes: self.opt.useShapes
//                    ,useTooltips: self.opt.useTooltips
//                    ,clickable: false
//                    ,zoomable: false
//                    ,collapsible: false
//                    ,ftHeight: self.opt.ftHeight
//                    ,transparency: self.opt.transparency
//                    ,sequence: self.opt.featuresModel.sequence
//                    ,category: category.types[posType]
//                    ,categoryIndex: index
//                    ,typeIndex: posType
//                });
//                category.types[posType] = myInstance.opt.category;
//                myInstance.on("featureClicked", function(obj) {
//                    _onInstanceFeatureClick(obj);
//                });
//                myInstance.on("featureOn", function (obj) {
//                    _onInstanceFeatureOn(obj);
//                });
//                myInstance.on("featureOff", function(obj) {
//                    _onInstanceFeatureOff(obj);
//                });
//                self._instances.push(myInstance);
//                if (self._zoomed === true) {
//                    myInstance.zoomInOut();
//                    var currentX = parseFloat(self._dragger.attr("x"));
//                    var moveAA = currentX / self._pixelPerAA + 1;
//                    myInstance.translate(moveAA);
//                }
//            });
//        } else {
//            if ( self._debug === true)  self._debugTrace += ", open-category-" + category.category;
//        }
//        //If currently selected FT belongs to this category, update selected SVG in types
//        //any already selected feature should be selected as well in the new types
//        if ( _currentSelectedFeature != undefined) {
//            if ( _currentSelectedSVGID.lastIndexOf("_") ==  _currentSelectedSVGID.lastIndexOf("_" + index)) {
//                try {
//                    var toSelectInType =  d3.select("div." + categoryTarget + " path[id^='" +  _currentSelectedFeature.ftid + "_index_']");
//                    if (toSelectInType[0][0] != null) {
//                        toSelectInType.style("fill-opacity", 1);
//                         _currentSelectedSVGID = toSelectInType[0][0].ftid;
//                    }
//                } catch (err) {}
//            }
//        }
//        */
//    },
//    /**
//     * Closes a category.
//     * NOTE: The categoryTarget is used as a class so we can select divs based on it.
//     * @private
//     */
//    _closeCategory = function(self, category, categoryTarget) {
//        var self = this;
//        if ( self._debug === true)  self._debugTrace += ", close-category-" + category.category;
//        d3.select("#" + categoryTarget + " div.categoryFeatures").style("display", "inline-block");
//        d3.select("#" + categoryTarget + " div.categoryFeatures").classed("hiddenCategory", false);
//        d3.selectAll("div ." + categoryTarget).style("display", "none");
//        d3.selectAll("div." + categoryTarget).classed("hiddenCategory", true);
//        //If currently selected FT belongs to this category, update selected SVG in category
//        //any already selected feature should be selected as well in the closed category
//        if ( _currentSelectedFeature != undefined) {
//            try {
//                var toSelectInCategory =  d3.select("#" + categoryTarget + " path[id^='" +  _currentSelectedFeature.ftid + "_index_']");
//                if (toSelectInCategory[0][0] != null) {
//                    toSelectInCategory.style("fill-opacity", 1);
//                     _currentSelectedSVGID = toSelectInCategory[0][0].id;
//                }
//            } catch (err) {}
//        }
//    },
    /**
     * Calculates the number of amino acids to move to left or right.
     * @param left True if the movment will go to the left, false otherwise.
     * @private
     */
    _slide = function(self, left) {
        var currentX = parseFloat( self._dragger.attr("x"));
        var currentAA = currentX /  self._pixelPerAA;
        if ( self._numVisibleAA === undefined) {
            var firstMaxVisibleAA = (self._rulerWidth - self._dragger.attr("width")) / self._pixelPerAA;
            self._numVisibleAA = self.opt.featuresModel.sequence.length - firstMaxVisibleAA;
        }
        if (left === true) {
            self._firstVisibleAA = currentAA - self._numVisibleAA/2;
            return currentAA - self._numVisibleAA/2;
        } else {
            self._numVisibleAA = currentAA +  self._numVisibleAA/2;
            return currentAA + self._numVisibleAA/2;
        }
    }
//

;
/*
 * Public zone
 */
ProteinFeaturesViewer.prototype.opt = undefined;
ProteinFeaturesViewer.prototype._debug = true;
ProteinFeaturesViewer.prototype._debugTrace = "START";
ProteinFeaturesViewer.prototype._zoomed = false; //has been zoom applied?
ProteinFeaturesViewer.prototype._instances = []; //centered instances
ProteinFeaturesViewer.prototype._initMouseX = undefined;
ProteinFeaturesViewer.prototype._initZoomSelectorX = undefined;
ProteinFeaturesViewer.prototype._rulerWidth = undefined; //width to be used for the ruler
ProteinFeaturesViewer.prototype._rulerMargin = undefined; //margins around the ruler
ProteinFeaturesViewer.prototype._draggerGap = 4; //the dragger will be a bit above the ruler and will have a handler
ProteinFeaturesViewer.prototype._pixelPerAA = undefined; //number of pixels per amino acid
ProteinFeaturesViewer.prototype._rulerSVG = undefined; //SVG with the ruler group
ProteinFeaturesViewer.prototype._ruler = undefined; //group inside self._rulerSVG, actual ruler containing the separations and the dragger
ProteinFeaturesViewer.prototype._dragger = undefined; //group inside the self._ruler, draggable bar that will move left or right the categories and sequence
ProteinFeaturesViewer.prototype._controlAASeqDivDisplay = undefined; //original display/visibility for the amino acid sequence container, can be "display" or "none"
ProteinFeaturesViewer.prototype._categoryDivDisplay = undefined; //original display/visibility for the categories and types
ProteinFeaturesViewer.prototype._seqAASVG = undefined; //SVG with a group to display the amino acids
ProteinFeaturesViewer.prototype._seqAASVGGroup = undefined; //group inside self._seqAASVG that displays the amino acids
ProteinFeaturesViewer.prototype._openAllButton = undefined;
ProteinFeaturesViewer.prototype._closeAllButton = undefined;
ProteinFeaturesViewer.prototype._settingsButton = undefined;
ProteinFeaturesViewer.prototype._helpButton = undefined;
ProteinFeaturesViewer.prototype._zoomInButton = undefined;
ProteinFeaturesViewer.prototype._zoomOutButton = undefined;
ProteinFeaturesViewer.prototype._moveLeftButton = undefined;
ProteinFeaturesViewer.prototype._moveRightButton = undefined;
ProteinFeaturesViewer.prototype._settingsDiv = undefined; //div containing the setting options menu
ProteinFeaturesViewer.prototype._tooltipdiv = undefined; //tooltip div
ProteinFeaturesViewer.prototype._numVisibleAA = undefined;
ProteinFeaturesViewer.prototype._numVisibleAA = undefined;

///**
// * Zooms in or out the features displayed.
// * @param moveToAA Zoom and then move to the given amino acid.
// */
//ProteinFeaturesViewer.prototype.zoomInOut = function zoomInOut(moveToAA) {
//    var self = this;
//    if ( self._zoomed === false) { //It is zoomed out, then zoom in, i.e., go to detailed view
//        if ( self._debug === true)  self._debugTrace += ", zoom-in";
//        _.each(self._instances, function(instance) {
//            instance.zoomInOut();
//        });
//        d3.selectAll("div .seqContainer").style("display",  self._controlAASeqDivDisplay);
//        var visibleAA =  self._rulerWidth / FTVUtils.getMaxPixelAA();
//         self._dragger
//            .classed("zoomable", false)
//            .classed("draggable", true)
//            .attr("width", visibleAA * self._pixelPerAA)
//            .attr("x", 0)
//            .attr("d", _draggerPath(
//                {x: 0, y: parseFloat(self._dragger.attr("y"))}
//                , visibleAA * self._pixelPerAA, parseFloat(self._dragger.attr("height"))))
//            .attr("transform", "translate(0,0)");
//         self._zoomOutButton.style("display",  _buttonDisplay);
//         self._moveLeftButton.style("display",  _buttonDisplay);
//         self._moveRightButton.style("display",  _buttonDisplay);
//         self._zoomInButton.style("display", "none");
//         self._zoomed = true;
//        if ( _currentSelectedFeature != undefined) {
//             _onInstanceFeatureOn({feature:  _currentSelectedFeature});
//        }
//        if (moveToAA !== undefined) {
//            ProteinFeaturesViewer.translate(moveToAA);
//        }
//    } else {  //It is zoomed in, then zoom out, i.e., go to overview
//        if ( self._debug === true)  self._debugTrace += ", zoom-out";
//        _.each(self._instances, function(instance) {
//            instance.zoomInOut();
//        });
//        d3.selectAll("div .seqContainer").style("display", "none");
//        d3.selectAll("g.seqSVGGroup")
//            .attr("transform", "translate" +
//                "(" + self._rulerMargin.left +
//                "," +  self._rulerMargin.top + ")");
//         self._zoomOutButton.style("display", "none");
//         self._moveLeftButton.style("display", "none");
//         self._moveRightButton.style("display", "none");
//         self._zoomInButton.style("display",  _buttonDisplay);
//         self._dragger
//            .classed("zoomable", true)
//            .classed("draggable", false)
//            .attr("width", self._rulerWidth)
//            .attr("x", 0)
//            .attr("d", _draggerPath(
//                {x: 0, y: parseFloat(self._dragger.attr("y"))}
//                , self._rulerWidth, parseFloat(self._dragger.attr("height"))))
//            .attr("transform", "translate(0,0)");
//         self._zoomed = false;
//        d3.selectAll(".aminoAcid").style("stroke", "none");
//    }
//    //always update selection of features across all svg
//    if ( _currentSelectedFeature != undefined) {
//        if ( self._debug === true)  self._debugTrace += ", zoom-selectedFT-updated";
//        d3.selectAll("path[id^='" +  _currentSelectedFeature.ftid + "_index_']").style("fill-opacity", 1);
//    }
//    //TODO event???
//};
//
///**
// * Translates a category to a given coordinate.
// * @param xMove Starting coordinate for translation, meaning the first amino acid to be displayed.
// */
//ProteinFeaturesViewer.prototype.translate = function translate(moveToAA) {
//    //if ( self._debug === true)  self._debugTrace += ", translate-to-" + moveToAA;
//    var self = this;
//    if ( self._zoomed === true) {
//        var previousX = parseFloat( self._dragger.attr("x"));
//        var currentX = moveToAA *  self._pixelPerAA;
//        var firstMaxVisibleAA =  self._rulerWidth -  self._dragger.attr("width");// + self._pixelPerAA;
//        if (currentX < 0) {
//            currentX = 0;
//        } else if (currentX > firstMaxVisibleAA) {
//            currentX = firstMaxVisibleAA;
//        }
//        if (currentX != previousX) {
//             self._dragger.attr("x", currentX);
//             self._dragger.attr("transform", "translate(" + currentX + ", " + 0 + ")");
//            d3.selectAll("g.seqSVGGroup")
//                .attr("transform", "translate(" +
//                    (self._rulerMargin.left - (currentX/self._pixelPerAA)*FTVUtils.getMaxPixelAA() ) + "," +
//                    self._rulerMargin.top + ")"
//            );
//            if (currentX != previousX) {
//                _.each(self._instances, function(instance) {
//                    instance.translate(moveToAA+1, false);
//                });
//            }
//        }
//    }
//    //TODO event???
//};









/**
 * Gets a DOM id and sets its innerHTML to text
 * @param id DOM id
 * @param text Text to be injected
 */
ProteinFeaturesViewer.prototype.greetings = function greetings(id, text) {
    ProteinFeaturesViewer.start();
    d3.select("#" + id).text("hello " + text);
};
/**
 * Greetings test method.
 * @example
 *     ProteinFeaturesViewer.greetingsTest('biojs');
 *
 * @method greetingsTest
 * @param {String} text Text to greet to
 * @return {String} Returns hello + text
 */
ProteinFeaturesViewer.prototype.getGreetings = function getGreetings(text) {
    return 'hello ' + text;
};

require('biojs-events').mixin(ProteinFeaturesViewer.prototype);