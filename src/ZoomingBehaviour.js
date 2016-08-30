/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var ViewerHelper = require("./ViewerHelper");

var ZoomingBehaviour = function() {
    return {
        updateViewportFromChart: function(fv) {
            fv.viewport.extent(fv.xScale.domain());
            fv.globalContainer.select('.up_pftv_viewport').call(fv.viewport);
            fv.viewport.updateTrapezoid();
        },

        createZoom: function(fv) {
            var zooming = this;
            var zoom = d3.behavior.zoom()
                .x(fv.xScale)
                .on('zoom', function() {
                    if (fv.xScale.domain()[0] < 1) {
                        var tempX = zoom.translate()[0] - fv.xScale(1) + fv.xScale.range()[0];
                        zoom.translate([tempX, 0]);
                    } else if (fv.xScale.domain()[1] > fv.maxPos) {
                        var translatedX = zoom.translate()[0] - fv.xScale(fv.maxPos) + fv.xScale.range()[1];
                        zoom.translate([translatedX, 0]);
                    }
                    zooming.update(fv);
                    zooming.updateViewportFromChart(fv);
                });
            return zoom;
        },

        updateZoomFromChart: function(fv) {
            fv.zoom.x(fv.xScale);

            // remove if no zoom
            var fullDomain = fv.maxPos - 1,
                currentDomain = fv.xScale.domain()[1] - fv.xScale.domain()[0];

            var minScale = currentDomain / fullDomain,
                maxScale = minScale * Math.floor(fv.sequence.length/fv.maxZoomSize);
            fv.zoom.scaleExtent([minScale, maxScale]);
        },

        update: function(fv) {
            fv.aaViewer.update();
            fv.aaViewer2.update();
            _.each(fv.categories, function(category) {
                category.update();
            });
        },

        updateZoomButton: function(fv, currentClass, newClass, newTitle) {
            try {
                var zoomBtn = fv.globalContainer.select('.' + currentClass);
                zoomBtn.classed(currentClass, false);
                zoomBtn.classed(newClass, true);
                zoomBtn.attr('title', newTitle);
            } catch(er) {
                console.log('updateZoomButton error: ' + er);
            }
        },

        zoomIn: function(fv) {
            var zooming = this;

            var feature;
            if (fv.selectedFeature) {
                feature = fv.selectedFeature;
            } else if (fv.highlight) {
                feature = fv.highlight;
            }

            var upperDomain = feature ? Math.max(fv.maxZoomSize + 1, +feature.end - +feature.begin +11)
                : fv.maxZoomSize + 1;
            fv.xScale.domain([
                1,
                upperDomain
            ]);
            ViewerHelper.centerToHighlightedSelection(fv);
            zooming.update(fv);
            zooming.updateViewportFromChart(fv);
            zooming.updateZoomFromChart(fv);
            zooming.updateZoomButton(fv, 'fv-icon-zoom-in', 'fv-icon-zoom-out', 'Zoom out to overview');
        },

        resetZoom: function(fv) {
            var zooming = this;
            zooming.update(fv);
            zooming.updateViewportFromChart(fv);
            zooming.updateZoomFromChart(fv);
        },

        zoomOut: function(fv) {
            var zooming = this;
            fv.xScale.domain([
                1,
                fv.maxPos
            ]);
            zooming.resetZoom(fv);
            zooming.updateZoomButton(fv, 'fv-icon-zoom-out', 'fv-icon-zoom-in', 'Zoom in to sequence view');
        },

        resetZoomAndSelection: function(fv) {
            var zooming = this;
            fv.xScale.domain([
                1,
                fv.maxPos
            ]);
            ViewerHelper.deselectFeature(fv);
            ViewerHelper.resetHighlight(fv);
            fv.zoomToRegion.clearValues();
            zooming.resetZoom(fv);
            zooming.updateZoomButton(fv, 'fv-icon-zoom-out', 'fv-icon-zoom-in', 'Zoom in to sequence view');
            _.each(fv.categories, function(category) {
                category.reset();
            });
        }
    };
}();

module.exports = ZoomingBehaviour;