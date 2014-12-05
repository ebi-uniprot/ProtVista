var _ = require("underscore");
var d3 = require("d3");
var jQuery = require("jquery");
var FTVUtils = require("./pftv-aux-utils.js");
//var centered = require("./pftv-aux-centeredProteinCategoryFTViewer.js");
//var nonOverlapping = require("./pftv-aux-centeredProteinCategoryFTViewer.js");
/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

/**
@class biojs-vis-proteinFeaturesViewer
 */
var  biojs_vis_proteinFeaturesViewer;

module.exports = biojs_vis_proteinFeaturesViewer = function(options){
    constructor(options);
};

/**
 * Private zone
 */
/*
 * Private variables
 * */
var
    _debug = true,
    _debugTrace = "START",
    _zoomed = false, //has been zoom applied?
    _instances = [], //centered instances
    _zoomInButton = undefined,
    _zoomOutButton = undefined,
    _initMouseX = undefined,
    _initZoomSelectorX = undefined,
    _rulerWidth = undefined, //width to be used for the ruler
    _rulerMargin = undefined, //margins around the ruler
    _draggerGap = 4, //the dragger will be a bit above the ruler and will have a handler
    _pixelPerAA = undefined, //number of pixels per amino acid
    _rulerSVG = undefined, //SVG with the ruler group
    _ruler = undefined, //group inside _rulerSVG, actual ruler containing the separations and the dragger
    _dragger = undefined, //group inside the _ruler, draggable bar that will move left or right the categories and sequence
    _buttonDisplay = "inline-block", //display for buttons
    _controlAASeqDivDisplay = undefined, //original display/visibility for the amino acid sequence container, can be "display" or "none"
    _categoryDivDisplay = undefined, //original display/visibility for the categories and types
    _seqAASVG = undefined, //SVG with a group to display the amino acids
    _seqAASVGGroup = undefined, //group inside _seqAASVG that displays the amino acids
    _hasBeenOpenedProp = "_hasBeenOpen", //combined with the category target will be used as a property to figure out whether a category has been opened already
    _openAllButton = undefined,
    _closeAllButton = undefined,
    _settingButton = undefined,
    _helpButton = undefined,
    _zoomInButton = undefined,
    _zoomOutButton = undefined,
    _moveLeftButton = undefined,
    _moveRightButton = undefined,
    _settingsDiv = undefined, //div containing the setting options menu
    _tooltipdiv = undefined //tooltip div
;

/*
 * Private methods
 * */
