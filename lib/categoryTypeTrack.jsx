/** @jsx React.DOM */

var React   = require('react');
var ProteinTrack = require('./pftv-layout-proteinTrack.jsx');
var d3 = require('d3');

var CategoryTypeTrack;

module.exports = CategoryTypeTrack = function(options){
    _constructor(this, options);
};

/**
 * Private zone
 */
/*
 * Private variables
 * */
/*
 * Private methods
 * */
var
    /**
     * Constructor, it loads the default values for the options.
     * @param self This instance.
     * @params options Configuration options.
     * @private
     */
    _constructor = function(self, options) {
        React.render(
            <ProteinTrack
                {...options}
                //trackId={options.trackId}
                //trackIndex={options.trackIndex}
                //catWrapperId={options.catWrapperId}
                //allTypesWrapperId={options.allTypesWrapperId}
                //collapsible={options.collapsible}
                //dark={options.dark}
                //featuresStyle={options.featuresStyle}
            />,
            options.element
        );
        /*
        var dummyObject = d3.select("body").append("div")
            .classed("up_pftv_hiddenContainer", true)
            .attr("id", "up_pftv_hiddenContainer_id");
        var dummyElement = document.getElementById(dummyObject.attr("id"));
        var renderDiv = React.render(
            <HelloName name={options.name} style={options.style} id={options.id}/>,
            dummyElement
        );
        console.log("getDOMNode");
        console.log(renderDiv.getDOMNode());
        var d3Div = d3.select(renderDiv.getDOMNode()).classed("myClass", true);
        console.log("d3Div");
        console.log(d3Div);

        var child = dummyElement.childNodes[0];
        React.unmountComponentAtNode(dummyElement);
        console.log(child);
        options.element.appendChild(child);

        options.name = "Leyla";
        options.id = "otherId";
        renderDiv = React.render(
            <HelloName name={options.name} style={options.style} id={options.id}/>,
            dummyElement
        );
        child = dummyElement.childNodes[0];
        React.unmountComponentAtNode(dummyElement);
        console.log(child);
        options.element.appendChild(child);
        */
    }
;