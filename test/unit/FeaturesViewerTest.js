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
var Constants = require('../../src/Constants');
var DataLoader = require('../../src/DataLoader');
var NonOverlappingLayout = require('../../src/NonOverlappingLayout');

describe('FeaturesViewerTest', function() {
    describe('DataLoader', function() {
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
    describe('Add external sources', function () {
        var source = {
            url: 'https://my.url.com',
            type: 'basic',
            authority: 'my lab'
        };
        it ('should add a new source', function() {
            var expectedSources = Constants.getDataSources().slice(0);
            expectedSources.push(source);
            Constants.addSource(source);
            assert.equal(JSON.stringify(expectedSources), JSON.stringify(Constants.getDataSources()));
        });
        it('should add only new categories', function() {
            var expectedCategoryNamesInOrder = [
                {DOMAINS_AND_SITES: 'Domains & sites'}, {MOLECULE_PROCESSING: 'Molecule processing'},
                {PTM: 'Post translational modifications'}, {SEQUENCE_INFORMATON: 'Sequence information'} ,
                {STRUCTURAL: 'Structural features'}, { TOPOLOGY: 'Topology'},
                {MUTAGENESIS: 'Mutagenesis'}, {PROTEOMICS: 'Proteomics'},
                {MY_DOMAINS: 'My domains'}, {CAT: 'My cat'},
                {VARIATION: 'Variants'}
            ];

            var categoriesToAdd = [
                {MY_DOMAINS: 'My domains'}, {MOLECULE_PROCESSING: 'Molecule processing'}, {CAT: 'My cat'}
            ];
            Constants.addCategories(source, categoriesToAdd);
            assert.equal(JSON.stringify(expectedCategoryNamesInOrder),
                JSON.stringify(Constants.getCategoryNamesInOrder()));
        });
        it('should add only new tracks', function() {
            var keys = _.keys(Constants.getTrackNames());
            var howMany = keys.length;
            var label = Constants.getTrackNames().unique.label;

            var tracksToAdd = {
                only_unique: {label: 'Only unique peptide', tooltip: ''},
                unique: {label: 'Unique peptide whose track already exist', tooltip: ''},
                mixed: {label: 'Mixed peptide', tooltip: ''}
            };

            Constants.addTrackTypes(tracksToAdd);
            keys = _.keys(Constants.getTrackNames());
            assert.equal(howMany + 2, keys.length);
            assert.equal(Constants.getTrackNames().unique.label, label);
            assert.deepEqual(Constants.getTrackNames().mixed, tracksToAdd.mixed);
            assert.deepEqual(Constants.getTrackNames().only_unique, tracksToAdd.only_unique);
        });
        it('should get existing track info', function() {
            var unique = {label:'Unique peptide',tooltip:''};
            assert.deepEqual(unique, Constants.getTrackInfo('unique'));
        });
        it('should get non-existing track info', function() {
            var family_Domains = {label:'family_Domains', tooltip:''};
            assert.deepEqual(family_Domains, Constants.getTrackInfo('family_Domains'));
        });
    });
});
