/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var _ = require('underscore');
var Config = require('./config.json');

var allVisualization = Config.visualization;
var allSources = Config.sources;
var allCategories = Config.categories;
var allTrackNames = Config.trackNames;

var Constants = function() {
  return {
    getBlastURL: function() {
        return 'http://www.uniprot.org/blast/?about='
    },
    getNoBlastTypes: function() {
      return ['helix', 'strand', 'turn', 'disulfid', 'crosslnk', 'variant'];
    },
    getDataSources: function() {
      return allSources;
    },
    addSource: function(source) {
        allSources.push(source);
    },
    cleanDataSources: function() {
        allSources = [];
    },
    getCategories: function() {
        return allCategories;
    },
    getCategoryNamesInOrder: function() {
        var temp = [];
        _.each(allCategories, function(cat) {
            temp = _.union(temp, cat.categoryNamesInOrder);
        });
        return temp;
    },
    getCategoryInfo: function(categoryName) {
        var result = {name: categoryName, label: '', visualization: ''};
        var exist = _.find(allCategories, function(cat) {
            result.visualization = cat.visualization;
            var found = _.find(cat.categoryNamesInOrder, function(catInfo) {
                result.label = catInfo.label;
                return catInfo.name === categoryName;
            });
            return found;
        });
        return exist === true ? result : {name: categoryName, label: categoryName, visualization: 'basic'};
    },
    addCategories: function(categories) {
        _.each(categories, function(newCat) {
            var catSameVisual = _.find(allCategories, function(otherCat) {
                return otherCat.visualization === newCat.visualization;
            });
            if (!catSameVisual) {
                allCategories.splice(allCategories.length-1, 0, newCat);
            } else {
                _.each(newCat.categoryNamesInOrder, function(newCatInfo) {
                    var catSameName = _.find(catSameVisual.categoryNamesInOrder, function(otherCatInfo) {
                        return otherCatInfo.name === newCatInfo.name;
                    });
                    if (!catSameName) {
                        catSameVisual.categoryNamesInOrder.push(newCatInfo);
                    } else {
                        catSameName.label = newCatInfo.label;
                    }
                });
            }
        });
    },
    getTrackNames: function() {
      return allTrackNames;
    },
    addTrackTypes: function(tracksToAdd) {
        _.each(tracksToAdd, function(elem, key) {
            key = key.toLowerCase();
            allTrackNames[key] = elem;
        });
    },
    getTrackInfo: function(trackName) {
        var name = trackName.toLowerCase();
        return this.getTrackNames()[name] ? this.getTrackNames()[name] : {label: name, tooltip:''};
    }
  };
}();

module.exports = Constants;
