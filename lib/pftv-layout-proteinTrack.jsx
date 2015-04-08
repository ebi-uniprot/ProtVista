var React = require('react');
var LayoutGlobal = require('./pftv-layout-global');
var BiojsEvents = require('biojs-events');
var d3 = require('d3');
/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

/**
 @class pftv-layout-proteinTrack
 React rendering for a category/type track layout. It does not render the features, just the wrappers as well as SGV & group.
 */

/**
 * Private zone
 */
/*
 * Private variables.
 * */
var
    _TOOLTIP_CLASS = LayoutGlobal.cssPrefix + "tooltip",
    _TRACK_CLASS = LayoutGlobal.cssPrefix + "category",
    _ROW_CLASS = LayoutGlobal.cssPrefix + "row",
    _TITLE_CLASS = LayoutGlobal.cssPrefix + "categoryTitle",
    _TITLE_NO_COLLAPSIBLE_CLASS = LayoutGlobal.cssPrefix + "categoryTitleNoCollapsible",
    _WITH_SHAPES_CLASS = LayoutGlobal.cssPrefix + "withShapesShort",
    _WITH_BRIDGES_CLASS = LayoutGlobal.cssPrefix + "withBridgesShort",
    _WITH_REGIONS_CLASS = LayoutGlobal.cssPrefix + "withRegionsShort",
    _WITH_VARIANTS_CLASS = LayoutGlobal.cssPrefix + "withVariants",
    _LONG_CLASS = LayoutGlobal.cssPrefix + "longTitle",
    _LONG_CLOSE_CLASS = LayoutGlobal.cssPrefix + "longTitleClose",
    _SHORT_CLOSE_CLASS = LayoutGlobal.cssPrefix + "shortTitleClose",
    _FEATURES_CLASS = LayoutGlobal.cssPrefix + "categoryFeatures",
    _FEATURES_DARK = LayoutGlobal.cssPrefix + "categoryFeaturesDark",
    _FEATURES_LIGHT = LayoutGlobal.cssPrefix + "categoryFeaturesLight",
    _CATEGORY = "category",
    _TYPE = "type",
    _TITLE = "title",
    _FEATURES = "features",
    _SEPARATOR = "_",
    _ALL_TYPES_WRAPPER = "myTypes",
    _SHORT_TITLE = 19,
    _HIDDEN_STYLE = {opacity: 0.0000001}
