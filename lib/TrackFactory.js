"use strict";

var d3 = require("d3");
var _ = require("underscore");

var Track = function(typeFeatures, container, xScale) {
	var track = this;
	track.data = typeFeatures;
	track.type = typeFeatures[0].type.name;
	track.label = typeFeatures[0].type.label;
	track.xScale = xScale;
	track.id = track.type + '_track';
	container.append('span')
		.attr('class', 'fv-track-header')
		.text(track.label);
	track.trackContainer = container.append('div')
		.attr('class', 'fv-track');
	track.update = function() {
		track.trackViewer.update();
	}
}

Track.basic = function() {
	this.trackViewer = new BasicTrackViewer(this.data, this.trackContainer, this.xScale)
}

var BasicTrackViewer = function(features, container, xScale) {
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

	this.update =function(){

	}
}

var TrackFactory = function() {
	return {
		createTrack: function(typeFeatures, type, container, xScale) {
			var trackViewerType = type,
				track;

			// error if the constructor doesn't exist
			if (typeof Track[type] !== "function") {
				console.log(type + " doesn't exist");
			}

			//inherit parent constructor
			Track[type].prototype = new Track(typeFeatures, container, xScale);
			track = new Track[type]();
		}
	}
}();

module.exports = TrackFactory;