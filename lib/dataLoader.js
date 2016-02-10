/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var $ = require('jquery');
var _ = require('underscore');
var Evidence = require('./Evidence');

var DataLoader = function() {
    return {
        get: function(proxy, uniprotID) {
            var url = 'wwwdev.ebi.ac.uk/uniprot/services/restful/features/';
            if(!proxy) {
                url = 'https:' + url;
            }

            return $.ajax({
                url: proxy + url + uniprotID,
                //We need this dataType to set the Accept header correctly
                dataType: "json"
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
                        if (feature.variants) {
                            _.each(feature.variants, function(variant) {
                                variant.internalId = "ft_" + consecutive;
                                variant.type.label = variant.type.label.replace('_', ' ');
                                consecutive++;
                            });
                        } else {
                            feature.internalId = "ft_" + consecutive;
                            feature.type.label = feature.type.label.replace('_', ' ');
                            consecutive++;
                        }
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
                    d.begin = +d.begin;
                    d.wildType = d.wildType ? d.wildType : mutationArray[d.begin].normal;
                    d.sourceType = d.sourceType.toLowerCase();
                    if ((1 <= d.begin) && (d.begin <= seq.length)) {
                        mutationArray[d.begin].variants.push(d);
                    } else if ((seq.length+1) === d.begin) {
                        mutationArray[d.begin - 1].variants.push(d);
                    }
                });
            }
            return mutationArray;
        }
    };
} ();

module.exports = DataLoader;