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
    var instance;
    var data;
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

	it('should create general structure', function() {
        var mochaDiv = document.getElementById('mocha');
        assert.equal(mochaDiv.firstElementChild.getAttribute('class'), 'up_pftv_container');
        assert.equal(mochaDiv.childElementCount, 1);
        var mainContainer = document.getElementsByClassName('up_pftv_container');
        assert.equal(mainContainer.length, 1);
        assert.equal(mainContainer[0].childElementCount, 4);
        assert.equal(document.getElementsByClassName('up_pftv_navruler').length, 1);
        assert.equal(document.getElementsByClassName('up_pftv_buttons').length, 1);
        assert.equal(document.getElementsByClassName('up_pftv_aaviewer').length, 1);
        assert.equal(document.getElementsByClassName('up_pftv_category-container').length, 1);
	});
    it('should create aa sequence', function() {
        var aaViewer = document.getElementsByClassName('up_pftv_aaviewer')[0].firstElementChild.firstElementChild;
        assert.equal(aaViewer.childElementCount, instance.sequence.length);
    });
    it('should create a category track', function() {
        var category = document.getElementsByClassName('up_pftv_category-container')[0].firstElementChild;
        var catTitle = category.firstElementChild;
        assert.equal(catTitle.text.toUpperCase(), "DOMAINS & SITES");
        expect(catTitle.getAttribute('class').indexOf('up_pftv_arrow-right')).to.not.equal(-1);
        var categoryFeatures = category.children[1].firstElementChild.firstElementChild;
        assert.equal(categoryFeatures.childElementCount, data.domainsAndSites.features.length);
        var typeTracks = category.children[2];
        assert.equal(typeTracks.style.display, 'none');
    });
    it('should open/close type tracks', function() {
        var category = document.getElementsByClassName('up_pftv_category-container')[0].firstElementChild;
        var catTitle = category.firstElementChild;
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, catTitle);
        catTitle.dispatchEvent(evt); //open
        var typeTracks = category.children[2];
        assert.equal(typeTracks.style.display, 'inline-block');

        catTitle.dispatchEvent(evt); //close
        assert.equal(typeTracks.style.display, 'none');
    });
    it('should create a metal in position 147', function() {
        var feature = data.domainsAndSites.features[0];
        var path = document.querySelector("[name='" + feature.internalId + "']");
        assert.equal(path.getAttribute('d'), 'M0,0L5,5L0,10L-5,5Z');
        assert.equal(path.getAttribute('class'), 'up_pftv_feature up_pftv_metal');
        assert.equal(path.getAttribute('transform'), 'translate(' + instance.xScale(+feature.begin) + ',5)');
    });
    it('should select a feature in position 147', function() {
        var feature = data.domainsAndSites.features[0];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        assert.equal(paths.length, 2);
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);
        paths[0].dispatchEvent(evt); //select

        assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature');
        assert.equal(paths[1].getAttribute('class'), 'up_pftv_feature up_pftv_metal');

        paths[0].dispatchEvent(evt); //deselect
        assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal');
    });
    it('should propagate selection on selected feature', function() {
        var feature = data.domainsAndSites.features[0];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);
        paths[0].dispatchEvent(evt); //select

        var category = document.getElementsByClassName('up_pftv_category-container')[0].firstElementChild;
        var catTitle = category.firstElementChild;
        var evtOpen = document.createEvent("MouseEvents");
        evtOpen.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, catTitle);
        catTitle.dispatchEvent(evtOpen); //open

        assert.equal(paths[1].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature');

        paths[0].dispatchEvent(evt); //deselect
        catTitle.dispatchEvent(evtOpen); //close
    });
    it('should select another feature', function() {
        var featureDS = data.domainsAndSites.features[0];
        var pathsDS = document.querySelectorAll("[name='" + featureDS.internalId + "']");
        var evtDS = document.createEvent("MouseEvents");
        evtDS.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, pathsDS[0]);
        pathsDS[0].dispatchEvent(evtDS); //select
        assert.equal(pathsDS[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature');

        var featureMP = data.moleculeProcessing.features[0];
        var pathsMP = document.querySelectorAll("[name='" + featureMP.internalId + "']");
        assert.equal(pathsMP[0].getAttribute('class'), 'up_pftv_feature up_pftv_signal');
        var evtMP = document.createEvent("MouseEvents");
        evtMP.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, pathsMP[0]);
        pathsMP[0].dispatchEvent(evtMP); //select another
        assert.equal(pathsDS[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal');
        assert.equal(pathsMP[0].getAttribute('class'), 'up_pftv_feature up_pftv_signal up_pftv_activeFeature');

        pathsMP[0].dispatchEvent(evtMP); //deselect
        assert.equal(pathsMP[0].getAttribute('class'), 'up_pftv_feature up_pftv_signal');
    });
    it('should zoom in/out', function() {
        var zoomIn = document.getElementsByClassName('up_pftv_icon-zoom-in')[0];
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, zoomIn);
        zoomIn.dispatchEvent(evt); //zoom in

        var feature = data.domainsAndSites.features[0];
        var path = document.querySelector("[name='" + feature.internalId + "']");
        assert.equal(path.getAttribute('transform'), 'translate(' + instance.xScale(+feature.begin) + ',5)');

        var extent = document.querySelector('.up_pftv_navruler .extent');
        assert.equal(extent.getAttribute('x'), 0);
        expect(extent.getAttribute('width')).to.be.above(0);
        var trapezoid = document.querySelector('.up_pftv_trapezoid');
        expect(trapezoid.getAttribute('d')).to.not.equal('M0,0');

        var resetButton = document.querySelector('.up_pftv_icon-arrows-cw');
        var evtReset = document.createEvent("MouseEvents");
        evtReset.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, resetButton);
        resetButton.dispatchEvent(evtReset); //zoom out
        assert.equal(extent.getAttribute('width'), 0);
        assert.equal(trapezoid.getAttribute('d'), 'M0,0')
    });
    it('', function() {

    });
});