var _ = require("underscore");
var d3 = require("d3");
var FTVUtils = require("./pftv-aux-utils");
var CategoryViewer = require("./pftv-aux-proteinCategoryFTViewer");
/*
 * biojs-vis-proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */
 
/**
@class biojs-vis-proteinFeaturesViewer

 Events:
 featureOn: whenever the mouse is on a feature. Listens to categories and types and propagates.
 featureOff: whenever the mouse goes away from a feature. Listens to categories and types and propagates.
 featureSelected: whenever a feature is selected (remains highlighted). Listens to categories and propagates.
 featureUnselected: whenever a feature is deselected (fixed highlighted is remove). Listens to categories and propagates.
 zoomIn: whenever a zoom in is performed.
 zoomOut: whenever a zoom out is performed.
 categoryOpen: whenever a category is opened. Listens to categories and propagates.
 categoryClose: whenever a category is closed. Listens to categories and propagates.
 openAllTracks: whenever all tracks (categories and types) are opened at the same time.
 closeAllTracks: whenever all tracks (categories and types) are closed at the same time.
 filter: TODO
 */
var  ProteinFeaturesViewer;
 
module.exports = ProteinFeaturesViewer = function(options){
    _constructor(this, options);
};
 
/**
 * Private zone
 */
/*
 * Private variables
 * */
var
    _DEFAULT_OPTIONS = {
        width: 600
        ,useShapes: true
        ,useTooltips: false
        ,clickable: true
        ,ftHeight: 10
        ,variantHeight: 130
        ,transparency: 0.5
    },
    /*
     * Buttons default display
     * @type {string}
     * @private
     */
    _BUTTON_DISPLAY = "inline-block",
    /**
     * Arrow to right, used when a category is closed.
     * @type {string}
     * @private
     */
    _ARROW_RIGHT = "\u25BA",
    /**
     * Arrow to bottom, used when a category is open.
     * @type {string}
     * @private
     */
    _ARROW_DOWN = "\u25BC"
;
/*
 * Private methods
 * */
