var React = require('react');
var React = require('react');
var LayoutGlobal = require('./ptv-aux-global');
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
    _TOOLTIP_CLASS = LayoutGlobal.CSS_PREFIX + "tooltip",
    _TRACK_CLASS = LayoutGlobal.CSS_PREFIX + "category",
    _ROW_CLASS = LayoutGlobal.CSS_PREFIX + "row",
    _TITLE_CLASS = LayoutGlobal.CSS_PREFIX + "categoryTitle",
    _TITLE_NO_COLLAPSIBLE_CLASS = LayoutGlobal.CSS_PREFIX + "categoryTitleNoCollapsible",
    _WITH_SHAPES_CLASS = LayoutGlobal.CSS_PREFIX + "withShapesShort",
    _WITH_BRIDGES_CLASS = LayoutGlobal.CSS_PREFIX + "withBridgesShort",
    _WITH_REGIONS_CLASS = LayoutGlobal.CSS_PREFIX + "withRegionsShort",
    _WITH_VARIANTS_CLASS = LayoutGlobal.CSS_PREFIX + "withVariants",
    _LONG_CLASS = LayoutGlobal.CSS_PREFIX + "longTitle",
    _LONG_CLOSE_CLASS = LayoutGlobal.CSS_PREFIX + "longTitleClose",
    _SHORT_CLOSE_CLASS = LayoutGlobal.CSS_PREFIX + "shortTitleClose",
    _FEATURES_CLASS = LayoutGlobal.CSS_PREFIX + "categoryFeatures",
    _FEATURES_DARK = LayoutGlobal.CSS_PREFIX + "categoryFeaturesDark",
    _FEATURES_LIGHT = LayoutGlobal.CSS_PREFIX + "categoryFeaturesLight",
    _TOOLTIP = "tooltip",
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
        id: undefined,
        tooltipId: undefined,
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
        shortTitle: undefined,
        isClosed: undefined,
        isCollapsible: undefined,
        _notify: true,
        /**
         * Mixin classes.
         */
        mixins: [BiojsEvents],
        /**
         * Parameter restrictions.
         */
        propTypes: {
            title: React.PropTypes.string.isRequired,
            tooltip: React.PropTypes.string.isRequired,
            isTrackCategory: React.PropTypes.bool.isRequired,
            categoryIndex: React.PropTypes.number.isRequired,
            typeIndex: React.PropTypes.number.isRequired,
            dark: React.PropTypes.bool.isRequired,
            content: React.PropTypes.oneOf([LayoutGlobal.WITH_SHAPES, LayoutGlobal.WITH_BRIDGES, LayoutGlobal.WITH_REGIONS, LayoutGlobal.WITH_VARIANTS]),
            featuresWidth: React.PropTypes.number.isRequired
        },
        /**
         * Initializes title and feature classes.
         * @private
         */
        _initClasses: function() {
            this.titleClass = (this.isCollapsible === true ? _TITLE_CLASS : _TITLE_NO_COLLAPSIBLE_CLASS);
            this.featuresClass = _FEATURES_CLASS + " " + (this.props.dark === true ? _FEATURES_DARK : _FEATURES_LIGHT);

            if (this.props.title.length <= _SHORT_TITLE) {
                this.shortTitle = true;
                switch(this.props.content) {
                    case LayoutGlobal.WITH_SHAPES:
                        this.titleClass += " " + _WITH_SHAPES_CLASS;
                        this.featuresClass += " " + _WITH_SHAPES_CLASS;
                        break;
                    case LayoutGlobal.WITH_BRIDGES:
                        this.titleClass += " " + _WITH_BRIDGES_CLASS;
                        this.featuresClass += " " + _WITH_BRIDGES_CLASS;
                        break;
                    case LayoutGlobal.WITH_VARIANTS:
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
                if (this.props.content === LayoutGlobal.WITH_VARIANTS) {
                    this.titleClass += " " + _WITH_VARIANTS_CLASS;
                    this.featuresClass += " " + _WITH_VARIANTS_CLASS;
                } else {
                    this.titleClass += " " + _LONG_CLASS;
                    this.featuresClass += " " + _LONG_CLASS;
                }
            }
        },
        /**
         * Initializes the category wrapper id and the all-types wrapper id.
         * @private
         */
        _initIds: function() {
            this.id = LayoutGlobal.CSS_PREFIX + (new Date().getTime());
            this.tooltipId = this.id + _SEPARATOR + _TOOLTIP;
            this.wrapperId = this.id + _SEPARATOR + _CATEGORY + _SEPARATOR + this.props.categoryIndex +
                (this.props.isTrackCategory === true
                    ?  ""
                    : _SEPARATOR + _TYPE + _SEPARATOR + this.props.typeIndex
                )
            ;

            this.divTitleId = this.wrapperId + _SEPARATOR + _TITLE;
            this.divFeaturesId = this.wrapperId + _SEPARATOR + _FEATURES;

            if (this.props.isTrackCategory === true) {
                this.allTypesWrapperId = this.wrapperId + _SEPARATOR + _ALL_TYPES_WRAPPER;
                this.catTypes = <div id={this.allTypesWrapperId} className={_ROW_CLASS}></div>;
            }
        },
        /**
         * Return div ids.
         */
        getDivIds: function() {
            return {trackId: this.id, tooltipId: this.tooltipId, wrapperId: this.wrapperId, divTitleId: this.divTitleId, divFeaturesId: this.divFeaturesId, allTypesWrapperId: this.allTypesWrapperId};
        },
        /**
         * Opens or closes a track and triggers an event.
         * If track is closed, arrow will point down, otherwise it will point right.
         */
        openClose: function() {
            this.isClosed = !this.isClosed;
            if (this.isClosed === true) {
                d3.select("#" + this.divTitleId).text(LayoutGlobal.ARROW_RIGHT + " " + this.props.title);
                d3.select("#" + this.divTitleId).attr("class", this.titleClass);
                d3.select("#" + this.divFeaturesId).style("display", "");
                d3.select("#" + this.allTypesWrapperId).style("display", LayoutGlobal.DISPLAY_NONE);
            } else {
                d3.select("#" + this.divTitleId).text(LayoutGlobal.ARROW_DOWN + " " + this.props.title);
                d3.select("#" + this.divFeaturesId).style("display", LayoutGlobal.DISPLAY_NONE);
                d3.select("#" + this.allTypesWrapperId).style("display", "");
                var titleClass;
                if (this.shortTitle === false) {
                    titleClass = (this.isCollapsible === true ? _TITLE_CLASS : _TITLE_NO_COLLAPSIBLE_CLASS) + " " + _LONG_CLOSE_CLASS;
                } else {
                    titleClass = (this.isCollapsible === true ? _TITLE_CLASS : _TITLE_NO_COLLAPSIBLE_CLASS) + " " + _SHORT_CLOSE_CLASS;
                }
                d3.select("#" + this.divTitleId).attr("class", titleClass);
            }
            this.trigger("openClose", {isClosed: this.isClosed});
        },
        /**
         * Initializes the close/open state, the wrapper ids, classes, styles, and SVG index & transformation.
         */
        componentWillMount: function() {
            this.isCollapsible = this.props.isTrackCategory === true ? true : false;
            this.isClosed = true;
            this._initIds();
            this._initClasses();
            this.widthStyle = {width: this.props.featuresWidth + "px"};
            this.svgIndex = this.props.categoryIndex + _SEPARATOR + this.props.typeIndex;
            this.transform = "translate(0, -" + LayoutGlobal.TRACK_PADDING + ")";
        },
        /**
         * Default parameter values.
         * @returns {{
         *  wrapperSeedId: string,
         *  title: string,
         *  isTrackCategory: boolean,
         *  categoryIndex: number,
         *  typeIndex: number,
         *  dark: boolean,
         *  content: string,
         *  featuresWidth: number}}
         */
        getDefaultProps: function() {
            return {
                title: "",
                tooltip: "",
                isTrackCategory: true,
                categoryIndex: 0,
                typeIndex: 0,
                dark: true,
                content: LayoutGlobal.WITH_REGIONS,
                featuresWidth: 1050
            };
        },
        /**
         * Component rendering.
         * @returns {XML}
         */
        render: function() {
            var title = this.props.title;
            if (this.isCollapsible === true) {
                title = LayoutGlobal.ARROW_RIGHT + " " + title;
            }
            var titleDiv;
            if (this.props.isTrackCategory === true) {
                titleDiv = <div id={this.divTitleId} className={this.titleClass} onClick={this.openClose}>{title}</div>;
            } else {
                titleDiv = <div id={this.divTitleId} className={this.titleClass}>{title}</div>;
            }
            return (
                <div id={this.id}>
                    <div id={this.wrapperId}>
                        <div id={this.tooltipId} className={_TOOLTIP_CLASS} style={_HIDDEN_STYLE}></div>
                        <div className={_TRACK_CLASS}>
                            {titleDiv}
                            <div id={this.divFeaturesId} className={this.featuresClass} style={this.widthStyle}>
                                <svg index={this.svgIndex} width={this.props.featuresWidth} height="10">
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