var
    /**
     * Constructor, it loads the default values for the options.
     * @params options Configuration options.
     */
    constructor = function(options) {
        console.log(FTVUtils.greetingsTest("me"));
        //Do we have something to show?
        var allEmpty = _.every(options.featuresModel.categories, function(category) {
            return _.every(category.types, _.isEmpty);
        });
        if (allEmpty === true) {
            d3.select("#" + options.target).text("No features available for this protein");
        } else {
            //deep-copy the options
            biojs_vis_proteinFeaturesViewer.opt = jQuery.extend(true, biojs_vis_proteinFeaturesViewer.opt, options);
            _init();
        }
    },

    /**
     * Initializes the private variables and layout, including div/svg for controls and categories.
     * @private
     * */
    _init = function() {
        d3.select("body")
            .on("click", function() {
                var origin = d3.event.target.className;
                if (typeof origin === "object") {
                    origin = origin.baseVal;
                }
                if ((origin === undefined) || (origin.indexOf("noBodyClick") === -1)) {
                    _settingsDiv
                        .style("opacity", 1e-6)
                        .style("z-index", -1);
                }
            });
        //tooltip
        _tooltipdiv = d3.select("#" + biojs_vis_proteinFeaturesViewer.opt.target).append("div")
            .classed("tooltip", true)
            .style("opacity", 1e-6);
        _settingsDiv = d3.select("#" + biojs_vis_proteinFeaturesViewer.opt.target).append("div")
            .classed("dialog noBodyClick", true)
            .style("opacity", 1e-6)
            .style("z-index", -1);
        _settingsDiv.append("div").classed("clickable spriteCloseX noBodyClick", true)
            .on("click", function() {
                _settingsDiv
                    .style("opacity", 1e-6)
                    .style("z-index", -1);
            });
         biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence = biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.toUpperCase();
         //setting up values
         _rulerMargin = {
             top: FTVUtils.getMaxSeqLengthDisplay().height +  _draggerGap,
             right: FTVUtils.getMarginLeftRight().right + FTVUtils.getZoomTextGap() - FTVUtils.getTitlesPadding()*2,
             bottom: 0,
             left: FTVUtils.getMarginLeftRight().left + FTVUtils.getTitlesPadding()*2
         };
         var sequenceScale = d3.scale.linear()
             .domain([1, biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length + 1])
             .range([_rulerMargin.left, (biojs_vis_proteinFeaturesViewer.opt.width - FTVUtils.getTitlesWidth()) - _rulerMargin.right]);
        _pixelPerAA = sequenceScale(2) - sequenceScale(1);
        if ( _pixelPerAA > FTVUtils.getMaxPixelAA()) {
            biojs_vis_proteinFeaturesViewer.opt.width = biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length * FTVUtils.getMaxPixelAA() + FTVUtils.getTitlesWidth() + _rulerMargin.left + _rulerMargin.right;
            sequenceScale = d3.scale.linear().
                domain([1, biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length + 1])
                .range([_rulerMargin.left, (biojs_vis_proteinFeaturesViewer.opt.width - FTVUtils.getTitlesWidth()) - _rulerMargin.right]);
             _pixelPerAA = sequenceScale(2) - sequenceScale(1);
        }
        //init ruler, controls, categories, sequence
        var rulerWidthWithMargin =  _initMasterControlDiv();
        _initCategories();
        _initSecondaryControlDiv(rulerWidthWithMargin);
        //As the sequence is duplicated top and bottom, we have to wait until having both control divs
        _initSeqAASVG(rulerWidthWithMargin);
    },
    /**
     * Initializes the master control panel at the top.
     * @private
     */
    _initMasterControlDiv = function() {
        //div with titles, controls, and ruler
        var controlDiv = d3.select("#" + biojs_vis_proteinFeaturesViewer.opt.target)
            .append("div")
            .classed("control", true)
            .style("width", biojs_vis_proteinFeaturesViewer.opt.width + "px");

        //first row: accession and controls
        var controlDivUp = controlDiv.append("div")
            .classed("row", true)
            .style("width", biojs_vis_proteinFeaturesViewer.opt.width + "px");
         _initAccession(controlDivUp);
         _initControls(controlDivUp);

        //second row: identifier and then ruler and aa sequence
        var controlDivDown = controlDiv.append("div")
            .classed("row", true)
            .style("width", biojs_vis_proteinFeaturesViewer.opt.width + "px");
         _initIdentifier(controlDivDown);
        var controlDivDownRight = controlDivDown.append("div")
            .classed("cell", true)
            .style("width", (biojs_vis_proteinFeaturesViewer.opt.width - FTVUtils.getTitlesWidth()) + "px");
        var rulerWidthWithMargin =  _initRulerDiv(controlDivDownRight);
         _initAASeqDiv(controlDivDownRight, rulerWidthWithMargin);
        return rulerWidthWithMargin;
    },
    /**
     * Initializes the protein accession.
     * @param controlDiv
     * @private
     */
    _initAccession = function(controlDivUp) {
        controlDivUp.append("div")
            .classed("cell accession", true)
            .style("width", FTVUtils.getTitlesWidth() + "px")
            .text(biojs_vis_proteinFeaturesViewer.opt.featuresModel.accession);
    },
    /**
     * Initializes the controls (zoom, TODO download, upload, legend).
     * @param controlDiv
     * @private
     */
    _initControls = function(controlDivUp) {
        var controlDivUpRight = controlDivUp.append("div")
            .classed("cell", true)
            .style("width", (biojs_vis_proteinFeaturesViewer.opt.width-FTVUtils.getTitlesWidth()) + "px");
        var leftControlDivUpRight = controlDivUpRight.append("div").classed("left", true);
        _zoomInButton = _initZoomButton(_zoomInButton, leftControlDivUpRight, "zoomInButton", "spriteZoomIn", true);
        _zoomOutButton = _initZoomButton(_zoomOutButton, leftControlDivUpRight, "zoomOutButton", "spriteZoomOut", false);
        _moveLeftButton = _initMoveButton(_moveLeftButton, leftControlDivUpRight, "moveLeftButton", "spriteMoveLeft", "move-left", "Move current display 50% left");
        _moveRightButton = _initMoveButton(_moveRightButton, leftControlDivUpRight, "moveRightButton", "spriteMoveRight", "move-right", "Move current display 50% right");
        var rightControlDivUpRight = controlDivUpRight.append("div").classed("right", true);
        _openAllButton = _initAllButton(_openAllButton, rightControlDivUpRight, "openAllButton", "spriteOpenAll", "open-all", true);
        _closeAllButton = _initAllButton(_closeAllButton, rightControlDivUpRight, "closeAllButton", "spriteCloseAll", "close-all", false);
        _settingsButton = rightControlDivUpRight.append("div")
            .attr("id", "settingsButton")
            .classed("clickable spriteSettings noBodyClick", true)
            .style("display",  _buttonDisplay)
            .on("click", function() {
                if (_debug === true) _debugTrace += ", settings";
                _settingsDiv
                    .style("opacity", 1)
                    .style("z-index", 10);
            });
        _helpButton = rightControlDivUpRight.append("div")
            .attr("id", "helpButton")
            .classed("clickable spriteHelp", true)
            .style("display",  _buttonDisplay)
            .on("click", function() { //TODO real onclick
                if (_debug === true) {
                    _debugTrace += ", STOP";
                    console.log(_debugTrace);
                    _debugTrace = "INIT";
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
    _initZoomButton = function(zoomButton, leftControlDivUpRight, id, spriteId, display) {
        zoomButton = leftControlDivUpRight.append("div")
            .attr("id", id)
            .classed("clickable " + spriteId, true)
            .on("click", function() {
                if (_debug === true) _debugTrace += ", on-click-zoom-out-button";
                biojs_vis_proteinFeaturesViewer.zoomInOut();
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
    _initMoveButton = function(moveButton, leftControlDivUpRight, id, spriteId, debugText, tooltipText) {
        moveButton = leftControlDivUpRight.append("div")
            .attr("id", id)
            .classed("clickable " + spriteId, true)
            .style("display", "none")
            .on("click", function() {
                if (_zoomed === true) {
                    if (_debug === true) _debugTrace += ", " + debugText;
                    biojs_vis_proteinFeaturesViewer
                        .translate(_slide(true));
                }
            })
            .on("mouseover", function() {
                FTVUtils.mouseover(_tooltipdiv, tooltipText);
            })
            .on("mousemove", function() {
                FTVUtils.mousemove(_tooltipdiv);
            })
            .on("mouseout", function() {
                FTVUtils.mouseout(_tooltipdiv);
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
    _initAllButton = function(allButton, rightControlDivUpRight, id, spriteId, debugText, open) {
        allButton = rightControlDivUpRight.append("div")
            .attr("id", id)
            .classed("clickable " + spriteId, true)
            .style("display", _buttonDisplay)
            .on("click", function() {
                if (_debug === true) {
                    _debugTrace += ", " + debugText;
                }
                if (open === true) {
                    _.each(_instances, function(instance) {
                        instance.open();
                    });
                } else {
                    _.each(_instances, function(instance) {
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
    _initIdentifier = function(controlDivDown) {
        controlDivDown.append("div")
            .classed("cell identifier", true)
            .style("width", FTVUtils.getTitlesWidth() + "px")
            .text(biojs_vis_proteinFeaturesViewer.opt.featuresModel.identifier.toUpperCase());
    },
    /**
     * Initializes all the elements related to the ruler.
     * @param controlDivDown
     * @private
     */
    _initRulerDiv = function(controlDivDownRight) {
        //Second row of controls: protein identifier and ruler
        var self = this;
        var controlDivDownRightRuler = controlDivDownRight.append("div")
            .classed("row", true)
            .style("width", (biojs_vis_proteinFeaturesViewer.opt.width - FTVUtils.getTitlesWidth()) + "px");
        var rulerWidthWithMargin = Math.floor((biojs_vis_proteinFeaturesViewer.opt.width - FTVUtils.getTitlesWidth()) -  _pixelPerAA);
        //init rows
        _initRulerSVG(controlDivDownRightRuler, rulerWidthWithMargin);
        return rulerWidthWithMargin;
    },
    /**
     * Initializes the amino acids sequence.
     * @param controlDivDown
     * @private
     */
    _initAASeqDiv = function(controlDivDownRight) {
        var temp = controlDivDownRight.append("div")
            .classed("row seqContainer", true)
            .style("width", (biojs_vis_proteinFeaturesViewer.opt.width - FTVUtils.getTitlesWidth()) + "px");
         _controlAASeqDivDisplay = temp.style("display");
        temp.style("display", "none");
    },
    /**
     * Initializes the categories.
     * @private
     */
    _initCategories = function() {
        var dark = true;
        _.each(biojs_vis_proteinFeaturesViewer.opt.featuresModel.categories, function(category, posCat) {
            var internalDiv = _settingsDiv.append("div")
                .classed("noBodyClick", true);
            internalDiv.append("input")
                .attr("id", "check_category_" + posCat)
                .classed("noBodyClick", true)
                .attr("index", posCat)
                .attr("type", "checkbox")
                .attr("checked", true)
                .on("click", function() {
                    if (biojs_vis_proteinFeaturesViewer.checked === true) {
                        d3.selectAll("div[id^='target_category_" + d3.select(this).attr("index") + "']")
                            .style("display", _categoryDivDisplay); //show all categories and types
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
            var temp = d3.select("#" + biojs_vis_proteinFeaturesViewer.opt.target)
                .append("div")
                .attr("id", biojs_vis_proteinFeaturesViewer.opt.target + "_category_" + posCat)
                .attr("index", posCat)
                .classed("category", true);
             _categoryDivDisplay = temp.style("display");
            _.each(category.types, function(type, posType) {
                d3.select("#" + biojs_vis_proteinFeaturesViewer.opt.target)
                    .append("div")
                    .attr("id", biojs_vis_proteinFeaturesViewer.opt.target + "_category_" + posCat + "_type_" + posType)
                    .classed("category " + biojs_vis_proteinFeaturesViewer.opt.target + "_category_" + posCat, true)
                    .style("display", "none");
            });
            dark = posCat%2 == 0 ? true : false;
            var myInstance = new centered();
            myInstance.constructor({
                target: biojs_vis_proteinFeaturesViewer.opt.target + "_category_" + posCat
                ,darkBackground: dark
                ,width: biojs_vis_proteinFeaturesViewer.opt.width
                ,useShapes: biojs_vis_proteinFeaturesViewer.opt.useShapes
                ,useTooltips: biojs_vis_proteinFeaturesViewer.opt.useTooltips
                ,clickable: false
                ,zoomable: false
                ,collapsible: true
                ,ftHeight: biojs_vis_proteinFeaturesViewer.opt.ftHeight
                ,transparency: biojs_vis_proteinFeaturesViewer.opt.transparency
                ,sequence: biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence
                ,category: biojs_vis_proteinFeaturesViewer.opt.featuresModel.categories[posCat]
                ,categoryIndex: posCat
            });//TODO migration
            /*biojs_vis_proteinFeaturesViewer.opt.featuresModel.categories[posCat] = myInstance.opt.category; //category = myInstance.opt.category;
            myInstance.opt.category[biojs_vis_proteinFeaturesViewer.opt.target + "_category_" + posCat + _hasBeenOpenedProp] = false;
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
            });
            _instances.push(myInstance); */
        });
         _settingsDiv
            .style("left", ( _settingsButton[0][0].offsetLeft - _settingsDiv[0][0].offsetWidth + 5) + "px")
            .style("top", ( _settingsButton[0][0].offsetTop + _settingsButton[0][0].offsetHeight - 5) + "px");
    },
    /**
     * Initializes the secondary control panel at the bottom, only with the sequence.
     * @private
     */
    _initSecondaryControlDiv = function(rulerWidthWithMargin) {
        var self = this;
        //Secondary control, duplicated sequence
        var secondaryControlDiv = d3.select("#" + biojs_vis_proteinFeaturesViewer.opt.target)
            .append("div")
            .classed("control", true)
            .style("width", biojs_vis_proteinFeaturesViewer.opt.width + "px");
        //unique row: empty and ruler
        var secondaryControlDivDown = secondaryControlDiv.append("div")
            .classed("row", true)
            .style("width", biojs_vis_proteinFeaturesViewer.opt.width + "px");
        secondaryControlDivDown.append("div")
            .classed("cell identifier", true)
            .style("width", FTVUtils.getTitlesWidth() + "px");
        var controlDivDownRight = secondaryControlDivDown.append("div")
            .classed("cell", true)
            .style("width", (biojs_vis_proteinFeaturesViewer.opt.width - FTVUtils.getTitlesWidth()) + "px");
         _initAASeqDiv(controlDivDownRight, rulerWidthWithMargin);
    },
    /* Inits the sequence SVG
     * @param rulerWidthWithMargin
     * @private
     */
    _initSeqAASVG = function (rulerWidthWithMargin) {
        var seqAAHeight = FTVUtils.getMaxPixelAA()*3;
        d3.selectAll("div.seqContainer").append("svg")
            .classed("seqSVG", true)
            .attr("width", rulerWidthWithMargin)
            .attr("height", seqAAHeight);

        var sequenceLength = biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length;
        var maxAminoAcidFontSize = FTVUtils.getMaxAAFontDisplay().width/2;
        var maxAAPositionFontSize = FTVUtils.calculateTextSizeSVG(sequenceLength, ".aminoAcid").width/2;
        d3.selectAll("svg.seqSVG").append("g")
            .classed("seqSVGGroup", true)
            .attr("transform", "translate(" + _rulerMargin.left + "," + _rulerMargin.top + ")");
        var aaResidues = d3.selectAll("g.seqSVGGroup").selectAll("text")
            .data(biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence).enter()
            .append("text")
            .classed("aminoAcid", true)
            .attr("x", function (d, i) {
                return i*FTVUtils.getMaxPixelAA() + FTVUtils.getMaxPixelAA()/2 - maxAminoAcidFontSize + 2})
            .attr("width", FTVUtils.getMaxPixelAA())
            .attr("tooltip", function(d, i) {return (i+1);})
            .on("mouseover", function(d, i) {
                d3.selectAll(".aminoAcid[tooltip='" + (i+1) + "']").style("stroke", "black");
                //d3.select(this).style("stroke", "black");
                FTVUtils.mouseover(_tooltipdiv, d3.select(this).attr("tooltip"));
            })
            .on("mousemove", function() {
                FTVUtils.mousemove(_tooltipdiv);
            })
            .on("mouseout", function(d, i) {
                d3.selectAll(".aminoAcid[tooltip='" + (i+1) + "']").style("stroke", "none");
                FTVUtils.mouseout(_tooltipdiv);
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
    _initRulerSVG = function(controlDivDownRightRuler, rulerWidthWithMargin) {
        var rulerTickHeight = 15, longRulerTickHeight = 21;
        var rulerHeight = rulerTickHeight*2 + 5;
         _rulerWidth = rulerWidthWithMargin - _rulerMargin.left - _rulerMargin.right;
        //SVG
         _rulerSVG = controlDivDownRightRuler.append("svg")
            .attr("width", rulerWidthWithMargin)
            .attr("height", rulerHeight + _rulerMargin.top + _rulerMargin.bottom);
        //ruler
         _initRuler(rulerTickHeight, longRulerTickHeight);
        //dragger
         _initDragger(rulerTickHeight);
    },
    /**
     * Initializes all the elements related to the ruler, e.g. ticks and numbers for the ruler.
     * @param controlDivDown
     * @private
     */
    _initRuler = function(rulerTickHeight, longRulerTickHeight) {
        var self = this;
         _ruler =  _rulerSVG
            .append("g")
            .attr("transform", "translate(" + _rulerMargin.left + "," + _rulerMargin.top + ")");

        var rulerScale = d3.scale.linear()
            .domain([1, biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length])
            .range([0,  _rulerWidth]);

        //How many ticks?
        var separations = 10;
        var aaPerTick = Math.ceil(biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length / ( _rulerWidth / separations ) );
        var ticks = Math.floor(biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length / aaPerTick);
        var tickValues = [];
        var seqAdded = false;
        /*for (var i = 0, value = 1; i <= ticks; i++, value=value + aaPerTick) {
         if (value > biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length) {
         break; //depending on the values an extra tick can appear, get rid of it
         }
         tickValues.push(value);
         } */
        var value = 1;
        _.range(0, ticks+1).every(function() {
            tickValues.push(value);
            value = value + aaPerTick;
            return value <= biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length;
        });
        if (tickValues[tickValues.length-1] != biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length) {
            tickValues.push(biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length);
            seqAdded = true;
        }

        //Axis
        var xAxis = d3.svg.axis()
            .scale(rulerScale)
            .tickValues(tickValues)
            .outerTickSize(rulerTickHeight)
            .innerTickSize(longRulerTickHeight)
            .orient("bottom");

        var rulerAxis =  _ruler.append("g")
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
                    var posEndPrevious = tickValues[i] * _pixelPerAA - _pixelPerAA + previousText/2;
                    var posEndLast = biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length * _pixelPerAA - _pixelPerAA - lastText/2;
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
    _initDragger = function(rulerTickHeight) {
         _dragger =  _ruler.append("g")
            .selectAll("path").
            data([{ x: 0, y: -2 }]).enter()
            .append("path")
            .classed("rulerDragger", true)
            .classed("zoomable", true)
            .attr("width", _rulerWidth)
            .attr("height", rulerTickHeight + _draggerGap)
            .attr("x", function (d) { return d.x; })
            .attr("y", function (d) { return d.y; })
            .attr("d", function(d) {
                return _draggerPath(d, _rulerWidth, rulerTickHeight + _draggerGap);
            })
            .on("click", function() {
                if (d3.select(this).attr("class").indexOf("zoomable") != -1) {
                    var moveToAA = (d3.mouse(this)[0]+1) / _pixelPerAA;
                    biojs_vis_proteinFeaturesViewer.zoomInOut(moveToAA);
                }
            })
            .call(_onRulerDragDrop());
    },
    /**
     * Drag and drop behaviour for the ruler.
     * @returns {*}
     * @private
     */
    _onRulerDragDrop = function() {
        var drag = d3.behavior.drag();
        drag
            .on("dragend", function(d) {
                _initMouseX = undefined;
                _initZoomSelectorX = undefined;
            })
            .on("drag", function(d) {
                if (_zoomed) {
                    if ((_initMouseX == undefined) || (_initZoomSelectorX == undefined)) { //init memory variables
                        _initMouseX = d3.event.x;
                        _initZoomSelectorX = parseFloat(d3.select(this).attr("x"));
                    } else { //mouse is moving, then move everything with it
                        var previousX = parseFloat(d3.select(this).attr("x"));
                        //track movement on
                        var currentX = (d3.event.x - _initMouseX) + _initZoomSelectorX;
                        var firstMaxVisibleAA = _rulerWidth - d3.select(this).attr("width");// + _pixelPerAA;
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
                                (_rulerMargin.left - (currentX/_pixelPerAA)*FTVUtils.getMaxPixelAA() ) + "," +
                                _rulerMargin.top + ")"
                        );
                        var moveToAA = currentX / _pixelPerAA + 1;
                        /*if (currentX != previousX) {  //TODO migration
                            _.each(_instances, function(instance) {
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
     * The handlerHeight (8px) works fine with  _draggerGap, if that one changes, this one should be adjusted.
     * @param datum
     * @param width
     * @param height
     * @returns {string}
     * @private
     */
    _draggerPath = function(datum, width, height) {
        var handlerHeight = 8; //this one works fine with _draggerGap, if that one changes, this one has to be adjust
        return "M " + datum.x + ", " + datum.y
            + " L " + ((datum.x + width)/2) + ", " + datum.y
            + " L " + ((datum.x + width)/2 - handlerHeight) + ", " + (datum.y-handlerHeight)
            + " L " + ((datum.x + width)/2 + handlerHeight) + ", " + (datum.y-handlerHeight)
            + " L " + ((datum.x + width)/2) + ", " + datum.y
            + " L " + (datum.x + width) + ", " + datum.y
            + " L " + (datum.x + width) + ", " + (datum.y + height)
            + " L " + datum.x + ", " + (datum.y + height)
            + " Z";
    }//,
//    /**
//     * Responds to a click on a feature.
//     * @param obj
//     * @private
//     */
//    _onInstanceFeatureClick = function(obj) {
//        //console.log(obj.feature);
//        //console.log(obj.svgElemID);
//        //console.log(_currentSelectedFeature);
//        //console.log(_currentSelectedSVGID);
//        //console.log(self);
//        if (biojs_vis_proteinFeaturesViewer.opt.clickable == true) {
//            if ( (obj.feature.selected === true)
//                || ( ( _currentSelectedFeature != undefined) && (obj.feature.ftid ===  _currentSelectedFeature.ftid) ) ) { //we are clicking the same, deselect
//                if ( _debug === true)  _debugTrace += ", FT-unselected-same-click-" + obj.feature.ftid;
//                obj.feature.selected = false; //colour will be changed on the mouseout, sequence will be deselected on the mouseout
//                 _currentSelectedFeature.selected = false;
//                //deselect same feature all across categories/types zoom in/out
//                d3.selectAll("path[id^='" +  _currentSelectedFeature.ftid + "_index_']").style("fill-opacity", biojs_vis_proteinFeaturesViewer.opt.transparency);
//                //but leave this one highlighted as mouse is still on
//                d3.select("#" +  _currentSelectedSVGID).style("fill-opacity", 1);
//                 _currentSelectedFeature = undefined;
//                 _currentSelectedSVGID = undefined;
//                biojs_vis_proteinFeaturesViewer.trigger('featureUnselected', {feature: obj.feature});
//            } else { //we are clicking on another one, deselect the previous one, select the current one
//                var recentlyUnselected =  _currentSelectedFeature;
//                if ( _currentSelectedFeature != undefined) {//there was a previous selection, deselect it
//                    if ( _debug === true)  _debugTrace += ", FT-unselected-" +  _currentSelectedFeature.ftid;
//                    //change SVG opacity, id should be unique
//                    d3.select("#" +  _currentSelectedSVGID).style("fill-opacity", biojs_vis_proteinFeaturesViewer.opt.transparency);
//                    //deselect same feature in all other svg tracks (on zoom in/out categories and tracks will be repainted with selection so more than one SVG can be selected)
//                    d3.selectAll("path[id^='" +  _currentSelectedFeature.ftid + "_index_']").style("fill-opacity", biojs_vis_proteinFeaturesViewer.opt.transparency);
//                     _currentSelectedFeature.selected = false;
//                    biojs_vis_proteinFeaturesViewer.trigger('featureUnselected', {feature:  _currentSelectedFeature});
//                     _currentSelectedFeature = undefined;
//                     _currentSelectedSVGID = undefined;
//                }
//                if ( _debug === true)  _debugTrace += ", FT-selected-" + obj.feature.ftid;
//                //color was changed on the mouseover and will not be restore on the mouseout
//                obj.feature.selected = true;
//                 _currentSelectedFeature = biojs_vis_proteinFeaturesViewer.opt.featuresModel.categories[obj.feature.categoryIndex]
//                    .types[obj.feature.typeIndex]
//                    .locations[obj.feature.locationIndex]
//                    .features[obj.feature.featureIndex];
//                 _currentSelectedFeature.selected = true;
//                 _currentSelectedSVGID = obj.svgElemID;
//                //select same feature in all other svg tracks (on zoom in/out categories and tracks will be repainted with selection so more than one SVG can be selected)
//                d3.selectAll("path[id^='" +  _currentSelectedFeature.ftid + "_index_']").style("fill-opacity", 1);
//                biojs_vis_proteinFeaturesViewer.trigger('featureSelected', {feature: obj.feature});
//                if (recentlyUnselected != undefined) {
//                    recentlyUnselected.selected = false;
//                    biojs_vis_proteinFeaturesViewer.opt.featuresModel.categories[recentlyUnselected.categoryIndex]
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
//    _onInstanceFeatureOn = function(obj) {
//        if ( _zoomed === true) {
//            if ( _debug === true)  _debugTrace += ", sequence-on-" + obj.feature.ftid;
//            var end = FTVUtils.getEnd(obj.feature);
//            var start = FTVUtils.getStart(obj.feature);
//            if ((start == 1) && (end == biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length)) {
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
//    _onInstanceFeatureOff = function(obj) {
//        if ( _zoomed === true) {
//            if ( _debug === true)  _debugTrace += ", sequence-off-" + obj.feature.ftid;
//            var end = FTVUtils.getEnd(obj.feature);
//            var start = FTVUtils.getStart(obj.feature);
//            if (obj.feature.selected != true) {
//                if ((start == 1) && (end == biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length)) {
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
//            d3.selectAll("div." + categoryTarget).style("display", _categoryDivDisplay);
//        }
//        if (category[categoryTarget +  _hasBeenOpenedProp] !== true) {
//            if ( _debug === true)  _debugTrace += ", open-category-first-" + category.category;
//            category[categoryTarget +  _hasBeenOpenedProp] = true;
//            _.each(category.types, function(type, posType) {
//                var myInstance = new nonOverlapping;
//                nonOverlapping.construct({
//                    target: categoryTarget + "_type_" + posType
//                    ,darkBackground: dark
//                    ,width: biojs_vis_proteinFeaturesViewer.opt.width
//                    ,useShapes: biojs_vis_proteinFeaturesViewer.opt.useShapes
//                    ,useTooltips: biojs_vis_proteinFeaturesViewer.opt.useTooltips
//                    ,clickable: false
//                    ,zoomable: false
//                    ,collapsible: false
//                    ,ftHeight: biojs_vis_proteinFeaturesViewer.opt.ftHeight
//                    ,transparency: biojs_vis_proteinFeaturesViewer.opt.transparency
//                    ,sequence: biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence
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
//                _instances.push(myInstance);
//                if (_zoomed === true) {
//                    myInstance.zoomInOut();
//                    var currentX = parseFloat(_dragger.attr("x"));
//                    var moveAA = currentX / _pixelPerAA + 1;
//                    myInstance.translate(moveAA);
//                }
//            });
//        } else {
//            if ( _debug === true)  _debugTrace += ", open-category-" + category.category;
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
//    _closeCategory = function(category, categoryTarget) {
//        if ( _debug === true)  _debugTrace += ", close-category-" + category.category;
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
//    /**
//     * Calculates the number of amino acids to move to left or right.
//     * @param left True if the movment will go to the left, false otherwise.
//     * @private
//     */
//    _slide = function(left) {
//        var currentX = parseFloat( _dragger.attr("x"));
//        var currentAA = currentX /  _pixelPerAA;
//        if ( _numVisibleAA === undefined) {
//            var firstMaxVisibleAA = ( _rulerWidth -  _dragger.attr("width")) /  _pixelPerAA;
//             _numVisibleAA = biojs_vis_proteinFeaturesViewer.opt.featuresModel.sequence.length - firstMaxVisibleAA;
//        }
//        if (left === true) {
//             _firstVisibleAA = currentAA -  _numVisibleAA/2;
//            return currentAA -  _numVisibleAA/2;
//        } else {
//             _firstVisibleAA = currentAA +  _numVisibleAA/2;
//            return currentAA +  _numVisibleAA/2;
//        }
//    },
//

;
/*
 * Public zone
 */
biojs_vis_proteinFeaturesViewer.opt = {
    target: "YourOwnDivId"
    ,width: 600
    ,useShapes: true
    ,useTooltips: false
    ,clickable: true
    ,zoomable: true
    ,ftHeight: 10
    ,transparency: 0.5
    ,featuresModel: {}
};

///**
// * Zooms in or out the features displayed.
// * @param moveToAA Zoom and then move to the given amino acid.
// */
//biojs_vis_proteinFeaturesViewer.zoomInOut = function(moveToAA) {
//    var self = this;
//    if ( _zoomed === false) { //It is zoomed out, then zoom in, i.e., go to detailed view
//        if ( _debug === true)  _debugTrace += ", zoom-in";
//        _.each(_instances, function(instance) {
//            instance.zoomInOut();
//        });
//        d3.selectAll("div .seqContainer").style("display",  _controlAASeqDivDisplay);
//        var visibleAA =  _rulerWidth / FTVUtils.getMaxPixelAA();
//         _dragger
//            .classed("zoomable", false)
//            .classed("draggable", true)
//            .attr("width", visibleAA * _pixelPerAA)
//            .attr("x", 0)
//            .attr("d", _draggerPath(
//                {x: 0, y: parseFloat(_dragger.attr("y"))}
//                , visibleAA * _pixelPerAA, parseFloat(_dragger.attr("height"))))
//            .attr("transform", "translate(0,0)");
//         _zoomOutButton.style("display",  _buttonDisplay);
//         _moveLeftButton.style("display",  _buttonDisplay);
//         _moveRightButton.style("display",  _buttonDisplay);
//         _zoomInButton.style("display", "none");
//         _zoomed = true;
//        if ( _currentSelectedFeature != undefined) {
//             _onInstanceFeatureOn({feature:  _currentSelectedFeature});
//        }
//        if (moveToAA !== undefined) {
//            biojs_vis_proteinFeaturesViewer.translate(moveToAA);
//        }
//    } else {  //It is zoomed in, then zoom out, i.e., go to overview
//        if ( _debug === true)  _debugTrace += ", zoom-out";
//        _.each(_instances, function(instance) {
//            instance.zoomInOut();
//        });
//        d3.selectAll("div .seqContainer").style("display", "none");
//        d3.selectAll("g.seqSVGGroup")
//            .attr("transform", "translate" +
//                "(" + _rulerMargin.left +
//                "," +  _rulerMargin.top + ")");
//         _zoomOutButton.style("display", "none");
//         _moveLeftButton.style("display", "none");
//         _moveRightButton.style("display", "none");
//         _zoomInButton.style("display",  _buttonDisplay);
//         _dragger
//            .classed("zoomable", true)
//            .classed("draggable", false)
//            .attr("width", _rulerWidth)
//            .attr("x", 0)
//            .attr("d", _draggerPath(
//                {x: 0, y: parseFloat(_dragger.attr("y"))}
//                , _rulerWidth, parseFloat(_dragger.attr("height"))))
//            .attr("transform", "translate(0,0)");
//         _zoomed = false;
//        d3.selectAll(".aminoAcid").style("stroke", "none");
//    }
//    //always update selection of features across all svg
//    if ( _currentSelectedFeature != undefined) {
//        if ( _debug === true)  _debugTrace += ", zoom-selectedFT-updated";
//        d3.selectAll("path[id^='" +  _currentSelectedFeature.ftid + "_index_']").style("fill-opacity", 1);
//    }
//    //TODO event???
//};
//
///**
// * Translates a category to a given coordinate.
// * @param xMove Starting coordinate for translation, meaning the first amino acid to be displayed.
// */
//biojs_vis_proteinFeaturesViewer.translate = function(moveToAA) {
//    //if ( _debug === true)  _debugTrace += ", translate-to-" + moveToAA;
//    var self = this;
//    if ( _zoomed === true) {
//        var previousX = parseFloat( _dragger.attr("x"));
//        var currentX = moveToAA *  _pixelPerAA;
//        var firstMaxVisibleAA =  _rulerWidth -  _dragger.attr("width");// + _pixelPerAA;
//        if (currentX < 0) {
//            currentX = 0;
//        } else if (currentX > firstMaxVisibleAA) {
//            currentX = firstMaxVisibleAA;
//        }
//        if (currentX != previousX) {
//             _dragger.attr("x", currentX);
//             _dragger.attr("transform", "translate(" + currentX + ", " + 0 + ")");
//            d3.selectAll("g.seqSVGGroup")
//                .attr("transform", "translate(" +
//                    (_rulerMargin.left - (currentX/_pixelPerAA)*FTVUtils.getMaxPixelAA() ) + "," +
//                    _rulerMargin.top + ")"
//            );
//            if (currentX != previousX) {
//                _.each(_instances, function(instance) {
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
biojs_vis_proteinFeaturesViewer.greetings = function(id, text) {
    biojs_vis_proteinFeaturesViewer.start();
    d3.select("#" + id).text("hello " + text);
};
/**
 * Greetings test method.
 * @example
 *     biojs_vis_proteinFeaturesViewer.greetingsTest('biojs');
 *
 * @method greetingsTest
 * @param {String} text Text to greet to
 * @return {String} Returns hello + text
 */
biojs_vis_proteinFeaturesViewer.getGreetings = function (text) {
    return 'hello ' + text;
};

require('biojs-events').mixin(biojs_vis_proteinFeaturesViewer.prototype);