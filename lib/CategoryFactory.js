/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var TrackFactory = require("./TrackFactory");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var tooltipHandler = require("./TooltipFactory");
var BasicViewer = require("./BasicViewer");
var ViewerFactory = require("./ViewerFactory");

var Category = function(data, type, fv) {
    var category = this;
    category.tracks = [];
    category.data = data;
    category.viewerType = type;
    category.fv = fv;
    category.tracksCreated = false;
    category.categoryViewer = undefined;

    var categoryContainer = fv.container.append('div')
        .attr('class', 'up_pftv_category');

    category.header = categoryContainer.append('a')
        .attr('class', 'up_pftv_category-name up_pftv_arrow-right')
        .attr('title', data.label)
        .text(data.label)
        .on('click', function() {
            category.toggle();
            category.propagateSelection();
        });

    category.viewerContainer = categoryContainer.append('div')
        .attr('class', 'up_pftv_category-viewer');

    category.tracksContainer = categoryContainer.append('div')
        .attr('class', 'up_pftv_category-tracks')
        .style('display','none');

    category.addTrack = function(track) {
        this.tracks.push(track);
    };

    category.buildTracks = function() {
        //Group tracks by type
        var typeFeatures = _.groupBy(category.data.features, function(d) {
            if (d.type) {
                return d.type.label;
            }
        });
        var that = this;
        _.each(typeFeatures, function(value, key) {
            that.addTrack(TrackFactory.createTrack(typeFeatures[key], category.viewerType, category));
        });
    };

    category.toggle = function() {
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

    category.propagateSelection = function() {
        if (this.fv.selectedFeature) {
            d3.selectAll('svg path[name=' + this.fv.selectedFeature.internalId + ']')
                .classed('up_pftv_activeFeature', true)
            ;
        }
    };

    category.setDisabled = function() {
        categoryContainer.attr('class','up_pftv_category up_pftv_category-disabled');
        category.viewerContainer.style('display','none');
        category.header.on('click', function(){});
    };
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
        category.data.features, category.viewerContainer, category.fv
    );
};

var VariantCategoryViewer = function(category) {
    var height = 40;
    var features = category.data.features,
        container = category.viewerContainer,
        xScale = category.fv.xScale,
        width = category.fv.width,
        zoom = category.fv.zoom;

    var varChart = ViewerFactory.createSVG(container, width, height, category.fv, 'up_pftv_variation-chart');

    var variationCountArray = _.map(features, function(d) {
        return d.variants.length;
    });

    var varYScale = d3.scale.linear()
                .domain([0,d3.max(variationCountArray)])
                .range([height, 0]);

    var line = d3.svg.line()
                .x(function(d,i) {
                    return xScale(i);
                })
                .y(function(d) {
                    return varYScale(d);
                })
                .interpolate('linear');

    varChart.append("path")
            .data(features)
            .attr("class","up_pftv_block-area")
            .attr("d",line(variationCountArray))
            .on('click', function(){
                category.toggle();
            });

    varChart.append("path")
            .data(features)
            .attr("class","up_pftv_line")
            .attr("d",line(variationCountArray))
                .on('click', function(){
                category.toggle();
            });

    this.update = function() {
        varChart.selectAll(".up_pftv_block-area")
            .data(features)
            .attr("class","up_pftv_block-area")
            .attr("d",line(variationCountArray));

        varChart.selectAll(".up_pftv_line")
            .data(features)
            .attr("class","up_pftv_line")
            .attr("d",line(variationCountArray));
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
        createCategory: function(data, type, fv) {
            var category;

            // error if the constructor doesn't exist
            if (typeof Category[type] !== "function") {
                console.log('WARNING: Category viewer type ' + type + " doesn't exist");
            }

            //inherit parent constructor
            Category[type].prototype = new Category(data, type, fv);
            category = new Category[type]();

            if(data.features.length > 0) {
                category.buildTracks();
            } else {
                category.setDisabled();
            }

            return category;
        }
    };
}();

module.exports = CategoryFactory;