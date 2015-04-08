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
        options.todo = self.test;
        var component = React.render(
            <ProteinTrack
                {...options}
            />,
            options.element
        );
        component.on('myEvent', function(obj) {
            console.log('i am listening');
            console.log(obj.value);
        });
        /*
        var wrapperId = options.wrapperSeedId + "_category_" + options.categoryIndex +
                    (options.isTrackCategory === true
                        ?  ""
                        : "_type_" + options.typeIndex
                    )
                ;
        console.log(wrapperId);
        //add attributes outside React: ok
        d3.select("#" + wrapperId).classed("newclass", true);
        //add non-standard attributes outside React: ok
        d3.select("#" + wrapperId).attr("index", "index_0");
        //d3.selectAll("svg").attr("height", "50px");
        d3.selectAll("path").remove();
        d3.select("g").selectAll("path").data([1])
        	.enter().append("path")
        	.attr("id", "up_pftv_bond-1_index_0")
        	.classed("up_pftv_bridge up_pftv_disulfid", true)
        	.attr("d", "M49.16326530612245 39 L 49.16326530612245 24 L 82.29154518950438 24 L 82.29154518950438 39 L 79.27988338192421 39 L 79.27988338192421 25 L 52.17492711370262 25 L 52.17492711370262 39 Z")
    	;
    	d3.select("#" + wrapperId).append("div");


        d3.select("body").append("div").attr("id", "otherId");
        options.wrapperSeedId = "diffId";
        React.render(
            <ProteinTrack
                {...options}
            />,
            document.getElementById("otherId")
        );
        */
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
    },
    _test = function(anything) {
        console.log("private TEST defined in parent");
        console.log(anything);
    }
;

CategoryTypeTrack.prototype.myVar = "i am a variable";
CategoryTypeTrack.prototype.test = function test(anything) {
    console.log("public TEST defined in parent");
    console.log(this);
    console.log(anything);
    console.log(this.myVar);
};