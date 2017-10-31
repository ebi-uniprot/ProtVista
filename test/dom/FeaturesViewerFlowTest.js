/*
 * ProtVista
 * https://github.com/ebi-uniprot/ProtVista
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

// chai is an assertion library
var chai = require('chai');
var sinon = require('sinon');

// @see http://chaijs.com/api/assert/
var assert = chai.assert;
// register alternative styles
// @see http://chaijs.com/api/bdd/
var expect = chai.expect;

// this is your global div instance (see index.html)
var yourDiv = document.getElementById('mocha');

// requires your main app (specified in index.js)
var FeaturesViewer = require('../..');
var Constants = require('../../src/Constants');
var ViewerHelper = require('../../src/ViewerHelper');
var FeaturesData = require('./FeaturesData');
var jQuery = require('jquery');
var _ = require('underscore');
var d3 = require('d3');

var verifyHighlightAttributes = function(containerClass, path, exactPath, translate, height, x) {
    var categoryHighlight = document.querySelector('.' + containerClass + ' .up_pftv_highlight');

     if (path) {
         var transform = path.getAttribute('transform');
         transform = transform.substring(0, transform.indexOf(','));
         assert.equal(categoryHighlight.getAttribute('transform'), transform + ',0)', 'highlight translation');
     } else {
         if (translate) {
             assert.equal(categoryHighlight.getAttribute('transform'), translate, 'highlight translation');
         } else {
            expect(categoryHighlight.getAttribute('transform')).to.be.null;
         }
     }

     if (exactPath) {
         assert.equal(categoryHighlight.getAttribute('d'), exactPath, 'highlight path');
     } else {
         var highlightPath = categoryHighlight.getAttribute('d');
         assert.equal(highlightPath.indexOf('M' + x + ','), 0, 'highlight initial x');
         assert.notEqual(highlightPath.indexOf(',' + height + 'L'), -1, 'highlight height');
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
    var instance, data, aaWidth, gapRegion,
        firstMetalPosition = 9;

    var flushAllD3Transitions = function() {
        var now = Date.now;
        Date.now = function() { return Infinity; };
        d3.timer.flush();
        Date.now = now;
    };

    before(function(done) {
        sinon.stub(Constants, 'getDataSources', function() {
            return [{
                url: '',
                type: 'basic'
            }];
        });
        sinon.stub(jQuery, 'getJSON', function() {
            var deferred = jQuery.Deferred();
            setTimeout(function() {
                return deferred.resolve(FeaturesData.features);
            }, 5);
            return deferred;
        });
        var opts = {
            el: yourDiv,
            uniprotacc: ''
        };
        instance = new FeaturesViewer(opts);

        instance.getDispatcher().on("ready", function() {
            aaWidth = instance.xScale(2) - instance.xScale(1);
            gapRegion = aaWidth/2;
            data = instance.data;
            done();
        });
    });

    after(function() {
        Constants.getDataSources.restore();
        jQuery.getJSON.restore();
    });

    describe('Viewer initialization.', function() {
        it('should create 1 up_pftv_container with 3 children', function() {
            var mochaDiv = document.getElementById('mocha');
            assert.equal(mochaDiv.firstElementChild.getAttribute('class'), 'up_pftv_container', 'up_pftv_container' +
                ' existence inside test div');
            assert.equal(mochaDiv.childElementCount, 1, 'test div children count');
            var mainContainer = document.getElementsByClassName('up_pftv_container');
            assert.equal(mainContainer.length, 1, 'only one up_pftv_container');
            assert.equal(mainContainer[0].childElementCount, 3, 'up_pftv_container children count');
        });

        it('should create 1 nav-ruler with 1 SVG', function() {
            var navRuler = document.querySelectorAll('.up_pftv_container .up_pftv_navruler');
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
            var buttonsDiv = document.querySelectorAll('.up_pftv_container .up_pftv_buttons');
            assert.equal(buttonsDiv.length, 1, 'one up_pftv_buttons');
            assert.equal(buttonsDiv[0].childElementCount, 4, 'up_pftv_buttons children count');

            var buttons = document.querySelectorAll('.up_pftv_buttons a');
            assert.equal(buttons.length, 4, 'number of buttons');
            assert.equal(buttons[0].getAttribute('class'), 'up_pftv_icon-button up_pftv_icon-download',
                'download button class');
            assert.equal(buttons[1].getAttribute('class'), 'up_pftv_icon-button up_pftv_icon-location',
                'location button class');
            assert.equal(buttons[2].getAttribute('class'), 'up_pftv_icon-button up_pftv_icon-reset',
                'reset button class');
            assert.equal(buttons[3].getAttribute('class'), 'up_pftv_icon-button up_pftv_icon-zoom-in',
                'zoom-in button class');
        });

        it('should create 1 up_pftv_credit_buttons with no child', function() {
            var buttonsDiv = document.querySelectorAll('.up_pftv_container .up_pftv_credit');
            assert.equal(buttonsDiv.length, 1, 'only one up_pftv_credit');
            assert.equal(buttonsDiv[0].childElementCount, 0, 'up_pftv_credit children count');

            /*var buttons = document.querySelectorAll('.up_pftv_credit_buttons span');
            assert.equal(buttons.length, 1, 'number of credit buttons');
            assert.equal(buttons[0].firstElementChild.getAttribute('class'), 'fv-icon-info-circled', 'info button' +
                ' class');*/
        });

        it('should create 2 aaViewers aa sequence', function() {
            var aaViewerDiv = document.querySelectorAll('.up_pftv_container .up_pftv_aaviewer');
            assert.equal(aaViewerDiv.length, 2, 'only one up_pftv_aaviewer');
            assert.equal(aaViewerDiv[0].childElementCount, 1, 'up_pftv_aaviewer children count');

            var aaText = document.querySelectorAll('.up_pftv_aa-text text');
            assert.equal(aaText.length, instance.sequence.length * 2, 'aa sequence length');
        });

        it('should create 1 container with 10 sub-containers', function() {
            var catContainer = document.querySelectorAll('.up_pftv_container .up_pftv_category-container');
            assert.equal(catContainer.length, 1, 'only one up_pftv_category-container');
            assert.equal(catContainer[0].childElementCount, Constants.getCategoryNamesInOrder().length + 1,
                'up_pftv_category-container children count');

            assert.equal(catContainer[0].children[0].className, 'up_pftv_category_on_the_fly', 'one for on the fly' +
                ' categories');

            var children = document.querySelectorAll('.up_pftv_container .up_pftv_category');
            assert.equal(children.length, data.length, 'category count');
        });

        it('should create 1 category container with 6 category and type tracks', function() {
            var categoryFeatures = document.querySelectorAll('.up_pftv_category-container' +
                ' .up_pftv_category-viewer-group');

            var typesCount = 0, catFtCount = 0;
            _.each(Constants.getCategoryNamesInOrder(), function (value, index) {
                var category = _.find(data, function (datum) {
                    return datum[0] === value.name;
                });
                if (category) {
                    assert.equal(categoryFeatures[catFtCount].childElementCount, category[1].length,
                        ' category features count ' + category[0]);
                    typesCount += _.keys(_.groupBy(category[1], 'type')).length;
                    catFtCount = typesCount + index + 1;
                }
            });
            assert.equal(categoryFeatures.length, typesCount + data.length, 'category and type tracks number, ' +
                'variants excluded');
        });

        it('should create a category track with title and features', function() {
            var catTitle = document.querySelector('.up_pftv_category-container .up_pftv_category-name');
            assert.equal(catTitle.text.toUpperCase(), "DOMAINS & SITES", 'first category title');
            expect(catTitle.getAttribute('class').indexOf('up_pftv_arrow-right')).to.not.equal(-1);

            var categoryFeatures = document.querySelector('.up_pftv_category-container .up_pftv_category-viewer-group');
            assert.equal(categoryFeatures.childElementCount, data[0][1].length, 'first category' +
                ' features count');
        });

        it('should create one hidden vertical highlight on the category track', function() {
            var categoryHighlightGroup = document.querySelector('.up_pftv_category-container g');
            assert.equal(categoryHighlightGroup.childElementCount, 1, 'only one vertical highlight');

            verifyHighlightAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });

        it('should create 10 hidden type track elements on the category track', function() {
            var typeTracksDiv = document.querySelector('.up_pftv_category-tracks');
            assert.equal(typeTracksDiv.style.display, 'none', 'type tracks display');
            assert.equal(typeTracksDiv.childElementCount, 10, 'type tracks count');
        });

        it('should create a hidden vertical highlight on the type track', function() {
            var typeHighlight = document.querySelector('.up_pftv_track g');
            assert.equal(typeHighlight.childElementCount, 1, 'only one vertical highlight');

            verifyHighlightAttributes('up_pftv_track', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });

        it('should create a metal in position 147', function() {
            var feature = data[0][1][firstMetalPosition];
            var path = document.querySelector("[name='" + feature.internalId + "']");
            assert.equal(path.getAttribute('d'), 'M0,0L5,5L0,10L-5,5Z', 'metal path');
            assert.equal(path.getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'metal class');
            assert.equal(path.getAttribute('transform'), 'translate(' + instance.xScale(+feature.begin) + ',5)', 'metal' +
                ' translation');
        });
    });

    describe('Feature selection', function() {
        it('should select a category feature @147', function() {
            instance.overFeature = true;
            var feature = data[0][1][firstMetalPosition];
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
            var feature = data[0][1][firstMetalPosition];
            var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
            var svg = document.querySelector('.up_pftv_category svg');

            verifyHighlightAttributes('up_pftv_category', paths[0], undefined, undefined,
                svg.getAttribute('height'), -gapRegion);
        });

        it('should adjust vertical highlight for type tracks', function() {
            var typeHighlight = document.querySelector('.up_pftv_track g');
            assert.equal(typeHighlight.childElementCount, 1, 'only one vertical highlight');

            var feature = data[0][1][firstMetalPosition];
            var paths = document.querySelectorAll("[name='" + feature.internalId + "']");

            verifyHighlightAttributes('up_pftv_track', paths[0], undefined, undefined,
                document.querySelector('.up_pftv_track svg').getAttribute('height'), -gapRegion);
        });

        it('should open 1 tooltip after feature selection @147', function() {
            var tooltip = document.querySelectorAll('.up_pftv_tooltip-container');
            assert.equal(tooltip.length, 1, 'tooltip exists');
        });
    });

    describe('Closing tooltips', function() {
        it('should close 1 tooltip ', function() {
            var tooltip = document.querySelector('.up_pftv_tooltip-close');
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, tooltip);
            tooltip.dispatchEvent(evt); //close tooltip
            flushAllD3Transitions();

            var allTooltips = document.querySelectorAll('.up_pftv_tooltip-container');
            assert.equal(allTooltips.length, 0, 'tooltip does not exists');
        });
    });

    describe('Feature deselection', function() {
        it('should deselect the selected feature @147', function() {
            var feature = data[0][1][firstMetalPosition];
            var paths = document.querySelectorAll("[name='" + feature.internalId + "']");
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, paths[0]);

            paths[0].dispatchEvent(evt); //deselect
            assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal', 'unselected metal class');
            expect(instance.selectedFeature).to.be.undefined;
        });

        it('should not re-open 1 tooltip after feature deselection @147', function() {
            var tooltip = document.querySelectorAll('.up_pftv_tooltip-container');
            assert.equal(tooltip.length, 0, 'tooltip was not created');
        });

        it('should deactivate category vertical highlight after feature deselection @147', function() {
            verifyHighlightAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });

        it('should deactivate type vertical highlight after feature deselection @147', function() {
            verifyHighlightAttributes('up_pftv_track', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });
    });

    describe('Opening tracks', function() {
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
    });

    describe('Type feature selection', function() {
        it('should select a type feature @147', function() {
            instance.overFeature = true;
            var feature = data[0][1][firstMetalPosition];
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
            var feature = data[0][1][firstMetalPosition];
            var paths = document.querySelectorAll("[name='" + feature.internalId + "']");

            var transform = paths[0].getAttribute('transform');
            transform = transform.substring(0, transform.indexOf(','));

            var highlights = document.querySelectorAll('.up_pftv_highlight');
            for (var i = 0; i < highlights.length; i++) {
                var highlight = highlights[i];
                assert.equal(highlight.getAttribute('transform'), transform + ',0)', 'highlight translation');
                assert.equal(highlight.getAttribute('d').indexOf('M' + (-gapRegion) + ','), 0, 'highlight initial x');
            }
        });
    });

    describe('Closing categories', function() {
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
            var feature = data[0][1][firstMetalPosition];
            var paths = document.querySelectorAll("[name='" + feature.internalId + "']");

            assert.equal(paths[0].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature'
                , 'type track metal class');
            assert.equal(paths[1].getAttribute('class'), 'up_pftv_feature up_pftv_metal up_pftv_activeFeature'
                , 'type track metal class');
            assert.equal(feature, instance.selectedFeature, 'selected feature');
        });
    });

    describe('Feature selection when another on is already selected', function() {
        it('should select another feature, first molecule processing feature @1-17', function() {
            instance.overFeature = true;
            var featureDS = data[0][1][firstMetalPosition];
            var pathsDS = document.querySelectorAll("[name='" + featureDS.internalId + "']");

            var featureMP = data[1][1][0];
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
            var featureMP = data[1][1][0];
            var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

            var svg = document.querySelector('.up_pftv_category svg');

            var shapePath = paths[0].getAttribute('d');
            var x = shapePath.substring(1, shapePath.indexOf(','));

            verifyHighlightAttributes('up_pftv_category-container', paths[0], undefined, undefined,
                svg.getAttribute('height'), x);
        });

        it('should adjust vertical highlight for type tracks after feature selection @1-17', function() {
            var featureMP = data[1][1][0];
            var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

            var shapePath = paths[0].getAttribute('d');
            var x = shapePath.substring(1, shapePath.indexOf(','));

            verifyHighlightAttributes('up_pftv_track', paths[0], undefined, undefined,
                document.querySelector('.up_pftv_track svg').getAttribute('height'), x);
        });
    });

    describe('Zooming with icon', function() {
        it('should zoom in with button to the middle of the selected ft', function() {
            var zoomIn = document.querySelector('.up_pftv_icon-zoom-in');
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, zoomIn);
            zoomIn.dispatchEvent(evt); //zoom in
            flushAllD3Transitions();

            var feature = data[0][1][firstMetalPosition];
            var path = document.querySelector("[name='" + feature.internalId + "']");
            assert.equal(path.getAttribute('transform'), 'translate(' + instance.xScale(+feature.begin) + ',5)'
                , 'translated metal');

            verifyViewPortAttributes(true, false,
                'M0,50L0,48L10,28L10,40L38.86866059817945,40L38.86866059817945,28L760,48L760,50Z', 1);
        });

        it('should display only zoom-out button', function() {
            var zoomBtn = document.querySelectorAll('.up_pftv_icon-zoom-in');
            assert.equal(zoomBtn.length, 0, 'no zoom-in button');

            zoomBtn = document.querySelectorAll('.up_pftv_icon-zoom-out');
            assert.equal(zoomBtn.length, 1, 'only one zoom-out button');
        });

        it('should adjust vertical highlight after zooming', function() {
            var featureMP = data[1][1][0];
            var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

            var shapePath = paths[0].getAttribute('d');
            var x = shapePath.substring(1, shapePath.indexOf(','));

            verifyHighlightAttributes('up_pftv_category', paths[0], undefined, undefined,
                document.querySelector('.up_pftv_category svg').getAttribute('height'), x);
        });
    });

    describe('Zooming-out with icon', function() {
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
            assert.equal(selectedFeature.length, 2, 'feature still selected in overview and hidden type track');
            expect(instance.selectedFeature).to.be.not.undefined;
        });

        it('should keep highlight after zooming-out', function() {
            var featureMP = data[1][1][0];
            var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

            var shapePath = paths[0].getAttribute('d');
            var x = shapePath.substring(1, shapePath.indexOf(','));

            verifyHighlightAttributes('up_pftv_category', paths[0], undefined, undefined,
                document.querySelector('.up_pftv_category svg').getAttribute('height'), x);
        });
    });

    describe('Clicking outside div', function() {
        it('should keep selection on div click', function() {
            var svgDiv = document.querySelector('.up_pftv_category-viewer');
            var evtDiv = document.createEvent("MouseEvents");
            evtDiv.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, svgDiv);
            svgDiv.dispatchEvent(evtDiv);

            var selectedFeature = document.querySelectorAll('.up_pftv_activeFeature');
            assert.equal(selectedFeature.length, 2, 'feature still selected in overview and hidden type track');
            expect(instance.selectedFeature).to.be.not.undefined;

            var featureMP = data[1][1][0];
            var paths = document.querySelectorAll("[name='" + featureMP.internalId + "']");

            var shapePath = paths[0].getAttribute('d');
            var x = shapePath.substring(1, shapePath.indexOf(','));

            verifyHighlightAttributes('up_pftv_category', paths[0], undefined, undefined,
                document.querySelector('.up_pftv_category svg').getAttribute('height'), x);
        });
    });

    describe('Zooming when no feature is selected', function() {
        it('should zoom-in with button to position 1 when no ft is selected', function() {
            var zoomInButton = document.querySelector('.up_pftv_icon-zoom-in');
            var inEvent = document.createEvent("MouseEvents");
            inEvent.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, zoomInButton);
            zoomInButton.dispatchEvent(inEvent); //zoom in
            flushAllD3Transitions();

            verifyViewPortAttributes(false, false,
                'M0,50L0,48L10,28L10,40L38.86866059817945,40L38.86866059817945,28L760,48L760,50Z', 1);
        });
    });

    describe('Deselection on click outside the FT', function() {
        it('should deselect feature on svg click', function() {
            var featureMP = data[1][1][0];
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

            verifyHighlightAttributes('up_pftv_category', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });
    });

    describe('allow selection of features by using the selectFeature method', function() {
        var regionFeature;
        it('should select a REGION feature', function() {
            regionFeature = instance.selectFeature({type: 'REGION', begin: 96, end: 110});
            var activeFeature = document.querySelector('.up_pftv_activeFeature');

            assert.equal(instance.selectedFeature.begin, 96, 'begin selected region feature');
            assert.equal(instance.selectedFeature.end, 110, 'end selected region feature');
            assert.equal(activeFeature.getAttribute('class'), 'up_pftv_feature up_pftv_region up_pftv_activeFeature',
                'selected region class');
        });

        it('should have opened 1 tooltip after REGION feature selection', function() {
            var tooltip = document.querySelectorAll('.up_pftv_tooltip-container');
            assert.equal(tooltip.length, 1, 'region tooltip exists');
        });

        it('should select a MUTAGENESIS feature', function() {
            instance.selectFeature({type: 'MUTAGEN', begin: 198, end: 198, alternativeSequence: 'A'});
            var activeFeature = document.querySelector('.up_pftv_activeFeature');

            assert.equal(instance.selectedFeature.begin, 198, 'begin selected mutagen feature');
            assert.equal(instance.selectedFeature.end, 198, 'end selected mutagen feature');
            assert.equal(activeFeature.getAttribute('class'), 'up_pftv_feature up_pftv_mutagen up_pftv_activeFeature',
                'selected mutagen class');
        });

        it('should have deselected the REGION feature', function() {
            var feature = document.querySelector("[name='" + regionFeature.internalId + "']");
            assert.equal(feature.getAttribute('class'), 'up_pftv_feature up_pftv_region',
                'non-selected region class');
        });

        it('should still have only 1 tooltip after feature mutagen selection', function() {
            var tooltip = document.querySelectorAll('.up_pftv_tooltip-container');
            assert.equal(tooltip.length, 1, 'region tooltip exists');
        });
    });

    describe('allow feature deselection with method', function() {
        it('should deselect selected feature (whichever it is)', function() {
            instance.deselectFeature();
            var selected = document.querySelectorAll('.up_pftv_activeFeature');
            assert.equal(selected.length, 0, 'nothing selected');
            verifyHighlightAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });
    });

    describe('highlight region', function() {
        it('should not highlight region if no input', function(){
            instance.highlightRegion();
            assert.equal(instance.highlight, undefined, 'begin, end undefined');
            verifyHighlightAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });

        it('should not highlight if no begin', function() {
            instance.highlightRegion(undefined, 100);
            assert.equal(instance.highlight, undefined, 'begin undefined, end does not matter');
            verifyHighlightAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });

        it('should not highlight if begin > end', function() {
            instance.highlightRegion(100, 10);
            assert.equal(instance.highlight, undefined, 'begin > end');
            verifyHighlightAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });

        it('should not highlight if non-numeric input', function() {
            instance.highlightRegion('a', 'b');
            assert.equal(instance.highlight, undefined, 'begin, end non-numeric');
            verifyHighlightAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });

        it('should highlight region with begin < 0 and end > sequence lenght', function () {
            instance.highlightRegion(0, 1000);
            expect(instance.highlight).to.be.not.undefined;
            assert.equal(instance.highlight.begin, 1);
            assert.equal(instance.highlight.end, instance.sequence.length);

            verifyHighlightAttributes('up_pftv_category-container', undefined,
                ViewerHelper.highlightPath(instance.highlight, instance, 40),
                'translate(' + instance.xScale(1) + ',0)', 40, -gapRegion);
        });

        it('should highlight region with only begin', function () {
            instance.highlightRegion(10);
            expect(instance.highlight).to.be.not.undefined;
            assert.equal(instance.highlight.begin, 10);
            assert.equal(instance.highlight.end, 10);
        });

        it('should de-highlight after feature selection', function() {
            instance.selectFeature({type: 'REGION', begin: 96, end: 110});
            expect(instance.highlight).to.be.undefined;
        });

        it('should highlight region with valid begin < end', function () {
            instance.highlightRegion(10, 100);
            expect(instance.highlight).to.be.not.undefined;
            assert.equal(instance.highlight.begin, 10);
            assert.equal(instance.highlight.end, 100);
        });

        it('should deselect after the previous highlighting', function() {
            var selected = document.querySelectorAll('.up_pftv_activeFeature');
            assert.equal(selected.length, 0, 'nothing selected');
        });

        it('should de-highlight if clicking somewhere else', function() {
            var svg = document.querySelector('.up_pftv_category-viewer svg');
            var evtSVGDown = document.createEvent("MouseEvents");
            evtSVGDown.initMouseEvent("mousedown", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, svg);
            svg.dispatchEvent(evtSVGDown);
            var evtSVGUp = document.createEvent("MouseEvents");
            evtSVGUp.initMouseEvent("mouseup", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, svg);
            svg.dispatchEvent(evtSVGUp);

            expect(instance.highlight).to.be.undefined;
            verifyHighlightAttributes('up_pftv_category-container', undefined, 'M-1,-1', 'translate(-1,-1)', 0, 0);
        });
    });
});
