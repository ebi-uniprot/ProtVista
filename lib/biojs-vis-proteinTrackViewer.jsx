/** @jsx React.DOM */

var React = require('react');
var LayoutProteinTrack = require('./ptv-layout-proteinTrack.jsx');
var LayoutGlobal = require('./ptv-layout-global');
var ProteinTrackUtils = require('./ptv-aux-utils');
var TrackPaintingHelper = require('./ptv-aux-trackPaintingHelper');
var _ = require('underscore');
var d3 = require('d3');

var ProteinTrackViewer;

module.exports = ProteinTrackViewer = function(options){
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
    _instanceIndex = -1,
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
    }

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
        //make sure every new instance remains independent
        _instanceArray.push(self);
        _instanceIndex = _instanceArray.length-1;
        _instanceArray[_instanceIndex].opt = _.extend(_.extend({}, _defaultOptions), options);
        _instanceArray[_instanceIndex].opt.myArrayIndex = _instanceIndex;
        _instanceArray[_instanceIndex].opt.layout = undefined;
        _instanceArray[_instanceIndex]._ftPosAndHeight = {
            position: {yLine: 31, hLine: 20, y: 10},
            bridge: {y: 31, h: 15},
            continuous: {y: 31, h: 10}
        };
        _instanceArray[_instanceIndex]._stylingOpt = {};
        if (_instanceArray[_instanceIndex].opt.clickable === true) {
            _instanceArray[_instanceIndex].opt.clickableStyle = true;
        }

        self.opt.categoryIndex = self.opt.categoryIndex == undefined ? 0 : self.opt.categoryIndex;
        if (ProteinTrackUtils.getTrackMode(self.opt.category) === LayoutGlobal.TRACK_MODES.category) {
            self.opt.collapsible = true;
            self._styleView = LayoutGlobal.STYLE_VIEWS.centered;
        } else {
            self.opt.collapsible = false;
            self._styleView = LayoutGlobal.STYLE_VIEWS.nonOverlapping;
            self.opt.typeIndex = self.opt.typeIndex == undefined ? 0 : self.opt.typeIndex;
        }

        if (ProteinTrackUtils.isVariantsTrack(self.opt.category)) {
            self.opt.useShapes = false;
            self._styleView = LayoutGlobal.STYLE_VIEWS.variants;
        }

        self._hasBeenOpen = false;

        _initLayout(self);
        _initIdsAndEvents(self);
    },
    /**
     * Create a container inside self.opt.element for this category/type; if this is a category (always collapsible),
     * it also creates a secondary container for the category types.
     * @param self
     * @private
     */
    _initLayout = function(self) {
        var container = self.opt.element == undefined ? document.body : self.opt.element;

        var content = LayoutGlobal.WITH_REGIONS;
        if (self._categoryContains(LayoutGlobal.FT_LOCATION.position)) {//we have shapes
            content = LayoutGlobal.WITH_SHAPES;
        } else if (self._categoryContains(LayoutGlobal.FT_LOCATION.bridge)) {//we have bridges
            content = LayoutGlobal.WITH_BRIDGES;
        } else if (self._categoryContains(LayoutGlobal.FT_LOCATION.continuous))  {//we have rectangles
            content = LayoutGlobal.WITH_REGIONS;
        } else {
            content = LayoutGlobal.WITH_VARIANTS;
        }

        var options = {
            title: ProteinTrackUtils.getTrackTitle(self.opt.category),
            tooltip: "", //TODO do we want a tooltip for title?
            isTrackCategory: ProteinTrackUtils.getTrackMode(self.opt.category) === LayoutGlobal.TRACK_MODES.category,
            categoryIndex: self.opt.categoryIndex,
            typeIndex: self.opt.typeIndex,
            dark: self.opt.darkBackground,
            content: content,
            featuresWidth: 1050 //TODO get it from scale
        };

        self.opt.layout = React.render(
            <LayoutProteinTrack
                {...options}
            />,
            container
        );
    },
    /**
     * After initializing the layout, it recovers inner div ids and register listeners to layout events.
     * @param self
     * @private
     */
    _initIdsAndEvents = function(self) {
        self.opt.allTypesDiv = d3.select("#" + self.opt.layout.getDivIds().allTypesWrapperId);

        self.opt.layout.on('openClose', function(obj) {
            _openClose(self, obj);
        });
    },
    /**
     * Opens/closes a category track.
     * @param self
     * @param obj
     * @private
     */
    _openClose = function(self, obj) {
        if (obj.isClosed === true) {
            self.trigger('categoryClose', {category: self.opt.category});
        } else {
            if (self._hasBeenOpen === false) {//first time, create type layouts
                self._hasBeenOpen = true;
                var types = TrackPaintingHelper.getTypes(self);
                _buildTypeInstances(self, types);
            } else { //TODO types exist, only selection should be updated
                /*if (self._currentSelectedFeature != undefined) {
                    var myInstance = _.find(self._instances, function(type, posType) {
                        return self._currentSelectedFeature.typeIndex === posType;
                    });
                    if (myInstance != undefined) {
                        d3.select(self._currentSelectedSVG).style("fill-opacity", self.opt.transparency);
                        self._currentSelectedSVG = document.getElementById(FTVUtils.ID_CLASS_PREFIX + self._currentSelectedFeature.ftId + "_index_" + myInstance.opt.myArrayIndex);
                        d3.select(self._currentSelectedSVG).style("fill-opacity", 1);
                    }
                }*/
            }
            self.trigger('categoryOpen', {category: self.opt.category});
        }
    },
    /**
     * Creates a type instance, called only when the current instance is a category and is open for the first time.
     * @param self This Category instance.
     * @param types Category types.
     * @private
     */
    _buildTypeInstances = function(self, types) {
        _.each(types, function(type, posType) {
            var elem = self.opt.allTypesDiv.append("div");
            var myInstance = new ProteinTrackViewer({
                element: elem[0][0]
                ,darkBackground: self.opt.darkBackground
                ,width: self.opt.width
                ,useShapes: self.opt.useShapes
                ,useTooltips: self.opt.useTooltips
                ,clickable: false
                ,clickableStyle: self.opt.clickableStyle
                ,ftHeight: self.opt.ftHeight
                ,transparency: self.opt.transparency
                ,sequence: self.opt.sequence
                ,category: types[posType]
                ,categoryIndex: self.opt.categoryIndex
                ,typeIndex: posType
            });
            types[posType] = myInstance.opt.category;
            self._instances.push(myInstance);
            /* TODO
            myInstance.on("featureClicked", function(obj) {
                _onInstanceFeatureClick(self, obj);
            });
            myInstance.on("featureOn", function(obj) {
                self.trigger('featureOn', obj);
            });
            myInstance.on("featureOff", function(obj) {
                self.trigger('featureOff', obj);
            });*/
            //propagates zoom and translation
            /* TODO
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
                self._currentSelectedSVG = document.getElementById(FTVUtils.ID_CLASS_PREFIX + self._currentSelectedFeature.ftId + "_index_" + myInstance.opt.myArrayIndex);
                d3.select(self._currentSelectedSVG).style("fill-opacity", 1);
            }*/
        });
    }
