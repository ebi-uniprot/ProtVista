/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var ViewerHelper = require("./ViewerHelper");

var HighlightRegionDialog;

var addInputRow = function(table, text, id, value) {
    var row = table.append('tr');
    row.append('td').append('label').text(text);
    row.append('td').append('input')
        .attr('id', id)
        .attr('type', 'text')
        .attr('placeholder', value);
};

var populateDialog = function (fv, wrapper) {
    var warning = 'Invalid sequence positions.';
    var div = wrapper.append('div').style('display', 'table');

    var table = div.append('table');

    addInputRow(table, 'Begin: ', 'up_pftv_highlight_start', 'e.g., 1');
    addInputRow(table, 'End: ', 'up_pftv_highlight_end', 'e.g., ' + fv.sequence.length);

    var row = table.append('tr');
    row.append('td').attr('colspan', '2').classed('up_pftv_popupDialog-warning', true);

    row = table.append('tr');
    row.append('td').attr('colspan', '2').style('text-align', 'right')
        .append('button').text('Apply')
        .on('click', function() {
            var begin = wrapper.select('#up_pftv_highlight_start').property('value');
            var end = wrapper.select('#up_pftv_highlight_end').property('value');
            if (begin.length === 0) {
                table.select('.up_pftv_popupDialog-warning').text(warning);
            } else {
                begin = +begin;
                end = end.length === 0 ? begin : +end;
                if (!isNaN(begin) && !isNaN(end)) {
                    if ((begin < 1) || (end > fv.sequence.length)) {
                        table.select('.up_pftv_popupDialog-warning').text(warning);
                    } else if (begin <= end) {
                        fv.highlightRegion(begin, end);
                        HighlightRegionDialog.closeDialog(fv);
                    } else {
                        table.select('.up_pftv_popupDialog-warning').text(warning);
                    }
                } else {
                    table.select('.up_pftv_popupDialog-warning').text(warning);
                }
            }
        });
};

var clearValues = function(wrapper) {
    wrapper.select('#up_pftv_highlight_start')
        .property('value', '');

    wrapper.select('#up_pftv_highlight_end')
        .property('value', '');

    wrapper.select('.up_pftv_popupDialog-warning').text('');
};

var createDialog = function (fv, container) {
    var wrapper = container.append('div')
        .attr('class','up_pftv_popupDialog-container')
        .style('left', (d3.mouse(container.node())[0] + 10) + 'px')
        .style('top', (d3.mouse(container.node())[1] + 5) + 'px')
        .on('mousedown', function() {
            fv.overHighlightRegionDialog = true;
        })
        .on('mouseup', function() {
            fv.overHighlightRegionDialog = false;
        });
    wrapper.append('span')
        .text('x')
        .attr('class','up_pftv_tooltip-close')
        .on('click',function(){
            fv.overHighlightRegionDialog = false;
            wrapper.transition(20)
                .style('opacity',0)
                .style('display','none');
        });
    populateDialog(fv, wrapper);
    clearValues(wrapper);
    return wrapper;
};

HighlightRegionDialog = function() {
    return {
        displayDialog: function(fv, container) {
            if (!fv.highlightRegionDialog) {
                fv.highlightRegionDialog = createDialog(fv, container);
            } else {
                clearValues(fv.highlightRegionDialog);
            }
            fv.highlightRegionDialog.transition(20)
                .style('opacity',1)
                .style('display','block');
        },
        closeDialog: function(fv) {
            if (fv.highlightRegionDialog) {
                fv.highlightRegionDialog.transition(20)
                    .style('opacity', 0)
                    .style('display', 'none');
            }
        }
    };
}();

module.exports = HighlightRegionDialog;