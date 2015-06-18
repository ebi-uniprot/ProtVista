"use strict";

var d3 = require("d3");
var _ = require("underscore");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var tooltipHandler = require("./TooltipHandler");

var height = 40;

var Track = function(typeFeatures, category) {	
	var track = this;
	track.data = typeFeatures;
	track.type = typeFeatures[0].type.name;
	track.label = typeFeatures[0].type.label;
	track.category = category;
	track.id = track.type + '_track';
	category.tracksContainer.append('span')
		.attr('class', 'fv-track-header')
		.text(track.label);
	track.trackContainer = category.tracksContainer.append('div')
		.attr('class', 'fv-track');

	track.selectFeature = function(feature, elem) {
		this.category.fv.selectedFeature = (feature === this.category.fv.selectedFeature) ? undefined : feature;
        var selectedPath = d3.select(elem).classed('up_pftv_activeFeature');
        d3.selectAll('svg path.up_pftv_activeFeature').classed('up_pftv_activeFeature', false);
        var clazz = d3.select(elem).attr('class'); //it is not active anymore
        d3.select(elem).classed('up_pftv_activeFeature', !selectedPath);
        this.category.fv.aaViewer.selectFeature(clazz);
	};
};

Track.prototype.update = function() {
	var track = this;
	track.trackViewer.update();
};

Track.basic = function() {
	this.trackViewer = new BasicTrackViewer(this);
};

var BasicTrackViewer = function(track) {
    var features = track.data,
        container = track.trackContainer,
        xScale = track.category.fv.xScale,
        zoom = track.category.fv.zoom;
	var width = xScale.range()[1];
	var layout = new NonOverlappingLayout(features,height);
	layout.calculate();	

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
										xScale(2) - xScale(1),
										layout.getFeatureHeight(),
										(d.end) ? d.end - d.begin + 1 : 1);
					})
					.attr('name', function(d) {
						return d.internalId;
					})
					.attr('transform',function(d) {
						return 'translate('+xScale(d.begin)+ ',' + layout.getYPos(d) + ')';
					})
					.attr('class',function(d) {
						return 'feature up_pftv_' + d.type.name.toLowerCase();
					})
					.classed('up_pftv_activeFeature', function(d) {					
						return d === track.category.fv.selectedFeature;
					})
					.on('click', function(d){
						tooltipHandler(d);
                        track.selectFeature(d, this);
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
		createTrack: function(typeFeatures, type, category) {
			var trackViewerType = type,
				track;

			// error if the constructor doesn't exist
			if (typeof Track[type] !== "function") {
				console.log(type + " doesn't exist");
			}

			//inherit parent constructor
			Track[type].prototype = new Track(typeFeatures, category);
			track = new Track[type]();
			return track;
		}
	};
}();

module.exports = TrackFactory;