var
    /**
     * Constructor, it loads the default values for the options.
     * @param self This instance.
     * @params options Configuration options.
     * @private
     */
    _constructor = function(self, options) {
        var targetID = FTVUtils.ID_CLASS_PREFIX + (new Date().getTime());
        if (options.element == undefined) {
            d3.select("body").append("div").attr("id", targetID);
            options.element = document.getElementById(targetID);
        }
        if ((options.element.id == undefined) || (options.element.id.length === 0))  {
            options.element.id = targetID;
            options.target = targetID;
        } else {
            options.target = options.element.id;
        }

        var allEmpty = false;
        try {
            allEmpty = _.every(options.featuresModel.categories, function(category) {
                if (FTVUtils.isVariantsTrack(category)) {
                    return _.every(category.variants, _.isEmpty);
                } else {
                    return _.every(category.types, _.isEmpty);
                }
            });
            if (allEmpty === true) {
                d3.select(options.element).text("No features available for this protein.");
            } else {
                self.opt = _.extend(_.extend({}, _DEFAULT_OPTIONS), options);
                _init(self);
            }
        } catch (error) {
            d3.select(self.opt.element).html(
                "<p>" +
                    "Please make sure you are providing a modelFeatures element in the configuration options." +
                    "<br/>Please take a look to configuration options and mandatory fields at https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer." +
                "</p>" +
                "<p>" +
                    "If you still have problems, you can report the following error and trace to developers via GitHub." +
                    "<br/><b>Chrome</b> usually provide the best strack trace, which would be helpful for developers." +
                    "<br/>Providing traces from different browsers might also be a good idea." +
                    "<br/><br/><b>Error:</b> " + error.message +
                    "<br/><br/><b>Stacktrace:</b> " + error.stack +
                "</p>");
        }
    },

    /**
     * Initializes the private variables and layout, including div/svg for controls and categories.
     * @param self This instance.
     * @private
     * */
    _init = function(self) {
        _initMenuClosing(self);
        _initTooltip(self);
        self.opt.featuresModel.sequence = self.opt.featuresModel.sequence.toUpperCase();
        //setting up values
        self._rulerMargin = {
            top: FTVUtils.getMaxSeqLengthDisplay().height +  self._draggerGap,
            right: FTVUtils.getMarginLeftRight().right + FTVUtils.getZoomTextGap() - FTVUtils.getTitlesPadding()*2,
            bottom: 0,
            left: FTVUtils.getMarginLeftRight().left + FTVUtils.getTitlesPadding()*2
        };
        self._leftMarginAASeq = self._rulerMargin.left + 2;
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
     * Some buttons will display a menu; such menus should be closed whenever a user clicks on the X corner,
     * or anywhere else out of the menu area.
     * @param self This instance.
     * @private
     * */
    _initMenuClosing = function(self) {
    	d3.select("body")
            .on("click", function() {
                var origin = d3.event.target.className;
                if (typeof origin === "object") {
                    origin = origin.baseVal;
                }
                if ((origin === undefined) || (origin.indexOf(FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick") === -1)) {
                    self._filterDiv.style("opacity", 1e-6).style("z-index", -1);
                    self._settingsDiv.style("opacity", 1e-6).style("z-index", -1);
                    self._helpDiv.style("opacity", 1e-6).style("z-index", -1);
                }
            })
        ;
    },
    /**
     * Initializes the tooltip.
     * @param self This instance.
     * @private 
     */
    _initTooltip = function(self) {
    	//tooltip
        self._tooltipdiv = d3.select(self.opt.element).append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "tooltip", true)
            .style("opacity", 1e-6);
        //filter
        self._filterOptions = [];
        self._filterDiv = d3.select(self.opt.element).append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "dialog " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
            .style("opacity", 1e-6).style("z-index", -1);
        self._filterDiv.append("div").classed(FTVUtils.ID_CLASS_PREFIX + "clickable " + FTVUtils.ID_CLASS_PREFIX + "spriteCloseX " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
            .on("click", function() {
                self._filterDiv.style("opacity", 1e-6).style("z-index", -1);
            })
        ;
        _.each(FTVUtils.evidenceGroups, function(elem, posElem) {
            var internalDiv = self._filterDiv.append("div")
                .classed(FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true);
            var input = internalDiv.append("input")
                    .attr("id", FTVUtils.ID_CLASS_PREFIX + "check_curation_" + posElem)
                    .classed(FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
                    .attr("filter", elem.name)
                    .attr("type", "checkbox")
                    .property("checked", true);
            self._filterOptions.push(input[0][0]);
            internalDiv.append("span")
                .classed(FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
                .text(elem.text);
        });
        self._filterDiv.append("button").classed(FTVUtils.ID_CLASS_PREFIX + "clickable " + FTVUtils.ID_CLASS_PREFIX + "applyButton", true)
            .text("Apply")
            .on("click", function() {
                var filters = {evidence: {}};
                _.each(self._filterOptions, function(filter) {
                    if (filter.checked === true) {
                        try {
                            filters.evidence[filter.attributes.filter.value] = true;
                        } catch (error) {}  //TODO, try to avoid error catching, avoid/minimize the error some how!!!
                    }
                });
                self.filter(filters);
            });
        //settings
        self._settingsDiv = d3.select(self.opt.element).append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "dialog " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
            .style("opacity", 1e-6).style("z-index", -1);
        self._settingsDiv.append("div").classed(FTVUtils.ID_CLASS_PREFIX + "clickable " + FTVUtils.ID_CLASS_PREFIX + "spriteCloseX " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
            .on("click", function() {
                self._settingsDiv.style("opacity", 1e-6).style("z-index", -1);
            })
        ;
        //help
        self._helpDiv = d3.select(self.opt.element).append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "dialog " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
            .style("opacity", 1e-6).style("z-index", -1);
        self._helpDiv.append("div").classed(FTVUtils.ID_CLASS_PREFIX + "clickable " + FTVUtils.ID_CLASS_PREFIX + "spriteCloseX " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
            .on("click", function() {
                self._helpDiv.style("opacity", 1e-6).style("z-index", -1);
            })
        ;
        self._helpDiv.append("div").classed(FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
            .html("<p class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick'>The Protein Features Viewer displays protein sequence features in tracks. " +
            "Features are grouped in types and types are grouped in categories. " +
            "The initial overview displays one category per track, with features organized on a centered layout, " +
            "while the open view displays one type per track, with features organized in a non overlapping layout. " +
            "Rectangles are used for features typically covering more than one residue, bridges are used for features connecting" +
            "two residues, and shapes are used for features tipically covering only one or two residues</p>" +
            "<div class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick'>" + _ARROW_RIGHT + " opens a category so its types will be displayed.</div>" +
            "<div class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick'>" + _ARROW_DOWN + " closes a category.</div>" +
            "<div>" +
                "<div class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display: inline-block'>" +
                "   <div class='" + FTVUtils.ID_CLASS_PREFIX + "spriteOpenAll " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display:inline-block;'></div> Opens all categories. " +
                "</div>" +
                "<div class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display: inline-block'>" +
                "   <div class='" + FTVUtils.ID_CLASS_PREFIX + "spriteCloseAll " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display:inline-block;'></div> Closes all categories" +
                "</div>" +
            "</div>" +
            "<div class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick'>" +
                "<div class='" + FTVUtils.ID_CLASS_PREFIX + "spriteSettings " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display:inline-block;'></div> Allows you to hide/show categories." +
            "</div>" +
            "<div>" +
                "<div class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display: inline-block'>" +
                "   <div class='" + FTVUtils.ID_CLASS_PREFIX + "spriteZoomIn " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display:inline-block;'></div> Zooms in to amino acid level. " +
                "</div>" +
                "<div class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display: inline-block'>" +
                "   <div class='" + FTVUtils.ID_CLASS_PREFIX + "spriteZoomOut " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display:inline-block;'></div> Zooms out." +
                "</div>" +
            "</div>" +
            "<div>" +
                "<div class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display: inline-block'>" +
                "   <div class='" + FTVUtils.ID_CLASS_PREFIX + "spriteMoveLeft " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display:inline-block;'></div> Moves to the left. " +
                "</div>" +
                "<div class='" + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display: inline-block'>" +
                "   <div class='" + FTVUtils.ID_CLASS_PREFIX + "spriteMoveRight " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick' style='display:inline-block;'></div> Moves to the right." +
                "</div>" +
            "</div>");
    },
    /**
     * Initializes the master control panel at the top.
     * @param self This instance.
     * @private
     */
    _initMasterControlDiv = function(self) {
        //div with titles, controls, and ruler
        var controlDiv = d3.select(self.opt.element)
            .append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "control", true)
            .style("width", self.opt.width + "px");
 
        //first row: accession and controls
        var controlDivUp = controlDiv.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "row", true)
            .style("width", self.opt.width + "px");
         _initAccession(self, controlDivUp);
         _initControls(self, controlDivUp);
 
        //second row: identifier and then ruler and aa sequence
        var controlDivDown = controlDiv.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "row", true)
            .style("width", self.opt.width + "px");
         _initIdentifier(self, controlDivDown);
        var controlDivDownRight = controlDivDown.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "cell", true)
            .style("width", (self.opt.width - FTVUtils.getTitlesWidth()) + "px");
        var rulerWidthWithMargin =  _initRulerDiv(self, controlDivDownRight);
         _initAASeqDiv(self, controlDivDownRight, rulerWidthWithMargin);
        return rulerWidthWithMargin;
    },
    /**
     * Initializes the protein accession.
     * @param self This instance.
     * @param controlDiv
     * @private
     */
    _initAccession = function(self, controlDivUp) {
        controlDivUp.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "cell " + FTVUtils.ID_CLASS_PREFIX + "accession", true)
            .style("width", FTVUtils.getTitlesWidth() + "px")
            .text(self.opt.featuresModel.accession);
    },
    /**
     * Initializes the controls (zoom, TODO download, upload, legend).
     * @param self This instance.
     * @param controlDiv
     * @private
     */
    _initControls = function(self, controlDivUp) {
        var controlDivUpRight = controlDivUp.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "cell", true)
            .style("width", (self.opt.width-FTVUtils.getTitlesWidth()) + "px");

        var leftControlDivUpRight = controlDivUpRight.append("div").classed(FTVUtils.ID_CLASS_PREFIX + "left", true);
        //zoom in/out
        self._zoomInButton = _initControlButton(
            self, leftControlDivUpRight, FTVUtils.ID_CLASS_PREFIX + "zoomInButton", FTVUtils.ID_CLASS_PREFIX + "spriteZoomIn", true,
            function() {
                //if (self._debug === true) self._debugTrace += ", on-click-zoom-out-button";
                self.zoomInOut();
            }, "Zoom-in to amino acid level"
        );
        self._zoomOutButton = _initControlButton(
            self, leftControlDivUpRight, FTVUtils.ID_CLASS_PREFIX + "zoomOutButton", FTVUtils.ID_CLASS_PREFIX + "spriteZoomOut", false,
            function() {
                //if (self._debug === true) self._debugTrace += ", on-click-zoom-out-button";
                self.zoomInOut();
            }, "Zoom-out to overview level");
        //move left/right
        self._moveLeftButton = _initControlButton(
            self, leftControlDivUpRight, FTVUtils.ID_CLASS_PREFIX + "moveLeftButton", FTVUtils.ID_CLASS_PREFIX + "spriteMoveLeft", false,
            function() {
                if (self._zoomed === true) {
                    //if (self._debug === true) self._debugTrace += ", move-left";
                    self.translate(_slide(self, true));
                }
            }, "Move current display 50% left"
        );
        self._moveRightButton = _initControlButton(
            self, leftControlDivUpRight, FTVUtils.ID_CLASS_PREFIX + "moveRightButton", FTVUtils.ID_CLASS_PREFIX + "spriteMoveRight", false,
            function() {
                if (self._zoomed === true) {
                    //if (self._debug === true) self._debugTrace += ", move-right";
                    self.translate(_slide(self, false));
                }
            }, "Move current display 50% right"
        );

        var rightControlDivUpRight = controlDivUpRight.append("div").classed(FTVUtils.ID_CLASS_PREFIX + "right", true);
        //open/close tracks
        self._openAllButton = _initControlButton(
            self, rightControlDivUpRight, FTVUtils.ID_CLASS_PREFIX + "openAllButton", FTVUtils.ID_CLASS_PREFIX + "spriteOpenAll", true,
            function() {
                //if (self._debug === true) self._debugTrace += ", open-all";
                self.openAllTracks();
            }, "Open all tracks"
        );
        self._closeAllButton = _initControlButton(
            self, rightControlDivUpRight, FTVUtils.ID_CLASS_PREFIX + "closeAllButton", FTVUtils.ID_CLASS_PREFIX + "spriteCloseAll", false,
            function() {
                //if (self._debug === true) self._debugTrace += ", close-all";
                self.closeAllTracks();
            }, "Collapse all tracks"
        );
        //filter
        self._filterButton = _initControlButton(
            self, rightControlDivUpRight, FTVUtils.ID_CLASS_PREFIX + "filterButton", FTVUtils.ID_CLASS_PREFIX + "spriteFilter " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true,
            function() {
                //if (self._debug === true) self._debugTrace += ", filter";
                self._filterDiv.style("opacity", 1).style("z-index", 10);
            }, "Filter according to curation method");
        //settings
        self._settingsButton = _initControlButton(
            self, rightControlDivUpRight, FTVUtils.ID_CLASS_PREFIX + "settingsButton", FTVUtils.ID_CLASS_PREFIX + "spriteSettings " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true,
            function() {
                //if (self._debug === true) self._debugTrace += ", settings";
                self._settingsDiv.style("opacity", 1).style("z-index", 10);
            }, "Hide/show tracks"
        );
        //help
        self._helpButton = _initControlButton(
            self, rightControlDivUpRight, FTVUtils.ID_CLASS_PREFIX + "helpButton", FTVUtils.ID_CLASS_PREFIX + "spriteHelp " + FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true,
            function() {
                /*if (self._debug === true) {
                    self._debugTrace += ", STOP";
                    console.log(self._debugTrace);
                    self._debugTrace = "INIT";
                } */
                self._helpDiv.style("opacity", 1).style("z-index", 10);
            }, "Hide/show tracks"
        );
        //div localization, make sure all buttons have been displayed
        self._filterDiv
            .style("left", ( self._filterButton[0][0].offsetLeft - self._filterDiv[0][0].offsetWidth + 5) + "px")
            .style("top", ( self._filterButton[0][0].offsetTop + self._filterButton[0][0].offsetHeight - 5) + "px");
        self._helpDiv
            .style("left", ( self._helpButton[0][0].offsetLeft - self._helpDiv[0][0].offsetWidth + 5) + "px")
            .style("top", ( self._helpButton[0][0].offsetTop + self._helpButton[0][0].offsetHeight - 5) + "px");
    },
    /**
     * Initializes the zoom in/out buttons.
     * @param self This instance.
     * @param container
     * @param id
     * @param addToClass
     * @param display
     * @param onclick
     * @param tooltipText
     * @returns {*}
     * @private
     */
    _initControlButton = function(self, container, id, addToClass, display, onclick, tooltipText) {
        var button = container.append("div")
                .attr("id", id)
                .classed(FTVUtils.ID_CLASS_PREFIX + "clickable " + addToClass, true)
                .on("click", onclick)
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
        if (display === false) {
            button.style("display", "none");
        } else {
            button.style("display", _BUTTON_DISPLAY);
        }
        return button;
    },
    /**
     * Initializes the protein identifier.
     * @param self This instance.
     * @param controlDivDown
     * @private
     */
    _initIdentifier = function(self, controlDivDown) {
        controlDivDown.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "cell " + FTVUtils.ID_CLASS_PREFIX + "identifier", true)
            .style("width", FTVUtils.getTitlesWidth() + "px")
            .text(self.opt.featuresModel.identifier.toUpperCase());
    },
    /**
     * Initializes all the elements related to the ruler.
     * @param self This instance.
     * @param controlDivDown
     * @private
     */
    _initRulerDiv = function(self, controlDivDownRight) {
        //Second row of controls: protein identifier and ruler
        var controlDivDownRightRuler = controlDivDownRight.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "row", true)
            .style("width", (self.opt.width - FTVUtils.getTitlesWidth()) + "px");
        var rulerWidthWithMargin = Math.floor((self.opt.width - FTVUtils.getTitlesWidth()) -  self._pixelPerAA);
        //init rows
        _initRulerSVG(self, controlDivDownRightRuler, rulerWidthWithMargin);
        return rulerWidthWithMargin;
    },
    /**
     * Initializes the amino acids sequence.
     * @param self This instance.
     * @param controlDivDown
     * @private
     */
    _initAASeqDiv = function(self, controlDivDownRight) {
        var temp = controlDivDownRight.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "row " + FTVUtils.ID_CLASS_PREFIX + "seqContainer", true)
            .style("width", (self.opt.width - FTVUtils.getTitlesWidth()) + "px");
         self._controlAASeqDivDisplay = temp.style("display");
        temp.style("display", "none");
    },
    /**
     * Initializes the categories.
     * @param self This instance.
     * @private
     */
    _initCategories = function(self) {
        var dark = true;
        //var startTime = new Date().getTime();
        _.each(self.opt.featuresModel.categories, function(category, posCat) {
            var internalDiv = self._settingsDiv.append("div")
                .classed(FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true);
            internalDiv.append("input")
                .attr("id", FTVUtils.ID_CLASS_PREFIX + "check_category_" + posCat)
                .classed(FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
                .attr("index", posCat)
                .attr("type", "checkbox")
                .property("checked", true)
                .on("click", function() {
                    if (this.checked === true) {
                        d3.selectAll("div[id^='" + self.opt.target + "_category_" + d3.select(this).attr("index") + "']")
                            .style("display", self._categoryDivDisplay); //show all categories and types
                        d3.selectAll("#" + self.opt.target + "_category_" + d3.select(this).attr("index") + " div." + FTVUtils.ID_CLASS_PREFIX + "hiddenCategory")
                            .style("display", "none"); //hide category if closed
                        d3.selectAll("div[id^='" + self.opt.target + "_category_" + d3.select(this).attr("index") + "_type_']" + "." + FTVUtils.ID_CLASS_PREFIX + "hiddenCategory")
                            .style("display", "none"); //hide types if closed
                    } else {
                        d3.selectAll("div[id^='" + self.opt.target + "_category_" + d3.select(this).attr("index") + "']")
                            .style("display", "none");
                    }
                });
            internalDiv.append("span")
                .classed(FTVUtils.ID_CLASS_PREFIX + "nothingOnBodyClick", true)
                .text(category.category);
            dark = posCat%2 == 0 ? true : false;
            var myInstance = _createOverviewInstance(self, posCat, dark);
            self._instances.push(myInstance);
        });
        //var endTime = new Date().getTime();
        //console.log("ALL: " + (endTime-startTime) + "ms");
        self._settingsDiv
            .style("left", ( self._settingsButton[0][0].offsetLeft - self._settingsDiv[0][0].offsetWidth + 5) + "px")
            .style("top", ( self._settingsButton[0][0].offsetTop + self._settingsButton[0][0].offsetHeight - 5) + "px");
    },
    /**
     * Creates an overview instance.
     * @param self This instance.
     * @private 
     */
    _createOverviewInstance = function (self, posCat, dark) {
        var temp = d3.select(self.opt.element)
            .append("div")
            .attr("id", self.opt.target + "_category_" + posCat)
            .attr("index", posCat)
            .classed(FTVUtils.ID_CLASS_PREFIX + "category", true);
        self._categoryDivDisplay = temp.style("display");
    	var myInstance = new CategoryViewer({
                element: document.getElementById(self.opt.target + "_category_" + posCat)
                ,darkBackground: dark
                ,width: self.opt.width
                ,useShapes: FTVUtils.isVariantsTrack(self.opt.featuresModel.categories[posCat]) ? false : self.opt.useShapes
                ,useTooltips: self.opt.useTooltips
                ,clickable: true
                ,collapsible: true
                ,ftHeight: FTVUtils.isVariantsTrack(self.opt.featuresModel.categories[posCat]) ? self.opt.variantHeight : self.opt.ftHeight
                ,transparency: self.opt.transparency
                ,sequence: self.opt.featuresModel.sequence
                ,category: self.opt.featuresModel.categories[posCat]
                ,categoryIndex: posCat
                ,styleView: FTVUtils.isVariantsTrack(self.opt.featuresModel.categories[posCat]) ? FTVUtils.styleViews.centeredVariants : FTVUtils.styleViews.centered
            });
            self.opt.featuresModel.categories[posCat] = myInstance.opt.category;
            myInstance.on("categoryOpen", function(obj) {
                self.trigger('categoryOpen', obj);
                self._howManyOpen++;
                if (self._howManyOpen === self.opt.featuresModel.categories.length) {
                    self._openAllButton.style("display", "none");
                    self._closeAllButton.style("display", _BUTTON_DISPLAY);
                } else {
                    self._openAllButton.style("display", _BUTTON_DISPLAY);
                    self._closeAllButton.style("display", _BUTTON_DISPLAY);
                }
            });
            myInstance.on("categoryClose", function(obj) {
                self.trigger('categoryClose', obj);
                console.log(self._howManyOpen);
                if (self._howManyOpen === 0) {
                    self._openAllButton.style("display", _BUTTON_DISPLAY);
                    self._closeAllButton.style("display", "none");
                } else {
                    self._openAllButton.style("display", _BUTTON_DISPLAY);
                    self._closeAllButton.style("display", _BUTTON_DISPLAY);
                }
            });
            myInstance.on("featureOn", function (obj) {
                _onInstanceFeatureOn(self, obj);
            });
            myInstance.on("featureOff", function(obj) {
                _onInstanceFeatureOff(self, obj);
            });
            myInstance.on("featureSelected", function(obj) {
                _onInstanceFeatureSelected(self, obj);
            });
            myInstance.on("featureUnselected", function(obj) {
                _onInstanceFeatureDeselected(self, obj);
            });
            return myInstance;
    },
    /**
     * Initializes the secondary control panel at the bottom, only with the sequence.
     * @param self This instance.
     * @param rulerWidthWithMargin Width including margin for the ruler.
     * @private
     */
    _initSecondaryControlDiv = function(self, rulerWidthWithMargin) {
        //Secondary control, duplicated sequence
        var secondaryControlDiv = d3.select(self.opt.element)
            .append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "control", true)
            .style("width", self.opt.width + "px");
        //unique row: empty and ruler
        var secondaryControlDivDown = secondaryControlDiv.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "row", true)
            .style("width", self.opt.width + "px");
        secondaryControlDivDown.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "cell " + FTVUtils.ID_CLASS_PREFIX + "identifier", true)
            .style("width", FTVUtils.getTitlesWidth() + "px");
        var controlDivDownRight = secondaryControlDivDown.append("div")
            .classed(FTVUtils.ID_CLASS_PREFIX + "cell", true)
            .style("width", (self.opt.width - FTVUtils.getTitlesWidth()) + "px");
         _initAASeqDiv(self, controlDivDownRight, rulerWidthWithMargin);
    },
    /**
     * Initializes the sequence SVG
     * @param self This instance.
     * @param rulerWidthWithMargin
     * @private
     */
    _initSeqAASVG = function (self, rulerWidthWithMargin) {
        var seqAAHeight = FTVUtils.getMaxPixelAA()*3;
        d3.selectAll("div." + FTVUtils.ID_CLASS_PREFIX + "seqContainer").append("svg")
            .classed(FTVUtils.ID_CLASS_PREFIX + "seqSVG", true)
            .attr("width", rulerWidthWithMargin)
            .attr("height", seqAAHeight);
 
        var sequenceLength = self.opt.featuresModel.sequence.length;
        var maxAminoAcidFontSize = FTVUtils.getMaxAAFontDisplay().width/2;
        var maxAAPositionFontSize = FTVUtils.calculateTextSizeSVG(sequenceLength, ".aminoAcid").width/2;
        d3.selectAll("svg." + FTVUtils.ID_CLASS_PREFIX + "seqSVG").append("g")
            .classed(FTVUtils.ID_CLASS_PREFIX + "seqSVGGroup", true)
            .attr("transform", "translate(" + self._leftMarginAASeq + "," + self._rulerMargin.top + ")");
        var aaResidues = d3.selectAll("g." + FTVUtils.ID_CLASS_PREFIX + "seqSVGGroup").selectAll("text")
            .data(self.opt.featuresModel.sequence).enter()
            .append("text")
            .classed(FTVUtils.ID_CLASS_PREFIX + "aminoAcid", true)
            .attr("x", function (d, i) {
                return i*FTVUtils.getMaxPixelAA() + FTVUtils.getMaxPixelAA()/2 - maxAminoAcidFontSize + 2;})
            .attr("tooltip", function(d, i) {return (i+1);})
            .on("mouseover", function(d, i) {
                self._initialStroke = d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid[tooltip='" + (i+1) + "']").style("stroke");
                d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid[tooltip='" + (i+1) + "']").style("stroke", "black");
                FTVUtils.mouseover(self._tooltipdiv, d3.select(this).attr("tooltip"));
            })
            .on("mousemove", function() {
                FTVUtils.mousemove(self._tooltipdiv);
            })
            .on("mouseout", function(d, i) {
                d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid[tooltip='" + (i+1) + "']").style("stroke", self._initialStroke);
                FTVUtils.mouseout(self._tooltipdiv);
            })
            .text(function (d) {return d;})
            .filter(function (d, i) {
            	return ((i+1) % 10) == 0;
            })
            	.append("tspan")
            	.attr("x", function (d, i) {
                	return (i+1)*10*FTVUtils.getMaxPixelAA() - FTVUtils.getMaxPixelAA()/2 - maxAAPositionFontSize + 4;
            	})
	            .attr("y", FTVUtils.getMaxPixelAA() + 2)
	            .text(function (d, i) {
                    if (((i+1) * 10) == sequenceLength) {
                        return "";
                    } else {
                        return (i+1) * 10;
                    }
	            })
        ;
    },
    /**
     * Initializes the ruler SVG.
     * @param self This instance.
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
     * @param self This instance.
     * @param rulerTickHeight
     * @param longRulerTickHeight
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
     * @param self This instance.
     * @param rulerTickHeight
     * @private
     */
    _initDragger = function(self, rulerTickHeight) {
        self._dragger = self._ruler.append("g")
            .selectAll("path").
            data([{ x: 0, y: -2 }]).enter()
            .append("path")
            .classed(FTVUtils.ID_CLASS_PREFIX + "rulerDragger", true)
            .classed(FTVUtils.ID_CLASS_PREFIX + "zoomable", true)
            .attr("width", self._rulerWidth)
            .attr("height", rulerTickHeight + self._draggerGap)
            .attr("x", function (d) { return d.x; })
            .attr("y", function (d) { return d.y; })
            .attr("d", function(d) {
                return _draggerPath(d, self._rulerWidth, rulerTickHeight + self._draggerGap);
            })
            .on("click", function() {
                if (d3.select(this).attr("class").indexOf(FTVUtils.ID_CLASS_PREFIX + "zoomable") != -1) {
                    var moveToAA = (d3.mouse(this)[0]+1) / self._pixelPerAA;
                    self.zoomInOut(moveToAA);
                }
            })
            .call(_onRulerDragDrop(self));
    },
    /**
     * Drag and drop behaviour for the ruler.
     * @param self This instance.
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
                        var firstMaxVisibleAA = self._rulerWidth - d3.select(this).attr("width");
                        if (currentX < 0) {
                            currentX = 0;
                        } else if (currentX > firstMaxVisibleAA) {
                            currentX = firstMaxVisibleAA;
                        }
                        d3.select(this).attr("x", d.x = currentX);
                        d3.select(this).attr("transform", "translate(" + currentX + ", " + 0 + ")");
                        d3.selectAll("g." + FTVUtils.ID_CLASS_PREFIX + "seqSVGGroup")
                            .attr("transform",
                                "translate(" +
                                (self._leftMarginAASeq - (currentX/self._pixelPerAA)*FTVUtils.getMaxPixelAA() ) + "," +
                                self._rulerMargin.top + ")"
                        );
                        var moveToAA = currentX / self._pixelPerAA + 1;
                        if (currentX != previousX) {
                            _.each(self._instances, function(instance) {
                                instance.translate(moveToAA, false);
                            });
                        }
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
    /**
     * Responds to a selection on a feature.
     * @param self This instance.
     * @param obj
     * @private
     */
    _onInstanceFeatureSelected = function(self, obj) {
        //update selected category
        if (self._currentSelectedFTCatIndex === undefined) {
            self._currentSelectedFTCatIndex = obj.feature.categoryIndex;
        } else {
            if (obj.feature.categoryIndex !== self._currentSelectedFTCatIndex) {
                d3.select(self._instances[self._currentSelectedFTCatIndex]._currentSelectedSVG).attr("fill-opacity", self.opt.transparency);
                d3.select("#" + self._instances[self._currentSelectedFTCatIndex]._currentSelectedSVG.id).style("fill-opacity", self.opt.transparency);
                self._instances[self._currentSelectedFTCatIndex]._currentSelectedSVG = undefined;

                self._instances[self._currentSelectedFTCatIndex]._currentSelectedFeature.selected = false;
                self.trigger("featureUnselected", {feature: self._instances[self._currentSelectedFTCatIndex]._currentSelectedFeature});
                _updateAASelection(self, {feature: self._instances[self._currentSelectedFTCatIndex]._currentSelectedFeature}, self._currentOnFeature);
                self._instances[self._currentSelectedFTCatIndex]._currentSelectedFeature = undefined;

                self._currentSelectedFTCatIndex = obj.feature.categoryIndex;
            }
        }
        self._currentSelectedFeature = obj.feature;
        self.trigger("featureSelected", {feature: obj.feature});
    },
    /**
     * Responds to a deselection on a feature.
     * @param self This instance.
     * @param obj
     * @private
     */
    _onInstanceFeatureDeselected = function(self, obj){
        if (obj.feature === self._currentOnFeature) {
            self._currentSelectedFTCatIndex = undefined;
        } else {
            _updateAASelection(self, obj, self._currentOnFeature);
            d3.selectAll("path[id^='" + FTVUtils.ID_CLASS_PREFIX + self._currentSelectedFeature.ftid + "_index_']").style("fill-opacity", self.opt.transparency);
        }
        self._currentSelectedFeature = undefined;
        self.trigger("featureUnselected", {feature: obj.feature});
    },
    /**
     * Highlights the amino acids in the sequence on feature on, only visible on zoomed view.
     * @param self This instance.
     * @param obj
     * @private
     */
    _onInstanceFeatureOn = function(self, obj) {
        self._currentOnFeature = obj.feature;
        if (self._zoomed === true) {
            //if ( self._debug === true) self._debugTrace += ", sequence-on-" + obj.feature.ftid;
            var end = FTVUtils.getEnd(obj.feature);
            var start = FTVUtils.getStart(obj.feature);
            if ((start === 1) && (end === self.opt.featuresModel.sequence.length)) {
                d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid").style("stroke", "black");
            } else {
                _.each(_.range(start, end+1), function(i) {
                    d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid[tooltip='" + (i) + "']").style("stroke", "black");
                });
            }
        }
        self.trigger("featureOn", {feature: obj.feature});
    },
    /**
     * De-highlights the amino acids in the sequence on feature off, only works on zoomed view.
     * Less code is possible but we want to minimize the loop times by (de)highlighting as less as possible.
     * @param self This instance.
     * @param obj
     * @private
     */
    _onInstanceFeatureOff = function(self, obj) {
        self._currentOnFeature = undefined;
        _updateAASelection(self, obj, self._currentSelectedFeature);
        self.trigger("featureOff", {feature: obj.feature});
    },
    /**
     * Updates the amino acide selection when the mouse leaves a feature or when a feature has been delected.
     * @param self This instance.
     * @param obj Object off or deselected.
     * @param current Current selected or on.
     * @private
     */
    _updateAASelection = function(self, obj, current) {
        if (self._zoomed === true) {
            //if (self._debug === true)  self._debugTrace += ", sequence-off-" + obj.feature.ftid;
            var end = FTVUtils.getEnd(obj.feature);
            var start = FTVUtils.getStart(obj.feature);
            if (obj.feature.selected !== true) {
                if ((start === 1) && (end === self.opt.featuresModel.sequence.length)) {
                    d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid").style("stroke", "none");//deselect all
                    if (current != undefined) {//but select again aa for selected/clicked/on feature
                        end = FTVUtils.getEnd(current);
                        start = FTVUtils.getStart(current);
                        _.each(_.range(start, end+1), function(i) {
                            d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid[tooltip='" + (i) + "']").style("stroke", "black");
                        });
                    }
                } else {
                    if (current != undefined) {
                        var selEnd = FTVUtils.getEnd(current);
                        var selStart = FTVUtils.getStart(current);
                        _.each(_.range(start, end+1), function(i) {
                            if ( !((selStart <= i) && (i <= selEnd)) ) {
                                d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid[tooltip='" + (i) + "']").style("stroke", "none");
                            }
                        });
                    } else {
                        _.each(_.range(start, end+1), function(i) {
                            d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid[tooltip='" + (i) + "']").style("stroke", "none");
                        });
                    }
                }
            }
        }
    },
    /**
     * Calculates the number of amino acids to move to left or right.
     * @param left True if the movement will go to the left, false otherwise.
     * @private
     */
    _slide = function(self, left) {
        var currentX = parseFloat( self._dragger.attr("x"));
        var currentAA = currentX /  self._pixelPerAA;
        if ( self._numVisibleAA === undefined) {
            self._numVisibleAA = Math.floor(self._rulerWidth / FTVUtils.getMaxPixelAA());
        }
        self._firstVisibleAA = left === true ? currentAA - self._numVisibleAA/2 : currentAA +  self._numVisibleAA/2;
        return self._firstVisibleAA;
    }
