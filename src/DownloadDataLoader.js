/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var $ = require('jquery');
var _ = require('underscore');
var Constants = require('./Constants');
var JSZip = require('jszip');
var FileSaver = require('file-saver');

    var DownloadDataLoader = function() {
    return {
        get: function(accession, format) {
            if (format === 'JSON') {
                this.getJSON(accession);
            }
        },
        getJSON: function(accession) {
            var zip = new JSZip();
            //zip.file("Hello.txt", "Hello World\n");   //TODO Maybe a readme?
            var loaders = [];
            _.each(Constants.getUniProtDataSources(), function(source) {
                //TODO decision should we support 3-party data sources download?
                //TODO decision if 3-party data sources do not support gff/xml, check the response headers and inform
                //TODO load only categories that are displayed... but that might not work for 3-party sources... we
                // would still need the filtering code
                var loader = $.getJSON(source.url + accession);
                loaders.push(loader);
                loader.done(function(d) {
                    if (source.category === 'GENERAL') { //TODO get rid of hardcoded here
                        d.features = _.filter(d.features, function(feature) {
                            return feature.category !== 'VARIANTS';
                        });
                    }
                    zip.file(source.authority + source.category + '.json', JSON.stringify(d));
                }).fail(function (e) {
                     console.log('DownloadDataLoader', e);
                });
            });
            //when all done
            $.when.apply(null, loaders).done(function () {
                zip.generateAsync({type:"blob"})
                .then(function(content) {
                    // TODO FileSaver does not necessarily work in Safari
                    FileSaver.saveAs(content, "data.zip");
                });
            });
        },
        getXML: function() {

        },
        getGFF: function() {

        }
    };
}();

module.exports = DownloadDataLoader;
