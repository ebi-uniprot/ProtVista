// Create a fake global `window` and `document` object:
require('./testdom')('<html><body></body></html>');

var assert = require('assert');
var ReactAO = require('react/addons');
var React = require('react');
var TestUtils = React.addons.TestUtils;
var ProteinTrack = require('../lib/pftv-layout-proteinTrack.jsx');
var LayoutGlobal = require('../lib/pftv-layout-global');

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

        var titleClose = LayoutGlobal.arrowRight + " ";
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.cssPrefix + "categoryTitle");
        assert.equal(divTitle.getDOMNode().textContent, titleClose);
    });
    it('opens and closes a track', function() {
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.cssPrefix + "categoryTitle");

        TestUtils.Simulate.click(divTitle);
        assert.equal(component.isClosed, false);

        TestUtils.Simulate.click(divTitle);
        assert.equal(component.isClosed, true);
    });
    it('checks title and feature classes for a short title with regions', function() {
        var options = {
            title: "MOLECULE PROCESSING",
            content: LayoutGlobal.withRegions
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.cssPrefix + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.cssPrefix + "withRegionsShort") != -1, true);
    });
    it('checks title and feature classes for a short title with bridges', function() {
        var options = {
            title: "MOLECULE PROCESSING",
            content: LayoutGlobal.withBridges
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.cssPrefix + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.cssPrefix + "withBridgesShort") != -1, true);
    });
    it('checks title and feature classes for a short title with shapes', function() {
        var options = {
            title: "MOLECULE PROCESSING",
            content: LayoutGlobal.withShapes
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.cssPrefix + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.cssPrefix + "withShapesShort") != -1, true);
    });
    it('checks title and feature classes for variants category with a short title', function() {
        var options = {
            title: "MOLECULE PROCESSING",
            content: LayoutGlobal.withVariants
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.cssPrefix + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.cssPrefix + "withVariants") != -1, true);
    });
    it('checks title and feature classes for variants category with a long title', function() {
        var options = {
            title: "MOLECULE PROCESSING LONG TITLE",
            content: LayoutGlobal.withVariants
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.cssPrefix + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.cssPrefix + "withVariants") != -1, true);
    });
    it('checks title and feature classes for variants category', function() {
        var options = {
            title: "MOLECULE PROCESSING LONG TITLE"
        };
        var component = TestUtils.renderIntoDocument(
            <ProteinTrack {...options}/>
        );
        var divTitle = TestUtils.findRenderedDOMComponentWithClass(component, LayoutGlobal.cssPrefix + "categoryTitle");
        assert.equal(divTitle.getDOMNode().className.indexOf(LayoutGlobal.cssPrefix + "longTitle") != -1, true);
    });
});
