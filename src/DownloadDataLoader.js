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
            var zip = new JSZip();
            zip.file("Hello.txt", "Hello World\n");   //TODO Maybe a readme?
            var loaders = [];
            _.each(Constants.getUniProtDataSources(), function(source) {
                //TODO decision should we support 3-party data sources download?
                //TODO decision if 3-party data sources do not support gff/xml, check the response headers and inform
                //TODO load only categories that are displayed... but that might not work for 3-party sources... we
                // would still need the filtering code
                //var loader = $.getJSON(source.url + accession);
                var extension = '';
                var loader = $.get({
                    url: source.url + accession + extension,
                    dataType: format === 'XML' ? 'xml' : (format === 'JSON') ? 'json' : 'text'
                });
                loaders.push(loader);
                loader.done(function(d) {
                    if (source.category === 'GENERAL') { //TODO get rid of hardcoded here
                        d.features = _.filter(d.features, function(feature) {
                            return feature.category !== 'VARIANTS';
                        });
                    }
                    if (format === 'JSON') {
                        zip.file(source.authority + source.category + '.json', JSON.stringify(d));
                    }

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
            if (format === 'JSON') {
                this.getJSON(accession);
            }
        },
        getJSON: function(accession) {

        },
        getXML: function() {

        },
        getGFF: function() {

        }
    };
}();

module.exports = DownloadDataLoader;
