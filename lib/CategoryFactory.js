"use strict";

var d3 = require("d3");
var _ = require("underscore");
var TrackFactory = require("./TrackFactory")

var Category = function(data, container, xScale, width) {
	var category = this;
	category.tracks = [];
	category.data = data;
	category.xScale = xScale;
	category.width = width;
	category.categoryViewer;

	var categoryContainer = container.append('div')
		.attr('class', 'fv-category');

	categoryContainer.append('a')
		.attr('class', 'fv-category-name')
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
	}

	category.buildTracks = function() {
		//Group tracks by type
		var typeFeatures = _.groupBy(category.data.features, function(d) {
			if (d.type) //TODO we need to change the JSON for variation
				return d.type.label;
		});
		_.each(_.keys(typeFeatures), function(d) {
			//TODO track type should come from data
			addTrack(TrackFactory.createTrack(typeFeatures[d], 'basic', category.tracksContainer, category.xScale));
		});
	}

	category.toggle = function() {
		if(category.tracksContainer.style('display') === 'none') {
			category.tracksContainer.style('display','block');
			category.viewerContainer.style('display','none')
		} else {
			category.tracksContainer.style('display','none');
			category.viewerContainer.style('display','block')
		}
	}

};

//Category types
Category.basic = function() {
	this.categoryViewer = new BasicCategoryViewer(this.data.features, this.viewerContainer, this.xScale, this.width);
};

Category.variant = function() {
	this.categoryViewer = new VariantCategoryViewer(this.data.features, this.viewerContainer, this.xScale, this.width);
};

Category.prototype.update = function() {
	var category = this;
	category.categoryViewer.update();
	_.each(category.tracks, function(t) {
		t.update();
	});
}

//Viewer types
var BasicCategoryViewer = function(features, container, xScale, width) {

	var featurePlot = function() {
		var series,
			boxes;

		var featurePlot = function(selection) {

			selection.each(function(data) {
				series = d3.select(this);
				boxes = series.selectAll('.feature')
							.data(data);
				boxes.enter().append('rect');

				boxes.attr('x', function(d) {
						return xScale(d.begin)
					})
					.attr('y', 10)
					.attr('width', function(d) {
						// return (d.end) ? xScale(d.end - d.begin) : 1;
						return 10;
					})
					.attr('height', 10)
					.attr('class','feature');

				boxes.exit().remove();
			});
		}
		return featurePlot;
	}

	var series = featurePlot();

	var svg = container
		.append('svg')
		.attr('width', width)
		.attr('height', 40);

	var drawArea = svg.append('g');
	var dataSeries = drawArea
		.datum(features)
		.call(series);

	this.update = function() {
		dataSeries.call(series);
	}

	return this;
};

var VariantCategoryViewer = function(features, containerId, xScale) {
	this.update = function() {
		//TODO
	}
	return this;
}

// Factory
var CategoryFactory = function() {
	return {
		createCategory: function(data, type, container, xScale, width) {
			var categoryViewerType = type,
				category;

			// error if the constructor doesn't exist
			if (typeof Category[type] !== "function") {
				console.log(type + " doesn't exist");
			}

			//inherit parent constructor
			Category[type].prototype = new Category(data, container, xScale, width);
			category = new Category[type]();

			category.buildTracks();

			return category;
		}
	}
}();

module.exports = CategoryFactory;