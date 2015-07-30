/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var ViewerFactory = require("./ViewerFactory");

var aaList = ['H', 'R', 'K', 'E', 'D', 'Q', 'N', 'Y', 'C', 'T', 'S', 'G', 'M', 'W', 'F', 'P', 'I', 'L', 'V', 'A', '*'];

var VariantViewer = function(features, container, fv, width) {
    var variantViewer = this;

    var height = 430;

    var variationPlot = function() {
        var xScale = d3.scale.ordinal(),
            yScale = d3.scale.linear();

        var frequency = d3.scale.pow()
            .exponent(0.001)
            .domain([0, 1])
            .range([5, 10]);

        var drawMainSequence = function(bars) {
            var circle = bars.selectAll('circle')
                .data(function(d) {
                    return [d];
                });

            circle
                .enter()
                .append('circle');

            circle.attr('cx', function(d) {
                    return xScale(d.pos);
                })
                .attr('cy', function(d) {
                    return yScale(d.normal);
                })
                .attr('r', 1)
                .attr('style','visibility:hidden')
                .attr('class', 'main-seq');

            circle.exit().remove();
        };

        var drawVariants = function(bars) {
            // var variantGroup = bars.append('g')
            //     .attr('id', 'variant-group');

            var variantCircle = bars.selectAll('circle')
                .data(function(d) {
                    return d.variants;
                });

            variantCircle.enter().append('circle');

            variantCircle.attr('cx', function(d) {
                    return xScale(d.begin);
                })
                .attr('cy', function(d) {
                    return yScale(d.mutation);
                })
                .attr('r', function(d) {
                    return frequency(d.frequency ? d.frequency : 0);
                })
                .attr('class', function(d) {
                    return  d.siftPrediction;
                })
            ;

            ViewerFactory.addEventsClassAndTitle(variantCircle, fv, container);

            variantCircle.exit().remove();
        };

        var variationPlot = function(selection) {
            var series, bars;

            selection.each(function(data) {
                // Generate chart
                series = d3.select(this);

                bars = series.selectAll('.var-series')
                    .data(data, function(d) {
                        return d.pos;
                    });

                bars.enter()
                    .append('g')
                    .classed('var-series', true);

                // drawMainSequence(bars);
                drawVariants(bars);

                bars.exit().remove();
            });
        };

        variationPlot.xScale = function(value) {
            if (!arguments.length) {
                return xScale;
            }
            xScale = value;
            return variationPlot;
        };

        variationPlot.yScale = function(value) {
            if (!arguments.length) {
                return yScale;
            }
            yScale = value;
            return variationPlot;
        };

        return variationPlot;
    };

    var xScale = fv.xScale;
    var margin = {top:20, bottom:10};

    var yScale = d3.scale.ordinal()
        .domain(aaList)
        .rangePoints([0, height - margin.top - margin.bottom]);

    var svg = ViewerFactory.createSVG(container, width, height, fv, 'variants-svg');

    var mainChart = svg.append('g')
                       .attr('transform','translate(0,' + margin.top + ')');

    var chartArea = mainChart.append('g')
        .attr('clip-path', 'url(#plotAreaClip)');

    mainChart.append('clipPath')
        .attr('id', 'plotAreaClip')
        .append('rect')
        .attr({ width: (width -20) , height: height})
        .attr('transform','translate(10, -10)');

    // Data series
    var series = variationPlot()
        .xScale(xScale)
        .yScale(yScale);

    var dataSeries = chartArea
        .datum(features)
        .call(series);

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .tickSize(-width)
        .orient('left');

    var yAxis2 = d3.svg.axis()
        .scale(yScale)
        .orient('right');


    mainChart.append('g')
        .attr('transform','translate(12 ,0)')
        .attr('class','variation-y axis')
        .call(yAxis);

    mainChart.append('g')
        .attr('transform','translate(' + (width - 20) + ', 0)')
        .attr('class','variation-y axis')
        .call(yAxis2);


    this.update = function() {
        dataSeries.call(series);
        if (fv.selectedFeature) {
            ViewerFactory.updateShadow(fv.selectedFeature, fv);
        }
    };

    return this;
};

module.exports = VariantViewer;