;
module.exports =
    React.createClass({
        /**
         * Attributes
         */
        wrapperId: undefined,
        allTypesWrapperId: undefined,
        catTypes: undefined,
        titleClass: undefined,
        divTitleId: undefined,
        featuresClass: undefined,
        divFeaturesId: undefined,
        widthStyle: undefined,
        svgIndex: undefined,
        transform: undefined,
        close: undefined,
        shortTitle: undefined,
        /**
         * Mixin classes.
         */
        mixins: [BiojsEvents],
        /**
         * Parameter restrictions.
         */
        propTypes: {
            wrapperSeedId: React.PropTypes.string.isRequired,
            title: React.PropTypes.string.isRequired,
            isTrackCategory: React.PropTypes.bool.isRequired,
            categoryIndex: React.PropTypes.number.isRequired,
            typeIndex: React.PropTypes.number.isRequired,
            collapsible: React.PropTypes.bool.isRequired,
            dark: React.PropTypes.bool.isRequired,
            content: React.PropTypes.oneOf([LayoutGlobal.withShapes, LayoutGlobal.withBridges, LayoutGlobal.withRegions, LayoutGlobal.withVariants]),
            featuresWidth: React.PropTypes.number.isRequired
        },
        /**
         * Initializes the category wrapper id and the all-types wrapper id.
         * @private
         */
        _initWrapperIds: function() {
            this.wrapperId = this.props.wrapperSeedId + _SEPARATOR + _CATEGORY + _SEPARATOR + this.props.categoryIndex +
                (this.props.isTrackCategory === true
                    ?  ""
                    : _SEPARATOR + _TYPE + _SEPARATOR + this.props.typeIndex
                )
            ;

            this.divTitleId = this.wrapperId + _SEPARATOR + _TITLE;
            this.divFeaturesId = this.wrapperId + _SEPARATOR + _FEATURES;

            this.allTypesWrapperId = this.wrapperId + _SEPARATOR + _ALL_TYPES_WRAPPER;
            if (this.props.isTrackCategory === true) {
                this.catTypes = <div id={this.allTypesWrapperId} className={_ROW_CLASS}></div>;
            }
        },
        /**
         * Initializes title and feature classes.
         * @private
         */
        _initClasses: function() {
            this.titleClass = (this.props.collapsible === true ? _TITLE_CLASS : _TITLE_NO_COLLAPSIBLE_CLASS);
            this.featuresClass = _FEATURES_CLASS + " " + (this.props.dark === true ? _FEATURES_DARK : _FEATURES_LIGHT);

            if (this.props.title.length <= _SHORT_TITLE) {
                this.shortTitle = true;
                switch(this.props.content) {
                    case LayoutGlobal.withShapes:
                        this.titleClass += " " + _WITH_SHAPES_CLASS;
                        this.featuresClass += " " + _WITH_SHAPES_CLASS;
                        break;
                    case LayoutGlobal.withBridges:
                        this.titleClass += " " + _WITH_BRIDGES_CLASS;
                        this.featuresClass += " " + _WITH_BRIDGES_CLASS;
                        break;
                    case LayoutGlobal.withVariants:
                        this.titleClass += " " + _WITH_VARIANTS_CLASS;
                        this.featuresClass += " " + _WITH_VARIANTS_CLASS;
                        break;
                    default:
                        this.titleClass += " " + _WITH_REGIONS_CLASS;
                        this.featuresClass += " " + _WITH_REGIONS_CLASS;
                        break;
                }
            } else {
                this.shortTitle = false;
                if (this.props.content === LayoutGlobal.withVariants) {
                    this.titleClass += " " + _WITH_VARIANTS_CLASS;
                    this.featuresClass += " " + _WITH_VARIANTS_CLASS;
                } else {
                    this.titleClass += " " + _LONG_CLASS;
                    this.featuresClass += " " + _LONG_CLASS;
                }
            }
        },
        /**
         * Opens or closes a track and triggers an event.
         * If track is closed, arrow will point down, otherwise it will point right.
         * @private
         */
        _openClose: function() {
            this.close = !this.close;
            if (this.close === true) {
                d3.select("#" + this.divTitleId).text(LayoutGlobal.arrowRight + " " + this.props.title);
                d3.select("#" + this.divTitleId).attr("class", this.titleClass);
                d3.select("#" + this.divFeaturesId).style("display", "");
                d3.select("#" + this.allTypesWrapperId).style("display", LayoutGlobal.displayNone);
            } else {
                d3.select("#" + this.divTitleId).text(LayoutGlobal.arrowDown + " " + this.props.title);
                d3.select("#" + this.divFeaturesId).style("display", LayoutGlobal.displayNone);
                d3.select("#" + this.allTypesWrapperId).style("display", "");
                var titleClass;
                if (this.shortTitle === false) {
                    titleClass = (this.props.collapsible === true ? _TITLE_CLASS : _TITLE_NO_COLLAPSIBLE_CLASS) + " " + _LONG_CLOSE_CLASS;
                } else {
                    titleClass = (this.props.collapsible === true ? _TITLE_CLASS : _TITLE_NO_COLLAPSIBLE_CLASS) + " " + _SHORT_CLOSE_CLASS;
                }
                d3.select("#" + this.divTitleId).attr("class", titleClass);
            }
            this.trigger("openClose", {close: this.close});
        },
        /**
         * Default parameter values.
         * @returns {{wrapperSeedId: string, title: string, isTrackCategory: boolean, categoryIndex: number, typeIndex: number, collapsible: boolean, dark: boolean, content: string, featuresWidth: number}}
         */
        getDefaultProps: function() {
            return {
                wrapperSeedId: "catWrapperSeedId",
                title: "",
                isTrackCategory: true,
                categoryIndex: 0,
                typeIndex: 0,
                collapsible: true,
                dark: true,
                content: LayoutGlobal.withRegions,
                featuresWidth: 1050
            };
        },
        /**
         * Initializes the open/close status, wrapper ids, classes, styles, and SVG index & transformation.
         */
        componentWillMount: function() {
            this.close = true;
            this._initWrapperIds();
            this._initClasses();
            this.widthStyle = {width: this.props.featuresWidth + "px"};
            this.svgIndex = this.props.categoryIndex + _SEPARATOR + this.props.typeIndex;
            this.transform = "translate(0, -" + LayoutGlobal.trackPadding + ")";
        },
        /**
         * Triggers a "ready" event.
         */
        componentDidMount: function() {
            this.trigger("ready", {wrapperId: this.wrapperId, divTitleId: this.divTitleId, divFeaturesId: this.divFeaturesId});
        },
        /**
         * Component rendering.
         * @returns {XML}
         */
        render: function() {
            var titleWithArrow = LayoutGlobal.arrowRight + " " + this.props.title;
            return (
                <div>
                    <div id={this.wrapperId}>
                        <div className={_TOOLTIP_CLASS} style={_HIDDEN_STYLE}></div>
                        <div className={_TRACK_CLASS}>
                            <div id={this.divTitleId} className={this.titleClass} onClick={this._openClose}>{titleWithArrow}</div>
                            <div id={this.divFeaturesId} className={this.featuresClass} style={this.widthStyle}>
                                <svg index={this.svgIndex} width={this.props.featuresWidth}>
                                    <g transform={this.transform}>
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>
                    {this.catTypes}
                </div>
            )

        }
    })
;