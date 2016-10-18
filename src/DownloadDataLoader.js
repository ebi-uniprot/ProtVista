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
            zip.file('readme', 'Protein sequence features for ' + accession + '\n\n' +
                'This zipped file contains protein sequence features provided by different data sources (' +
                _.pluck(Constants.getDataSources(), 'url').join() + '). \n\nCurrently, all download formats (' +
                _.pluck(Constants.getDownloadFormats(), 'text').join() + ') are supported for UniProt data sources' +
                ' while only JSON is guaranteed for any other data source. \n\nWe cannot guarantee the availability ' +
                'of any data source at the download time.');

            var loaders = [];
            _.each(Constants.getDataSources(), function(source, index) {
                var loader = $.ajax({
                    accepts: { gff: 'text/x-gff', json: 'application/json', xml: 'application/xml' },
                    converters: {
                        'text gff': function(result) { return result; },
                        'text json': function(result) { return result; },
                        'text xml': function(result) { return result; }
                    },
                    dataType: format,
                    url: source.url + accession
                });
                loaders.push(loader);
                loader.done(function(d) {
                    if (loader.getResponseHeader('Content-type').indexOf(format) !== -1) {
                        zip.file(source.source + source.category + '.' + format, d);
                    } else {
                        zip.file('warning' + index + '.txt', source.url + ' response does not correspond to the' +
                            ' required format ' + format + '. Data has not been processed.');
                    }
                    /*if ((format === 'json') && (loader.getResponseHeader('Content-type').indexOf('json') !== -1)) {
                        zip.file(source.source + source.category + '.json', JSON.stringify(d));
                    } else if ((format === 'xml') && (loader.getResponseHeader('Content-type').indexOf('xml') !== -1)) {

                    } else if ((format === 'gff') && (loader.getResponseHeader('Content-type').indexOf('gff') !== -1)) {
                        zip.file(source.source + source.category + '.gff', d);
                    } */
                }).fail(function (e) {
                    console.log('DownloadDataLoader-Error', e, this.url);
                });
            });
            //when all done
            $.when.apply(null, loaders).done(function () {
                zip.generateAsync({type:"blob"})
                    .then(function(content) {
                        // TODO FileSaver does not necessarily work in Safari -- see content type
                        FileSaver.saveAs(content, "protVistaData.zip");
                    });
            });
        }
    };
}();

module.exports = DownloadDataLoader;
