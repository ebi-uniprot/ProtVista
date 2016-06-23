/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var $ = require('jquery');
var _ = require('underscore');
var Evidence = require('./Evidence');
var Constants = require('./Constants');

var groupEvidencesByCode = function(features) {
    _.each(features, function(ft) {
        if (ft.evidences) {
            var evidences = {};
            _.each(ft.evidences, function(ev) {
                if (evidences[ev.code]) {
                    evidences[ev.code].push(ev.source);
                } else {
                    evidences[ev.code] = [ev.source];
                }
            });
            ft.evidences = evidences;
        }
    });
    return features;
};

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
            features = groupEvidencesByCode(features);
            var categories = _.groupBy(features, function(d) {
                return d.category;
            });
            delete categories.VARIANTS;
            var orderedPairs = [];
            var categoriesNames = Constants.getCategoryNamesInOrder();
            _.each(categoriesNames, function(catInfo){
                if(categories[catInfo.name]){
                    orderedPairs.push([
                        catInfo.name,
                        categories[catInfo.name]
                    ]);
                }
            });
            return orderedPairs;
        },
        processProteomics: function(features) {
            features = groupEvidencesByCode(features);
            var types = _.map(features, function(d){
                if (d.unique) {
                    d.type = 'unique';
                } else {
                    d.type = 'non_unique';
                }
                return d;
            });
            return [['PROTEOMICS',types]];
        },
        processUngroupedFeatures: function(features) {
            return [[features[0].type, features]];
        },
        processVariants: function(variants, sequence) {
            variants = groupEvidencesByCode(variants);
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
