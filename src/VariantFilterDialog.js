/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var $ = require('jquery');
var Evidence = require('./Evidence');

var filters = [
    {
        label: 'Filter consequence',
        cases: [
            {
                label: 'Disease',
                on: true,
                properties: {
                    'association': function(associations){
                      return _.some(associations, function(association){
                        return association.disease === true;
                      });
                    }
                },
                color: '#990000'
            }, {
                label: ['Predicted deleterious', 'Predicted benign'],
                on: true,
                properties: {
                    'alternativeSequence': /[^*]/,
                    'sourceType':Evidence.variantSourceType.lss
                },
                colorRange: ['#ff3300','#009900']
            }, {
                label: 'Non-disease',
                on: true,
                properties: {
                    'association': function(associations){
                        return _.every(associations, function(association){
                            return association.disease !== true;
                        }) || (!associations);
                    },
                    'sourceType': [
                        Evidence.variantSourceType.uniprot,
                        Evidence.variantSourceType.mixed
                    ]
                },
                color: '#99cc00'
            }, {
                label: 'Init, stop loss or gain',
                on: true,
                properties: {
                    'alternativeSequence': '*'
                },
                color: '#0033cc'
            }
        ]
    },
    {
        label: 'Filter data source',
        cases: [
            {
                label: 'UniProt reviewed',
                on: true,
                properties: {
                    'sourceType': [
                        Evidence.variantSourceType.uniprot,
                        Evidence.variantSourceType.mixed
                    ]
                },
                color: 'grey'
            }, {
                label: 'Large scale studies',
                on: true,
                properties: {
                    'sourceType': [
                        Evidence.variantSourceType.lss,
                        Evidence.variantSourceType.mixed
                    ]
                },
                color: 'grey'
            }
        ]
    }
];

var VariantFilterDialog = function(container, variantViewer) {
    var variantFilterDialog = this;
    variantFilterDialog.variantViewer = variantViewer;

    var buttons = container.append('div')
        .attr('class','up_pftv_buttons');

    buttons.append('span')
        .style('visibility', 'hidden')
        .attr('class','fv-icon-ccw')
        .attr('title','Reset all filters')
        .on('click', function(){
            variantFilterDialog.reset();
            variantFilterDialog.variantViewer.updateData(variantFilterDialog.variantViewer.features);
        });

    _.each(filters, function(filterSet, index) {
        var filterTitle = container.append('h4').text(filterSet.label);
        if (index === 0) {
            filterTitle.classed('up_pftv_keepWithPrevious', true);
        }
        var ul = container.append('ul')
            .attr('class', 'up_pftv_dialog-container');

        var li = ul
          .selectAll('li')
          .data(filterSet.cases)
          .enter()
          .append('li');

        var anchor = li.append('a')
            .on('click', function(filter) {
                if(filter.on === true) {
                    clearOthers(filterSet, filter);
                    container.select('.fv-icon-ccw')
                        .style('visibility', 'visible');
                } else {
                    filter.on = true;
                    updateResetButton(container);
                }
                update();
                var filteredData = filterData(variantFilterDialog.variantViewer.features);
                variantFilterDialog.variantViewer.updateData(filteredData);
            });

        anchor.append('div')
            .attr('class', function(filter) {
                if (filter.label instanceof Array) {
                    return 'up_pftv_legend up_pftv_legend_double';
                } else {
                    return 'up_pftv_legend';
                }
            })
            .attr('style',function(filter){
              return getBackground(filter);
            });

        anchor.append('span')
            .attr('class', 'up_pftv_legend_text')
            .html(function(filter){
              if (filter.label instanceof Array) {
                   return filter.label.join('<br/>');
              } else {
                  return filter.label;
              }
            });

        var update = function(){
          anchor.select('div').attr('style',function(filter){
              return getBackground(filter);
          });
        };
    });

    variantFilterDialog.reset = function() {
        _.each(filters, function(filterset) {
            _.each(filterset.cases, function(filterCase) {
                filterCase.on = true;
            });
        });
        container.select('.fv-icon-ccw')
            .style('visibility', 'hidden');
        container.selectAll('.up_pftv_legend')
            .attr('style',function(filter){
                return getBackground(filter);
            });
    };

    return variantFilterDialog;
};

var updateResetButton = function(container) {
    var allOn = _.every(filters, function(filterset) {
        return _.every(filterset.cases, function(filterCase) {
            return filterCase.on === true;
        });
    });
    if (allOn === true) {
        container.select('.fv-icon-ccw')
            .style('visibility', 'hidden');
    }
};

var getBackground = function(filter) {
    if(filter.colorRange) {
        return 'background:' + (filter.on ? 'linear-gradient(' + filter.colorRange + ');' : '#ffffff');
    } else {
        return 'background-color:' + (filter.on ? filter.color : '#ffffff');
    }
};

var clearOthers = function(filterSet, filterCase) {
    _.each(filterSet.cases, function(e) {
        e.on = filterCase.label === e.label ? true : false;
    });
};

var filterData = function(data) {
    var newData = [];
    _.each(data, function(feature) {
        var filtered = _.filter(feature.variants, function(variant) {
            var returnValue = _.every(filters, function(filterSet) {
                var activeFilters = _.filter(filterSet.cases, 'on');
                var anyOfSet = _.some(activeFilters, function(filter){
                    var allOfProps = _.every(_.keys(filter.properties), function(prop){
                        if(filter.properties[prop] instanceof Array) {
                            return _.some(filter.properties[prop], function(orProp){
                                return variant[prop] === orProp;
                            });
                        } else if (typeof filter.properties[prop] === 'string') {
                            return filter.properties[prop] === variant[prop];
                        } else if (filter.properties[prop] instanceof RegExp) {
                            return filter.properties[prop].test(variant[prop]);
                        } else if (filter.properties[prop] instanceof Function) {
                            return filter.properties[prop](variant[prop]);
                        } else {
                            return variant[prop] === filter.properties[prop];
                        }
                    });
                    return allOfProps;
                });
                return anyOfSet;
            });
            return returnValue;
        });
        var featureCopy = $.extend(true, {}, feature);
        featureCopy.variants = filtered;
        newData.push(featureCopy);
    });
    return newData;
};

module.exports = VariantFilterDialog;