;
/*
 * Public zone
 */
//Construct option
ProteinFeaturesViewer.prototype.opt = undefined;
//Debug
ProteinFeaturesViewer.prototype._debug = false;
ProteinFeaturesViewer.prototype._debugTrace = "START";
//zoom
ProteinFeaturesViewer.prototype._zoomed = false; //has been zoom applied?
//instances
ProteinFeaturesViewer.prototype._instances = []; //centered instances
//Initialization
ProteinFeaturesViewer.prototype._initMouseX = undefined;
ProteinFeaturesViewer.prototype._initZoomSelectorX = undefined;
ProteinFeaturesViewer.prototype._rulerWidth = undefined; //width to be used for the ruler
ProteinFeaturesViewer.prototype._rulerMargin = undefined; //margins around the ruler
ProteinFeaturesViewer.prototype._leftMarginAASeq = undefined; //left margin on the left of the aa sequence
ProteinFeaturesViewer.prototype._draggerGap = 4; //the dragger will be a bit above the ruler and will have a handler
ProteinFeaturesViewer.prototype._pixelPerAA = undefined; //number of pixels per amino acid
ProteinFeaturesViewer.prototype._rulerSVG = undefined; //SVG with the ruler group
ProteinFeaturesViewer.prototype._ruler = undefined; //group inside self._rulerSVG, actual ruler containing the separations and the dragger
ProteinFeaturesViewer.prototype._dragger = undefined; //group inside the self._ruler, draggable bar that will move left or right the categories and sequence
ProteinFeaturesViewer.prototype._controlAASeqDivDisplay = undefined; //original display/visibility for the amino acid sequence container, can be "display" or "none"
ProteinFeaturesViewer.prototype._categoryDivDisplay = undefined; //original display/visibility for the categories and types
ProteinFeaturesViewer.prototype._seqAASVG = undefined; //SVG with a group to display the amino acids
ProteinFeaturesViewer.prototype._seqAASVGGroup = undefined; //group inside self._seqAASVG that displays the amino acids
ProteinFeaturesViewer.prototype._numVisibleAA = undefined;
//Control buttons, divs, options
ProteinFeaturesViewer.prototype._howManyOpen = 0;
ProteinFeaturesViewer.prototype._openAllButton = undefined;
ProteinFeaturesViewer.prototype._closeAllButton = undefined;
ProteinFeaturesViewer.prototype._filterButton = undefined;
ProteinFeaturesViewer.prototype._settingsButton = undefined;
ProteinFeaturesViewer.prototype._helpButton = undefined;
ProteinFeaturesViewer.prototype._zoomInButton = undefined;
ProteinFeaturesViewer.prototype._zoomOutButton = undefined;
ProteinFeaturesViewer.prototype._moveLeftButton = undefined;
ProteinFeaturesViewer.prototype._moveRightButton = undefined;
ProteinFeaturesViewer.prototype._filterDiv = undefined; //div containing the filter options menu
ProteinFeaturesViewer.prototype._settingsDiv = undefined; //div containing the setting options menu
ProteinFeaturesViewer.prototype._helpDiv = undefined; //div containing the help legend
ProteinFeaturesViewer.prototype._tooltipdiv = undefined; //tooltip div
ProteinFeaturesViewer.prototype._filterOptions = undefined;
//Selection
//ProteinFeaturesViewer.prototype._currentSelectedSVG = undefined;
ProteinFeaturesViewer.prototype._currentSelectedFeature = undefined;
 
