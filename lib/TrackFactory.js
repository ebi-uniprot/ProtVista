"use strict";

var d3 = require("d3");
var _ = require("underscore");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var tooltipHandler = require("./TooltipFactory");
var BasicViewer = require("./BasicViewer");

var height = 40;

var Track = function(typeFeatures, category) {	
	var track = this;
	track.data = typeFeatures;
	track.type = typeFeatures[0].type.name;
	track.label = typeFeatures[0].type.label;
	track.category = category;
	track.id = track.type + '_track';
	category.tracksContainer.append('span')
		.attr('class', 'up_pftv_track-header')
		.text(track.label);
	track.trackContainer = category.tracksContainer.append('div')
		.attr('class', 'up_pftv_track');
};

Track.prototype.update = function() {
	var track = this;
	track.trackViewer.update();
};

Track.basic = function() {
	this.trackViewer = new BasicTrackViewer(this);
};

var BasicTrackViewer = function(track) {
    return new BasicViewer(
        track.data, track.trackContainer, track.category.fv,
        track.category.fv.xScale.range()[1], height, 'drawAreaTrackClip'
    );
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