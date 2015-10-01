/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");

var allFilters = [
    {
        id: 'up_pftv_dialog-checkReviewed',
        label: 'UniProt reviewed',
        on: true,
        property: 'sp',
        value: true,
        subfilters: [
            {
                id: 'up_pftv_dialog-checkDisease',
                label: 'Disease associated',
                clazz: 'up_pftv_indentedCheck',
                on: true,
                property: 'disease',
                value: true
            },
            {
                id: 'up_pftv_dialog-checkNotDisease',
                label: 'Not disease associated',
                clazz: 'up_pftv_indentedCheck',
                on: true,
                property: 'disease',
                value: false
            }
        ]
    },
    {
        id: 'up_pftv_dialog-checkOther',
        label: 'Large scale studies',
        on: true,
        property: 'lss',
        value: true
    }
];

var onClick = function(fv) {
    _.each(allFilters, function(filter) {
        var showFilter = false;
        if (filter.subfilters) {
            _.each(filter.subfilters, function(subfilter) {
                var showSubfilter = d3.select('#' + subfilter.id).property('checked');
                subfilter.on = showSubfilter;
                showFilter = showFilter || showSubfilter;
            });
            filter.on = showFilter;
            d3.select('#' + filter.id).property('checked', showFilter);
        } else {
            filter.on = d3.select('#' + filter.id).property('checked');
        }
    });
    fv.applyFilter();
};

var createCheckbox = function(container, filter, fv) {
    var div = container.append('div');
    if (filter.clazz) {
        div.attr('class', filter.clazz);
    }
    div.append('input')
        .attr('type', 'checkbox')
        .attr('id', filter.id)
        .property('checked', true)
        .on('click', function() {
            var inputElem = d3.select(this);
            d3.select(this.parentNode).selectAll('div')
                .selectAll('input')
                .property('checked', inputElem.property('checked'));
            onClick(fv);
        });
    div.append('label')
        .text(filter.label);
    return div;
};

var populateDialog = function(self, fv) {
    self.dialog.append('div').text('Filter');
    _.each(allFilters, function(filter) {
        var container = createCheckbox(self.dialog, filter, fv);
        if (filter.subfilters) {
            _.each(filter.subfilters, function(subfilter) {
                createCheckbox(container, subfilter, fv);
            });
        }
    });
};

var VariantFilterDialog = function() {
    return {
        displayDialog: function(container, fv) {
            this.dialog = container.append('div')
                .attr('class','up_pftv_dialog-container');
            populateDialog(this, fv);
            return this.dialog;
        },
        displayFeature: function(feature) {
            var display = false;

            _.each(allFilters, function(filter) {
                if (filter.on) {
                    var ftValueProp = feature[filter.property] === undefined ? false : feature[filter.property];
                    var parentDisplay = ftValueProp === filter.value;
                    if (parentDisplay && filter.subfilters) {
                        var subDisplay = false;
                        _.each(filter.subfilters, function(subfilter) {
                            if (subfilter.on) {
                                var ftValuePropSub = feature[subfilter.property] === undefined ? false : feature[subfilter.property];
                                subDisplay = subDisplay || (ftValuePropSub === subfilter.value);
                            }
                        });
                        display = display || (parentDisplay && subDisplay);
                    } else {
                        display = display || (ftValueProp === filter.value);
                    }
                }
            });

            return display;
        }
    };
}();

module.exports = VariantFilterDialog;