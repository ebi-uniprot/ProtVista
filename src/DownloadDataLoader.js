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
        get: function(format) {
            console.log('get format', format);
            if (format === 'JSON') {
                this.getJSON();
            }
        },
        getJSON: function() {
          console.log('getJSON');
          var zip = new JSZip();
          var loaders = [];
          _.each(Constants.getUniProtDataSources(), function(source) {
                var loader = $.getJSON(source.url + 'P05067'); //TODO get it from FV opts
                loaders.push(loader);
                loader.done(function(d) {
                    console.log('done', d.features);
                    zip.file(source.category + '.json', d.features);
                }).fail(function (e) {
                     console.log('DownloadDataLoader', e);
                });
          });
          //when all done
          $.when.apply(null, loaders).done(function () {
            console.log('all done');
            zip.generateAsync({type:"blob"})
              .then(function(content) {
                  // see FileSaver.js
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
