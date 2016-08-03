/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var $ = require('jquery');
var _ = require("underscore");
var TrackFactory = require("./TrackFactory");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var BasicViewer = require("./BasicViewer");
var ViewerHelper = require("./ViewerHelper");
var Constants = require("./Constants");
var Evidence = require('./Evidence');

var Category = function(name, data, catInfo, fv, container) {
    var category = this;
    category.name = name;
    category.tracks = [];
    category.data = data;
    category.viewerType = catInfo.visualizationType;
    category.fv = fv;
    category.categoryViewer = undefined;

    category.categoryContainer = container.append('div')
        .attr('class', 'up_pftv_category');
    category.header = category.categoryContainer.append('a')
        .attr('class', 'up_pftv_category-name up_pftv_arrow-right')
        .attr('title', category.name)
        .text(catInfo.label)
        .on('click', function() {
            category.toggle();
            category.propagateSelection();
        });

    category.viewerContainer = category.categoryContainer.append('div')
        .attr('class', 'up_pftv_category-viewer');

    category.tracksContainer = category.categoryContainer.append('div')
        .attr('class', 'up_pftv_category-tracks')
        .style('display','none');
};

Category.prototype.reset = function() {
    var category = this;
    _.each(category.tracks, function(track) {
        if (track.reset) {
            track.reset();
        }
    });
};

Category.prototype.repaint = function(data) {
    var category = this;
    if (category.viewerType === Constants.getVisualizationTypes().basic) {
        category.data = _.union(category.data, data);
    } else {
        _.each(category.data, function (wildAAPosition, wildIndex) {
            if ((data[wildIndex].variants.length !== 0)) {
                if (wildAAPosition.variants.length !== 0) {
                    _.each(data[wildIndex].variants, function(dataVariant) {
                        var sameCatVariant = _.find(wildAAPosition.variants, function(variant) {
                            return (variant.begin === dataVariant.begin) && (variant.end === dataVariant.end) &&
                                (variant.wildType === dataVariant.wildType) &&
                                (variant.alternativeSequence === dataVariant.alternativeSequence);
                        });
                        if (sameCatVariant) {
                            var sourceType;
                            if (!sameCatVariant.sourceType && !dataVariant.sourceType) {
                                sourceType = undefined;
                            } else if (!sameCatVariant.sourceType) {
                                sourceType = dataVariant.sourceType;
                            } else if (!dataVariant.sourceType) {
                                sourceType = sameCatVariant.sourceType;
                            }

                            $.extend(true, sameCatVariant, dataVariant);
                            sameCatVariant.sourceType = sourceType;
                        } else {
                            wildAAPosition.variants.push(dataVariant);
                        }
                    });
                } else {
                    wildAAPosition.variants = data[wildIndex].variants;
                }
            }
        });
    }

    var catContainer = d3.select('.up_pftv_category_' + category.name);
    var ftGroup = catContainer.select('.up_pftv_category-viewer-group');
    ftGroup.selectAll('*').remove();
    category.categoryViewer.updateData(category.data);

    var tracksContainer = catContainer.select('.up_pftv_category-tracks');
    tracksContainer.selectAll('*').remove();
    tracksContainer.html('');
    category.tracks = [];
    category.buildTracks();
};

Category.prototype.addTrack = function(track) {
    this.tracks.push(track);
};

Category.prototype.buildTracks = function() {
    var category = this;
    //Group tracks by type
    var typeFeatures = _.groupBy(category.data, function(d) {
        if (d.type) {
            return d.type;
        }
    });
    var that = this;
    _.each(typeFeatures, function(value, key) {
        that.addTrack(TrackFactory.createTrack(typeFeatures[key], category.viewerType, category));
    });
};

Category.prototype.toggle = function() {
    var category = this;
    if(category.tracksContainer.style('display') === 'none') {
        category.tracksContainer.style('display','block');
        category.viewerContainer.select('.up_pftv_category-viewer-group').style('display','none');
        category.header.attr('class','up_pftv_category-name up_pftv_arrow-down');
    } else {
        category.tracksContainer.style('display','none');
        category.viewerContainer.select('.up_pftv_category-viewer-group').style('display','block');
        category.header.attr('class','up_pftv_category-name up_pftv_arrow-right');
    }
};

