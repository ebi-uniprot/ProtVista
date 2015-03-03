var _ = require("underscore");
var d3 = require("d3");

var FTVUtils = (function(){
    /*
     1. Position
     2. ProbablePosition
     3. Bridge
     4. RangePosition
     5. Continuous
     6. ContinuousWithUncertainty: Continuous + {~, <, >}
     7. ContinuousWithRange:
     8. ContinuousWithEnvelope
     9. Discontinuous
     *****
     1. FT   INIT_MET     1   1      Removed [Comment.]
     5. FT   SIGNAL       1   m      [Comment.]
     5. FT   PROPEP       n   m      [Comment.]
     5. FT   TRANSIT      1   m      Organelle [Comment].
     5. FT   CHAIN        n   m      Name of mature protein [Comment].
     5. FT   PEPTIDE      n   m      Name of active peptide [Comment].
     5. FT   TOPO_DOM     n   m      Location of the topological domain.
     5. FT   TRANSMEM     n   m      [Comment.]
     5. FT   DOMAIN       n   m      Nature of the domain [Comment].
     5. FT   REPEAT       n   m      Repeat name and/or repeat number [Comment].
     5. FT   CA_BIND      n   m      [Comment.]
     5. FT   ZN_FING      n   m      Nature of the zinc finger.
     5. FT   DNA_BIND     n   m      Nature of the DNA-binding region [Comment].
     5. FT   NP_BIND      n   m      Nature of the nucleotide phosphate [Comment].
     5. FT   REGION       n   m      Nature of the region.
     5. FT   COILED       n   m      [Comment].
     5. FT   MOTIF        n   m      Nature of the motif.
     5. FT   COMPBIAS     n   m      Nature of the compositionally biased region.
     1. FT   ACT_SITE     n   n(m)   Nature of active site [Comment].
     1. FT   METAL        n   n      Nature of the binding metal [Comment].
     1. FT   BINDING      n   n(m)   Name of the binding chemical group [Comment].
     1. FT   SITE         n   n/m    Nature of the site.
     1. FT   NON_STD      n   n      [Comment.]
     1. FT   MOD_RES      n   n      Modification [Comment].
     1. FT   LIPID        n   n      Name of the attached group [Comment].
     1. FT   CARBOHYD     n   n      Nature of the carbohydrate [Comment].
     3. FT   DISULFID     n   n(m)   [Interchain] [Comment].
     3. FT   CROSSLNK     n   m      Nature of crosslink.
     5. FT   VAR_SEQ      n   n(m)   Sequence variation (Comment).
     5. FT   VARIANT      n   n/m    Sequence variation [Comment].
     5. FT   MUTAGEN      n   n(m)   Modification: Comment.
     5. FT   UNSURE       n   n/m    [Comment.]
     5. FT   CONFLICT     n   n/m    Difference (Origin).
     1. FT   NON_CONS     n   n+1    [Comment.]
     1. FT   NON_TER      n   n
     5. FT   HELIX        n   m
     5. FT   TURN         n   m
     5. FT   STRAND       n   m
     * */
    var self = {
        /**
         * Possible locations for features; these will be use in the JSON and the code.
         */
        ftLocation: {
            position: "POSITION",
            bridge: "BRIDGE",
            continuous: "CONTINUOUS",
            variation: "VARIATION"
        },
        /**
         * Different shapes for POSITION features, values must correspond to functions.
         */
        ftTypeShapeFunction: {
            up_pftv_metal: "createDiamond",
            up_pftv_site: "createChevron",
            up_pftv_binding: "createCatFace",
            up_pftv_act_site: "createCircle",
            up_pftv_mod_res: "createTriangle",
            up_pftv_lipid: "createWave",
            up_pftv_carbohyd: "createHexagon",
            up_pftv_non_std: "createPentagon",
            up_pftv_init_met: "createArrow",
            up_pftv_non_ter: "createDoubleBar",
            up_pftv_non_cons: "createDoubleBar"
        },
        /**
         * Evidence types for manual and automatic annotations, will be used for filtering.
         */
        evidenceTypes: {
            manual: ["ECO:0000218"],
            automatic: ["ECO:0000203"]
        },
        /**
         * Possible values for evidence based filter.
         */
        evidenceGroups: {
            manual: {name: "manual", text: "Manually curated"},
            automatic: {name: "automatic", text: "Automatically predicted"},
            unknown: {name: "unknown", text: "Unknown"}
        },
        /**
         * Style views for categories and types, must be all in low case!
         */
        styleViews: {
            centered : "centered",
            nonOverlapping: "nonoverlapping",
            variants: "variants"
        },
        /**
         * Possible values for features track, they are either categories or types
         * (variant is a special case that can be either a category or a type).
         */
        trackModes: {
            category: "category",
            type: "type"
        },
        aaResidueMap: {"A":"Ala","R":"Arg","N":"Asn","D":"Asp","C":"Cys","E":"Glu","Q":"Gln","G":"Gly","H":"His","I":"Ile","L":"Leu","K":"Lys","M":"Met","F":"Phe","P":"Pro","S":"Ser","T":"Thr","W":"Trp","Y":"Tyr","V":"Val"},
        maxShapeSize: 13, //Maximum number of pixels per shape, it should be the same as maxPixelAA
        maxPixelAA: 13, //Maximum number of pixels per aa
        scaleFactor:50/100, //percentage to calculate minShapeSize, it will affect shapes calculation as well
        minShapeSize: 13 * 50/100, //a percentage of maxShapeSize, the rate is given by scaleFactor
        maxZoom: 2, //we only have two states, either initial or zoomed so only two zoom levels
        titlesWidth: 150, //width taken by titles
        nonCollapsibleTitlesWidth: 140, //titlesWidth - 10 for margin in CSS
        titlesPadding: 5, //padding for titles in CSS
        minimumTitlesHeight: 21,
        maxSeqLengthDisplay: undefined, //maximum pixels used to display a sequence length on the ruler axis, depending on the font specified by css   .axis text
        maxAAFontDisplay: undefined, //maximum pixels used to display one AA symbol, depending on the font specified by the .aminoAcid css class
        marginLeft: 7, //margin on the left
        marginRight: undefined, //margin on the right
        ID_CLASS_PREFIX: "up_pftv_",
        /**
         * Returns a track tile depending on whether it is a category track (title comes in the category element),
         * or a type track (title comes in the label element).
         * @param track
         * @returns {string}
         */
        getTrackTitle: function(track) {
            if (track.category === undefined) {//it is a type
                return track.label.toUpperCase();
            } else {
                return track.category.toUpperCase();
            }
        },
        /**
         * Returns a trackMode, "category" if the track has an element category and the typeIndex is not undefined,
         * otherwise "type"
         * @param track
         * @param typeIndex
         * @returns {string}
         */
        getTrackMode: function(track, typeIndex) {
            if (track.category === undefined) {
                return this.trackModes.type;
            } else {
                if (typeIndex != undefined) {
                    return this.trackModes.type;
                }
                return this.trackModes.category;
            }
        },
        /**
         * Returns the types for a features track; if it is a category track types come in the types element,
         * otherwise it is a type and the type itself come in the category element.
         * @param track
         * @returns {*}
         */
        getTrackTypes: function(track) {
            if (track.category === undefined) {
                return [track];
            } else {
                return track.types;
            }
        },
        /**
         * Returns whether the features track is a variant track.
         * @param track
         * @returns {boolean}
         */
        isVariantsTrack: function(track) {
            if (track.variants === undefined) {//it is a category/type with variants
                return false;
            } else {
                return true;
            }
        },
        /**
         * Returns the tooltip text.
         * @param type
         * @param location
         * @param feature
         * @param self
         * @returns {string}
         */
        getFeatureTooltipText: function(type, location, feature, self) {
            var text = "";
            //type
            text =
                type.label == undefined ?
                    type.cvid == undefined ?
                        ""
                    : text + "Type: " + type.cvid + "<br/>"
                : type.cvid == undefined ?
                        text + "Type: " + type.label + "<br/>"
                    : text + "Type: " + type.label + " - " + type.cvid + "<br/>";
            // location
            if (this.equalsNoCase(location, this.ftLocation.position)) {
                var residues = FTVUtils.getResidue(self.opt.sequence[FTVUtils.getStart(feature)-1]);//aa position starts in 1, sequence string starts in 0
                if (FTVUtils.getStart(feature) != FTVUtils.getEnd(feature)) {
                    residues = residues + FTVUtils.getResidue(self.opt.sequence[FTVUtils.getEnd(feature)-1]);
                }
                text = text + "Residues: " + residues + " [" + FTVUtils.getStart(feature) + "," + FTVUtils.getEnd(feature) + "]" + "<br/>";
            } else {
                text = text + "Residues: [" + FTVUtils.getStart(feature) + "," + FTVUtils.getEnd(feature) + "]" + "<br/>";
            }
            //description
            text =
                feature.description == undefined ?
                    feature.comments == undefined ?
                        text + ""
                    : text + "Description: (" + feature.comments[0] + ")<br/>"
                : feature.comments == undefined ?
                        text + "Description: " + feature.description + "<br/>"
                    : text + "Description: " + feature.description + " (" + feature.comments[0] + ")<br/>";
            // id
            text = feature.id == undefined ? text : text + "Feature ID: " + feature.id + "<br/>";
            return text;
        },
        /**
         * Returns an enum with possible feature locations.
         * @returns {*}
         */
        getFTLocation: function() {
            return this.ftLocation;
        },
        /**
         * Returns the residue name corresponding to an amino acid letter.
         * @param aa
         * @returns {*}
         */
        getResidue: function(aa) {
            if (this.aaResidueMap[aa] === undefined) {
                return "";
            } else {
                return this.aaResidueMap[aa];
            }
        },
        /**
         * Returns the maximum shape size.
         * @returns {number}
         */
        getMaxShapeSize: function() {
            return this.maxShapeSize;
        },
        /**
         * Returns the maximum allowed number of pixels per amino acid.
         * @returns {number}
         */
        getMaxPixelAA: function() {
            return this.maxPixelAA;
        },
        /**
         * Returns the maximum zoom level.
         * @returns {number}
         */
        getMaxZoom: function() {
            return this.maxZoom;
        },
        /**
         * Returns the title container widht.
         * @param collapsible
         * @returns {number}
         */
        getTitlesWidth: function(collapsible) {
            if (collapsible == undefined) {
                return this.titlesWidth;
            } else if (collapsible === true) {
                return this.titlesWidth;
            } else {
                return this.nonCollapsibleTitlesWidth;
            }
        },
        /**
         * Returns the padding required by track titles.
         * @returns {number}
         */
        getTitlesPadding: function() {
            return this.titlesPadding;
        },
        /**
         * Returns the minimum height required by track titles.
         * @returns {number}
         */
        getMinimumTitlesHeight: function() {
            return this.minimumTitlesHeight;
        },
        /**
         * Compares two string regardless the case.
         * @param str1
         * @param str2
         * @returns {boolean}
         */
        equalsNoCase: function(str1, str2) {
            return (str1.toUpperCase() === str2.toUpperCase());
        },
        /*
         * Returns the height and width for a classed text in SVG.
         * It will likely trigger an style recalculation so do not over use it!
         * By http://stackoverflow.com/users/1029936/bill
         * From http://stackoverflow.com/questions/14605348/title-and-axis-labels
         */
        calculateTextSizeSVG: function (text, classname) {
            if(!text || (text.length === 0))
                return {height: 0, width: 0};

            var container = d3.select("body").append("svg").attr("class", classname);
            container.append("text").attr({x: -1000, y: -1000}).text(text);

            var bbox = container.node().getBBox();
            container.remove();

            return {height: bbox.height, width: bbox.width};
        },
        /*
         * Returns the height and width for a classed text inside a DIV.
         */
        calculateTextHeightDIV: function (text, classname, width) {
            if(!text || (text.length === 0))
                return {height: 0, width: 0};

            var container = d3.select("body").append("div")
                .classed(classname, true)
                .style("height", "auto")
                .style("width", width + "px");
            //.style("overflow", "hidden");
            container.attr({x: -1000, y: -1000}).text(text);

            var height = container.style("height");
            container.remove();
            if (height.indexOf("px", height.length-2) !== -1) {
                height = height.substring(0, height.length-2);
            }

            return parseInt(height);
        },
        /*
         * Returns the maximum size required for a sequence length to be displayed,
         * considering a max length of 99999 aa that will be displayed
         * on a horizontal D3 axis
         * */
        getMaxSeqLengthDisplay: function() {
            if (this.maxSeqLengthDisplay == undefined) {
                this.maxSeqLengthDisplay = this.calculateTextSizeSVG("99999", ".axis text");
            }
            this.maxSeqLengthDisplay.width = this.maxSeqLengthDisplay.width/2;
            this.maxSeqLengthDisplay.height = this.maxSeqLengthDisplay.height/2;
            return this.maxSeqLengthDisplay;
        },
        /*
         * Returns the maximum size required for an AA symbol to be displayed considering M as the the widest AA.
         * */
        getMaxAAFontDisplay: function() {
            if (this.maxAAFontDisplay == undefined) {
                this.maxAAFontDisplay = this.calculateTextSizeSVG("M", ".aminoAcid");
            }
            return this.maxAAFontDisplay;
        },
        /**
         * Returns the gap on the right so the sequence length can be displayed.
         * @returns {number}
         */
        getZoomTextGap: function() {
            if (this.maxSeqLengthDisplay == undefined) {
                this.getMaxSeqLengthDisplay();
            }
            return Math.max(this.maxSeqLengthDisplay.width, this.getMaxPixelAA());
        },
        /**
         * Gets the left and right margins.
         * Left margin is always 7, right margin depends on the maximum number of pixels per amino acid and the pixels
         * used to display the sequence legth.
         * @returns {{right: *, left: number}}
         */
        getMarginLeftRight: function() {
            if (this.marginRight == undefined) {
                var gap = 0;
                if (this.getMaxSeqLengthDisplay().width < this.getMaxPixelAA()) {
                    this.marginRight = this.getMaxPixelAA() + gap;
                } else {
                    this.marginRight = this.getMaxSeqLengthDisplay().width + gap;
                }
            }
            this.marginLeft = 7;
            return {right: this.marginRight, left: this.marginLeft};
        },
        /**
         * Converts a feature type into a valid CSS class name.
         * @param type
         * @returns {string}
         */
        stringToClass: function(type) {
            return this.ID_CLASS_PREFIX + type.toLowerCase().replace(/ /g,'_');
        },
        /**
         * Shows tooltip on mouse-over, displayed text corresponds to the label argument.
         * @param tooltipdiv
         * @param label
         */
        mouseover: function (tooltipdiv, label) {
            tooltipdiv.transition()
                .duration(300)
                .style("opacity", 1);
            tooltipdiv.html(label);
        },
        /**
         * Keeps showing tooltip on mouse-move.
         * @param tooltipdiv
         */
        mousemove: function (tooltipdiv) {
            tooltipdiv
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY + 5) + "px");
        },
        /**
         * Hides tooptip on mouse-out.
         * @param tooltipdiv
         */
        mouseout: function (tooltipdiv) {
            tooltipdiv.transition()
                .duration(300)
                .style("opacity", 1e-6);
        },
        /**
         * Gets the start position for a feature depending on its type.
         * Note: It works fine with the currently supported location types, i.e., CONTINUOUS, POSITION, and BRIDGE.
         * It would also work with RANGE_POSITION, CONTINUOUS_WITH_UNCERTAINTY, and CONTINUOUS_WITH_ENVELOPE (maybe) but not for PROBABLE_POSITION, CONTINUOUS_WITH_RANGE, and DISCONTINUOUS.
         * @param feature
         * @return Number
         */
        getStart: function (feature) {
            return parseInt(feature.begin);
        },
        /**
         * Gets the end position for a feature depending on its type.
         * * Note: It works fine with the currently supported location types, i.e., CONTINUOUS, POSITION, and BRIDGE.
         * It would also work with RANGE_POSITION, CONTINUOUS_WITH_UNCERTAINTY, and CONTINUOUS_WITH_ENVELOPE (maybe) but not for PROBABLE_POSITION, CONTINUOUS_WITH_RANGE, and DISCONTINUOUS.
         * @param feature
         * @return {*}
         */
        getEnd: function (feature) {
            return parseInt(feature.end);
        },
        /**
         * Returns the length of a feature.
         * @param feature
         * @returns {number}
         */
        getLength: function(feature) {
            return this.getEnd(feature)-this.getStart(feature) + 1;
        },
        /**
         * Returns the shape corresponding to a feature, shapes change depending on the feature type.
         * @param locationType
         * @param feature
         * @param pixelPerAA
         * @param useShapes
         * @param classType
         * @returns {*}
         */
        getShape: function(locationType, feature, pixelPerAA, useShapes, classType) {
            /*var locationType = this.ftLocation.continuous;
             if (classType.indexOf(" " + this.ftLocation.bridge) != 0) {
             locationType = this.ftLocation.bridge;
             } else if (classType.indexOf(" " + this.ftLocation.position) != 0) {
             locationType = this.ftLocation.position;
             } */
            if (FTVUtils.equalsNoCase(locationType, this.getFTLocation().continuous)) {
                return this.createRectangle(feature);
            } else if (FTVUtils.equalsNoCase(locationType, this.getFTLocation().position)) {
                if (useShapes) {
                    var fnName = this.ftTypeShapeFunction[classType];
                    //Some one-single-amino-acid features actually have more than one
                    var thick = this.getLength(feature)/2 * pixelPerAA;
                    thick = 0; //we do not want thick bars linking the shape and the sequence line
                    var doubleLink = !(this.getLength(feature) === 1);
                    var path;
                    if (FTVUtils[fnName] instanceof Function) {
                        path = FTVUtils[fnName](feature, pixelPerAA, thick, doubleLink);
                    } else {
                        path = this.createLink(feature, pixelPerAA, thick);
                    }
                    return path;
                } else {
                    return this.createRectangle(feature);
                }
            } else if (FTVUtils.equalsNoCase(locationType, this.getFTLocation().bridge)) {
                return this.createBridge(feature, pixelPerAA);
            } else if (FTVUtils.equalsNoCase(locationType, this.getFTLocation().variation)) {
                return this.createRectangle(feature);
            }
            return "";
        },
        /**
         * Helper function to create shapes; if the pixels per amino acid are lower than the minimum,
         * it adjusts it.
         * @param value
         * @param pixelPerAA
         * @returns {*}
         */
        pixelScale: function(value, pixelPerAA) {
            if (pixelPerAA > this.minShapeSize) {
                return ((value * pixelPerAA) / (this.minShapeSize - 1));
            }
            return value;
        },
        /**
         * Creates a rectangle shape.
         * @param feature
         * @returns {string|*}
         */
        createRectangle: function(feature) {
            var x = feature.x;
            var y = feature.y;
            var width = feature.width;
            var height = feature.height;
            feature.shape = "M" + x + "," + y +
                "L" + x + "," + (y-height) +
                "L" + (x+width) + "," + (y-height) +
                "L" + (x+width) + "," + y + "Z";
            return feature.shape;
        },
        /**
         * Creates a bridge shape.
         * @param feature
         * @param pixelPerAA
         * @returns {string|*}
         */
        createBridge: function(feature, pixelPerAA) {
            var x = feature.x;
            var y = feature.y;
            var width = feature.width;
            var height = feature.height;
            if (this.getLength(feature) == 1) {
                feature.shape = "M" + x + " " + y
                    + " L " + x + " " + (y-height)
                    + " L " + (x+width/2) + " " + (y-height)
                    + " L " + (x+width/2) + " " + (y-height-5) //antenna
                    + " L " + (x+width/2) + " " + (y-height)
                    + " L " + (x+width) + " " + (y-height)
                    + " L " + (x+width) + " " + y
                    + " Z"
                ;
            } else {
                feature.shape = "M" + x + " " + y
                    + " L " + x + " " + (y-height)
                    + " L " + (x+width) + " " + (y-height)
                    + " L " + (x+width) + " " + y
                    + " L " + (x+width-pixelPerAA) + " " + y
                    + " L " + (x+width-pixelPerAA) + " " + (y-height+1)
                    + " L " + (x+pixelPerAA) + " " + (y-height+1)
                    + " L " + (x+pixelPerAA) + " " + (y)
                    //+ "L" + x + "," + (y-height)
                    + " Z"
                ;
            }
            return feature.shape;
        },
        /**
         * Creates a link shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @returns {string|*}
         */
        createLink: function(feature, pixelPerAA, thick) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var gap = 6*this.scaleFactor;
            if (pixelPerAA > this.minShapeSize) {
                gap = this.pixelScale(gap, pixelPerAA);
            }
            feature.shape = " M " + xLine + " " + yLine //line
                + " L " + (xLine-thick) + " " + yLine //line
                + " L " + (xLine-thick) + " " + y //line
                + " L " + x + " " + y //line
                //+ "L" + (x) + "," + (y-gap*2) //shape
                //+ "L" + x + "," + y //shape
                + " L " + (xLine+thick) + " " + y //line
                + " L " + (xLine+thick) + " " + yLine //line
                + " Z";
            return feature.shape;
        },
        /**
         * Initializes a shape other than rectangle, link, or bridge.
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @param xLine
         * @param yLine
         * @param x
         * @param y
         * @returns {*}
         * @private
         */
        _initShape: function(pixelPerAA, thick, doubleLink, xLine, yLine, x, y) {
            var initShape;
            if (doubleLink === true) { //no thick will be taken into account here
                initShape = "M " + (xLine-pixelPerAA/2) + " " + yLine //left line
                    + " L " + xLine + " " + y //middle line point
                    + " L " + x + " " + y ; //line & shape
            } else {
                initShape = " M " + xLine + " " + yLine //line
                    + " L " + (xLine-thick) + " " + yLine //line
                    + " L " + (xLine-thick) + " " + y //line
                    + " L " + x + " " + y; //line & shape
            }
            return initShape;
        },
        /**
         * Finishes a shape other than rectangle, bridge, or link.
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @param xLine
         * @param yLine
         * @param x
         * @param y
         * @returns {*}
         * @private
         */
        _endShape: function(pixelPerAA, thick, doubleLink, xLine, yLine, x, y) {
            var endShape;
            if (doubleLink === true) { //no thick will be taken into account here
                endShape = " L " + x + " " + y //shape
                    + " L " + xLine + " " + y //middle line point
                    + " L " + (xLine+pixelPerAA/2) + " " + yLine //right line
                    + " L " + xLine + " " + y //middle line point
                    + " L " + (xLine-pixelPerAA/2) + " " + yLine //left line
                    + " Z";
            } else {
                endShape = " L " + x + " " + y //line & shape
                    + " L " + (xLine+thick) + " " + y //line
                    + " L " + (xLine+thick) + " " + yLine //line
                    + " Z";
            }
            return endShape;
        },
        /**
         * Creates a diamond shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createDiamond: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var gap = 6*this.scaleFactor;
            if (pixelPerAA > this.minShapeSize) {
                gap = this.pixelScale(gap, pixelPerAA);
            }
            var shape = " L " + (x-gap) + " " + (y-gap) //diamond
                + " L " + x + " " + (y-(gap*2)) //diamond
                + " L " + (x+gap) + " " + (y-gap); //diamond
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            } else {
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            }
            return feature.shape;
        },
        /**
         * Creates a chevron shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createChevron: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var gap = 6*this.scaleFactor;
            if (pixelPerAA > this.minShapeSize) {
                gap = this.pixelScale(gap, pixelPerAA);
            }
            var shape = " L " + (x-gap) + " " + (y-gap) //shape
                + " L " + (x-gap) + " " + (y-(gap*2)) //shape
                + " L " + x + " " + (y-gap) //shape
                + " L " + (x+gap) + " " + (y-(gap*2)) //shape
                + " L " + (x+gap) + " " + (y-gap); //shape
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            } else {
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            }
            return feature.shape;
        },
        /**
         * Creates a cat-face shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createCatFace: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var chin = this.pixelScale(3*this.scaleFactor, pixelPerAA);
            var side = this.pixelScale(6*this.scaleFactor, pixelPerAA);
            var upperSide = this.pixelScale(12*this.scaleFactor, pixelPerAA);
            var chick = this.pixelScale(2*this.scaleFactor, pixelPerAA);
            var upperChick = this.pixelScale(4*this.scaleFactor, pixelPerAA);
            var shape = " L " + (x-chin) + " " + y //shape
                + " L " + (x-side) + " " + (y-upperChick) //shape
                + " L " + (x-side) + " " + (y-upperSide) //shape
                + " L " + (x-chick) + " " + (y-side) //shape
                + " L " + (x+chick) + " " + (y-side) //shape
                + " L " + (x+side) + " " + (y-upperSide) //shape
                + " L " + (x+side) + " " + (y-upperChick) //shape
                + " L " + (x+chin) + " " + (y); //shape
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            } else {
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            }
            return feature.shape;
        },
        /**
         * Creates a standing on the side rathe than the edge triangle shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createTriangle: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var gap = this.pixelScale(6*this.scaleFactor, pixelPerAA);
            var shape = " L " + (x-gap) + " " + y //shape
                + " L " + x + " " + (y-(gap*2)) //shape
                + " L " + (x+gap) + " " + y ; //shape
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            } else {
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            }
            return feature.shape;
        },
        /**
         * Creates a like-w wave shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createWave: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var hillX = this.pixelScale(3*this.scaleFactor, pixelPerAA);//1
            var lowerHillY = this.pixelScale(4*this.scaleFactor, pixelPerAA);//1
            var sideX = this.pixelScale(6*this.scaleFactor, pixelPerAA);//3
            var sideY = this.pixelScale(6*this.scaleFactor, pixelPerAA);//4
            var upperHillY = this.pixelScale(12*this.scaleFactor, pixelPerAA);//6
            var shape = " L " + (x-hillX) + " " + (y-lowerHillY) //shape
                + " L " + (x-sideX) + " " + y //shape
                + " L " + (x-sideX) + " " + (y-sideY) //shape
                + " L " + (x-hillX) + " " + (y-upperHillY) //shape
                + " L " + (x) + " " + (y-lowerHillY) //shape
                + " L " + (x+hillX) + " " + (y-upperHillY) //shape
                + " L " + (x+sideX) + " " + (y-sideY) //shape
                + " L " + (x+sideX) + " " + (y) //shape
                + " L " + (x+hillX) + " " + (y-lowerHillY) ; //shape
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            } else {
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            }
            return feature.shape;
        },
        /**
         * Creates a hexagon shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createHexagon: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var topBottomX = this.pixelScale(2*this.scaleFactor, pixelPerAA);
            var middleX = this.pixelScale(6*this.scaleFactor, pixelPerAA);
            var middleY = this.pixelScale(3*this.scaleFactor, pixelPerAA);
            var topY = this.pixelScale(6*this.scaleFactor, pixelPerAA);
            var shape = " L " + (x-topBottomX) + " " + y //shape
                + " L " + (x-middleX) + " " + (y-middleY) //shape
                + " L " + (x-topBottomX) + " " + (y-topY) //shape
                + " L " + (x+topBottomX) + " " + (y-topY) //shape
                + " L " + (x+middleX) + " " + (y-middleY) //shape
                + " L " + (x+topBottomX) + " " + (y) ; //shape
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            } else {
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            }
            return feature.shape;
        },
        /**
         * Creates a pentagon shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createPentagon: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var edge = this.pixelScale(6*this.scaleFactor, pixelPerAA);
            var topX = this.pixelScale(3*this.scaleFactor, pixelPerAA);
            var topY = this.pixelScale(12*this.scaleFactor, pixelPerAA);
            var shape = "L " + (x-edge) + " " + (y-edge) //shape
                + " L " + (x-topX) + " " + (y-topY) //shape
                + " L " + (x+topX) + " " + (y-topY) //shape
                + " L " + (x+edge) + " " + (y-edge) ; //shape
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            } else {
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            }
            return feature.shape;
        },
        /**
         * Creates a circle shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createCircle: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var topY = this.pixelScale(12*this.scaleFactor, pixelPerAA);
            var radius = pixelPerAA/2;
            if (pixelPerAA <= this.minShapeSize) {
                radius = this.minShapeSize/2;
            }
            var shape = "M " + (x) + " " + (y-topY-2) //shape
                + "a " + radius + " " + radius + " 0 1 0 0.02 0" ; //shape
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = shape
                    + " M " + x + " " + y //shape
                    + " L " + (xLine-pixelPerAA/2) + " " + yLine //left line
                    + " L " + x + " " + y //line & shape
                    + " L " + (xLine+pixelPerAA/2) + " " + yLine //right line
                    + " L " + x + " " + y //line & shape
                    + " Z";
            } else {
                feature.shape = shape
                    + " M " + x + " " + y //line
                    + " L " + (x-thick) + " " + y //line
                    + " L " + (xLine-thick) + " " + yLine //line
                    + " L " + (xLine+thick) + " " + yLine //line
                    + " L " + (x+thick) + " " + y //line
                    + " Z";
            }
            return feature.shape;
        },
        /**
         * Creates an arrow pointing down shape.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createArrow: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var middleX = this.pixelScale(6*this.scaleFactor, pixelPerAA);
            var middleY = this.pixelScale(10*this.scaleFactor, pixelPerAA);
            var topY = this.pixelScale(12*this.scaleFactor, pixelPerAA);
            var shape = "L" + (x-middleX) + "," + (y-middleY) //shape
                + "L" + (x) + "," + (y-topY) //shape
                + "L" + (x+middleX) + "," + (y-middleY) ; //shape
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            } else {
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            }
            return feature.shape;
        },
        /**
         * Creates a rectangle shape lying to the right.
         * @param feature
         * @param pixelPerAA
         * @param thick
         * @param doubleLink
         * @returns {string|*}
         */
        createDoubleBar: function(feature, pixelPerAA, thick, doubleLink) {
            var x = feature.x;
            var y = feature.y;
            var xLine = feature.xLine;
            var yLine = feature.yLine;
            var leftRightX = this.pixelScale(6*this.scaleFactor, pixelPerAA);
            var topY = this.pixelScale(12*this.scaleFactor, pixelPerAA);
            var shape = "L" + (x-leftRightX) + "," + (y) //shape
                + "L" + (x) + "," + (y-topY) //shape
                + "L" + (x+leftRightX) + "," + (y-topY) ; //shape
            if (doubleLink === true) { //no thick will be taken into account here
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            } else {
                feature.shape = this._initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
                    + shape
                    + this._endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
            }
            return feature.shape;
        },
        /**
         * Returns the evidence group for the evidence provided.
         * @param evidence
         * @returns {string}
         */
        getEvidenceType: function(evidence) {
            if (((evidence != undefined) && (evidence.type != undefined))) {
                if (_.contains(this.evidenceTypes.manual, evidence.type)) {
                    return this.evidenceGroups.manual.name;
                }
                if (_.contains(this.evidenceTypes.automatic, evidence.type)) {
                    return this.evidenceGroups.automatic.name;
                }
            }
            return this.evidenceGroups.unknown.name;
        },
        /**
         * Returns true if the evidence provided corresponds to the group "manual".
         * @param evidence
         * @returns {boolean}
         */
        isManualEvidence: function(evidence) {
            return (this.getEvidenceType(evidence) === this.evidenceGroups.manual.name);
        },
        /**
         * Returns true if the evidence provided corresponds to the group "automatic".
         * @param evidence
         * @returns {boolean}
         */
        isAutomaticEvidence: function(evidence) {
            return (this.getEvidenceType(evidence) === this.evidenceGroups.automatic.name);
        },
        /**
         * Returns true if the evidence provided corresponds to the group "unknown".
         * @param evidence
         * @returns {boolean}
         */
        isUnknownEvidence: function(evidence) {
            return (this.getEvidenceType(evidence) === this.evidenceGroups.unknown.name);
        },
        greetingsTest: function(name){
            return "pftv-aux-utils greetings to " + name;
        }
    };
    return self;
})(this);

module.exports = FTVUtils;