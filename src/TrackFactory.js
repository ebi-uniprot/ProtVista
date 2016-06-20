/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var BasicViewer = require("./BasicViewer");
var VariantViewer = require("./VariantViewer");
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
        track.category.name, track.data, track.trackContainer, track.category.fv
    );
};

var VariantTrackViewer = function(track) {
    return new VariantViewer(
        track.category.name, track.data, track.trackContainer, track.category.fv, track.variantHeight
        , track.titleContainer
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
    this.variantHeight = 430;
    this.titleContainer.attr('class', 'up_pftv_track-header')
        .attr('style','height:' + this.variantHeight + 'px');
    this.trackViewer = new VariantTrackViewer(this);

    this.reset = function() {
        this.trackViewer.reset();
    };
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
