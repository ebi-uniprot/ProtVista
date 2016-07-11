/*
 * ProtVista
 * https://github.com/ebi-uniprot/ProtVista
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

// chai is an assertion library
var chai = require('chai');
var sinon = require('sinon');

// @see http://chaijs.com/api/assert/
var assert = chai.assert;
// register alternative styles
// @see http://chaijs.com/api/bdd/
var expect = chai.expect;

// this is your global div instance (see index.html)
var yourDiv = document.getElementById('mocha');

// requires your main app (specified in index.js)
var FeaturesViewer = require('../..');
var Constants = require('../../src/Constants');
var FeaturesData = require('./FeaturesData');
var jQuery = require('jquery');

describe('FeaturesViewerExclusionTest', function() {
    var instance;

    before(function() {
        sinon.stub(Constants, 'getDataSources', function() {
            return [{
                url: '',
                type: 'basic'
            }];
        });
        sinon.stub(jQuery, 'getJSON', function() {
            var deferred = jQuery.Deferred();
            setTimeout(function() {
                return deferred.resolve(FeaturesData.features);
            }, 5);
            return deferred;
        });
    });

    after(function() {
        Constants.getDataSources.restore();
        jQuery.getJSON.restore();
    });

    it('should create 1 category container with 1 category "Domains and Sites"', function(done) {
        var opts = {
            el: yourDiv,
            uniprotacc: '',
            exclusions: ['MOLECULE_PROCESSING', 'PTM', 'SEQUENCE_INFORMATION', 'STRUCTURAL', 'TOPOLOGY',
                'MUTAGENESIS', 'PROTEOMICS', 'VARIATION']
        };
        var instance = new FeaturesViewer(opts);

        instance.getDispatcher().on("ready", function() {
            var catContainer = document.querySelectorAll('.up_pftv_container .up_pftv_category-container');
            assert.equal(catContainer.length, 1, 'only one up_pftv_category-container');
            assert.equal(catContainer[0].childElementCount, Constants.getCategoryNamesInOrder().length + 1,
                'up_pftv_category-container children count');

            assert.equal(catContainer[0].children[0].className, 'up_pftv_category_on_the_fly', 'one for on the fly' +
                ' categories');
            assert.equal(catContainer[0].children[1].className, 'up_pftv_category_DOMAINS_AND_SITES', 'one for' +
                ' domains');

            var catWithName = document.querySelectorAll('.up_pftv_container .up_pftv_category-name');
            assert.equal(catWithName.length, 1, 'only one category with name');

            var children = document.querySelectorAll('.up_pftv_category-container .up_pftv_category');
            assert.equal(children.length, 1, 'category count');

            var catTitle = document.querySelector('.up_pftv_category-container .up_pftv_category-name');
            assert.equal(catTitle.text.toUpperCase(), "DOMAINS & SITES", 'first category title');

            var categoryFeatures = document.querySelector('.up_pftv_category-container .up_pftv_category-viewer-group');
            assert.equal(categoryFeatures.childElementCount, instance.data[0][1].length, 'first category' +
                ' features count');
            done();
        });
    });

    it('should create 2 categories "Topology" and "Mutagenesis", in that order', function(done) {
        var opts = {
            el: yourDiv,
            uniprotacc: 'P05067',
            exclusions: ['DOMAINS_AND_SITES', 'MOLECULE_PROCESSING', 'PTM', 'SEQUENCE_INFORMATION', 'STRUCTURAL',
                'VARIATION', 'PROTEOMICS']
        };
        var instance = new FeaturesViewer(opts);

        instance.getDispatcher().on("ready", function() {
            var children = document.querySelectorAll('.up_pftv_category-container .up_pftv_category');
            assert.equal(children.length, 2, 'category count');

            var catTitle = document.querySelectorAll('.up_pftv_category-container .up_pftv_category-name');
            assert.equal(catTitle[0].text.toUpperCase(), "TOPOLOGY", 'second category title');
            assert.equal(catTitle[1].text.toUpperCase(), "MUTAGENESIS", 'first category title');

            var categoryFeatures = document.querySelectorAll('.up_pftv_category-container' +
                ' .up_pftv_category-viewer-group');
            assert.equal(categoryFeatures.length, 5, 'category and type tracks number');
            assert.equal(categoryFeatures[0].childElementCount, instance.data[0][1].length, 'second category' +
                ' features count');
            assert.equal(categoryFeatures[3].childElementCount, instance.data[1][1].length, 'first category' +
                ' features count');
            done();
        });
    });
});