/**
* Zooms in or out the features displayed.
* @param moveToAA Zoom and then move to the given amino acid, locating in it in the middle of the display.
*/
ProteinFeaturesViewer.prototype.zoomInOut = function zoomInOut(moveToAA) {
    //var startTime = new Date().getTime();
    var self = this;

    var visibleAA = self._rulerWidth / FTVUtils.getMaxPixelAA();
    if (moveToAA != undefined) {
        moveToAA = moveToAA - Math.ceil(visibleAA/2);
    }

    if (self._zoomed === false) { //It is zoomed out, then zoom in, i.e., go to detailed view
        //if (self._debug === true)  self._debugTrace += ", zoom-in";
        _.each(self._instances, function(instance) {
            instance.zoomInOut(moveToAA);
        });
        d3.selectAll("div ." + FTVUtils.ID_CLASS_PREFIX + "seqContainer").style("display",  self._controlAASeqDivDisplay);
        self._dragger
            .classed(FTVUtils.ID_CLASS_PREFIX + "zoomable", false)
            .classed(FTVUtils.ID_CLASS_PREFIX + "draggable", true)
            .attr("width", visibleAA * self._pixelPerAA)
            .attr("x", 0)
            .attr("d", _draggerPath(
                {x: 0, y: parseFloat(self._dragger.attr("y"))}
                , visibleAA * self._pixelPerAA, parseFloat(self._dragger.attr("height"))))
            .attr("transform", "translate(0,0)");
         self._zoomOutButton.style("display", _BUTTON_DISPLAY);
         self._moveLeftButton.style("display", _BUTTON_DISPLAY);
         self._moveRightButton.style("display", _BUTTON_DISPLAY);
         self._zoomInButton.style("display", "none");
         self._zoomed = true;
        this.trigger('zoomIn', {model: this.opt.featuresModel});
        if (self._currentSelectedFeature != undefined) {
             _onInstanceFeatureOn(self, {feature: self._currentSelectedFeature});
        }
        if (moveToAA !== undefined) {
            self.translate(moveToAA);
        }
    } else {  //It is zoomed in, then zoom out, i.e., go to overview
        //if (self._debug === true)  self._debugTrace += ", zoom-out";
        _.each(self._instances, function(instance) {
            instance.zoomInOut();
        });
        d3.selectAll("div ." + FTVUtils.ID_CLASS_PREFIX + "seqContainer").style("display", "none");
        d3.selectAll("g." + FTVUtils.ID_CLASS_PREFIX + "seqSVGGroup")
            .attr("transform", "translate" +
                "(" + self._leftMarginAASeq +
                "," +  self._rulerMargin.top + ")");
         self._zoomOutButton.style("display", "none");
         self._moveLeftButton.style("display", "none");
         self._moveRightButton.style("display", "none");
         self._zoomInButton.style("display", _BUTTON_DISPLAY);
         self._dragger
            .classed(FTVUtils.ID_CLASS_PREFIX + "zoomable", true)
            .classed(FTVUtils.ID_CLASS_PREFIX + "draggable", false)
            .attr("width", self._rulerWidth)
            .attr("x", 0)
            .attr("d", _draggerPath(
                {x: 0, y: parseFloat(self._dragger.attr("y"))}
                , self._rulerWidth, parseFloat(self._dragger.attr("height"))))
            .attr("transform", "translate(0,0)");
         self._zoomed = false;
        this.trigger('zoomOut', {model: this.opt.featuresModel});
        d3.selectAll("." + FTVUtils.ID_CLASS_PREFIX + "aminoAcid").style("stroke", "none");
    }
    //always update selection of features across all svg
    if (self._currentSelectedFeature != undefined) {
        //if ( self._debug === true)  self._debugTrace += ", zoom-selectedFT-updated";
        d3.selectAll("path[id^='" + FTVUtils.ID_CLASS_PREFIX + self._currentSelectedFeature.ftid + "_index_']").style("fill-opacity", 1);
    }
    //var endTime = new Date().getTime();
    //console.log("ZOOM ALL: " + (endTime-startTime) + "ms");
};
 
