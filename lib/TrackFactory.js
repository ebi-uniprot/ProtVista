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
}

Track.prototype.update = function() {
	var track = this;
	track.trackViewer.update();
}


Track.basic = function() {
	this.trackViewer = new BasicTrackViewer(this.data, this.trackContainer, this.xScale)
}

var BasicTrackViewer = function(features, container, xScale) {
	var width = xScale.range()[1];

	var featurePlot = function(){
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

	this.update =function(){
		dataSeries.call(series);
	}

	return this;
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
			return track;
		}
	}
}();

module.exports = TrackFactory;