/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var ViewerHelper = require("./ViewerHelper");
var ZoomingBehaviour = require("./ZoomingBehaviour");

var addInputColumn = function(row, id, value) {
    row.append('td').append('input')
        .attr('id', id)
        .attr('type', 'text')
        .attr('placeholder', value);
};

var populateDialog = function (fv, wrapper) {
    var div = wrapper.append('div');

    var table = div.append('table');

    var row = table.append('tr');
    row.append('td').text('Begin');
    row.append('td').text('End');
    row.append('td').text('');

    row = table.append('tr');
    addInputColumn(row, 'up_pftv_zoom_start', 'e.g., 1');
    addInputColumn(row, 'up_pftv_zoom_end', 'e.g., ' + fv.sequence.length);
    row.append('td').append('span')
    .attr('class','fv-icon-zoom-in')
    .attr('title','Zoom in to sequence view')
    .on('click', function(){
        if ( d3.select(this).classed('fv-icon-zoom-in')) {
            var begin = wrapper.select('#up_pftv_zoom_start').property('value');
            var end = wrapper.select('#up_pftv_zoom_end').property('value');
            if (begin.length === 0) {
                ZoomingBehaviour.zoomIn(fv);
            } else {
                begin = +begin;
                end = end.length === 0 ? begin : +end;
                if (!isNaN(begin) && !isNaN(end)) {
                    if ((1 <= begin) && (begin <= end) && (end <= fv.sequence.length)) {
                        if (!(fv.selectedFeature && (+fv.selectedFeature.begin === begin) &&
                            (+fv.selectedFeature.end === end))) {
                            fv.highlightRegion(begin, end);
                        }
                        ZoomingBehaviour.zoomIn(fv);
                    } else {
                        warning(table);
                    }
                } else {
                    warning(table);
                }
            }
        } else {
            ZoomingBehaviour.zoomOut(fv);
        }
    });

    row = table.append('tr');
    row.append('td').attr('colspan', '3')
        .append('div')
        .classed('up_pftv_popupDialog-warning', true)
        .text('Invalid sequence positions!')
        .style('opacity', 0);
};

var warning = function(wrapper) {
    wrapper.select('.up_pftv_popupDialog-warning').style('opacity', 1);
    clearValues(wrapper);
};

var clearValues = function(wrapper) {
    wrapper.select('#up_pftv_zoom_start')
        .property('value', '');

    wrapper.select('#up_pftv_zoom_end')
        .property('value', '');

    wrapper.select('.up_pftv_popupDialog-warning')
        .transition()
            .duration(1800)
        .style('opacity', 0);

};

var ZoomToRegionContainer = function(fv, container) {
    this.wrapper = container.append('div')
        .classed('up_pftv_nav_buttons', true);

    this.clearValues = function() {
        clearValues(this.wrapper);
    };

    this.updateValues = function(feature) {
        this.wrapper.select('#up_pftv_zoom_start')
            .property('value', feature.begin);

        this.wrapper.select('#up_pftv_zoom_end')
            .property('value', feature.end);
    };

    populateDialog(fv, this.wrapper);
};

var ZoomToRegionFactory = function() {
    return {
        createZoomZone: function(fv, container) {
            if (!fv.zoomToRegion) {
                fv.zoomToRegion = new ZoomToRegionContainer(fv, container);
            }
        }
    };
}();

module.exports = ZoomToRegionFactory;