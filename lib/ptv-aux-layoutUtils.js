var LayoutGlobal = require('./ptv-layout-global');
var ProteinTrackUtils = require('./ptv-aux-utils');
var _ = require("underscore");
var d3 = require("d3");

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

var ProteinTrackLayoutUtils;
module.exports = ProteinTrackLayoutUtils = function(){};

/**
 * Private zone
 */
/*
 * Private variables.
 * */
var
    /**
     * Different shapes for POSITION features, values must correspond to functions.
     */
    _ftTypeShapeFunction = {
        up_pftv_metal: "_createDiamond",
        up_pftv_site: "_createChevron",
        up_pftv_binding: "_createCatFace",
        up_pftv_act_site: "_createCircle",
        up_pftv_mod_res: "_createTriangle",
        up_pftv_lipid: "_createWave",
        up_pftv_carbohyd: "_createHexagon",
        up_pftv_non_std: "_createPentagon",
        up_pftv_init_met: "_createArrow",
        up_pftv_non_ter: "_createDoubleBar",
        up_pftv_non_cons: "_createDoubleBar"
    },

    _maxShapeSize = 13, //Maximum number of pixels per shape, it should be the same as maxPixelAA
    _maxPixelAA = 13, //Maximum number of pixels per aa
    _scaleFactor = 50/100, //percentage to calculate minShapeSize, it will affect shapes calculation as well
    _minShapeSize = 13 * 50/100, //a percentage of maxShapeSize, the rate is given by scaleFactor
    _maxZoom = 2, //we only have two states, either initial or zoomed so only two zoom levels
    _titlesWidth = 150, //width taken by titles
    _nonCollapsibleTitlesWidth = 140, //titlesWidth - 10 for margin in CSS

    _maxSeqLengthDisplay = undefined, //maximum pixels used to display a sequence length on the ruler axis, depending on the font specified by css   .axis text
    _maxAAFontDisplay = undefined //maximum pixels used to display one AA symbol, depending on the font specified by the .aminoAcid css class
;
/**
 * Private methods.
 */
