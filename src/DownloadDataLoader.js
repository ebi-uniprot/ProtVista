/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var $ = require('jquery');
var _ = require('underscore');
var Constants = require('./Constants');
var JSZip = require('jszip');
var FileSaver = require('file-saver');

var getFileName = function(accession, source, format) {
    return source.source + '_' + accession +
        (source.category ? '_' + source.category.toLowerCase() : '') + '.' + format;
};

var DownloadDataLoader = function() {
    return {
        get: function(accession, format, isSafari) {
            var zip = new JSZip();
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
                        zip.file(getFileName(accession, source, format), d);
                    } else {
                        zip.file(getFileName(accession, source, format), 'Unable to retrieve the data in the required' +
                            'format ' + format + '.');
                    }
                }).fail(function (e) {
                    zip.file(getFileName(accession, source, format), 'Unable to retrieve the data at this time.' +
                        ' Please try again later.');
                }).always(function() {
                    delegates[index].resolve();
                });
            });
            $.when.apply(null, delegates).always(function () {
                if (!isSafari) {
                    zip.generateAsync({type:'blob'})
                        .then(function(content) {
                            FileSaver.saveAs(content, "protVistaData.zip");
                        });
                } else {
                    zip.generateAsync({type:"base64"}).then(function (base64) {
                        window.location = "data:application/zip;base64," + base64;
                    }, function (err) {
                        console.log('Error: ', err);
                    });
                }
            });
        }
    };
}();

module.exports = DownloadDataLoader;
