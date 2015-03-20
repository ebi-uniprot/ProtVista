var React = require('react');
var FTVUtils = require('./pftv-aux-utils');

/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

/**
 @class pftv-layout-proteinTrack
 */

/**
 * Private zone
 */
/*
 * Private variables.
 * */
var
    _TOOLTIP_CLASS = FTVUtils.ID_CLASS_PREFIX + "tooltip",
    _TRACK_CLASS = FTVUtils.ID_CLASS_PREFIX + "category",
    _TITLE_CLASS = FTVUtils.ID_CLASS_PREFIX + "categoryTitle",
    _TITLE_NO_COLLAPSIBLE_CLASS = FTVUtils.ID_CLASS_PREFIX + "categoryTitleNoCollapsible",
    _FEATURES_CLASS = FTVUtils.ID_CLASS_PREFIX + "categoryFeatures",
    _FEATURES_DARK = FTVUtils.ID_CLASS_PREFIX + "categoryFeaturesDark",
    _FEATURES_LIGHT = FTVUtils.ID_CLASS_PREFIX + "categoryFeaturesLight",
    _CATEGORY = "category",
    _TYPE = "type",
    _SEPARATOR = "_",
    _ALL_TYPES_WRAPPER = "myTypes"
;
 module.exports =
    React.createClass({
            propTypes: {
                isTrackCategory: React.PropTypes.bool.isRequired,
                wrapperSeedId: React.PropTypes.string.isRequired,
                categoryIndex: React.PropTypes.number.isRequired,
                typeIndex: React.PropTypes.number.isRequired,
                collapsible: React.PropTypes.bool.isRequired,
                dark: React.PropTypes.bool.isRequired,
                //content: React.PropTypes.oneOf(['withShapes', 'withBridges', 'withRegions']),
                featuresStyle: React.PropTypes.object
            },
            getDefaultProps: function() {
                return {
                    isTrackCategory: true,
                    wrapperSeedId: "catWrapperSeedId",
                    categoryIndex: 0,
                    typeIndex: 0,
                    collapsible: true,
                    dark: true,
                    featuresStyle:{width: "250px"}
                };
            },
            componentDidMount: function() {
                //no need to check if trackIndex exists, there is a default value
                //this.getDOMNode().setAttribute('index', this.props.trackIndex);
                //console.log(this.getDOMNode());
                //console.log(this.props.trackIndex);
                //console.log(this.props.children);
                //console.log(React.Children);
            },
            render: function() {
                var wrapperId = this.props.wrapperSeedId + _SEPARATOR + _CATEGORY + _SEPARATOR + this.props.categoryIndex +
                    (this.props.isTrackCategory === true
                        ?  ""
                        : _SEPARATOR + _TYPE + _SEPARATOR + this.props.typeIndex
                    )
                ;
                console.log(wrapperId);
                var allTypesWrapperId = wrapperId + _SEPARATOR + _ALL_TYPES_WRAPPER;
                console.log(allTypesWrapperId);
                var catTypes;
                if (this.props.isTrackCategory === true) {
                    catTypes = <div id={allTypesWrapperId}></div>;
                }
                var titleClass = this.props.collapsible === true ? _TITLE_CLASS : _TITLE_NO_COLLAPSIBLE_CLASS; //height
                var featuresClass = _FEATURES_CLASS + " " +
                    (this.props.dark === true ? _FEATURES_DARK : _FEATURES_LIGHT); //height
                console.log(featuresClass);
                var opacityStyle = {opacity: 0.0000001};

                return (
                    <div>
                        <div id={wrapperId}>
                            <div className={_TOOLTIP_CLASS} style={opacityStyle}></div>
                            <div className={_TRACK_CLASS}>
                                <div className={titleClass} style={this.props.featuresStyle}>Hello there!</div>
                                <div className={featuresClass} style={this.props.featuresStyle}>
                                    <svg index="0" width="1050" height="39">
                                        <g transform="translate(0,0)">
                                            <path
                                                id="up_pftv_bond-1_index_0" className="up_pftv_bridge up_pftv_disulfid"
                                                d="M49.16326530612245 39 L 49.16326530612245 24 L 82.29154518950438 24 L 82.29154518950438 39 L 79.27988338192421 39 L 79.27988338192421 25 L 52.17492711370262 25 L 52.17492711370262 39 Z">
                                            </path>
                                            <path
                                                d=" M 8.505830903790088 39 L 8.505830903790088 39 L 8.505830903790088 19 L 8.505830903790088 19L5.505830903790088,14L8.505830903790088,13L11.505830903790088,14 L 8.505830903790088 19 L 8.505830903790088 19 L 8.505830903790088 39 Z"
                                                id="up_pftv_init-met-0_index_0" className="up_pftv_position up_pftv_init_met">
                                            </path>
                                            <path d=" M 1038.49416909621 39 L 1038.49416909621 39 L 1038.49416909621 19 L 1038.49416909621 19L1035.49416909621,19L1038.49416909621,13L1041.49416909621,13 L 1038.49416909621 19 L 1038.49416909621 19 L 1038.49416909621 39 Z"
                                                id="up_pftv_non-ter-0_index_0" className="up_pftv_position up_pftv_non_ter"></path>
                                        </g>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        {catTypes}
                    </div>
                )

            }
        }
    );

//<path id="up_pftv_turn-1_index_0" class="up_pftv_continuous up_pftv_turn" index="0" tooltip="Type: turn - SO:0001128<br/>Residues: [8,59]<br/>Description: turn-1-desc<br/>" style={fill-opacity: 0.5; cursor: pointer;" d="M28.081632653061224,39L28.081632653061224,29L184.68804664723032,29L184.68804664723032,39Z}></path>
//<path id="up_pftv_turn-2_index_0" class="up_pftv_continuous up_pftv_turn" index="0" tooltip="Type: turn - SO:0001128<br/>Residues: [18,69]<br/>Description: turn-2-desc<br/>" style={fill-opacity: 0.5; cursor: pointer;" d="M58.19825072886297,39L58.19825072886297,29L214.80466472303206,29L214.80466472303206,39Z}></path>
//<path id="up_pftv_turn-3_index_0" class="up_pftv_continuous up_pftv_turn" index="0" tooltip="Type: turn - SO:0001128<br/>Residues: [28,79]<br/>Description: turn-3-desc<br/>" style={fill-opacity: 0.5; cursor: pointer;" d="M88.31486880466473,39L88.31486880466473,29L244.92128279883377,29L244.92128279883377,39Z}></path>