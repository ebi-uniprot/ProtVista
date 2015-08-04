/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");

var FilterDialog = function() {
    var populateDialog = function(self, fv) {
        var divManual = self.dialog.append('div');
        divManual.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'up_pftv_dialog-checkReviewed')
            .property('checked', true)
            .on('click', function() {
                var checkReviewed = d3.select('#up_pftv_dialog-checkReviewed').property('checked');
                var checkOther = d3.select('#up_pftv_dialog-checkOther').property('checked');
                fv.applyFilter(checkReviewed, checkOther);
            });
        divManual.append('label')
            .text('Manually reviewed');

        var divOther = self.dialog.append('div');
        divOther.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'up_pftv_dialog-checkOther')
            .property('checked', true)
            .on('click', function() {
                var checkReviewed = d3.select('#up_pftv_dialog-checkReviewed').property('checked');
                var checkOther = d3.select('#up_pftv_dialog-checkOther').property('checked');
                fv.applyFilter(checkReviewed, checkOther);
            });
        divOther.append('label')
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