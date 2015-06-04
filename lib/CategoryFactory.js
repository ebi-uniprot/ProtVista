"use strict";

var d3 = require("d3");
var _ = require("underscore");
var TrackFactory = require("./TrackFactory");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");

var height = 40;

var Category = function(data, container, xScale, width, zoom) {
	var category = this;
	category.tracks = [];
	category.data = data;
	category.xScale = xScale;
	category.width = width;
	category.zoom = zoom;
	category.categoryViewer;

	var categoryContainer = container.append('div')
		.attr('class', 'fv-category');											

	category.header = categoryContainer.append('a')
		.attr('class', 'fv-category-name arrow-right')
		.text(data.label)
		.on('click', function(event) {
			category.toggle();
		});;

	category.viewerContainer = categoryContainer.append('div')
		.attr('class', 'fv-category-viewer');

	category.tracksContainer = categoryContainer.append('div')
		.attr('class', 'fv-category-tracks')
		.style('display','none');

	var addTrack = function(track) {
		category.tracks.push(track);
	};

	category.buildTracks = function() {
		//Group tracks by type
		var typeFeatures = _.groupBy(category.data.features, function(d) {
			if (d.type) //TODO we need to change the JSON for variation
				return d.type.label;
		});
		_.each(_.keys(typeFeatures), function(d) {
			//TODO track type should come from data
			addTrack(TrackFactory.createTrack(typeFeatures[d], 'basic', category.tracksContainer, category.xScale, zoom));
		});
	};

	category.toggle = function() {
		if(category.tracksContainer.style('display') === 'none') {
			category.tracksContainer.style('display','inline-block');
			category.viewerContainer.style('display','none');
			category.header.attr('class','fv-category-name arrow-down');
		} else {
			category.tracksContainer.style('display','none');
			category.viewerContainer.style('display','inline-block');
			category.header.attr('class','fv-category-name arrow-right');
		}
	};

	category.setDisabled = function() {
		categoryContainer.attr('class','fv-category fv-category-disabled');
		category.viewerContainer.style('display','none');
		category.header.on('click', function(){});
	};

};

//Category types
Category.basic = function() {
	this.categoryViewer = new BasicCategoryViewer(this.data.features, this.viewerContainer, this.xScale, this.width, this.zoom);
};

Category.variant = function() {
	this.categoryViewer = new VariantCategoryViewer(this.data.features, this.viewerContainer, this.xScale, this.width, this.zoom);
};

Category.prototype.update = function() {
	var category = this;
	category.categoryViewer.update();
	_.each(category.tracks, function(t) {
		t.update();
	});
};

//Viewer types
var BasicCategoryViewer = function(features, container, xScale, width, zoom) {

	var layout = new NonOverlappingLayout(features);
	layout.calculate(height);

	var featurePlot = function() {
		var series,
			shapes;

		var featurePlot = function(selection) {

			selection.each(function(data) {
				series = d3.select(this);
				shapes = series.selectAll('.feature')
							.data(data);

				shapes.enter().append('path')
									.append('title')
						.text( function(d){
						return d.description;
					});

				shapes
					.attr('d', function(d) {
						return FeatureFactory.getFeature(
							d.type.name, 
							(d.end) ? xScale.domain()[0] + (xScale(d.end) - xScale(d.begin)) : xScale(1), 
							layout.getFeatureHeight(),
							(d.end) ? d.end - d.begin + 1 : 1);
					})
					.attr('transform',function(d){
						return 'translate('+xScale(d.begin)+ ',' + layout.getYPos(d) + ')';
					})
					.attr('class',function(d){
						return 'feature up_pftv_' + d.type.name.toLowerCase();
					});

				shapes.exit().remove();
			});
		};
		return featurePlot;
	};

	var series = featurePlot();

	var svg = container
		.append('svg')
		.attr('width', width)
		.attr('height', height)
		.call(zoom);

	var drawArea = svg.append('g')
						.attr('clip-path','url(#drawAreaCategoryClip)');
	var dataSeries = drawArea
		.datum(features)
		.call(series);

	this.update = function() {
		dataSeries.call(series);
	};

	return this;
};

var VariantCategoryViewer = function(features, containerId, xScale, width, zoom) {
	this.update = function() {
		//TODO
	}
	return this;
}

// Factory
var CategoryFactory = function() {
	return {
		createCategory: function(data, type, container, xScale, width, zoom) {
			var categoryViewerType = type,
				category;

			// error if the constructor doesn't exist
			if (typeof Category[type] !== "function") {
				console.log(type + " doesn't exist");
			}

			//inherit parent constructor
			Category[type].prototype = new Category(data, container, xScale, width, zoom);
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