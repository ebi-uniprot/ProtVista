"use strict";

var d3 = require("d3");
var _ = require("underscore");
var TrackFactory = require("./TrackFactory");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var tooltipHandler = require("./TooltipFactory");
var BasicViewer = require("./BasicViewer");

var Category = function(data, type, fv) {
	var category = this;
	category.tracks = [];
	category.data = data;
    category.viewerType = type;
	category.fv = fv;
	category.tracksCreated = false;
	category.categoryViewer;
    category.effectiveHeight;

	var categoryContainer = fv.container.append('div')
		.attr('class', 'up_pftv_category');

	category.header = categoryContainer.append('a')
		.attr('class', 'up_pftv_category-name up_pftv_arrow-right')
		.text(data.label)
		.on('click', function(event) {
			category.toggle();
			category.propagateSelection();
		});

    category.effectiveHeight = categoryContainer.node().getBoundingClientRect().height;

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
			if (d.type) //TODO we need to change the JSON for variation
				return d.type.label;
		});
        var that = this;
		_.each(_.keys(typeFeatures), function(d) {
			//TODO track type should come from data, now it manually comes from the FeatureViewer
			that.addTrack(TrackFactory.createTrack(typeFeatures[d], category.viewerType, category));
		});
	};

	category.toggle = function() {
        //up_pftv_track .node().getBoundingClientRect().height
		if(category.tracksContainer.style('display') === 'none') {
			category.tracksContainer.style('display','inline-block');
			category.viewerContainer.select('.up_pftv_category-viewer-group').style('display','none');
			category.header.attr('class','up_pftv_category-name up_pftv_arrow-down');
            category.tracksContainer.selectAll('.up_pftv_track-header')
                .classed('up_pftv_track-header', function() {
                    var headerHeight = Math.ceil(d3.select(this).node().getBoundingClientRect().height);
                    d3.select(this.nextSibling).select('svg').attr('height', headerHeight);
                    d3.select(this.nextSibling).select('.up_pftv_shadow').attr('height', headerHeight);
                    return true;
                });
		} else {
			category.tracksContainer.style('display','none');
			category.viewerContainer.select('.up_pftv_category-viewer-group').style('display','inline-block');
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

//Category types
Category.basic = function() {
	this.categoryViewer = new BasicCategoryViewer(this);
};

Category.variant = function() {
	this.categoryViewer = new VariantCategoryViewer(this);
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
        category.data.features, category.viewerContainer, category.fv,
        category.fv.width, 'drawAreaCategoryClip', category.effectiveHeight
	);
};

var VariantCategoryViewer = function(category) {
	var height = 40;
	var features = category.data.features,
		container = category.viewerContainer,
		xScale = category.fv.xScale,
		width = category.fv.width,
		zoom = category.fv.zoom;

	var varChart = container
				.append('svg')
				.attr('class','up_pftv_variation-chart')
				.attr('width', width)
				.attr('height', height)
				.append('g');

	var variationCountArray = _.map(features,function(d){
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
			.attr("d",line(variationCountArray));

	varChart.append("path")
			.data(features)
			.attr("class","up_pftv_line")
			.attr("d",line(variationCountArray));


	this.update = function() {
		varChart.selectAll("path")
				.data(features)
				.attr("class","up_pftv_block-area")
				.attr("d",line(variationCountArray));

		varChart.selectAll("path")
				.data(features)
				.attr("class","up_pftv_line")
				.attr("d",line(variationCountArray));		
	};
	return this;
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