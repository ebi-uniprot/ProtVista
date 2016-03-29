/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var $ = require('jquery');
var _ = require('underscore');
var Evidence = require('./Evidence');
var Constants = require('./Constants');

var DataLoader = function() {
  return {
    get: function(url) {
      return $.getJSON(url);
    }, // processData: function(d) {
    //   var consecutive = 0;
    //   _.each(d, function(datum) {
    //     if (datum && datum.features) {
    //       _.each(datum.features, function(feature) {
    //         if (feature.variants) {
    //           _.each(feature.variants, function(variant) {
    //             variant.internalId = "ft_" + consecutive;
    //             variant.type.label = variant.type.label.replace('_', ' ');
    //             consecutive++;
    //           });
    //         } else {
    //           feature.internalId = "ft_" + consecutive;
    //           feature.type.label = feature.type.label.replace('_', ' ');
    //           consecutive++;
    //         }
    //       });
    //     }
    //   });
    //   d.totalFeatureCount = consecutive;
    //   return d;
    // },
    groupFeaturesByCategory: function(features) {
      var categories = _.groupBy(features, function(d) {
        return d.category;
      });
      delete categories.VARIANTS;
      var orderedPairs = [];
      var categoriesNames = Constants.getCategoryNamesInOrder();
      _.each(categoriesNames, function(name){
        if(categories[_.keys(name)[0]]){
          orderedPairs.push([
            _.keys(name)[0],
            categories[_.keys(name)[0]]
          ]);
        }
      });
      return orderedPairs;
    },
    processProteomics: function(features) {
      var types = _.map(features, function(d){
        d.unique ? d.type = 'unique' : d.type = 'non_unique';
        return d;
      });
      return [['PROTEOMICS',types]];
    },
    processUngroupedFeatures: function(features) {
      return [[features[0].type, features]];
    },
    processVariants: function(variants, sequence) {
      var mutationArray = [];
        mutationArray.push({
          'type': 'VARIANT',
          'normal': '-',
          'pos': 0,
          'variants': []
        });
        var seq = sequence.split('');
        _.each(seq, function(d, i) {
          mutationArray.push({
            'type': 'VARIANT',
            'normal': seq[i],
            'pos': i + 1,
            'variants': []
          });
        });
        mutationArray.push({
          'type': 'VARIANT',
          'normal': '-',
          'pos': seq.length + 1,
          'variants': []
        });

        _.each(variants, function(d) {
          d.begin = +d.begin;
          d.wildType = d.wildType ? d.wildType : mutationArray[d.begin].normal;
          d.sourceType = d.sourceType.toLowerCase();
          if ((1 <= d.begin) && (d.begin <= seq.length)) {
            mutationArray[d.begin].variants.push(d);
          } else if ((seq.length + 1) === d.begin) {
            mutationArray[d.begin - 1].variants.push(d);
          }
        });
      return [['VARIATION', mutationArray]];
    }
  };
}();

module.exports = DataLoader;
