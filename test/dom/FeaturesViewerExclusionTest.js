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

describe('FeaturesViewerExclusionTest', function() {
    var flushAllD3Transitions = function() {
        var now = Date.now;
        Date.now = function() { return Infinity; };
        d3.timer.flush();
        Date.now = now;
    };

    it('should create 1 category container with 1 category "Domains and Sites"', function(done) {
        var instance = new FeaturesViewer({
            el: yourDiv,
            uniprotacc: 'P05067',
            display: {
                domainsAndSites: true
            }
        });
        instance.getDispatcher().on("ready", function(data) {
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

    it('should create only 1 category "Domains and Sites" and dismiss the non-existent one', function(done) {
        var instance = new FeaturesViewer({
            el: yourDiv,
            uniprotacc: 'P05067',
            display: {
                domainsAndSites: true,
                anythingElse: true
            }
        });
        instance.getDispatcher().on("ready", function(data) {
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
    it('should create only 1 category "Domains and Sites" and dismiss the ones with false as display', function(done) {
        var instance = new FeaturesViewer({
            el: yourDiv,
            uniprotacc: 'P05067',
            display: {
                domainsAndSites: true,
                seqInfo: false,
                mutagenesis: false
            }
        });
        instance.getDispatcher().on("ready", function(data) {
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
    it('should create 2 categories "Mutagenesis" and "Topology", in that order, dismissing anything else', function(done) {
        var instance = new FeaturesViewer({
            el: yourDiv,
            uniprotacc: 'P05067',
            display: {
                seqInfo: false,
                mutagenesis: true,
                anythingElse: true,
                topology: true,
                anyOther: false
            }
        });
        instance.getDispatcher().on("ready", function(data) {
            var children = document.querySelectorAll('.up_pftv_category-container>.up_pftv_category');
            assert.equal(children.length, 2, 'category count');

            var catTitle = document.querySelectorAll('.up_pftv_category-container .up_pftv_category-name');
            assert.equal(catTitle[0].text.toUpperCase(), "MUTAGENESIS", 'first category title');
            assert.equal(catTitle[1].text.toUpperCase(), "TOPOLOGY", 'second category title');

            var categoryFeatures = document.querySelectorAll('.up_pftv_category-container' +
                ' .up_pftv_category-viewer-group');
            assert.equal(categoryFeatures.length, 5, 'category and type tracks number');
            assert.equal(categoryFeatures[0].childElementCount, data.mutagenesis.features.length, 'first category' +
                ' features count');
            assert.equal(categoryFeatures[2].childElementCount, data.topology.features.length, 'second category' +
                ' features count');
            done();
        });
    });
});