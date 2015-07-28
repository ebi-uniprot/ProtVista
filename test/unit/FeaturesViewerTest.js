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

// requires your main app
var FeaturesViewer = require('../..');
var DataLoader = require('../../lib/dataLoader');
var NonOverlappingLayout = require('../../lib/NonOverlappingLayout');

describe('FeaturesViewerTest', function() {

	var data = require('../../snippets/data/features.json');

	//'DataLoader'
	it('should process the data', function() {
		var d = DataLoader.processData(data);
		var totalFeatures = data.domainsAndSites.features.length + data.moleculeProcessing.features.length +
			data.ptm.features.length + data.seqInfo.features.length + data.structural.features.length +
			data.topology.features.length + data.mutagenesis.features.length + data.variants.features.length;
		assert(d.totalFeatureCount, totalFeatures);
	});

	//'NonOverlappingLayout
	var layout = new NonOverlappingLayout(data.domainsAndSites.features, 40);

	it('should calculate track overlaps', function() {
		layout.calculate();
	});

	it('should return feature height', function() {
		assert.equal(13,layout.getFeatureHeight());
	});

	it('should return right number of rows', function() {
		assert.equal(2, layout.getRows().length);
	});

});