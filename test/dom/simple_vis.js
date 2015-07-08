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
chai.expect();
chai.should();

// this is your global div instance (see index.html)
var yourDiv = document.getElementById('mocha');

// requires your main app (specified in index.js)
var FeaturesViewer = require('../..');

describe('FeaturesViewer module', function() {
    var opts = {
        el: yourDiv,
        uniprotacc: 'P05067'
    };
    var instance = new FeaturesViewer(opts);
	it('should create general structure', function() {
        instance.getDispatcher().on("ready", function() {
            var mochaDiv = document.getElementById('mocha');
            assert(mochaDiv.firstElementChild.getAttribute('class'), 'fv-container');
            assert(mochaDiv.childElementCount, 1);
            var mainContainer = document.getElementsByClassName('fv-container');
            assert(mainContainer.length, 1);
            assert(mainContainer[0].childElementCount, 4);
        });
	});
});