"use strict";

var $ = require("jquery");
var d3 = require("d3");
var _ = require("underscore");
var TrackFactory = require("./TrackFactory")

var Category = function(data, container, width, seqLength) {
	this.tracks = [];
	this.data = data;
	this.id = data.label.replace(/[^A-Z0-9]/ig, '').toLowerCase();
	this.width = width;
	this.seqLength = seqLength;
	var categoryContainer = $('<div class="fv-category"></div>');
	categoryContainer.append('<span class="fv-category-name">' + data.label + '</span');
	categoryContainer.append('<div class="fv-category-view" id="' + this.id + '""></div>');
	this.tracksContainer = $('<div class="fv-category-tracks"></div>');
	categoryContainer.append(this.tracksContainer);
	container.append(categoryContainer);
};

Category.prototype.addTrack = function(track) {
	this.tracks.push(track);
};

Category.prototype.buildTracks = function() {
	var that = this;
	//Group tracks by type
	var typeFeatures = _.groupBy(this.data.features, function(d) {
		if(d.type) //TODO we need to change the JSON for variation
			return d.type.label;
	});
	_.each(_.keys(typeFeatures), function(d){
		//TODO track type should come from data
		that.addTrack(TrackFactory.createTrack(typeFeatures[d], 'basic', that.tracksContainer, that.width, that.seqLength));
	});
};

//Category types
Category.basic = function() {
	this.categoryViewer = new BasicCategoryViewer(this.data.features, this.id, this.width, this.seqLength);
};

Category.variant = function() {
	this.categoryViewer = new VariantCategoryViewer(this.data.features, this.id, this.width, this.seqLength);
};

//Viewer types
var BasicCategoryViewer = function(features, containerId, width, seqLength) {
    var xScale = d3.scale.linear()
                        .domain([1, seqLength + 1])
                        .range([0, width]);

	var svg = d3.select('#' + containerId)
					.append('svg')
					.attr('width',width)
					.attr('height', 40);

	svg.selectAll('.feature')
		.data(features)
		.enter()
		.append('rect')
			.attr('x',function(d) {
				return xScale(d.begin)
			})
			.attr('y', 10)
			.attr('width', function(d) {
				return (d.end) ? xScale(d.end - d.begin) : 1;
			})
			.attr('height',10);
};

var VariantCategoryViewer = function(features, containerId, width, seqLength) {
	//TODO 
}

// Factory
var CategoryFactory = function() {
	return {
		createCategory: function(data, type, container, width, seqLength) {
			var categoryViewerType = type,
				category;

			// error if the constructor doesn't exist
			if (typeof Category[type] !== "function") {
				console.log(type + " doesn't exist");
			}

			//inherit parent constructor
			Category[type].prototype = new Category(data, container, width, seqLength);
			category = new Category[type]();

			category.buildTracks();

			return category;
		}
	}
}();

module.exports = CategoryFactory;