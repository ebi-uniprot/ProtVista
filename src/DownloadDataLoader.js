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
            var delegates = [];
            _.each(Constants.getDataSources(), function() {
                var delegate = $.Deferred();
                delegates.push(delegate);
            });
            _.each(Constants.getDataSources(), function(source, index) {
                var extension = source.source === Constants.getUniProtSource() ? '' : '.' + format;
                var loader = $.ajax({
                    accepts: { gff: 'text/x-gff', json: 'application/json', xml: 'application/xml' },
                    converters: {
                        'text gff': function(result) { return result; },
                        'text json': function(result) { return result; },
                        'text xml': function(result) { return result; }
                    },
                    dataType: format,
                    url: source.url + accession + extension
                }).done(function(d) {
                    if (loader.getResponseHeader('Content-type').indexOf(format) !== -1) {
                        var fileName = source.source + (source.category ? source.category : '') + '.' + format;
                        zip.file(fileName, d);
                    } else {
                        zip.file('warning_' + index + '.txt', source.url + ' response does not correspond to the ' +
                            'required format ' + format + '. Data has not been processed.');
                    }
                }).fail(function (e) {
                    zip.file('error_' + index + '.txt', source.url + ' responded with an error code for the ' +
                        'required format ' + format + '. Data has not been retrieved.');
                }).always(function() {
                    delegates[index].resolve();
                });
            });
            //when all done
            //TODO async download does not work in safari
            $.when.apply(null, delegates).always(function () {
                zip.generateAsync({type:'blob'})
                    .then(function(content) {
                        FileSaver.saveAs(content, "protVistaData.zip");
                    });
            });
        }
    };
}();

module.exports = DownloadDataLoader;
