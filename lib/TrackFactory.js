"use strict";

var d3 = require("d3");
var _ = require("underscore");
var FeatureFactory = require("./FeatureFactory");

var height = 40;

var Track = function(typeFeatures, container, xScale, zoom) {
	var track = this;
	track.data = typeFeatures;
	track.type = typeFeatures[0].type.name;
	track.label = typeFeatures[0].type.label;
	track.xScale = xScale;
	track.zoom = zoom;
	track.id = track.type + '_track';
	container.append('span')
		.attr('class', 'fv-track-header')
		.text(track.label);
	track.trackContainer = container.append('div')
		.attr('class', 'fv-track');
};

Track.prototype.update = function() {
	var track = this;
	track.trackViewer.update();
};


Track.basic = function() {
	this.trackViewer = new BasicTrackViewer(this.data, this.trackContainer, this.xScale, this.zoom);
};

var BasicTrackViewer = function(features, container, xScale, zoom) {
	var width = xScale.range()[1];

	var featurePlot = function() {
		var series,
			shapes;

		var featurePlot = function(selection) {

			selection.each(function(data) {
				series = d3.select(this);
				shapes = series.selectAll('.feature')
					.data(data);

				shapes.enter().append('path');

				shapes
					.attr('d', function(d) {
						return FeatureFactory.getFeature(
										d.type.name, 
										(d.end) ? xScale(d.end) - xScale(d.begin) : xScale(1),
										10,
										(d.end) ? d.end - d.begin + 1 : 1);
					})
					.attr('transform',function(d) {
						return 'translate('+xScale(d.begin)+ ',' + ((height/2)-5) + ')';
					})
					.attr('class',function(d) {
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
						.attr('clip-path','url(#drawAreaTrackClip)');
	var dataSeries = drawArea
		.datum(features)
		.call(series);

	this.update =function() {
		dataSeries.call(series);
	};

	return this;
};

var TrackFactory = function() {
	return {
		createTrack: function(typeFeatures, type, container, xScale, zoom) {
			var trackViewerType = type,
				track;

			// error if the constructor doesn't exist
			if (typeof Track[type] !== "function") {
				console.log(type + " doesn't exist");
			}

			//inherit parent constructor
			Track[type].prototype = new Track(typeFeatures, container, xScale, zoom);
			track = new Track[type]();
			return track;
		}
	};
}();

module.exports = TrackFactory;