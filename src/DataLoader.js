/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var $ = require('jquery');
var _ = require('underscore');
var Evidence = require('./Evidence');
var Constants = require('./Constants');

var evidenceGrouping = function (ftEvidences) {
    var evidences = {};
    _.each(ftEvidences, function(ev) {
        if (evidences[ev.code]) {
            evidences[ev.code].push(ev.source);
        } else {
            evidences[ev.code] = [ev.source];
        }
    });
    return evidences;
};

var groupEvidencesByCode = function(features) {
    _.each(features, function(ft) {
        if (ft.evidences) {
            ft.evidences = evidenceGrouping(ft.evidences);
        }
        if (ft.association) {
            _.each(ft.association, function(disease) {
                if (disease.evidences) {
                    disease.evidences = evidenceGrouping(disease.evidences);
                }
            });
        }
    });
    return features;
};

var setVariantData = function(source, d) {
    var datum = {};
    if (source && (source !== Constants.getUniProtSource())) {
        datum.begin = d.begin;
        delete d.begin;
        datum.end = d.end;
        delete d.end;
        datum.wildType = d.wildType;
        delete d.wildType;
        datum.alternativeSequence = d.alternativeSequence;
        delete d.alternativeSequence;
        datum.sourceType = d.sourceType;
        delete d.sourceType;
        datum.type = d.type;
        delete d.type;
        datum.externalData = {};
        datum.externalData[source] = d;
    } else {
        datum = d;
    }
    return datum;
};

var DataLoader = function() {
    return {
        get: function(url) {
            return $.getJSON(url);
        },
        groupFeaturesByCategory: function(features, sequence, source, includeVariants) {
            features = groupEvidencesByCode(features);
            var categories = _.groupBy(features, function(d) {
                return d.category;
            });
            var variants;
            if (source && (source !== Constants.getUniProtSource()) && (includeVariants === true)) {
                variants = categories.VARIATION;
                delete categories.VARIATION;
            } else {
                delete categories.VARIANTS;
            }
            var orderedPairs = [];
            var categoriesNames = Constants.getCategoryNamesInOrder();
            categoriesNames = _.pluck(categoriesNames, 'name');
            var newCategoryNames = [];
            _.each(categories, function(catInfo, catKey) {
                if (!_.contains(categoriesNames, catKey)) {
                    newCategoryNames.push({
                        name: catKey,
                        label: Constants.convertNameToLabel(catKey),
                        visualizationType: Constants.getVisualizationTypes().basic
                    });
                }
            });
            if (newCategoryNames.length !== 0) {
                Constants.addCategories(newCategoryNames);
                categoriesNames = Constants.getCategoryNamesInOrder();
                categoriesNames = _.pluck(categoriesNames, 'name');
            }
            _.each(categoriesNames, function(catName) {
                if (categories[catName]) {
                    orderedPairs.push([
                        catName,
                        categories[catName]
                    ]);
                }
            });
            if (variants) {
                var orderedVariantPairs = DataLoader.processVariants(variants, sequence, source, true);
                orderedPairs.push(orderedVariantPairs[0]);
            }
            return orderedPairs;
        },
        processProteomics: function(features) {
            features = groupEvidencesByCode(features);
            var types = _.map(features, function(d) {
                if (d.unique) {
                    d.type = 'unique';
                } else {
                    d.type = 'non_unique';
                }
                return d;
            });
            return [
                ['PROTEOMICS', types]
            ];
        },
        processUngroupedFeatures: function(features) {
            features = groupEvidencesByCode(features);
            return [
                [features[0].type, features]
            ];
        },
        processVariants: function(variants, sequence, source, evidenceAlreadyGrouped) {
            if (source && (source !== Constants.getUniProtSource())) {
                _.each(variants, function(variant) {
                    delete variant.category;
                });
            }
            if (!evidenceAlreadyGrouped) {
                variants = groupEvidencesByCode(variants);
            }
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
                d.end = d.end ? +d.end : d.begin;
                d.wildType = d.wildType ? d.wildType : sequence.substring(d.begin, d.end + 1);
                d.sourceType = d.sourceType ? d.sourceType.toLowerCase() : d.sourceType;
                if ((1 <= d.begin) && (d.begin <= seq.length)) {
                    mutationArray[d.begin].variants.push(setVariantData(source, d));
                } else if ((seq.length + 1) === d.begin) {
                    mutationArray[d.begin - 1].variants.push(setVariantData(source, d));
                }
                if (d.consequence) {
                    Constants.addConsequenceType(d.consequence);
                }
            });
            return [
                ['VARIATION', mutationArray]
            ];
        }
    };
}();

module.exports = DataLoader;