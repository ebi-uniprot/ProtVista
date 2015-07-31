/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");

var FilterDialog = function() {
    var populateDialog = function(self) {
        self.dialog.append('span')
            .text('x')
            .attr('class','up_pftv_tooltip-close')
            .on('click',function(){
                self.dialog.transition(20)
                    .style('opacity',0)
                    .style('display','none');
            });

        var divManual = self.dialog.append('div');
        divManual.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'up_pftv_dialog-checkReviewed')
            .property('checked', true)
            .on('click', function() {
                var checkReviewed = d3.select('#up_pftv_dialog-checkReviewed').property('checked');
                var checkOther = d3.select('#up_pftv_dialog-checkOther').property('checked');
                self.fv.applyFilter(checkReviewed, checkOther);
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
                self.fv.applyFilter(checkReviewed, checkOther);
            });
        divOther.append('label')
            .text('Large scale studies');
    };

    var showDialog = function(self) {
        self.dialog.style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY + 'px')
            .transition(200)
            .style('opacity',1)
            .style('display','block');
    };

    var createDialogBox = function(self) {
        self.dialog = self.container.select('.up_pftv_dialog-container');
        if (!self.dialog.node()) {
            self.dialog = self.container.append('div')
                .attr('class','up_pftv_dialog-container');
            populateDialog(self);
            showDialog(self);
        } else {
            showDialog(self);
        }
        return self.dialog;
    };

    return {
        displayDialog: function(container, fv) {
            this.container = container;
            this.fv = fv;
            this.dialog = createDialogBox(this);
            return this.dialog;
        }
    }
}();

module.exports = FilterDialog;