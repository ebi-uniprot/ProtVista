"use strict";

var $ = require("jquery");
var d3 = require("d3");
var _ = require("underscore");

var Track = function(typeFeatures, container, width, seqLength) {
	this.data = typeFeatures;
	this.type = typeFeatures[0].type.name;
	this.label = typeFeatures[0].type.label;
	this.id = this.type + '_track';
	var trackContainer = $('<div class="fv-track" id="' + this.id + '"></div>');
	trackContainer.append('<span class="fv-track-header">' + this.label + '</span>');
	container.append(trackContainer);
}

Track.basic = function() {
	this.trackViewer = new BasicTrackViewer(this.data, this.id, this.width, this.seqLength)
}

var BasicTrackViewer = function(features, containerId, width, seqLength) {
	var xScale = d3.scale.linear()
		.domain([1, seqLength + 1])
		.range([0, width]);

	var svg = d3.select('#' + containerId)
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
}

var TrackFactory = function() {
	return {
		createTrack: function(typeFeatures, type, container, width, seqLength) {
			var trackViewerType = type,
				track;

			// error if the constructor doesn't exist
			if (typeof Track[type] !== "function") {
				console.log(type + " doesn't exist");
			}

			//inherit parent constructor
			Track[type].prototype = new Track(typeFeatures, container, width, seqLength);
			track = new Track[type]();
		}
	}
}();

module.exports = TrackFactory;