"use strict";

var $ = require('jquery');
var _ = require('underscore');

var DataLoader = function() {
	return {
		get: function(uniprotID) {
			return $.ajax('https://wwwdev.ebi.ac.uk/uniprot/services/rest/features/' + uniprotID, {
			// return $.ajax('data/features.json', {	
				params: {
					//put things in here if we need, like options or variation style
				}
			}).done(function(d) {
				d.variants.features = DataLoader.processVariants(d);
				return DataLoader.processData(d);
			}).fail(function(e){
				return(e);
			});
		}, processData: function(d){
			var consecutive = 0;
			_.each(d, function(datum) {
				if (datum && datum.features) {
					_.each(datum.features, function(feature) {
						feature.internalId = "ft_" + consecutive;
						consecutive++;
					});	
				}
			});
			d.totalFeatureCount = consecutive;
		    return d;
		}, processVariants: function(d){
			var mutationArray = [];
			var seq = d.sequence.split('');
			_.each(seq, function(d,i){
				mutationArray.push({
					'type': {
						'name':'VARIANT',
						'label':'Sequence Variant'
					},
					'normal':seq[i],
					'pos': i,
					'count':0,
					'variants':[]
				});
			});
			_.each(d.variants.features, function(d){
				mutationArray[parseInt(d.begin)].variants.push({
					'pos':d.position,
					'mutation': d.mutation,
					'frequency': d.frequency,
					'siftPrediction': d.siftPrediction
				});
			});
			return mutationArray;
		}
	};
} ();

module.exports = DataLoader;