;

/**
 * Public zone.
 */
/**
 * Public and protected variables.
 */
//type instances (if category is collapsible it will be used)
ProteinTrackViewer.prototype._instances = [];
/**
 * Aimed to be protected/package methods
 */
/*
 * Informs (true or false) whether a category contains any feature with a given location class.
 * @param self This instance.
 * @param ftClass Feature location type.
 * @protected
 * */
ProteinTrackViewer.prototype._categoryContains = function _categoryContains(ftClass) {
    if (ProteinTrackUtils.isVariantsTrack(this.opt.category)) {
        return false; //Variants do not have location classes for features.
    } else {
        var types = ProteinTrackUtils.getTrackTypes(this.opt.category);
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
ProteinTrackViewer.prototype.zoomInOut = function zoomInOut(moveToAA) {
    //_zoomInOut(this, moveToAA, true, true);
};

/**
 * Translates a category to a given coordinate.
 * @param moveToAA First amino acid to be displayed.
 */
ProteinTrackViewer.prototype.translate = function translate(moveToAA) {
    //_translate(this, moveToAA, true);
};

/**
 * Opens/closes a category so the arrow on the left changes to pointer-down;
 * an event informing category, component container, and category div background is raised.
 */
ProteinTrackViewer.prototype.openClose = function openClose() {
    if (this.opt.collapsible === true) {
        this.opt.layout.openClose();
    }
};

/**
 * Closes a category do the arrow on the left changes to pointer-right;
 * an event informing category and component target is raised.
 */
//ProteinTrackViewer.prototype.close = function close() {
    /*if (this.opt.collapsible == true) {
        var text = this._categoryRowTitleDiv.text();
        if (text.charAt(0) != FTVUtils.ARROW_RIGHT) { //it is not closed ^, it makes sense to close it
            this._categoryRowTitleDiv.text(FTVUtils.ARROW_RIGHT + " " + FTVUtils.getTrackTitle(this.opt.category));
            _closeCategory(this);
            this.trigger('categoryClose', {category: this.opt.category, target: this.opt.target});
        }
    }*/
//};

require('biojs-events').mixin(ProteinTrackViewer.prototype);
