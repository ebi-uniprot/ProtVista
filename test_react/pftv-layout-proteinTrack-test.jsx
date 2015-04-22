// Create a fake global `window` and `document` object:
require('./testdom')('<html><body></body></html>');

var assert = require('assert');
var ReactAO = require('react/addons');
var React = require('react');
var TestUtils = React.addons.TestUtils;
var ProteinTrack = require('../lib/ptv-layout-proteinTrack.jsx');
var LayoutGlobal = require('../lib/ptv-layout-global');

describe('pftv-layout-proteinTrack', function() {
    afterEach(function(done) {
        ReactAO.unmountComponentAtNode(document.body);
        document.body.innerHTML = "";
        setTimeout(done);
    });
    it('renders a default component', function() {
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack/>
        );
        assert.equal(component.isClosed, true);

        var titleClose = LayoutGlobal.ARROW_RIGHT + " ";
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitle");
        assert.equal(divTitle.getDOMNode().textContent, titleClose);
    });
    it('opens and closes a track', function() {
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitle");

        TestUtils.Simulate.click(divTitle);
        assert.equal(component.isClosed, false);

        TestUtils.Simulate.click(divTitle);
        assert.equal(component.isClosed, true);
    });
    it('attempts to open a type track (type tracks do not open/close)', function() {
        var options = {
            isTrackCategory: false
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );

        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitleNoCollapsible");
        try {
            TestUtils.Simulate.click(divTitle);
        } catch (error) {
            assert(true);
        }
    });
    it('attempts to access a category title div from a type track', function() {
        var options = {
            isTrackCategory: false
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );

        try {
            TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitle");
        } catch (error) {
            assert(true);
        }
    });
    it('checks no arrow in title when isTrackCategory is false', function() {
        var options = {
            isTrackCategory: false
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitleNoCollapsible");
        assert.equal(divTitle.getDOMNode().textContent.indexOf(LayoutGlobal.ARROW_RIGHT) === -1, true);
    });
    it('checks title and feature classes for a short title with regions', function() {
        var options = {
            title: "MOLECULE PROCESSING",
            content: LayoutGlobal.WITH_REGIONS
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.CSS_PREFIX + "withRegionsShort") != -1, true);
    });
    it('checks title and feature classes for a short title with bridges', function() {
        var options = {
            title: "MOLECULE PROCESSING",
            content: LayoutGlobal.WITH_BRIDGES
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.CSS_PREFIX + "withBridgesShort") != -1, true);
    });
    it('checks title and feature classes for a short title with shapes', function() {
        var options = {
            title: "MOLECULE PROCESSING",
            content: LayoutGlobal.WITH_SHAPES
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.CSS_PREFIX + "withShapesShort") != -1, true);
    });
    it('checks title and feature classes for variants category with a short title', function() {
        var options = {
            title: "MOLECULE PROCESSING",
            content: LayoutGlobal.WITH_VARIANTS
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.CSS_PREFIX + "withVariants") != -1, true);
    });
    it('checks title and feature classes for variants category with a long title', function() {
        var options = {
            title: "MOLECULE PROCESSING LONG TITLE",
            content: LayoutGlobal.WITH_VARIANTS
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.CSS_PREFIX + "withVariants") != -1, true);
    });
    it('checks title and feature classes for variants category', function() {
        var options = {
            title: "MOLECULE PROCESSING LONG TITLE"
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.CSS_PREFIX + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.CSS_PREFIX + "longTitle") != -1, true);
    });
    it('checks that allTypes div exists for categories', function() {
        var options = {
            isTrackCategory: true
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        assert.equal(component.allTypesWrapperId == undefined, false);
    });
    it('checks that allTypes div does not exist for types', function() {
        var options = {
            isTrackCategory: false
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        assert.equal(component.allTypesWrapperId == undefined, true);
    });
});
