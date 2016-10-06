/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var _ = require('underscore');
var Config = require('./config.json');

var visualizationTypes = {
    basic: 'basic',
    variant: 'variant'
};
var uniprotSource = 'uniprot';
var allSources = [
    {
        url: 'https://www.ebi.ac.uk/uniprot/api/features/',
        source: uniprotSource
    },
    {
        url: 'https://www.ebi.ac.uk/uniprot/api/proteomics/',
        source: uniprotSource,
        category: 'PROTEOMICS'
    },
    {
        url: 'https://www.ebi.ac.uk/uniprot/api/variation/',
        source: uniprotSource,
        category: 'VARIATION'
    }
];
var allCategories = Config.categories;
var allTrackNames = Config.trackNames;
var consequenceTypes = [];

var Constants = function() {
  return {
    getBlastURL: function() {
        return 'http://www.uniprot.org/blast/?about=';
    },
    getNoBlastTypes: function() {
      return ['helix', 'strand', 'turn', 'disulfid', 'crosslnk', 'variant'];
    },
    getVisualizationTypes: function() {
        return visualizationTypes;
    },
    getDataSources: function() {
      return allSources;
    },
    getUniProtSource: function() {
        return uniprotSource;
    },
    addSource: function(source) {
        allSources.push(source);
    },
    addConsequenceType: function(consequence) {
        consequenceTypes.push(consequence);
    },
    getConsequenceTypes: function() {
        return _.uniq(consequenceTypes);
    },
    clearDataSources: function() {
        allSources = [];
    },
    getCategoryNamesInOrder: function() {
        return allCategories;
    },
    setCategoryNamesInOrder: function(categories) {
        allCategories = categories;
    },
    convertNameToLabel: function(name) {
        var label = name.replace(/_/g, ' ');
        label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
        return label;
    },
    getCategoryInfo: function(categoryName) {
        var exist = _.find(allCategories, function(cat) {
            return cat.name === categoryName;
        });
        return exist ? exist
            : {name: categoryName, label: Constants.convertNameToLabel(categoryName),
            visualizationType: Constants.getVisualizationTypes().basic};
    },
    addCategories: function(categories) {
        var index = 0;
        _.each(categories, function (newCat) {
            var exist = _.find(allCategories, function(cat) {
                return cat.name === newCat.name;
            });
            if (exist) {
                exist.label = newCat.label;
                exist.visualizationType = newCat.visualizationType;
            } else {
                allCategories.splice(index, 0, newCat);
                index++;
            }
        });
    },
    getTrackNames: function() {
      return allTrackNames;
    },
    setTrackNames: function(trackNames) {
        allTrackNames = trackNames;
    },
    addTrackTypes: function(tracksToAdd) {
        _.each(tracksToAdd, function(elem, key) {
            key = key.toLowerCase();
            allTrackNames[key] = elem;
        });
    },
    getTrackInfo: function(trackName) {
        var name = trackName.toLowerCase();
        return this.getTrackNames()[name] ? this.getTrackNames()[name]
            : {label: Constants.convertNameToLabel(name), tooltip:''};
    }
  };
}();

module.exports = Constants;
