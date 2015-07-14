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

describe('FeaturesViewer module', function() {
    var instance,
        data,
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
            done();
        });
    });

	it('should create one general container with 4 children', function() {
        var mochaDiv = document.getElementById('mocha');
        assert.equal(mochaDiv.firstElementChild.getAttribute('class'), 'up_pftv_container', 'up_pftv_container' +
            ' existence inside test div');
        assert.equal(mochaDiv.childElementCount, 1, 'test div children count');

        var mainContainer = document.getElementsByClassName('up_pftv_container');
        assert.equal(mainContainer.length, 1, 'only one up_pftv_container');
        assert.equal(mainContainer[0].childElementCount, 4, 'up_pftv_container children count');
	});
    it('should create one nav-ruler with one SVG with id up_pftv_svg-navruler', function() {
        var navRuler = document.querySelectorAll('.up_pftv_container>.up_pftv_navruler');
        assert.equal(navRuler.length, 1, 'only one up_pftv_navruler');
        assert.equal(navRuler[0].childElementCount, 1, 'up_pftv_navruler children count');

        var rulerSvg = navRuler[0].firstElementChild;
        assert.equal(rulerSvg.getAttribute('id'), 'up_pftv_svg-navruler', 'up_pftv_navruler child id');
    });
    it('should create a elements inside the up_pftv_svg-navruler', function() {
        var groups = document.querySelectorAll('#up_pftv_svg-navruler>g');
        assert.equal(groups.length, 3, '#up_pftv_svg-navruler groups count');
        assert.equal(groups[0].getAttribute('class'), 'x axis', 'first #up_pftv_svg-navruler group class');
        assert.equal(groups[1].getAttribute('class'), 'up_pftv_viewport', 'second #up_pftv_svg-navruler group class');
        assert.equal(groups[2].childElementCount, 1, 'third #up_pftv_svg-navruler group, children count');
        var trapezoid = document.querySelectorAll('#up_pftv_svg-navruler .up_pftv_trapezoid');
        expect(trapezoid.d).to.be.undefined;
    });
    it('should create one up_pftv_buttons with 4 span children', function() {
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
    it('should create one aaViewer with a hidden aa sequence', function() {
        var aaViewerDiv = document.querySelectorAll('.up_pftv_container>.up_pftv_aaviewer');
        assert.equal(aaViewerDiv.length, 1, 'only one up_pftv_aaviewer');
        assert.equal(aaViewerDiv[0].childElementCount, 1, 'up_pftv_aaviewer children count');

        var aaViewer = aaViewerDiv[0].firstElementChild.firstElementChild;
        assert.equal(aaViewer.style.opacity, 0, 'aa sequence opacity');
        assert.equal(aaViewer.childElementCount, instance.sequence.length, 'aa sequence length');
    });
    it('should create one category container', function() {
        var catContainer = document.querySelectorAll('.up_pftv_container>.up_pftv_category-container');
        assert.equal(catContainer.length, 1, 'only one up_pftv_category-container');
        assert.equal(catContainer[0].childElementCount, 7, 'up_pftv_category-container children count');

        var children = document.querySelectorAll('.up_pftv_category-container>.up_pftv_category');
        assert.equal(children.length, 7, 'category count');

    });
    it('should create a category track', function() {
        var catTitle = document.querySelector('.up_pftv_category-container .up_pftv_category-name');
        assert.equal(catTitle.text.toUpperCase(), "DOMAINS & SITES", 'first category title');
        expect(catTitle.getAttribute('class').indexOf('up_pftv_arrow-right')).to.not.equal(-1);

        var categoryShadow = document.querySelector('.up_pftv_category-container g');
        assert.equal(categoryShadow.childElementCount, 1, 'only one vertical shadow');
        assert.equal(categoryShadow.firstElementChild.getAttribute('width'), 0, 'shadow width');

        var categoryFeatures = document.querySelector('.up_pftv_category-container .up_pftv_category-viewer-group');
        assert.equal(categoryFeatures.childElementCount, data.domainsAndSites.features.length, 'first category' +
            ' features count');

        var category = document.querySelector('.up_pftv_category-container .up_pftv_category');
        var typeTracks = category.children[2];
        assert.equal(typeTracks.style.display, 'none', 'type tracks display');
    });
    it('should create a metal in position 147', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var path = document.querySelector("[name='" + feature.internalId + "']");
        assert.equal(path.getAttribute('d'), 'M0,0L5,5L0,10L-5,5Z', 'metal path');
        assert.equal(path.getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'metal class');
        assert.equal(path.getAttribute('transform'), 'translate(' + instance.xScale(+feature.begin) + ',5)', 'metal' +
            ' translation');
    });
    it('should select a feature in position 147', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        assert.equal(paths.length, 2, 'number of metal in position 147');
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);
        paths[0].dispatchEvent(evt); //select

        assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature', 'selected metal class');
        assert.equal(paths[1].getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'hidden type track metal class');

        paths[0].dispatchEvent(evt); //deselect
        assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'unselected metal class');
    });
    it('should activate vertical highlight on selection of feature at 147', function() {
        var feature = data.domainsAndSites.features[0];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        assert.equal(paths.length, 2, 'number of metal in position 147');
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);
        paths[0].dispatchEvent(evt); //select

        var transform = paths[0].getAttribute('transform');
        transform = transform.substring(0, transform.indexOf(','));
        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));
        var lineEnd = shapePath.substring(shapePath.indexOf('L')+1, shapePath.indexOf(',', shapePath.indexOf('L')));

        var categoryShadow = document.querySelector('.up_pftv_category-container .up_pftv_shadow');
        var width = categoryShadow.getAttribute('width');
        assert.equal(categoryShadow.getAttribute('transform'), transform + ',0)', 'shadow translation');
        assert.equal(categoryShadow.getAttribute('x'), x, 'shadow x coordinate');
        expect(Math.abs(lineEnd - x - width)).to.be.below(0.01);

        paths[0].dispatchEvent(evt); //deselect
        assert.equal(categoryShadow.getAttribute('transform'), 'translate(0,0)', 'shadow translation when not visible');
        assert.equal(categoryShadow.getAttribute('x'), 0, 'shadow x coordinate when not visible');
        assert.equal(categoryShadow.getAttribute('width'), 0, 'shadow x coordinate when not visible');
    });
    it('should propagate vertical highlight on selection of feature at 147 when types are opened', function() {
        var feature = data.domainsAndSites.features[0];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);
        paths[0].dispatchEvent(evt); //select

        var categoryShadow = document.querySelector('.up_pftv_track .up_pftv_shadow');
        assert.equal(categoryShadow.getAttribute('height'), 0, 'shadow height before opening');

        var category = document.getElementsByClassName('up_pftv_category-container')[0].firstElementChild;
        var catTitle = category.firstElementChild;
        var evtOpen = document.createEvent("MouseEvents");
        evtOpen.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, catTitle);
        catTitle.dispatchEvent(evtOpen); //open

        var transform = paths[1].getAttribute('transform');
        transform = transform.substring(0, transform.indexOf(','));
        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));
        var lineEnd = shapePath.substring(shapePath.indexOf('L')+1, shapePath.indexOf(',', shapePath.indexOf('L')));

        var categoryShadow = document.querySelector('.up_pftv_track .up_pftv_shadow');
        var width = categoryShadow.getAttribute('width');
        assert.equal(categoryShadow.getAttribute('transform'), transform + ',0)', 'shadow translation');
        assert.equal(categoryShadow.getAttribute('x'), x, 'shadow x coordinate');
        expect(Math.abs(lineEnd - x - width)).to.be.below(0.01);
        expect(categoryShadow.getAttribute('height')).to.be.above(0);

        paths[0].dispatchEvent(evt); //deselect
        catTitle.dispatchEvent(evtOpen); //close
    });
    it('should propagate selection on selected feature when types are opened', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);
        paths[0].dispatchEvent(evt); //select

        var category = document.getElementsByClassName('up_pftv_category-container')[0].firstElementChild;
        var catTitle = category.firstElementChild;
        var evtOpen = document.createEvent("MouseEvents");
        evtOpen.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, catTitle);
        catTitle.dispatchEvent(evtOpen); //open

        assert.equal(paths[1].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature', 'type' +
            ' track metal class');

        paths[0].dispatchEvent(evt); //deselect
        catTitle.dispatchEvent(evtOpen); //close
    });
    it('should select another feature', function() {
        var featureDS = data.domainsAndSites.features[firstMetalPosition];
        var pathsDS = document.querySelectorAll("[name='" + featureDS.internalId + "']");
        var evtDS = document.createEvent("MouseEvents");
        evtDS.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, pathsDS[0]);
        pathsDS[0].dispatchEvent(evtDS); //select
        assert.equal(pathsDS[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature', 'selected metal class');

        var featureMP = data.moleculeProcessing.features[0];
        var pathsMP = document.querySelectorAll("[name='" + featureMP.internalId + "']");
        assert.equal(pathsMP[0].getAttribute('class'), 'up_pftv_feature up_pftv_signal', 'non selected signal class');
        var evtMP = document.createEvent("MouseEvents");
        evtMP.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, pathsMP[0]);
        pathsMP[0].dispatchEvent(evtMP); //select another
        assert.equal(pathsDS[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'unselected metal class');
        assert.equal(pathsMP[0].getAttribute('class'), 'up_pftv_feature up_pftv_signal up_pftv_activeFeature', 'selected signal class');

        pathsMP[0].dispatchEvent(evtMP); //deselect
        assert.equal(pathsMP[0].getAttribute('class'), 'up_pftv_feature up_pftv_signal', 'unselected signal class');
    });
    it('should open/close type tracks', function() {
        var category = document.getElementsByClassName('up_pftv_category-container')[0].firstElementChild;
        var catTitle = category.firstElementChild;
        var typeTracks = category.children[2];
        assert.equal(typeTracks.style.display, 'none', 'initial type tracks display');

        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, catTitle);
        catTitle.dispatchEvent(evt); //open
        assert.equal(typeTracks.style.display, 'inline-block', 'type tracks display after opening');

        catTitle.dispatchEvent(evt); //close
        assert.equal(typeTracks.style.display, 'none', 'type tracks display after closing');
    });
    it('should zoom in/out', function() {
        var zoomIn = document.querySelector('.up_pftv_icon-zoom-in');
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, zoomIn);
        zoomIn.dispatchEvent(evt); //zoom in
        flushAllD3Transitions();

        var feature = data.domainsAndSites.features[firstMetalPosition];
        var path = document.querySelector("[name='" + feature.internalId + "']");
        assert.equal(path.getAttribute('transform'), 'translate(' + instance.xScale(+feature.begin) + ',5)', 'translated metal');

        var extent = document.querySelector('.up_pftv_navruler .extent');
        assert.equal(extent.getAttribute('x'), 0, 'navRuler.extent initial position');
        expect(extent.getAttribute('width')).to.be.above(0);

        var trapezoid = document.querySelector('.up_pftv_trapezoid');
        expect(trapezoid.getAttribute('d')).to.not.equal('M0,0');

        var aaViewer = document.querySelector('.up_pftv_aaviewer').firstElementChild.firstElementChild;
        assert.equal(aaViewer.style.opacity, 1, 'aa sequence opacity, now visible');

        var resetButton = document.querySelector('.up_pftv_icon-arrows-cw');
        var evtReset = document.createEvent("MouseEvents");
        evtReset.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, resetButton);
        resetButton.dispatchEvent(evtReset); //zoom out
        flushAllD3Transitions();

        assert.equal(extent.getAttribute('width'), 0, 'extent not visible after zooming out');
        assert.equal(trapezoid.getAttribute('d'), 'M0,0', 'trapezoid not visible afterm zooming out');
        assert.equal(aaViewer.style.opacity, 0, 'aa sequence not visible after zooming out');
    });
});