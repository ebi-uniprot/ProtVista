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
var DataLoader = require('../../lib/dataLoader');

var verifyShadowAttributes = function(containerClass, path, exactPath, translate, height, x) {
    var categoryShadow = document.querySelector('.' + containerClass + ' .up_pftv_shadow');

     if (path) {
         var transform = path.getAttribute('transform');
         transform = transform.substring(0, transform.indexOf(','));
         assert.equal(categoryShadow.getAttribute('transform'), transform + ',0)', 'shadow translation');
     } else {
         if (translate) {
             assert.equal(categoryShadow.getAttribute('transform'), translate, 'shadow translation');
         } else {
            expect(categoryShadow.getAttribute('transform')).to.be.null;
         }
     }

     if (exactPath) {
         assert.equal(categoryShadow.getAttribute('d'), exactPath, 'shadow path');
     } else {
         var shadowPath = categoryShadow.getAttribute('d');
         assert.equal(shadowPath.indexOf('M' + x + ','), 0, 'shadow initial x');
         assert.notEqual(shadowPath.indexOf(',' + height + 'L'), -1, 'shadow height');
     }
};

var verifyViewPortAttributes = function(verifyInitialX, verifyFullWidth, fullPath, opacity) {
    var extent = document.querySelector('.up_pftv_navruler .extent');

    if (verifyInitialX) {
        assert.equal(extent.getAttribute('x'), 10, 'navRuler.extent initial position');
    }
    if (verifyFullWidth) {
        assert.equal(extent.getAttribute('width'), 740, 'extent covers all width after zooming out');
    } else {
        expect(extent.getAttribute('width')).to.be.above(0);
    }

    var trapezoid = document.querySelector('.up_pftv_trapezoid');
    if (fullPath) {
        assert.equal(trapezoid.getAttribute('d'), fullPath, 'visible trapezoid');
    } else {
        expect(trapezoid.getAttribute('d')).to.not.equal('M0,0');
    }

};

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
            uniprotacc: 'nothing'
        };
        instance = new FeaturesViewer(opts);

        instance.getDispatcher().on("noData", function() {
            data = require('../../snippets/data/features.json');
            data.variants.features = DataLoader.processVariants(data);
            data = DataLoader.processData(data);

            instance.init(opts, data);
        });

        instance.getDispatcher().on("ready", function() {
            aaWidth = instance.xScale(2) - instance.xScale(1);
            gapRegion = aaWidth/2;
            done();
        });
    });

	it('should create 1 up_pftv_container with 5 children', function() {
        var mochaDiv = document.getElementById('mocha');
        assert.equal(mochaDiv.firstElementChild.getAttribute('class'), 'up_pftv_container', 'up_pftv_container' +
            ' existence inside test div');
        assert.equal(mochaDiv.childElementCount, 1, 'test div children count');
        var mainContainer = document.getElementsByClassName('up_pftv_container');
        assert.equal(mainContainer.length, 1, 'only one up_pftv_container');
        assert.equal(mainContainer[0].childElementCount, 5, 'up_pftv_container children count');
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

    it('should create 1 up_pftv_buttons with 3 children', function() {
        var buttonsDiv = document.querySelectorAll('.up_pftv_container>.up_pftv_buttons');
        assert.equal(buttonsDiv.length, 1, 'only one up_pftv_buttons');
        assert.equal(buttonsDiv[0].childElementCount, 3, 'up_pftv_buttons children count');

        var buttons = document.querySelectorAll('.up_pftv_buttons span');
        assert.equal(buttons.length, 3);
        assert.equal(buttons[0].getAttribute('class'), 'up_pftv_icon-eye-off', 'third button class');
        assert.equal(buttons[1].getAttribute('class'), 'up_pftv_icon-zoom-in', 'second button class');
        assert.equal(buttons[2].getAttribute('class'), 'up_pftv_icon-arrows-cw', 'first button class');
    });

    it('should create 2 aaViewers aa sequence', function() {
        var aaViewerDiv = document.querySelectorAll('.up_pftv_container .up_pftv_aaviewer');
        assert.equal(aaViewerDiv.length, 2, 'only one up_pftv_aaviewer');
        assert.equal(aaViewerDiv[0].childElementCount, 1, 'up_pftv_aaviewer children count');

        var aaText = document.querySelectorAll('.up_pftv_aa-text text');
        assert.equal(aaText.length, instance.sequence.length * 2, 'aa sequence length');
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
        assert.equal(categoryFeatures[10].childElementCount, data.ptm.features.length, 'third' +
            ' category' +
            ' features count');
        assert.equal(categoryFeatures[15].childElementCount, data.seqInfo.features.length, 'fourth' +
            ' category' +
            ' features count');
        assert.equal(categoryFeatures[18].childElementCount, data.structural.features.length, 'fifth' +
            ' category' +
            ' features count');
        assert.equal(categoryFeatures[22].childElementCount, data.topology.features.length, 'sixth' +
            ' category' +
            ' features count');
        assert.equal(categoryFeatures[25].childElementCount, data.mutagenesis.features.length, 'seventh' +
            ' category' +
            ' features count');
    });

    it('should create a category track with title and features', function() {
        var catTitle = document.querySelector('.up_pftv_category-container .up_pftv_category-name');
        assert.equal(catTitle.text.toUpperCase(), "DOMAINS & SITES", 'first category title');
        expect(catTitle.getAttribute('class').indexOf('up_pftv_arrow-right')).to.not.equal(-1);

        var categoryFeatures = document.querySelector('.up_pftv_category-container .up_pftv_category-viewer-group');
        assert.equal(categoryFeatures.childElementCount, data.domainsAndSites.features.length, 'first category' +
            ' features count');
    });

    it('should create one hidden vertical highlight on the category track', function() {
        var categoryShadowGroup = document.querySelector('.up_pftv_category-container g');
        assert.equal(categoryShadowGroup.childElementCount, 1, 'only one vertical shadow');

        verifyShadowAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
    });

    it('should create 10 hidden type track elements on the category track', function() {
        var typeTracksDiv = document.querySelector('.up_pftv_category-tracks');
        assert.equal(typeTracksDiv.style.display, 'none', 'type tracks display');
        assert.equal(typeTracksDiv.childElementCount, 10, 'type tracks count');
    });

    it('should create a hidden vertical highlight on the type track', function() {
        var typeShadow = document.querySelector('.up_pftv_track g');
        assert.equal(typeShadow.childElementCount, 1, 'only one vertical shadow');

        verifyShadowAttributes('up_pftv_track', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
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
        instance.overFeature = true;
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        assert.equal(paths.length, 2, 'number of metals in position 147 (1 in category, 1 in type)');
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);
        paths[0].dispatchEvent(evt); //select

        assert.equal(feature, instance.selectedFeature, 'selected feature');
        assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature', 'selected metal class');
        assert.equal(paths[1].getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'hidden type track metal class');
        instance.overFeature = false;
    });

    it('should activate vertical highlight after feature selection @147', function() {
        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
        var svg = document.querySelector('.up_pftv_category svg');

        verifyShadowAttributes('up_pftv_category', paths[0], undefined, undefined,
            svg.getAttribute('height'), -gapRegion);
    });

    it('should adjust vertical highlight for type tracks', function() {
        var typeShadow = document.querySelector('.up_pftv_track g');
        assert.equal(typeShadow.childElementCount, 1, 'only one vertical shadow');

        var feature = data.domainsAndSites.features[firstMetalPosition];
        var paths = document.querySelectorAll("[name='" + feature.internalId + "']");

        verifyShadowAttributes('up_pftv_track', paths[0], undefined, undefined,
            document.querySelector('.up_pftv_track svg').getAttribute('height'), -gapRegion);
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
        verifyShadowAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
    });

    it('should deactivate type vertical highlight after feature deselection @147', function() {
        verifyShadowAttributes('up_pftv_track', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
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

        assert.equal(typeTracks.style.display, 'block', 'type tracks display after opening');
        assert.equal(catTitle.getAttribute('class'), 'up_pftv_category-name up_pftv_arrow-down'
            , 'title class when category is open');
    });

    it('should select a type feature @147', function() {
        instance.overFeature = true;
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
        instance.overFeature = false;
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
            assert.equal(shadow.getAttribute('d').indexOf('M' + (-gapRegion) + ','), 0, 'shadow initial x');
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
        instance.overFeature = true;
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
        instance.overFeature = false;
    });

    it('should activate vertical highlight after feature selection @1-17', function() {
        var featureMP = data.moleculeProcessing.features[0];
        var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

        var svg = document.querySelector('.up_pftv_category svg');

        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));

        verifyShadowAttributes('up_pftv_category-container', paths[0], undefined, undefined,
            svg.getAttribute('height'), x);
    });

    it('should adjust vertical highlight for type tracks after feature selection @1-17', function() {
        var featureMP = data.moleculeProcessing.features[0];
        var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));

        verifyShadowAttributes('up_pftv_track', paths[0], undefined, undefined,
            document.querySelector('.up_pftv_track svg').getAttribute('height'), x);
    });

    it('should zoom in with button to the middle of the selected ft', function() {
        var zoomIn = document.querySelector('.up_pftv_icon-zoom-in');
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, zoomIn);
        zoomIn.dispatchEvent(evt); //zoom in
        flushAllD3Transitions();

        var feature = data.domainsAndSites.features[firstMetalPosition];
        var path = document.querySelector("[name='" + feature.internalId + "']");
        assert.equal(path.getAttribute('transform'), 'translate(' + instance.xScale(+feature.begin) + ',5)'
            , 'translated metal');

        verifyViewPortAttributes(true, false, 'M0,50L0,48L10,28L10,40L38.86866059817945,40L38.86866059817945,28L760,48L760,50Z', 1);
    });

    it('should display only zoom-out button', function() {
        var zoomBtn = document.querySelectorAll('.up_pftv_icon-zoom-in');
        assert.equal(zoomBtn.length, 0, 'no zoom-in button');

        zoomBtn = document.querySelectorAll('.up_pftv_icon-zoom-out');
        assert.equal(zoomBtn.length, 1, 'only one zoom-out button');
    });

    it('should adjust vertical highlight after zooming', function() {
        var featureMP = data.moleculeProcessing.features[0];
        var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));

        verifyShadowAttributes('up_pftv_category', paths[0], undefined, undefined,
            document.querySelector('.up_pftv_category svg').getAttribute('height'), x);
    });

    it('should zoom-out with button', function() {
        var zoomOutButton = document.querySelector('.up_pftv_icon-zoom-out');
        var outEvent = document.createEvent("MouseEvents");
        outEvent.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, zoomOutButton);
        zoomOutButton.dispatchEvent(outEvent); //zoom out
        flushAllD3Transitions();

        verifyViewPortAttributes(false, true, 'M0,50L0,48L10,28L10,40L750,40L750,28L760,48L760,50Z', 0);
    });

    it('should keep selection after zooming-out', function() {
        var selectedFeature = document.querySelectorAll('.up_pftv_activeFeature');
        assert.equal(selectedFeature.length, 2, 'feature still selected');
        expect(instance.selectedFeature).to.be.not.undefined;
    });

    it('should keep shadow after zooming-out', function() {
        var featureMP = data.moleculeProcessing.features[0];
        var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));

        verifyShadowAttributes('up_pftv_category', paths[0], undefined, undefined,
            document.querySelector('.up_pftv_category svg').getAttribute('height'), x);
    });

    it('should keep selection on div click', function() {
        var svgDiv = document.querySelector('.up_pftv_category-viewer');
        var evtDiv = document.createEvent("MouseEvents");
        evtDiv.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, svgDiv);
        svgDiv.dispatchEvent(evtDiv);

        var selectedFeature = document.querySelectorAll('.up_pftv_activeFeature');
        assert.equal(selectedFeature.length, 2, 'feature still selected');
        expect(instance.selectedFeature).to.be.not.undefined;

        var featureMP = data.moleculeProcessing.features[0];
        var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

        var shapePath = paths[0].getAttribute('d');
        var x = shapePath.substring(1, shapePath.indexOf(','));

        verifyShadowAttributes('up_pftv_category', paths[0], undefined, undefined,
            document.querySelector('.up_pftv_category svg').getAttribute('height'), x);
    });

    it('should reset view (zoom out and deselect features)', function() {
        var resetButton = document.querySelector('.up_pftv_icon-arrows-cw');
        var evtReset = document.createEvent("MouseEvents");
        evtReset.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, resetButton);
        resetButton.dispatchEvent(evtReset); //zoom out
        flushAllD3Transitions();

        verifyViewPortAttributes(false, true, 'M0,50L0,48L10,28L10,40L750,40L750,28L760,48L760,50Z', 0);

        var selectedFeature = document.querySelectorAll('.up_pftv_activeFeature');
        assert.equal(selectedFeature.length, 0, 'no feature selected anymore');
        expect(instance.selectedFeature).to.be.undefined;

        verifyShadowAttributes('up_pftv_category', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
    });

    it('should keep tooltip open', function() {
        var tooltip = document.querySelectorAll('.up_pftv_tooltip-container');
        assert.equal(tooltip.length, 1, 'tooltip still exists');
    });

    it('should go back to zoom-in button', function() {
        var zoomBtn = document.querySelectorAll('.up_pftv_icon-zoom-in');
        assert.equal(zoomBtn.length, 1, 'only 1 zoom-in button');

        zoomBtn = document.querySelectorAll('.up_pftv_icon-zoom-out');
        assert.equal(zoomBtn.length, 0, 'no zoom-out button');
    });

    it('should zoom-in with button to position 1 when no ft is selected', function() {
        var zoomInButton = document.querySelector('.up_pftv_icon-zoom-in');
        var inEvent = document.createEvent("MouseEvents");
        inEvent.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, zoomInButton);
        zoomInButton.dispatchEvent(inEvent); //zoom in
        flushAllD3Transitions();

        verifyViewPortAttributes(false, false, 'M0,50L0,48L10,28L10,40L37.90637191157347,40L37.90637191157347,28L760,48L760,50Z', 1);
    });

    it('should deselect feature on svg click', function() {
        var featureMP = data.moleculeProcessing.features[0];
        var pathsMP = document.querySelectorAll("[name='" + featureMP.internalId + "']");
        var evtMP = document.createEvent("MouseEvents");
        evtMP.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, pathsMP[0]);
        pathsMP[0].dispatchEvent(evtMP);

        var svg = document.querySelector('.up_pftv_category-viewer svg');
        var evtSVGDown = document.createEvent("MouseEvents");
        evtSVGDown.initMouseEvent("mousedown", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, svg);
        svg.dispatchEvent(evtSVGDown);
        var evtSVGUp = document.createEvent("MouseEvents");
        evtSVGUp.initMouseEvent("mouseup", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, svg);
        svg.dispatchEvent(evtSVGUp);

        var selectedFeature = document.querySelectorAll('.up_pftv_activeFeature');
        assert.equal(selectedFeature.length, 0, 'no feature selected anymore');
        expect(instance.selectedFeature).to.be.undefined;

        verifyShadowAttributes('up_pftv_category', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
    });
});