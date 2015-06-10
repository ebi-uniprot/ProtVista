"use strict";

var $ = require('jquery');

var DataLoader = function() {
	return {
		get: function(uniprotID) {
			return $.ajax('http://ves-ebi-ca:8082/us/rest/features/' + uniprotID, {
				params: {
					//put things in here if we need
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
		if (datum.features) {
			_.each(datum.features, function(feature) {
				feature.internalId = "ft_" + consecutive;
				consecutive++;
			});	
		}			
	});
	d.totalFeatureCount = consecutive;
    return d;        
};

module.exports = DataLoader;