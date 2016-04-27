/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var ViewerHelper = require("./ViewerHelper");
var Constants = require("./Constants");

var populateDialog = function (fv, wrapper) {
    var index = 0;
    _.each(Constants.getCategoryNamesInOrder(), function(category) {
        var catKey = _.keys(category)[0];
        var dataCategory = _.find(fv.data, function(catArray) {
            return catArray[0] === catKey;
        });
        if (dataCategory[1].length !== 0) {
            console.log(dataCategory);
            var div = wrapper.append('div');
            div.append('input')
                .attr('type', 'checkbox')
                .property('checked', true)
                .attr('index', index)
                .on('click', function() {
                    var elem = d3.select(this);
                    var myIndex = +elem.attr('index');
                    var allCategory = d3.selectAll('.up_pftv_category');
                    if (elem.property('checked')) {
                        d3.select(allCategory[0][myIndex]).style('display', 'block');
                        wrapper.selectAll('input:disabled').attr('disabled', null);
                    } else {
                        d3.select(allCategory[0][myIndex]).style('display', 'none');
                        var displayed = wrapper.selectAll("input:checked");
                        if (displayed[0].length === 1) {
                            displayed.attr('disabled', true);
                        }
                    }
                });
            div.append('label')
                .text(category[catKey]);
            index++;
        }
    });
};

var createDialog = function (fv, container) {
    var wrapper = container.append('div')
        .attr('class','up_pftv_popupDialog-container')
        .style('left', (d3.mouse(container.node())[0] + 10) + 'px')
        .style('top', (d3.mouse(container.node())[1] + 5) + 'px')
        .on('mousedown', function() {
            fv.overCatFilterDialog = true;
        })
        .on('mouseup', function() {
            fv.overCatFilterDialog = false;
        });
    wrapper.append('span')
        .text('x')
        .attr('class','up_pftv_tooltip-close')
        .on('click',function(){
            fv.overCatFilterDialog = false;
            wrapper.transition(20)
                .style('opacity',0)
                .style('display','none');
        });
    populateDialog(fv, wrapper);
    return wrapper;
};

var CategoryFilterDialog = function() {
    var dialog;
    return {
        displayDialog: function(fv, container) {
            if (!dialog) {
                dialog = createDialog(fv, container);
            }
            dialog.transition(20)
                .style('opacity',1)
                .style('display','block');
        },
        closeDialog: function() {
            if (dialog) {
                dialog.transition(20)
                    .style('opacity', 0)
                    .style('display', 'none');
            }
        }
    };
}();

module.exports = CategoryFilterDialog;