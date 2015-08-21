/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");

var FilterDialog = function() {
    var onClick = function(fv) {
        var disease = d3.select('#up_pftv_dialog-checkDisease').property('checked');
        var notDisease = d3.select('#up_pftv_dialog-checkNotDisease').property('checked');
        var isManual = !disease && !notDisease ? false
            : disease || notDisease ? true : d3.select('#up_pftv_dialog-checkReviewed').property('checked');
        d3.select('#up_pftv_dialog-checkReviewed').property('checked', isManual);
        fv.applyFilter({
            isManual: isManual
            , isAutomatic: d3.select('#up_pftv_dialog-checkOther').property('checked')
            , disease: disease
            , notDisease: notDisease
        });
    };
    var populateDialog = function(self, fv) {
        var divManual = self.dialog.append('div');
        divManual.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'up_pftv_dialog-checkReviewed')
            .property('checked', true)
            .on('click', function() {
                var checked = d3.select(this).property('checked');
                if (checked) {
                    d3.select('#up_pftv_dialog-checkDisease').property('checked', true);
                    d3.select('#up_pftv_dialog-checkNotDisease').property('checked', true);
                } else {
                    d3.select('#up_pftv_dialog-checkDisease').property('checked', false);
                    d3.select('#up_pftv_dialog-checkNotDisease').property('checked', false);
                }
                onClick(fv);
            });
        divManual.append('label')
            .text('Manually reviewed');

        var divDisease = self.dialog.append('div').classed('up_pftv_indentedCheck', true);
        divDisease.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'up_pftv_dialog-checkDisease')
            .property('checked', true)
            .on('click', function() {
                onClick(fv);
            });
        divDisease.append('label')
            .text('Disease associated');

        var divNotDisease = self.dialog.append('div').classed('up_pftv_indentedCheck', true);
        divNotDisease.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'up_pftv_dialog-checkNotDisease')
            .property('checked', true)
            .on('click', function() {
                onClick(fv);
            });
        divNotDisease.append('label')
            .text('Not disease associated');

        var divAuto = self.dialog.append('div');
        divAuto.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'up_pftv_dialog-checkOther')
            .property('checked', true)
            .on('click', function() {
                onClick(fv);
            });
        divAuto.append('label')
            .text('Large scale studies');
    };

    return {
        displayDialog: function(container, fv) {
            this.dialog = container.append('div')
                .attr('class','up_pftv_dialog-container');
            populateDialog(this, fv);
            return this.dialog;
        }
    };
}();

module.exports = FilterDialog;