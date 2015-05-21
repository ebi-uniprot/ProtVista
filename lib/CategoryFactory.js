"use strict";

var d3 = require("d3");
var _ = require("underscore");
var TrackFactory = require("./TrackFactory")

var Category = function(data, container, xScale) {
	var category = this;
	category.tracks = [];
	category.data = data;
	category.xScale = xScale;

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

	category.addTrack = function(track) {
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
			category.addTrack(TrackFactory.createTrack(typeFeatures[d], 'basic', category.tracksContainer, category.xScale));
		});
	}

	category.update = function() {
		category.categoryViewer.update();
		_.each(category.tracks, function(t) {
			 t.update();
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
	this.categoryViewer = new BasicCategoryViewer(this.data.features, this.viewerContainer, this.xScale);
};

Category.variant = function() {
	this.categoryViewer = new VariantCategoryViewer(this.data.features, this.viewerContainer, this.xScale);
};

//Viewer types
var BasicCategoryViewer = function(features, container, xScale) {
	var width = xScale.range()[1];

	var svg = container
		.append('svg')
		.attr('width', width)
		.attr('height', 40);

	svg.selectAll('.feature')
		.data(features)
		.enter()
		.append('rect')
		.attr('x', function(d) {
			return xScale(d.begin)
		})
		.attr('y', 10)
		.attr('width', function(d) {
			return (d.end) ? xScale(d.end - d.begin) : 1;
		})
		.attr('height', 10);

	this.update = function() {
		//Update
	}
};

var VariantCategoryViewer = function(features, containerId, xScale) {
	//TODO 
}

// Factory
var CategoryFactory = function() {
	return {
		createCategory: function(data, type, container, xScale) {
			var categoryViewerType = type,
				category;

			// error if the constructor doesn't exist
			if (typeof Category[type] !== "function") {
				console.log(type + " doesn't exist");
			}

			//inherit parent constructor
			Category[type].prototype = new Category(data, container, xScale);
			category = new Category[type]();

			category.buildTracks();

			return category;
		}
	}
}();

module.exports = CategoryFactory;