"use strict";

var d3 = require("d3");
var _ = require("underscore");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var TooltipFactory = require("./TooltipFactory");

var aaList = ['H', 'R', 'K', 'E', 'D', 'Q', 'N', 'Y', 'C', 'T', 'S', 'G', 'M', 'W', 'F', 'P', 'I', 'L', 'V', 'A', '*'];

var VariantViewer = function(features, container, fv, width, clip, effectiveHeight) {
    var variantViewer = this;

    var height = 430;

    var variationPlot = function() {
        var xScale = d3.scale.ordinal(),
            yScale = d3.scale.linear();

        var frequency = d3.scale.linear()
            .domain([0, 1])
            .range([5, 10]);

        var seriousness = d3.scale.ordinal()
            .domain([0, 0.25, 0.75, 1.0])
            .range(['crimson', 'lightskyblue', 'lightgreen'])

        var drawMainSequence = function(bars) {
            var circle = bars.selectAll('circle')
                .data(function(d) {
                    return [d];
                });

            circle
                .enter()
                .append('circle');

            circle.attr('cx', function(d, i) {
                    return xScale(d.pos);
                })
                .attr('cy', function(d) {
                    return yScale(d.normal);
                })
                .attr('r', 4)
                .attr('class', 'main-seq');

            circle.exit().remove();
        }

        var drawVariants = function(bars) {
            var variantGroup = bars.append('g')
                .attr('id', 'variant-group');

            variantGroup.selectAll('circle')
                .data(function(d) {
                    return d.variants;
                })
                .enter()
                .append('circle')
                .attr('cx', function(d) {
                    return xScale(d.pos);
                })
                .attr('cy', function(d) {
                    return yScale(d.mutation);
                })
                .attr('r', function(d) {
                    return frequency(d.frequency);
                })
                .attr('fill', function(d) {
                    return (d.mutation === '*') ? 'teal' : seriousness(d.polyphenScore);
                });
        }

        var variationPlot = function(selection) {
            var series, bars;

            selection.each(function(data) {
                // Generate chart
                series = d3.select(this);

                bars = series.selectAll('.var-series')
                    .data(data, function(d) {
                        return d.pos;
                    })

                bars.enter()
                    .append('g')
                    .classed('var-series', true);

                drawMainSequence(bars);
                drawVariants(bars);

                bars.exit().remove();
            });
        }

        variationPlot.xScale = function(value) {
            if (!arguments.length) {
                return xScale;
            }
            xScale = value;
            return variationPlot;
        }

        variationPlot.yScale = function(value) {
            if (!arguments.length) {
                return yScale;
            }
            yScale = value;
            return variationPlot;
        }

        return variationPlot;
    }

    var maxPos = features.length;

    var xScale = d3.scale.linear()
        .domain([0, maxPos])
        .range([0, width]);

    var yScale = d3.scale.ordinal()
        .domain(aaList)
        .rangePoints([0, height]);

    var mainChart = container
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g');
        // .attr('transform','translate(' + margin.left + ',' + margin.top + ')');


    // var chartArea = mainChart.append('g')
    //     .attr('clip-path', 'url(#plotAreaClip)');

    // mainChart.append('clipPath')
    //     .attr('id', 'plotAreaClip')
    //     .append('rect')
    //     .attr({ width: width, height: height})
    //     .attr('transform','translate(0, ' + 0 + ')');

    // Data series
    // var series = variationPlot()
    //     .xScale(xScale)
    //     .yScale(yScale);

    // var dataSeries = chartArea
    //     .datum(features)
    //     .call(series);

    // var xAxis = d3.svg.axis()
    //     .scale(xScale);

    // var yAxis = d3.svg.axis()
    //     .scale(yScale)
    //     .tickSize(-width)
    //     .orient('left');

    // var yAxis2 = d3.svg.axis()
    //     .scale(yScale)
    //     .orient('right');

    // mainChart.append('g')
    //     .attr('transform','translate(0 ,' + height+ ')')
    //     .attr('class','x axis')
    //     .call(xAxis);

    // mainChart.append('g')
    //     .attr('class','y axis')
    //     .call(yAxis);

    // mainChart.append('g')
    //     .attr('transform','translate(' + width + ', 0)')
    //     .attr('class','y axis')
    //     .call(yAxis2);


    this.update = function() {};

    return this;
};

module.exports = VariantViewer;