/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var BasicViewer = require("./BasicViewer");
var VariantViewer = require("./VariantViewer");
var VariantFilterDialog = require("./VariantFilterDialog");
var LegendDialog = require("./VariantLegendDialog");
var Constants = require("./Constants");

var Track = function(typeFeatures, category) {
    var track = this;
    track.data = typeFeatures;
    track.type = typeFeatures[0].type;
    track.label = typeFeatures[0].type;
    track.category = category;
    track.id = track.type + '_track';

    track.titleContainer = category.tracksContainer.append('div').style('display', 'inline-block');

    track.trackContainer = category.tracksContainer.append('div')
        .attr('class', 'up_pftv_track');
};

Track.prototype.update = function() {
    var track = this;
    track.trackViewer.update();
};

var BasicTrackViewer = function(track) {
    return new BasicViewer(
        track.category.data.label, track.data, track.trackContainer, track.category.fv
    );
};

var VariantTrackViewer = function(track) {
    return new VariantViewer(
        track.category.data.label, track.data, track.trackContainer, track.category.fv, track.variantHeight
    );
};

Track.basic = function() {
    var self = this;
    var trackInfo = Constants.getTrackInfo(self.type.toLowerCase());
    this.titleContainer.attr('class', 'up_pftv_track-header')
        .attr('title', trackInfo.label.toUpperCase() + '\n' +trackInfo.tooltip)
        .text(trackInfo.label);
    this.trackViewer = new BasicTrackViewer(this);
};

Track.variant = function() {
    var self = this;
    var trackInfo = Constants.getTrackInfo('variant');
    this.variantHeight = 430;
    this.titleContainer.classed('up_pftv_track-header-container', true);
    this.titleContainer.style('height', this.variantHeight);
    this.titleContainer.append('div')
        .attr('class', 'up_pftv_track-header')
        .attr('title', trackInfo.label + '\n' + trackInfo.tooltip)
        .text(trackInfo.label);
    VariantFilterDialog.displayDialog(self.titleContainer, self.category.fv);
    LegendDialog.createLegendDialog(self.titleContainer);
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