/**
* Translates a category to a given amino acid, which will be located in the center whenever possible.
* @param xMove Starting coordinate for translation, meaning the first amino acid to be displayed.
*/
ProteinFeaturesViewer.prototype.translate = function translate(moveToAA) {
    var self = this;
    if (self._zoomed === true) {
        var previousX = parseFloat(self._dragger.attr("x"));
        var currentX = moveToAA * self._pixelPerAA;
        var firstMaxVisibleAA = self._rulerWidth - self._dragger.attr("width");// + self._pixelPerAA;
        if (currentX < 0) {
            currentX = 0;
        } else if (currentX > firstMaxVisibleAA) {
            currentX = firstMaxVisibleAA;
        }
        if (currentX != previousX) {
             self._dragger.attr("x", currentX);
             self._dragger.attr("transform", "translate(" + currentX + ", " + 0 + ")");
            d3.selectAll("g." + FTVUtils.ID_CLASS_PREFIX + "seqSVGGroup")
                .attr("transform", "translate(" +
                    (self._leftMarginAASeq - (currentX/self._pixelPerAA)*FTVUtils.getMaxPixelAA() ) + "," +
                    self._rulerMargin.top + ")"
            );
            if (currentX != previousX) {
                _.each(self._instances, function(instance) {
                    instance.translate(moveToAA+1, false);
                });
            }
        }
    }
};

