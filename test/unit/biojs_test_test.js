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

// requires your main app (specified in index.js)
var biojs_vis_proteinFeaturesViewer = require('../../index.js');

describe('biojs_vis_proteinFeaturesViewer module', function(){
    describe('#init()', function(){
        it('should set the options', function(){
            var opts = {target: "mocha", testText: "biojs"};
            var instance = new biojs_vis_proteinFeaturesViewer(opts);
            assert.equal(instance.opt.target,"mocha");
            assert.equal(instance.opt.testText,"biojs");
        });
    });

    describe('#getGreetings()', function(){
        it('should return a hello', function(){
            assert.equal(biojs_vis_proteinFeaturesViewer.getGreetings('biojs'), ("hello biojs"));
            // alternative styles
            biojs_vis_proteinFeaturesViewer.getGreetings('biojs').should.equal("hello biojs");
        });
    });
});
