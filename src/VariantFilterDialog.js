/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var $ = require('jquery');
var Evidence = require('./Evidence');

// deleteriousColor: '#ff3300',
// getPredictionColor: d3.scale.linear()
//     .domain([0,1])
//     .range(['#ff3300','#009900']),

var filters = [{
  label: 'Disease associated',
  on: true,
  property: 'disease',
  color: '#990000',
  value: true
}, {
  label: 'Predicted',
  on: true,
  property: 'sourceType',
  value: Evidence.variantSourceType.lss
}, {
  label: 'Not disease associated',
  on: true,
  property: 'disease',
  color: '#99cc00',
  value: false
}, {
  label: 'Init, stop',
  on: true,
  property: '',
  color: '#0033cc',
  value: ''
}];

var VariantFilterDialog = function(container, variantViewer) {
  var variantFilterDialog = this;
  variantFilterDialog.variantViewer = variantViewer;

  var drawFilter = function(filter, li) {
    var anchor = li.append('a')
      .on('click', function() {
        var inputElem = d3.select(this);
        filter.on = !filter.on;
        var filteredData = filterData(variantFilterDialog.variantViewer.features, filter);
        variantViewer.updateData(filteredData);
      });
      anchor.append('div')
        .attr('class', 'up_pftv_legend')
        .attr('style','background-color:' + filter.color);
      anchor.append('span')
        .text(filter.label);
  };

  container.append('div').text('Filter consequence');
  var ul = container.append('ul')
    .attr('class', 'up_pftv_dialog-container');
  variantFilterDialog.dialog
  _.each(filters, function(filter) {
    var li = ul.append('li');
    drawFilter(filter, li)
  });

  return variantFilterDialog;
};

var filterData = function(data, filter) {
  var newData = [];
  _.each(data, function(feature) {
    var filtered = _.filter(feature.variants, function(variant) {
      return (!filter.on &&
        ((variant[filter.property] === undefined) || (filter.value != variant[filter.property]))) || filter.on;
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
}

module.exports = VariantFilterDialog;
