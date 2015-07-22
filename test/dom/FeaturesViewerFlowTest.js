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

describe('FeaturesViewerFlowTest', function() {
    var instance,
        data, aaWidth, gapRegion,
        firstMetalPosition = 9;

    var flushAllD3Transitions = function() {
        var now = Date.now;
        Date.now = function() { return Infinity; };
        d3.timer.flush();
        Date.now = now;
    };

    before(function(done) {
        var opts = {
            el: yourDiv,
            uniprotacc: 'P05067'
        };
        instance = new FeaturesViewer(opts);
        instance.getDispatcher().on("ready", function(obj) {
            data = obj;
            aaWidth = instance.xScale(2) - instance.xScale(1);
            gapRegion = aaWidth/2;
            done();
        });
    });

	it('should create 1 up_pftv_container with 4 children', function() {
        var mochaDiv = document.getElementById('mocha');
        assert.equal(mochaDiv.firstElementChild.getAttribute('class'), 'up_pftv_container', 'up_pftv_container' +
            ' existence inside test div');
        assert.equal(mochaDiv.childElementCount, 1, 'test div children count');

        var mainContainer = document.getElementsByClassName('up_pftv_container');
        assert.equal(mainContainer.length, 1, 'only one up_pftv_container');
        assert.equal(mainContainer[0].childElementCount, 4, 'up_pftv_container children count');
	});

    it('should create 1 nav-ruler with 1 SVG', function() {
        var navRuler = document.querySelectorAll('.up_pftv_container>.up_pftv_navruler');
        assert.equal(navRuler.length, 1, 'only one up_pftv_navruler');
        assert.equal(navRuler[0].childElementCount, 1, 'up_pftv_navruler children count');

        var rulerSvg = navRuler[0].firstElementChild;
        assert.equal(rulerSvg.getAttribute('id'), 'up_pftv_svg-navruler', 'up_pftv_navruler child id');
    });

    it('should create elements inside the nav-ruler SVG', function() {
        var groups = document.querySelectorAll('#up_pftv_svg-navruler>g');
        assert.equal(groups.length, 3, '#up_pftv_svg-navruler groups count');
        assert.equal(groups[0].getAttribute('class'), 'x axis', 'first #up_pftv_svg-navruler group class');
        assert.equal(groups[1].getAttribute('class'), 'up_pftv_viewport', 'second #up_pftv_svg-navruler group class');
        assert.equal(groups[2].childElementCount, 1, 'third #up_pftv_svg-navruler group, children count');

        var trapezoid = document.querySelectorAll('#up_pftv_svg-navruler .up_pftv_trapezoid');
        expect(trapezoid.d).to.be.undefined;

        var extent = document.querySelector('.up_pftv_navruler .extent');
        assert.equal(extent.getAttribute('x'), 10, 'navRuler.extent initial position');
        expect(+extent.getAttribute('width')).to.be.closeTo(740, 1);
    });

    it('should create 1 up_pftv_buttons with 4 children', function() {
        var buttonsDiv = document.querySelectorAll('.up_pftv_container>.up_pftv_buttons');
        assert.equal(buttonsDiv.length, 1, 'only one up_pftv_buttons');
        assert.equal(buttonsDiv[0].childElementCount, 4, 'up_pftv_buttons children count');

        var buttons = document.querySelectorAll('.up_pftv_buttons span');
        assert.equal(buttons.length, 4);
        assert.equal(buttons[0].getAttribute('class'), 'up_pftv_icon-arrows-cw', 'first button class');
        assert.equal(buttons[1].getAttribute('class'), 'up_pftv_icon-zoom-in', 'second button class');
        assert.equal(buttons[2].getAttribute('class'), 'up_pftv_icon-filter', 'third button class');
        assert.equal(buttons[3].getAttribute('class'), 'up_pftv_icon-info', 'fourth button class');
    });

    it('should create 1 aaViewer with a hidden aa sequence', function() {
        var aaViewerDiv = document.querySelectorAll('.up_pftv_container>.up_pftv_aaviewer');
        assert.equal(aaViewerDiv.length, 1, 'only one up_pftv_aaviewer');
        assert.equal(aaViewerDiv[0].childElementCount, 1, 'up_pftv_aaviewer children count');

        var aaViewer = aaViewerDiv[0].firstElementChild.firstElementChild;
        assert.equal(aaViewer.style.opacity, 0, 'aa sequence opacity');
        assert.equal(aaViewer.childElementCount, instance.sequence.length, 'aa sequence length');
    });

    it('should create 1 category container with 8 categories', function() {
        var catContainer = document.querySelectorAll('.up_pftv_container>.up_pftv_category-container');
        assert.equal(catContainer.length, 1, 'only one up_pftv_category-container');
        assert.equal(catContainer[0].childElementCount, 8, 'up_pftv_category-container children count');

        var children = document.querySelectorAll('.up_pftv_category-container>.up_pftv_category');
        assert.equal(children.length, 8, 'category count');

    });

    it('should create 1 category container with 8 category and type tracks', function() {
        var categoryFeatures = document.querySelectorAll('.up_pftv_category-container' +
            ' .up_pftv_category-viewer-group');
        assert.equal(categoryFeatures.length, 27, 'category and type tracks number, variants excluded');
        assert.equal(categoryFeatures[0].childElementCount, data.domainsAndSites.features.length, 'first category' +
            ' features count');
        assert.equal(categoryFeatures[6].childElementCount, data.moleculeProcessing.features.length, 'second category' +
            ' features count');
        assert.equal(categoryFeatures[10].childElementCount, data.ptm.features.length, 'second' +
            ' category' +
            ' features count');
        assert.equal(categoryFeatures[13].childElementCount, data.seqInfo.features.length, 'second' +
            ' category' +
            ' features count');
        assert.equal(categoryFeatures[16].childElementCount, data.structural.features.length, 'second' +
            ' category' +
            ' features count');
        assert.equal(categoryFeatures[22].childElementCount, data.topology.features.length, 'second' +
            ' category' +
            ' features count');
        assert.equal(categoryFeatures[25].childElementCount, data.mutagenesis.features.length, 'second' +
            ' category' +
            ' features count');
    });

    it('should cut all title to maximum 29 characters', function() {
        var catTitle = document.querySelectorAll('.up_pftv_category-container .up_pftv_category-name');

        for (var i = 0; i < catTitle.length; i++) {
            expect(catTitle[i].text.length).to.be.below(27);
        }
    });

    it('should create a category track with title and features', function() {
        var catTitle = document.querySelector('.up_pftv_category-container .up_pftv_category-name');
        assert.equal(catTitle.text.toUpperCase(), "DOMAINS & SITES", 'first category title');
        expect(catTitle.getAttribute('class').indexOf('up_pftv_arrow-right')).to.not.equal(-1);

        var categoryFeatures = document.querySelector('.up_pftv_category-container .up_pftv_category-viewer-group');
        assert.equal(categoryFeatures.childElementCount, data.domainsAndSites.features.length, 'first category' +
            ' features count');
    });

    it('should create a hidden vertical highlight on the category track', function() {
        var categoryShadow = document.querySelector('.up_pftv_category-container g');
        var svg = document.querySelector('.up_pftv_category svg');

        assert.equal(categoryShadow.childElementCount, 1, 'only one vertical shadow');
        expect(categoryShadow.getAttribute('transform')).to.be.null;
        assert.equal(categoryShadow.firstElementChild.getAttribute('width'), 0, 'shadow width');
        assert.equal(categoryShadow.firstElementChild.getAttribute('height'), svg.getAttribute('height'), 'shadow' +
            ' height');
        assert.equal(categoryShadow.firstElementChild.getAttribute('x'), 0, 'shadow x');
        assert.equal(categoryShadow.firstElementChild.getAttribute('y'), 0, 'shadow y');
    });

    it('should create 10 hidden type track elements on the category track', function() {
        var typeTracksDiv = document.querySelector('.up_pftv_category-tracks');
        assert.equal(typeTracksDiv.style.display, 'none', 'type tracks display');
        assert.equal(typeTracksDiv.childElementCount, 10, 'type tracks count');
    });

    it('should create a hidden vertical highlight on the type track', function() {
        var typeShadow = document.querySelector('.up_pftv_track g');
        var svg = document.querySelector('.up_pftv_category svg');

        assert.equal(typeShadow.childElementCount, 1, 'only one vertical shadow');
        expect(typeShadow.getAttribute('transform')).to.be.null;
        assert.equal(typeShadow.firstElementChild.getAttribute('width'), 0, 'shadow width');
        assert.equal(typeShadow.firstElementChild.getAttribute('height'), svg.getAttribute('height'), 'shadow' +
            ' height');
        assert.equal(typeShadow.firstElementChild.getAttribute('x'), 0, 'shadow x');
        assert.equal(typeShadow.firstElementChild.getAttribute('y'), 0, 'shadow y');
    });

    it('should create a metal in position 147', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var path = document.querySelector("[name='" + feature.internalId + "']");
        assert.equal(path.getAttribute('d'), 'M0,0L5,5L0,10L-5,5Z', 'metal path');
        assert.equal(path.getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'metal class');
        assert.equal(path.getAttribute('transform'), 'translate(' + instance.xScale(+feature.begin) + ',5)', 'metal' +
            ' translation');
    });

    it('should select a category feature @147', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        assert.equal(paths.length, 2, 'number of metals in position 147 (1 in category, 1 in type)');
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);
        paths[0].dispatchEvent(evt); //select

        assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature', 'selected metal class');
        assert.equal(paths[1].getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'hidden type track metal class');
        assert.equal(feature, instance.selectedFeature, 'selected feature');
    });

    it('should activate vertical highlight after feature selection @147', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");

        var transform = paths[0].getAttribute('transform');
        transform = transform.substring(0, transform.indexOf(','));

        var categoryShadow = document.querySelector('.up_pftv_category-container .up_pftv_shadow');
        assert.equal(categoryShadow.getAttribute('transform'), transform + ',0)', 'shadow translation');
        assert.equal(categoryShadow.getAttribute('width'), aaWidth, 'shadow width');
        expect(categoryShadow.getAttribute('height')).to.be.above(0);
        assert.equal(categoryShadow.getAttribute('x'), -gapRegion, 'shadow x coordinate');
        assert.equal(categoryShadow.getAttribute('y'), 0, 'shadow y coordinate');
    });

    it('should adjust vertical highlight for type tracks', function() {
        var typeShadow = document.querySelector('.up_pftv_track g');
        assert.equal(typeShadow.childElementCount, 1, 'only one vertical shadow');
        expect(typeShadow.getAttribute('transform')).to.be.null;
        assert.equal(typeShadow.firstElementChild.getAttribute('width'), aaWidth, 'shadow width');
        expect(typeShadow.getAttribute('height')).to.be.null;
        assert.equal(typeShadow.firstElementChild.getAttribute('x'), -gapRegion, 'shadow x');
        assert.equal(typeShadow.firstElementChild.getAttribute('y'), 0, 'shadow y');
    });

    it('should open 1 tooltip after feature selection @147', function() {
        var tooltip = document.querySelectorAll('.up_pftv_tooltip-container');
        assert.equal(tooltip.length, 1, 'tooltip exists');
    });

    it('should close 1 tooltip ', function() {
        var tooltip = document.querySelector('.up_pftv_tooltip-close');
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, tooltip);
        tooltip.dispatchEvent(evt); //close tooltip
        flushAllD3Transitions();

        var allTooltips = document.querySelectorAll('.up_pftv_tooltip-container');
        assert.equal(allTooltips.length, 0, 'tooltip does not exists');
    });

    it('should deselect the selected feature @147', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);

        paths[0].dispatchEvent(evt); //deselect
        assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'unselected metal class');
        expect(instance.selectedFeature).to.be.undefined;
    });

    it('should re-open 1 tooltip after feature deselection @147', function() {
        var tooltip = document.querySelectorAll('.up_pftv_tooltip-container');
        assert.equal(tooltip.length, 1, 'tooltip exists');
    });

    it('should deactivate category vertical highlight after feature deselection @147', function() {
        var categoryShadow = document.querySelector('.up_pftv_category-container .up_pftv_shadow');
        assert.equal(categoryShadow.getAttribute('transform'), 'translate(0,0)', 'shadow translation when not visible');
        assert.equal(categoryShadow.getAttribute('width'), 0, 'shadow x coordinate when not visible');
        expect(categoryShadow.getAttribute('height')).to.be.above(0);
        assert.equal(categoryShadow.getAttribute('x'), 0, 'shadow x coordinate when not visible');
        assert.equal(categoryShadow.getAttribute('y'), 0, 'shadow y coordinate');
    });

    it('should deactivate type vertical highlight after feature deselection @147', function() {
        var typeShadow = document.querySelector('.up_pftv_track .up_pftv_shadow');
        assert.equal(typeShadow.getAttribute('transform'), 'translate(0,0)', 'shadow translation when not visible');
        assert.equal(typeShadow.getAttribute('width'), 0, 'shadow x coordinate when not visible');
        expect(typeShadow.getAttribute('height')).to.be.above(0);
        assert.equal(typeShadow.getAttribute('x'), 0, 'shadow x coordinate when not visible');
        assert.equal(typeShadow.getAttribute('y'), 0, 'shadow y coordinate');
    });

    it('should open first category type tracks', function() {
        var catTitle = document.querySelector('.up_pftv_category .up_pftv_category-name');
        var typeTracks = document.querySelector('.up_pftv_category .up_pftv_category-tracks');
        assert.equal(typeTracks.style.display, 'none', 'initial type tracks display');
        assert.equal(catTitle.getAttribute('class'), 'up_pftv_category-name up_pftv_arrow-right'
            , 'title class when category is closed');

        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, catTitle);
        catTitle.dispatchEvent(evt); //open

        assert.equal(typeTracks.style.display, 'inline-block', 'type tracks display after opening');
        assert.equal(catTitle.getAttribute('class'), 'up_pftv_category-name up_pftv_arrow-down'
            , 'title class when category is open');
    });

    it('should select a type feature @147', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        assert.equal(paths.length, 2, 'number of metals in position 147 (1 in category, 1 in type)');
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);
        paths[1].dispatchEvent(evt); //select

        assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'hidden selected ' +
            'metal class in category');
        assert.equal(paths[1].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature'
            , 'selected metal class in category in type');
        assert.equal(feature, instance.selectedFeature, 'selected feature');
    });

    it('should activate all vertical highlight after feature selection @147', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");

        var transform = paths[0].getAttribute('transform');
        transform = transform.substring(0, transform.indexOf(','));

        var shadows = document.querySelectorAll('.up_pftv_shadow');
        for (var i = 0; i < shadows.length; i++) {
            var shadow = shadows[i];
            assert.equal(shadow.getAttribute('transform'), transform + ',0)', 'shadow translation');
            assert.equal(shadow.getAttribute('width'), aaWidth, 'shadow width');
            assert.equal(shadow.getAttribute('x'), -gapRegion, 'shadow x coordinate');
        }
    });

    it('should close first category type tracks', function() {
        var catTitle = document.querySelector('.up_pftv_category .up_pftv_category-name');
        var typeTracks = document.querySelector('.up_pftv_category .up_pftv_category-tracks');

        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, catTitle);
        catTitle.dispatchEvent(evt); //close

        assert.equal(typeTracks.style.display, 'none', 'type tracks display after closing');
        assert.equal(catTitle.getAttribute('class'), 'up_pftv_category-name up_pftv_arrow-right'
            , 'title class after closing');
    });

    it('should keep selection on selected feature after closing', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");

        assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature'
            , 'type track metal class');
        assert.equal(paths[1].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature'
            , 'type track metal class');
        assert.equal(feature, instance.selectedFeature, 'selected feature');
    });

    it('should select another feature, first molecule processing feature @1-17', function() {
        var featureDS = data.domainsAndSites.features[firstMetalPosition];
        var pathsDS = document.querySelectorAll("[name='" + featureDS.internalId + "']");

        var featureMP = data.moleculeProcessing.features[0];
        var pathsMP = document.querySelectorAll("[name='" + featureMP.internalId + "']");
        assert.equal(pathsMP[0].getAttribute('class'), 'up_pftv_feature up_pftv_signal', 'non selected signal class');
        var evtMP = document.createEvent("MouseEvents");
        evtMP.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, pathsMP[0]);
        pathsMP[0].dispatchEvent(evtMP); //select another

        assert.equal(pathsDS[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'unselected metal class');
        assert.equal(pathsMP[0].getAttribute('class'), 'up_pftv_feature up_pftv_signal up_pftv_activeFeature'
            , 'selected signal class');
        expect(featureDS).to.be.not.equal(instance.selectedFeature);
        assert.equal(featureMP, instance.selectedFeature, 'selected feature');
    });

    it('should activate vertical highlight after feature selection @1-17', function() {
        var featureMP = data.moleculeProcessing.features[0];
        var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

        var transform = paths[0].getAttribute('transform');
        transform = transform.substring(0, transform.indexOf(','));
        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));
        var lineEnd = shapePath.substring(shapePath.indexOf('L')+1, shapePath.indexOf(',', shapePath.indexOf('L')));

        var categoryShadow = document.querySelector('.up_pftv_category-container .up_pftv_shadow');
        assert.equal(categoryShadow.getAttribute('transform'), transform + ',0)', 'shadow translation');
        expect(Math.abs(lineEnd - x - categoryShadow.getAttribute('width'))).to.be.below(0.01);
        expect(categoryShadow.getAttribute('height')).to.be.above(0);
        assert.equal(categoryShadow.getAttribute('x'), x, 'shadow x coordinate');
        assert.equal(categoryShadow.getAttribute('y'), 0, 'shadow y coordinate');
    });

    it('should adjust vertical highlight for type tracks after feature selection @1-17', function() {
        var featureMP = data.moleculeProcessing.features[0];
        var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

        var transform = paths[0].getAttribute('transform');
        transform = transform.substring(0, transform.indexOf(','));
        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));
        var lineEnd = shapePath.substring(shapePath.indexOf('L')+1, shapePath.indexOf(',', shapePath.indexOf('L')));

        var typeShadow = document.querySelector('.up_pftv_track .up_pftv_shadow');
        assert.equal(typeShadow.getAttribute('transform'), transform + ',0)', 'shadow translation');
        expect(Math.abs(lineEnd - x - typeShadow.getAttribute('width'))).to.be.below(0.01);
        expect(typeShadow.getAttribute('height')).to.be.above(0);
        assert.equal(typeShadow.getAttribute('x'), x, 'shadow x');
        assert.equal(typeShadow.getAttribute('y'), 0, 'shadow y');
    });

    it('should zoom in', function() {
        var zoomIn = document.querySelector('.up_pftv_icon-zoom-in');
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, zoomIn);
        zoomIn.dispatchEvent(evt); //zoom in
        flushAllD3Transitions();

        var feature = data.domainsAndSites.features[firstMetalPosition];
        var path = document.querySelector("[name='" + feature.internalId + "']");
        assert.equal(path.getAttribute('transform'), 'translate(' + instance.xScale(+feature.begin) + ',5)'
            , 'translated metal');

        var extent = document.querySelector('.up_pftv_navruler .extent');
        assert.equal(extent.getAttribute('x'), 10, 'navRuler.extent initial position');
        expect(extent.getAttribute('width')).to.be.above(0);

        var trapezoid = document.querySelector('.up_pftv_trapezoid');
        expect(trapezoid.getAttribute('d')).to.not.equal('M0,0');

        var aaViewer = document.querySelector('.up_pftv_aaviewer').firstElementChild.firstElementChild;
        assert.equal(aaViewer.style.opacity, 1, 'aa sequence opacity, now visible');
    });

    it('should adjust vertical highlight after zooming', function() {
        var featureMP = data.moleculeProcessing.features[0];
        var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

        var transform = paths[0].getAttribute('transform');
        transform = transform.substring(0, transform.indexOf(','));
        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));
        var lineEnd = shapePath.substring(shapePath.indexOf('L')+1, shapePath.indexOf(',', shapePath.indexOf('L')));

        var categoryShadow = document.querySelector('.up_pftv_category-container .up_pftv_shadow');
        assert.equal(categoryShadow.getAttribute('transform'), transform + ',0)', 'shadow translation');
        expect(Math.abs(lineEnd - x - categoryShadow.getAttribute('width'))).to.be.below(0.01);
        expect(categoryShadow.getAttribute('height')).to.be.above(0);
        assert.equal(categoryShadow.getAttribute('x'), x, 'shadow x coordinate');
        assert.equal(categoryShadow.getAttribute('y'), 0, 'shadow y coordinate');
    });

    it('should reset view (zoom out and deselect features)', function() {
        var resetButton = document.querySelector('.up_pftv_icon-arrows-cw');
        var evtReset = document.createEvent("MouseEvents");
        evtReset.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, resetButton);
        resetButton.dispatchEvent(evtReset); //zoom out
        flushAllD3Transitions();

        var extent = document.querySelector('.up_pftv_navruler .extent');
        assert.equal(extent.getAttribute('width'), 740, 'extent covers all width after zooming out');

        var trapezoid = document.querySelector('.up_pftv_trapezoid');
        assert.equal(trapezoid.getAttribute('d'), 'M0,50L0,48L10,40L750,40L760,48L760,50Z', 'trapezoid not visible after zooming out');

        var aaViewer = document.querySelector('.up_pftv_aaviewer').firstElementChild.firstElementChild;
        assert.equal(aaViewer.style.opacity, 0, 'aa sequence not visible after zooming out');

        var selectedFeature = document.querySelectorAll('.up_pftv_activeFeature');
        assert.equal(selectedFeature.length, 0, 'no feature selected anymore');
        expect(instance.selectedFeature).to.be.undefined;

        var categoryShadow = document.querySelector('.up_pftv_category-container .up_pftv_shadow');
        assert.equal(categoryShadow.getAttribute('transform'), 'translate(0,0)', 'shadow x coordinate');
        assert.equal(categoryShadow.getAttribute('width'), 0, 'shadow x coordinate');
        assert.equal(categoryShadow.getAttribute('x'), 0, 'shadow x coordinate');
    });

    it('should keep tooltip open', function() {
        var tooltip = document.querySelectorAll('.up_pftv_tooltip-container');
        assert.equal(tooltip.length, 1, 'tooltip still exists');
    });
});