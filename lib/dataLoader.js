"use strict";

var $ = require('jquery');
var _ = require('underscore');

var DataLoader = function() {
	return {
		get: function(uniprotID) {
			return $.ajax('http://ves-ebi-ca:8082/us/rest/features/' + uniprotID, {
			//return $.ajax('data/features.json', {	
				params: {
					//put things in here if we need, like options or variation style
				}
			}).done(function(d) {
				return processData(d);
			}).fail(function(e){
				return(e);
			});
		}
	};
} ();

var processData = function(d) {
	var consecutive = 1;
	_.each(d, function(datum) {
		if (datum && datum.features) {
			_.each(datum.features, function(feature) {
				feature.internalId = "ft_" + consecutive;
				consecutive++;
			});	
		}			
	});
	d.totalFeatureCount = consecutive;
	
	if (d.options) {
		if (d.options.withShapes == undefined) {
			d.options.withShapes = true;
		}
	} else {
		d.options = {
			"withShapes": true
		};
	}
	
    return d;        
};

module.exports = DataLoader;