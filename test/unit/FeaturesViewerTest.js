/*
 * ProtVista
 * https://github.com/ebi-uniprot/ProtVista
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
var should = chai.should;

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
            authority: 'my lab'
        };
        it ('should add a new source', function() {
            var expectedSources = Constants.getDataSources().slice(0);
            expectedSources.push(source);
            Constants.addSource(source);
            assert.equal(JSON.stringify(expectedSources), JSON.stringify(Constants.getDataSources()));
        });
        it('should add new categories and modify existing ones', function() {
            var expectedCategoryNamesInOrder = [
                { name: 'MY_DOMAINS', label: 'My domains', visualizationType: 'basic' },
                { name: 'CAT', label: 'My cat', visualizationType: 'basic' },
                { name: 'DOMAINS_AND_SITES', label: 'Domains & sites', visualizationType: 'basic' },
                { name: 'MOLECULE_PROCESSING', label: 'Alt molecule processing', visualizationType: 'basic' },
                { name: 'PTM', label: 'PTM', visualizationType: 'basic' },
                { name: 'SEQUENCE_INFORMATION', label: 'Sequence information', visualizationType: 'basic' },
                { name: 'STRUCTURAL', label: 'Structural features', visualizationType: 'basic' },
                { name: 'TOPOLOGY', label: 'Topology', visualizationType: 'basic' },
                { name: 'MUTAGENESIS', label: 'Mutagenesis', visualizationType: 'basic' },
                { name: 'PROTEOMICS', label: 'Proteomics', visualizationType: 'basic' },
                { name: 'ANTIGEN', label: 'Antigenic sequences', visualizationType: 'basic' },
                { name: 'VARIATION', label: 'Variants', visualizationType: 'variant' }
             ];

            var categoriesToAdd = [
                {name: 'MY_DOMAINS', label: 'My domains', visualizationType: 'basic'},
                {name: 'MOLECULE_PROCESSING', label: 'Alt molecule processing', visualizationType: 'basic'},
                {name: 'CAT', label: 'My cat', visualizationType: 'basic'}
            ];
            Constants.addCategories(categoriesToAdd);
            expect(Constants.getCategoryNamesInOrder()).to.deep.equal(expectedCategoryNamesInOrder);
        });
        it('should get non-existing category info', function() {
            var family_domains = {name: 'family_domains', label: 'Family domains', visualizationType: 'basic'};
            expect(family_domains).to.deep.equal(Constants.getCategoryInfo('family_domains'));
        });
        it('should get existing category info', function() {
            var category = {name: 'DOMAINS_AND_SITES', label: 'Domains & sites', visualizationType: 'basic'};
            expect(category).to.deep.equal(Constants.getCategoryInfo('DOMAINS_AND_SITES'));
        });
        it('should add new tracks and modify existing ones', function() {
            var keys = _.keys(Constants.getTrackNames());
            var howMany = keys.length;
            var label = Constants.getTrackNames().unique.label;

            var tracksToAdd = {
                only_Unique: {label: 'Only unique peptide', tooltip: ''},
                unique: {label: 'Unique peptide whose track already exist', tooltip: ''},
                mixed: {label: 'Mixed peptide', tooltip: ''}
            };

            Constants.addTrackTypes(tracksToAdd);
            keys = _.keys(Constants.getTrackNames());
            assert.equal(howMany + 2, keys.length);
            assert.notEqual(Constants.getTrackNames().unique.label, label);
            expect(Constants.getTrackNames().unique).to.deep.equal(tracksToAdd.unique);
            expect(Constants.getTrackNames().mixed).to.deep.equal(tracksToAdd.mixed);
            expect(Constants.getTrackNames().only_unique).to.deep.equal(tracksToAdd.only_Unique);
        });
        it('should get existing track info', function() {
            var unique = {label:'Unique peptide whose track already exist',tooltip:''};
            expect(unique).to.deep.equal(Constants.getTrackInfo('unique'));
        });
        it('should get non-existing track info', function() {
            var family_domains = {label:'Family domains', tooltip:''};
            expect(family_domains).to.deep.equal(Constants.getTrackInfo('family_domains'));
        });
    });
});
