/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var $ = require('jquery');
var Evidence = require('./Evidence');

var filters = [{
  label: 'Disease (UniProt)',
  on: false,
  properties: {
    'disease': true,
    'sourceType': [
      Evidence.variantSourceType.uniprot,
      Evidence.variantSourceType.mixed
    ]
  },
  color: '#990000'
}, {
  label: 'Predicted',
  on: false,
  properties: {
    'sourceType':Evidence.variantSourceType.lss
  },
  colorRange: ['#ff3300','#009900']
}, {
  label: 'Non-disease (UniProt)',
  on: false,
  properties: {
    'disease':false,
    'sourceType': [
      Evidence.variantSourceType.uniprot,
      Evidence.variantSourceType.mixed
    ]
  },
  color: '#99cc00'
}, {
  label: 'Init, stop loss or gain',
  on: false,
  properties: {
    'alternativeSequence':'*'
  },
  color: '#0033cc'
}];

var VariantFilterDialog = function(container, variantViewer) {
  var variantFilterDialog = this;
  variantFilterDialog.variantViewer = variantViewer;

  var drawFilter = function(filter, li) {
    var anchor = li.append('a')
      .on('click', function() {
        var inputElem = d3.select(this);
        filter.on = !filter.on;
        li.select('.up_pftv_legend').attr('style', getBackground(filter));
        var filteredData = filterData(variantFilterDialog.variantViewer.features);
        variantViewer.updateData(filteredData);
      });
      anchor.append('div')
        .attr('class', 'up_pftv_legend')
        .attr('style',getBackground(filter));
      anchor.append('span')
        .text(filter.label);
  };

  container.append('h4').text('Filter consequence');
  var ul = container.append('ul')
    .attr('class', 'up_pftv_dialog-container');

  _.each(filters, function(filter) {
    var li = ul.append('li');
    drawFilter(filter, li);
  });

  return variantFilterDialog;
};

var getBackground = function(filter) {
  if(filter.colorRange) {
    return 'background:' + (filter.on ? '#ffffff' : 'linear-gradient(' + filter.colorRange + ');');
  } else {
    return 'background-color:' + (filter.on ? '#ffffff' : filter.color);
  }
};

var filterData = function(data) {
  var activeFilters = _.filter(filters, 'on');
  var newData = [];
  _.each(data, function(feature) {
    var filtered = _.filter(feature.variants, function(variant) {
      return !_.some(activeFilters, function(filter){
        var discard = _.every(_.keys(filter.properties), function(prop){
          if(filter.properties[prop] instanceof Array) {
            return _.some(filter.properties[prop], function(orProp){
              return variant[prop] === orProp;
            });
          } else {
            return variant[prop] === filter.properties[prop];
          }
        });
        return discard;
      });
    });
    var featureCopy = $.extend(true, {}, feature);
    featureCopy.variants = filtered;
    newData.push(featureCopy);
  });
  return newData;
};

var displayFeature = function(feature) {
  var display = false;
  _.each(filters, function(filter) {
    var ftValueProp = feature[filter.property] === undefined ? false : feature[filter.property];
    var parentDisplay = _.contains(filter.value, ftValueProp);
    display = display || parentDisplay;
  });
  return display;
};

module.exports = VariantFilterDialog;
