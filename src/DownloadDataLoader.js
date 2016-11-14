/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var $ = require('jquery');
var _ = require('underscore');
var Constants = require('./Constants');
var JSZip = require('jszip');
var FileSaver = require('file-saver');

var getFileName = function(source, format) {
    return source.source + (source.category ? source.category : '') + '.' + format;
};

var readmeText = function(accession, format) {
    var onlyUniProt = Constants.getDataSources().length === Constants.getUniProtDataSources().length;
    var onlyExternal = Constants.getDataSources().length === 1;
    var text = 'Protein sequence features for ' + accession + '. \n\n';

    if (onlyUniProt) {
        text += 'This zipped file contains UniProt protein sequence features split in ' +
        Constants.getUniProtDataSources().length + ' sets. \n\n';
    } else if (onlyExternal) {
        text += 'This zipped file contains ' + Constants.getExternalDataSource().source +  ' protein sequence' +
        ' features. \n\n';
    } else {
        text += 'This zipped file contains UniProt protein sequence features split in ' +
            Constants.getUniProtDataSources().length + ' sets. \n\nIt also contains protein sequence features ' +
            'provided by one additional data source (' + Constants.getExternalDataSource().source + '). \n\n';
    }

    text += 'Zipped files provided in this download: \n* readme.txt \n';
    _.each(Constants.getDataSources(), function(source) {
        text += '* ' + getFileName(source, format) + ' \n'
    });
    text += '\nIf any of the files listed above is not provided in the zipped file, please try again later as data ' +
        'services could be down at the moment.';
    return text;
};
var DownloadDataLoader = function() {
    return {
        get: function(accession, format, isSafari) {
            var zip = new JSZip();
            zip.file('readme.txt', readmeText(accession, format));
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
                        zip.file(getFileName(source, format), d);
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
                        console.log('Error: ', err)
                    });
                }
            });
        }
    };
}();

module.exports = DownloadDataLoader;
