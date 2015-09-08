/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");

var Spinner = function() {
    return {
        loadSpinner: function(config) {
            var radius = Math.min(config.width, config.height) / 2;
            var tau = 2 * Math.PI;

            var arc = d3.svg.arc()
                .innerRadius(radius*0.5)
                .outerRadius(radius*0.9)
                .startAngle(0);

            var svg = d3.select(config.container).append("svg")
                .classed('up_pftv_spinner', true)
                .attr("id", config.id)
                .attr("width", config.width)
                .attr("height", config.height)
                .append("g")
                .attr("transform", "translate(" + config.width / 2 + "," + config.height / 2 + ")");

            svg.append("path")
                .datum({endAngle: 0.33*tau})
                .style("fill", "#4D4D4D")
                .attr("d", arc)
                .call(spin, 1000);

            function spin(selection, duration) {
                selection.transition()
                    .ease("linear")
                    .duration(duration)
                    .attrTween("transform", function() {
                        return d3.interpolateString("rotate(0)", "rotate(360)");
                    });
                setTimeout(function() { spin(selection, duration); }, duration);
            }
        },
        removeSpinner: function() {
            d3.selectAll('.up_pftv_spinner').remove();
        }
    };
}();

module.exports = Spinner;