Category.prototype.propagateSelection = function() {
    if (this.fv.selectedFeature) {
        this.fv.globalContainer.selectAll('svg path[name=' + this.fv.selectedFeature.internalId + ']')
            .classed('up_pftv_activeFeature', true)
        ;
    }
};

Category.prototype.setDisabled = function() {
    var category = this;
    category.categoryContainer.attr('class','up_pftv_category up_pftv_category-disabled');
    category.viewerContainer.style('display','none');
    category.header.on('click', function(){});
};

Category.prototype.update = function() {
    var category = this;
    category.categoryViewer.update();
    _.each(category.tracks, function(t) {
        t.update();
    });
};

//Viewer types
var BasicCategoryViewer = function(category) {
    return new BasicViewer(
        category.name, category.data, category.viewerContainer, category.fv
    );
};

var VariantCategoryViewer = function(category) {
    var varCatViewer = this;
    varCatViewer.features = category.data;

    var height = 40;
    var container = category.viewerContainer,
        xScale = category.fv.xScale,
        width = category.fv.width,
        zoom = category.fv.zoom;

    varCatViewer.varChart = ViewerHelper.createSVG(container, width, height, category.fv, 'up_pftv_variation-chart');

    varCatViewer.variationCountArray = _.map(varCatViewer.features, function(d) {
        return d.variants.length;
    });

    var varYScale = d3.scale.linear()
                .domain([0,d3.max(varCatViewer.variationCountArray)])
                .range([height, 0]);

    var line = d3.svg.line()
                .x(function(d,i) {
                    return xScale(i);
                })
                .y(function(d) {
                    return varYScale(d);
                })
                .interpolate('linear');

    this.init = function () {
        var varCatViewer = this;
        varCatViewer.varChart.append("path")
            .data(varCatViewer.features)
            .attr("class","up_pftv_block-area")
            .attr("d",line(varCatViewer.variationCountArray))
            .on('click', function(){
                category.toggle();
            });

        varCatViewer.varChart.append("path")
            .data(varCatViewer.features)
            .attr("class","up_pftv_line")
            .attr("d",line(varCatViewer.variationCountArray))
            .on('click', function(){
                category.toggle();
            });
    };

    this.init();

    this.update = function() {
        var varCatViewer = this;
        varCatViewer.varChart.selectAll(".up_pftv_block-area")
            .data(varCatViewer.features)
            .attr("class","up_pftv_block-area")
            .attr("d",line(varCatViewer.variationCountArray));

        varCatViewer.varChart.selectAll(".up_pftv_line")
            .data(varCatViewer.features)
            .attr("class","up_pftv_line")
            .attr("d",line(varCatViewer.variationCountArray));
    };

    this.updateData = function(data) {
        var varCatViewer = this;
        varCatViewer.features = data;

        varCatViewer.variationCountArray = _.map(varCatViewer.features, function(d) {
            return d.variants.length;
        });

        varCatViewer.varChart.selectAll(".up_pftv_block-area").remove();
        varCatViewer.varChart.selectAll(".up_pftv_line").remove();
        this.init();
    };

    return this;
};

//Category types
Category.basic = function() {
    this.categoryViewer = new BasicCategoryViewer(this);
};

Category.variant = function() {
    this.categoryViewer = new VariantCategoryViewer(this);
};

// Factory
var CategoryFactory = function() {
    return {
        createCategory: function(name, data, catInfo, fv, container) {
            var category;

            // error if the constructor doesn't exist
            if (typeof Category[catInfo.visualizationType] !== "function") {
                console.log('WARNING: Category viewer type ' + catInfo.visualizationType + " doesn't exist");
            }

            //inherit parent constructor
            Category[catInfo.visualizationType].prototype = new Category(name, data, catInfo, fv, container);
            category = new Category[catInfo.visualizationType]();

            if(data.length > 0) {
                category.buildTracks();
            } else {
                category.setDisabled();
            }

            return category;
        }
    };
}();

module.exports = CategoryFactory;
