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
var _ = require("underscore");
var FeaturesViewer = require('../..');
var DataLoader = require('../../src/DataLoader');
var NonOverlappingLayout = require('../../src/NonOverlappingLayout');

describe('FeaturesViewerTest', function() {
	//'DataLoader'
    var data = require('../../snippets/data/features.json');
    var basicFeatures = DataLoader.groupFeaturesByCategory(data.features);

	it('should process the data', function(done) {
		var variants = _.contains(basicFeatures, function(cat) {
			return (cat[0] === 'VARIANTS') || (cat[0] === 'VARIATION');
		});
		assert.equal(variants, false);

        var ftVariants = _.filter(data.features, function(ft) {
            return ft.category === 'VARIANTS';
        });
        var totalFeatures = data.features.length - ftVariants.length;
		var totalCount = 0;
        _.each(basicFeatures, function(cat) {
			totalCount += cat[1].length;
		});
        assert.equal(totalFeatures, totalCount);
        done();
	});

	it('should process variants', function() {
        var data = require('../../snippets/data/variant.json');
        var variants = DataLoader.processVariants(data.features, data.sequence);
        assert.equal(variants[0].length, 2);
        assert.equal(variants[0][0], 'VARIATION');
        assert.equal(variants[0][1].length, data.sequence.length + 2);
	});

    it('should process proteomics', function() {
        var data = require('../../snippets/data/peptides.json');
        var proteomics = DataLoader.processProteomics(data.features, data.sequence);
        assert.equal(proteomics[0].length, 2);
        assert.equal(proteomics[0][0], 'PROTEOMICS');
        assert.equal(proteomics[0][1].length, data.features.length);
    });

	//'NonOverlappingLayout
	var layout = new NonOverlappingLayout(basicFeatures[0][1], 40);

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