var
    /*
     * Returns the height and width for a classed text in SVG.
     * It will likely trigger an style recalculation so do not over use it!
     * By http://stackoverflow.com/users/1029936/bill
     * From http://stackoverflow.com/questions/14605348/title-and-axis-labels
     */
    _calculateTextSizeSVG = function (text, classname) {
        if(!text || (text.length === 0))
            return {height: 0, width: 0};

        var container = d3.select("body").append("svg").attr("class", classname);
        container.append("text").attr({x: -1000, y: -1000}).text(text);

        var bbox = container.node().getBBox();
        container.remove();

        return {height: bbox.height, width: bbox.width};
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
    _initShape = function(pixelPerAA, thick, doubleLink, xLine, yLine, x, y) {
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
    _endShape = function(pixelPerAA, thick, doubleLink, xLine, yLine, x, y) {
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
     * Helper function to create shapes; if the pixels per amino acid are lower than the minimum,
     * it adjusts it.
     * @param value
     * @param pixelPerAA
     * @returns {*}
     */
    _pixelScale = function (value, pixelPerAA) {
        if (pixelPerAA > _minShapeSize) {
            return ((value * pixelPerAA) / (_minShapeSize - 1));
        }
        return value;
    },
    /**
     * Creates a rectangle shape.
     * @param feature
     * @returns {string|*}
     */
    _createRectangle = function (feature) {
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
    _createBridge = function (feature, pixelPerAA) {
        var x = feature.x;
        var y = feature.y;
        var width = feature.width;
        var height = feature.height;
        if (ProteinTrackUtils.getLength(feature) == 1) {
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
    _createLink = function (feature, pixelPerAA, thick) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var gap = 6 * _scaleFactor;
        if (pixelPerAA > _minShapeSize) {
            gap = _pixelScale(gap, pixelPerAA);
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
     * Creates a diamond shape.
     * @param feature
     * @param pixelPerAA
     * @param thick
     * @param doubleLink
     * @returns {string|*}
     */
    _createDiamond = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var gap = 6*_scaleFactor;
        if (pixelPerAA > _minShapeSize) {
            gap = _pixelScale(gap, pixelPerAA);
        }
        var shape = " L " + (x-gap) + " " + (y-gap) //diamond
            + " L " + x + " " + (y-(gap*2)) //diamond
            + " L " + (x+gap) + " " + (y-gap); //diamond
        if (doubleLink === true) { //no thick will be taken into account here
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
        } else {
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
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
    _createChevron = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var gap = 6*_scaleFactor;
        if (pixelPerAA > _minShapeSize) {
            gap = _pixelScale(gap, pixelPerAA);
        }
        var shape = " L " + (x-gap) + " " + (y-gap) //shape
            + " L " + (x-gap) + " " + (y-(gap*2)) //shape
            + " L " + x + " " + (y-gap) //shape
            + " L " + (x+gap) + " " + (y-(gap*2)) //shape
            + " L " + (x+gap) + " " + (y-gap); //shape
        if (doubleLink === true) { //no thick will be taken into account here
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
        } else {
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
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
    _createCatFace = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var chin = _pixelScale(3*_scaleFactor, pixelPerAA);
        var side = _pixelScale(6*_scaleFactor, pixelPerAA);
        var upperSide = _pixelScale(12*_scaleFactor, pixelPerAA);
        var chick = _pixelScale(2*_scaleFactor, pixelPerAA);
        var upperChick = _pixelScale(4*_scaleFactor, pixelPerAA);
        var shape = " L " + (x-chin) + " " + y //shape
            + " L " + (x-side) + " " + (y-upperChick) //shape
            + " L " + (x-side) + " " + (y-upperSide) //shape
            + " L " + (x-chick) + " " + (y-side) //shape
            + " L " + (x+chick) + " " + (y-side) //shape
            + " L " + (x+side) + " " + (y-upperSide) //shape
            + " L " + (x+side) + " " + (y-upperChick) //shape
            + " L " + (x+chin) + " " + (y); //shape
        if (doubleLink === true) { //no thick will be taken into account here
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
        } else {
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
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
    _createTriangle = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var gap = _pixelScale(6*_scaleFactor, pixelPerAA);
        var shape = " L " + (x-gap) + " " + y //shape
            + " L " + x + " " + (y-(gap*2)) //shape
            + " L " + (x+gap) + " " + y ; //shape
        if (doubleLink === true) { //no thick will be taken into account here
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
        } else {
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
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
    _createWave = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var hillX = _pixelScale(3*_scaleFactor, pixelPerAA);//1
        var lowerHillY = _pixelScale(4*_scaleFactor, pixelPerAA);//1
        var sideX = _pixelScale(6*_scaleFactor, pixelPerAA);//3
        var sideY = _pixelScale(6*_scaleFactor, pixelPerAA);//4
        var upperHillY = _pixelScale(12*_scaleFactor, pixelPerAA);//6
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
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
        } else {
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
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
    _createHexagon = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var topBottomX = _pixelScale(2*_scaleFactor, pixelPerAA);
        var middleX = _pixelScale(6*_scaleFactor, pixelPerAA);
        var middleY = _pixelScale(3*_.scaleFactor, pixelPerAA);
        var topY = _pixelScale(6*_scaleFactor, pixelPerAA);
        var shape = " L " + (x-topBottomX) + " " + y //shape
            + " L " + (x-middleX) + " " + (y-middleY) //shape
            + " L " + (x-topBottomX) + " " + (y-topY) //shape
            + " L " + (x+topBottomX) + " " + (y-topY) //shape
            + " L " + (x+middleX) + " " + (y-middleY) //shape
            + " L " + (x+topBottomX) + " " + (y) ; //shape
        if (doubleLink === true) { //no thick will be taken into account here
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
        } else {
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
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
     * */
    _createPentagon = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var edge = _pixelScale(6*_scaleFactor, pixelPerAA);
        var topX = _pixelScale(3*_scaleFactor, pixelPerAA);
        var topY = _pixelScale(12*_scaleFactor, pixelPerAA);
        var shape = "L " + (x-edge) + " " + (y-edge) //shape
            + " L " + (x-topX) + " " + (y-topY) //shape
            + " L " + (x+topX) + " " + (y-topY) //shape
            + " L " + (x+edge) + " " + (y-edge) ; //shape
        if (doubleLink === true) { //no thick will be taken into account here
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
        } else {
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
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
     * */
    _createCircle = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var topY = _pixelScale(12*_scaleFactor, pixelPerAA);
        var radius = pixelPerAA/2;
        if (pixelPerAA <= _minShapeSize) {
            radius = _minShapeSize/2;
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
    _createArrow = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var middleX = _pixelScale(6*_scaleFactor, pixelPerAA);
        var middleY = _pixelScale(10*_scaleFactor, pixelPerAA);
        var topY = _pixelScale(12*_scaleFactor, pixelPerAA);
        var shape = "L" + (x-middleX) + "," + (y-middleY) //shape
            + "L" + (x) + "," + (y-topY) //shape
            + "L" + (x+middleX) + "," + (y-middleY) ; //shape
        if (doubleLink === true) { //no thick will be taken into account here
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
        } else {
            feature.shape = _initShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y)
            + shape
            + _endShape(pixelPerAA, thick, doubleLink, xLine, yLine, x, y);
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
    _createDoubleBar = function (feature, pixelPerAA, thick, doubleLink) {
        var x = feature.x;
        var y = feature.y;
        var xLine = feature.xLine;
        var yLine = feature.yLine;
        var leftRightX = _pixelScale(6*_scaleFactor, pixelPerAA);
        var topY = _pixelScale(12*_scaleFactor, pixelPerAA);
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
    }
;
/**
 * Public zone.
 */
/**
 * Returns the maximum shape size.
 * @returns {number}
 */
ProteinTrackLayoutUtils.prototype.getMaxShapeSize = function getMaxShapeSize() {
    return _maxShapeSize;
};
/**
 * Returns the maximum allowed number of pixels per amino acid.
 * @returns {number}
 */
ProteinTrackLayoutUtils.prototype.getMaxPixelAA = function getMaxPixelAA() {
    return _maxPixelAA;
};
/**
 * Returns the maximum zoom level.
 * @returns {number}
 */
ProteinTrackLayoutUtils.prototype.getMaxZoom = function getMaxZoom() {
    return _maxZoom;
};
/**
 * Returns the title container widht.
 * @param collapsible
 * @returns {number}
 */
ProteinTrackLayoutUtils.prototype.getTitlesWidth = function getTitlesWidth(collapsible) {
    if (collapsible == undefined) {
        return _titlesWidth;
    } else if (collapsible === true) {
        return _titlesWidth;
    } else {
        return _nonCollapsibleTitlesWidth;
    }
};
/*
 * Returns the maximum size required for a sequence length to be displayed,
 * considering a max length of 99999 aa that will be displayed
 * on a horizontal D3 axis
 * */
ProteinTrackLayoutUtils.prototype.getMaxSeqLengthDisplay = function getMaxSeqLengthDisplay() {
    if (_maxSeqLengthDisplay == undefined) {
        _maxSeqLengthDisplay = _calculateTextSizeSVG("99999", ".axis text");
    }
    _maxSeqLengthDisplay.width = _maxSeqLengthDisplay.width/2;
    _maxSeqLengthDisplay.height = _maxSeqLengthDisplay.height/2;
    return _maxSeqLengthDisplay;
};
/*
 * Returns the maximum size required for an AA symbol to be displayed considering M as the the widest AA.
 * */
ProteinTrackLayoutUtils.prototype.getMaxAAFontDisplay = function getMaxAAFontDisplay() {
    if (_maxAAFontDisplay == undefined) {
        _maxAAFontDisplay = _calculateTextSizeSVG("M", ".aminoAcid");
    }
    return _maxAAFontDisplay;
};
/**
 * Returns the gap on the right so the sequence length can be displayed.
 * @returns {number}
 */
ProteinTrackLayoutUtils.prototype.getZoomTextGap = function getZoomTextGap() {
    if (_maxSeqLengthDisplay == undefined) {
        this.getMaxSeqLengthDisplay();
    }
    return Math.max(_maxSeqLengthDisplay.width, _maxPixelAA);
};
/**
 * Shows tooltip on mouse-over, displayed text corresponds to the label argument.
 * @param tooltipdiv
 * @param label
 */
ProteinTrackLayoutUtils.prototype.mouseover = function mouseover(tooltipdiv, label) {
    tooltipdiv.transition()
        .duration(300)
        .style("opacity", 1);
    tooltipdiv.html(label);
};
/**
 * Keeps showing tooltip on mouse-move.
 * @param tooltipdiv
 */
ProteinTrackLayoutUtils.prototype.mousemove = function mousemove(tooltipdiv) {
    tooltipdiv
        .style("left", (d3.event.pageX + 5) + "px")
        .style("top", (d3.event.pageY + 5) + "px");
};
/**
 * Hides tooptip on mouse-out.
 * @param tooltipdiv
 */
ProteinTrackLayoutUtils.prototype.mouseout = function mouseout(tooltipdiv) {
    tooltipdiv.transition()
        .duration(300)
        .style("opacity", 1e-6);
};
/**
 * Returns the shape corresponding to a feature, shapes change depending on the feature type.
 * @param locationType
 * @param feature
 * @param pixelPerAA
 * @param useShapes
 * @param classType
 * @returns {*}
 */
ProteinTrackLayoutUtils.prototype.getShape = function getShape(locationType, feature, pixelPerAA, useShapes, classType) {
    if (ProteinTrackUtils.equalsNoCase(locationType, LayoutGlobal.FT_LOCATION.continuous)) {
        return this.createRectangle(feature);
    } else if (ProteinTrackUtils.equalsNoCase(locationType, LayoutGlobal.FT_LOCATION.position)) {
        if (useShapes) {
            var fnName = _ftTypeShapeFunction[classType];
            //Some one-single-amino-acid features actually have more than one
            var thick = ProteinTrackUtils.getLength(feature)/2 * pixelPerAA;
            thick = 0; //we do not want thick bars linking the shape and the sequence line
            var doubleLink = !(ProteinTrackUtils.getLength(feature) === 1);
            var path;
            if (fnName instanceof Function) { //TODO, maybe fnName should be a class function
                path = fnName(feature, pixelPerAA, thick, doubleLink);
            } else {
                path = this.createLink(feature, pixelPerAA, thick);
            }
            return path;
        } else {
            return this.createRectangle(feature);
        }
    } else if (ProteinTrackUtils.equalsNoCase(locationType, LayoutGlobal.FT_LOCATION.bridge)) {
        return this.createBridge(feature, pixelPerAA);
    } else if (ProteinTrackUtils.equalsNoCase(locationType, LayoutGlobal.FT_LOCATION.variation)) {
        return this.createRectangle(feature);
    }
    return "";
};
