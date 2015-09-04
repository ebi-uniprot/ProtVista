/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var $ = require('jquery');
var _ = require('underscore');

var DataLoader = function() {
    var evidenceMapping = {
        isManual: ['ECO:0000269', 'ECO:0000303', 'ECO:0000305', 'ECO:0000250', 'ECO:0000255', 'ECO:0000244', 'ECO:0000312'],
        isAutomatic: ['ECO:0000256', 'ECO:0000213', 'ECO:0000313']
    };
    return {
        get: function(uniprotID) {
            return $.ajax('http://wwwdev.ebi.ac.uk/uniprot/services/rest/uniprot/features/' + uniprotID, {
            //return $.ajax('data/features.json', {
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
                mutationArray.push({
                    'type': {
                        'name':'VARIANT',
                        'label':'Sequence Variant'
                    },
                    'normal':'-',
                    'pos': 0,
                    'variants':[]
                });
                var seq = d.sequence.split('');
                _.each(seq, function(d,i){
                    mutationArray.push({
                        'type': {
                            'name':'VARIANT',
                            'label':'Sequence Variant'
                        },
                        'normal':seq[i],
                        'pos': i+1,
                        'variants':[]
                    });
                });
                mutationArray.push({
                    'type': {
                        'name':'VARIANT',
                        'label':'Sequence Variant'
                    },
                    'normal':'-',
                    'pos': seq.length+1,
                    'variants':[]
                });

                _.each(d.variants.features, function(d){
                    d.wildType = d.wildType ? d.wildType : mutationArray[parseInt(d.begin)].normal;

                    if ((1 <= d.begin) && (d.begin <= seq.length)) {
                        mutationArray[parseInt(d.begin)].variants.push(d);
                    } else if ((seq.length+1) == (d.begin)) {
                        mutationArray[parseInt(d.begin - 1)].variants.push(d);
                    }
                });

            }console.log(mutationArray);
            return mutationArray;
        }
    };
} ();

module.exports = DataLoader;