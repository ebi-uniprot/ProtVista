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
        var catKey = category.name;
        var dataCategory = _.find(fv.data, function(catArray) {
            return catArray[0] === catKey;
        });
        if (dataCategory && (dataCategory[1].length !== 0)) {
            var div = wrapper.append('div');
            div.append('input')
                .attr('type', 'checkbox')
                .property('checked', true)
                .attr('index', index)
                .on('click', function() {
                    var elem = d3.select(this);
                    var myIndex = +elem.attr('index');
                    var allCategory = fv.globalContainer.selectAll('.up_pftv_category');
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
                .text(category.label);
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
    return {
        displayDialog: function(fv, container) {
            if (!fv.categoryFilterDialog) {
                fv.categoryFilterDialog = createDialog(fv, container);
            }
            fv.categoryFilterDialog.transition(20)
                .style('opacity',1)
                .style('display','block');
        },
        closeDialog: function(fv) {
            if (fv.categoryFilterDialog) {
                fv.categoryFilterDialog.transition(20)
                    .style('opacity', 0)
                    .style('display', 'none');
            }
        }
    };
}();

module.exports = CategoryFilterDialog;