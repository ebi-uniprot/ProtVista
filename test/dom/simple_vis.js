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

// this is your global div instance (see index.html)
var yourDiv = document.getElementById('mocha');

// requires your main app (specified in index.js)
var biojs_vis_proteinFeaturesViewer = require('../..');

// describe('biojs_vis_proteinFeaturesViewer module', function(){
//   describe('#greetings()', function(){
//     it('should fill the textBox', function(){
//       //var opts = {target: "mocha", testText: "biojs1"};
//       //var instance = new biojs_vis_proteinFeaturesViewer(opts);
//       //instance.greetings("biojs");
//       biojs_vis_proteinFeaturesViewer.greetings('mocha', 'biojs');
//       assert.equal(yourDiv.innerHTML,"hello biojs");
//     });
//   });
// });
