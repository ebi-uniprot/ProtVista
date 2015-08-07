/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var $ = require('jquery');
var _ = require('underscore');

var DataLoader = function() {
    var evidenceMapping = {
        manual: ['ECO:0000269', 'ECO:0000303', 'ECO:0000305', 'ECO:0000250', 'ECO:0000255', 'ECO:0000244', 'ECO:0000312'],
        automatic: ['ECO:0000256', 'ECO:0000213', 'ECO:0000313']
    };
    return {
        get: function(uniprotID) {
            return $.ajax('http://wwwdev.ebi.ac.uk/uniprot/services/rest/uniprot/features/' + uniprotID, {
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
            if(d.variants.features.length > 0) {
                var seq = d.sequence.split('');
                _.each(seq, function(d,i){
                    mutationArray.push({
                        'type': {
                            'name':'VARIANT',
                            'label':'Sequence Variant'
                        },
                        'normal':seq[i-1],
                        'pos': i,
                        'variants':[]
                    });
                });
                _.each(d.variants.features, function(d){
                    d.wildType = d.wildType ? d.wildType : mutationArray[parseInt(d.begin)].normal;
                    d.isManual = d.isSP
                        ? true
                        : _.intersection(evidenceMapping.manual, _.pluck(d.evidences, 'code')).length !== 0;
                    d.isAutomatic = _.intersection(evidenceMapping.automatic, _.pluck(d.evidences, 'code')).length !== 0;
                    if(mutationArray.length > d.begin )
                        mutationArray[parseInt(d.begin)].variants.push(d);
                });
            }
            return mutationArray;
        }
    };
} ();

module.exports = DataLoader;