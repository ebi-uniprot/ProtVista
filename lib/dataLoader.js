"use strict";

var $ = require('jquery');

var DataLoader = function() {
	return {
		get: function(uniprotID) {
			return $.ajax('data/features.json', {
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
	d.totalFeatureCount = 
		d.variants.features.length
        + d.moleculeProcessing.features.length
		+ d.structural.features.length
        + d.domainsAndSites.features.length
        + d.ptm.features.length
        + d.mutagenesis.features.length
        + d.seqInfo.features.length
        + d.topology.features.length
        + d.variants.features.length;
    return d;        
};

module.exports = DataLoader;