/**
 * Opens all categories so types will be displayed in different tracks.
 */
ProteinFeaturesViewer.prototype.openAllTracks = function openAllTracks() {
    _.each(this._instances, function(instance) {
        instance.open();
    });
    this._openAllButton.style("display", "none");
    this._closeAllButton.style("display", _BUTTON_DISPLAY);
    this.trigger('openAllTracks', {model: this.opt.featuresModel});
};

/**
 * Closes all categories so types will not be displayed one by one but all together in the category track.
 */
ProteinFeaturesViewer.prototype.closeAllTracks = function closeAllTracks() {
    _.each(this._instances, function(instance) {
        instance.close();
    });
    this._openAllButton.style("display", _BUTTON_DISPLAY);
    this._closeAllButton.style("display", "none");
    this.trigger('closeAllTracks', {model: this.opt.featuresModel});
};

/**
 * Applies filters.
 * @param filters Filters that should be applied. So far the only filter supported is "evidence".
 * For instance: {
 *     evidence: {manual: true/false, automatic: true/false, unknown: true/false},
 *     another_filter_not_yet_supported: {xxx: true/false, yyy: true/false}
 * }
 */
ProteinFeaturesViewer.prototype.filter = function filter(filters) {
    _.each(this._instances, function(instance) {
        instance.filter(filters);
    });
    this.trigger('filter', {model: this.opt.featuresModel, filters: filters});
};
  
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