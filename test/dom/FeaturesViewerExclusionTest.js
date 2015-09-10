/*
 * biojs-vis-proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

// chai is an assertion library
var chai = require('chai');

// @see http://chaijs.com/api/assert/
var assert = chai.assert;
// register alternative styles
// @see http://chaijs.com/api/bdd/
var expect = chai.expect;

// this is your global div instance (see index.html)
var yourDiv = document.getElementById('mocha');

// requires your main app (specified in index.js)
var FeaturesViewer = require('../..');
var DataLoader = require('../../lib/dataLoader');

describe('FeaturesViewerExclusionTest', function() {
    it('should create 1 category container with 1 category "Domains and Sites"', function(done) {
        var opts = {
            el: yourDiv,
            uniprotacc: 'nothing',
            exclusions: ['moleculeProcessing', 'ptm', 'seqInfo', 'structural', 'topology', 'mutagenesis', 'variants']
        };
        var instance = new FeaturesViewer(opts);

        instance.getDispatcher().on("noData", function() {
            data = require('../../snippets/data/features.json');
            data = DataLoader.processData(data);

            instance.init(opts, data);
        });

        instance.getDispatcher().on("ready", function() {
            var catContainer = document.querySelectorAll('.up_pftv_container>.up_pftv_category-container');
            assert.equal(catContainer.length, 1, 'only one up_pftv_category-container');
            assert.equal(catContainer[0].childElementCount, 1, 'up_pftv_category-container children count');

            var children = document.querySelectorAll('.up_pftv_category-container>.up_pftv_category');
            assert.equal(children.length, 1, 'category count');

            var catTitle = document.querySelector('.up_pftv_category-container .up_pftv_category-name');
            assert.equal(catTitle.text.toUpperCase(), "DOMAINS & SITES", 'first category title');

            var categoryFeatures = document.querySelector('.up_pftv_category-container .up_pftv_category-viewer-group');
            assert.equal(categoryFeatures.childElementCount, data.domainsAndSites.features.length, 'first category' +
                ' features count');
            done();
        });
    });

    it('should create 2 categories "Topology" and "Mutagenesis", in that order', function(done) {
        var opts = {
            el: yourDiv,
            uniprotacc: 'P05067',
            exclusions: ['domainsAndSites', 'moleculeProcessing', 'ptm', 'seqInfo', 'structural', 'variants'],
            proxy: 'http://wwwdev.ebi.ac.uk/uniprot/services/rest/uniprot/features/P05067?nothing='
        };
        var instance = new FeaturesViewer(opts);

        instance.getDispatcher().on("noData", function() {
            data = require('../../snippets/data/features.json');
            data = DataLoader.processData(data);

            instance.init(opts, data);
        });

        instance.getDispatcher().on("ready", function() {
            var children = document.querySelectorAll('.up_pftv_category-container>.up_pftv_category');
            assert.equal(children.length, 2, 'category count');

            var catTitle = document.querySelectorAll('.up_pftv_category-container .up_pftv_category-name');
            assert.equal(catTitle[0].text.toUpperCase(), "TOPOLOGY", 'second category title');
            assert.equal(catTitle[1].text.toUpperCase(), "MUTAGENESIS", 'first category title');

            var categoryFeatures = document.querySelectorAll('.up_pftv_category-container' +
                ' .up_pftv_category-viewer-group');
            assert.equal(categoryFeatures.length, 5, 'category and type tracks number');
            assert.equal(categoryFeatures[0].childElementCount, data.topology.features.length, 'second category' +
                ' features count');
            assert.equal(categoryFeatures[3].childElementCount, data.mutagenesis.features.length, 'first category' +
                ' features count');
            done();
        });
    });
});