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
                    // 'alternativeSequence': /[^*]/,
                    'sourceType':Evidence.variantSourceType.lss
                },
                colorRange: ['#ff3300','#009900']
            }, {
                label: 'Non-disease',
                on: true,
                properties: {
                  'association': function(associations){
                    return _.some(associations, function(association){
                      return association.disease === true;
                    });
                  }
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
var filterCases = _.flatten(_.pluck(filters, 'cases'));

var VariantFilterDialog = function(container, variantViewer) {
    var variantFilterDialog = this;
    variantFilterDialog.variantViewer = variantViewer;

    _.each(filters, function(filter) {
        container.append('h4').text(filter.label);
        var ul = container.append('ul')
            .attr('class', 'up_pftv_dialog-container');

        var li = ul
          .selectAll('li')
          .data(filter.cases)
          .enter()
          .append('li');

        var anchor = li.append('a')
            .on('click', function(filter) {
                if(allOn()) {
                  clearFilters();
                }
                filter.on = !filter.on;
                update();
                var filteredData = filterData(variantFilterDialog.variantViewer.features);
                variantFilterDialog.variantViewer.updateData(filteredData);
            })

        anchor.append('div')
            .attr('class', function(filter) {
                if (filter.label instanceof Array) {
                    return 'up_pftv_legend up_pftv_legend_double';
                } else {
                    return 'up_pftv_legend';
                }
            })
            .attr('style',function(filter){
              return getBackground(filter)
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
              return getBackground(filter)
          });
        }

        // li.exit().remove();
    });

    return variantFilterDialog;
};

var getBackground = function(filter) {
    if(filter.colorRange) {
        return 'background:' + (filter.on ? 'linear-gradient(' + filter.colorRange + ');' : '#ffffff');
    } else {
        return 'background-color:' + (filter.on ? filter.color : '#ffffff');
    }
};

var redrawBackgrounds = function(ul) {
  _.each(ul.childNodes, function(li){
    console.log(li);
  });
}

var allOn = function() {
  return _.filter(filterCases, 'on').length === filterCases.length;
}

var clearFilters = function() {
  _.each(filters, function(d) {
    _.each(d.cases, function(e) {
      e.on = false;
    })
  })
}

var filterData = function(data) {
    var activeFilters = _.filter(filterCases, 'on');
    var newData = [];
    _.each(data, function(feature) {
        var filtered = _.filter(feature.variants, function(variant) {
            var returnValue = _.some(activeFilters, function(filter){
                return _.some(_.keys(filter.properties), function(prop){
                    if(filter.properties[prop] instanceof Array) {
                        return _.some(filter.properties[prop], function(orProp){
                            return variant[prop] === orProp;
                        });
                    } else if (typeof filter.properties[prop] === 'string') {
                        return filter.properties[prop] === variant[prop];
                    } else if (filter.properties[prop] instanceof RegExp) {
                        return filter.properties[prop].test(variant[prop]);
                    } else if (filter.properties[prop] instanceof Function) {
                      if(variant[prop]){
                        return filter.properties[prop](variant[prop]);
                      }
                    } else {
                        return variant[prop] === filter.properties[prop];
                    }
                });
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
