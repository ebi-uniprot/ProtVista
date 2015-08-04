/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var tooltipHandler = require("./TooltipFactory");
var BasicViewer = require("./BasicViewer");
var VariantViewer = require("./VariantViewer");
var FilterDialog = require("./FilterDialog");

var Track = function(typeFeatures, category) {
    var track = this;
    track.data = typeFeatures;
    track.type = typeFeatures[0].type.name;
    track.label = typeFeatures[0].type.label;
    track.category = category;
    track.id = track.type + '_track';

    track.titleContainer = category.tracksContainer.append('div').style('display', 'inline-block');

    track.trackContainer = category.tracksContainer.append('div')
        .attr('class', 'up_pftv_track');
};

Track.prototype.update = function(manual, automatic) {
    var track = this;
    track.trackViewer.update(manual, automatic);
};

var BasicTrackViewer = function(track) {
    return new BasicViewer(
        track.data, track.trackContainer, track.category.fv, track.category.fv.xScale.range()[1]
    );
};

var VariantTrackViewer = function(track) {
    return new VariantViewer(
        track.data, track.trackContainer, track.category.fv,
        track.category.fv.xScale.range()[1]
    );
};

Track.basic = function() {
    var self = this;
    this.titleContainer.attr('class', 'up_pftv_track-header')
        .attr('title', self.label)
        .text(self.category.fv.shortenDisplayName(self.label));
    this.trackViewer = new BasicTrackViewer(this);
};

Track.variant = function() {
    var self = this;
    FilterDialog.displayDialog(self.titleContainer, self.category.fv);
    this.titleContainer.append('div')
        .attr('class', 'up_pftv_track-header')
        .attr('title', self.label)
        .text(self.category.fv.shortenDisplayName(self.label));
    this.trackViewer = new VariantTrackViewer(this);
};

var TrackFactory = function() {
    return {
        createTrack: function(typeFeatures, type, category) {
            var track;

            // error if the constructor doesn't exist
            if (typeof Track[type] !== "function") {
                console.log('WARNING: Track viewer type ' + type + " doesn't exist");
            }

            //inherit parent constructor
            Track[type].prototype = new Track(typeFeatures, category, type);
            track = new Track[type]();
            return track;
        }
    };
}();

module.exports = TrackFactory;