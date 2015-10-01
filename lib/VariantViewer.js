/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var ViewerFactory = require("./ViewerFactory");
var LegendFactory = require("./LegendFactory");
var VariantFilterDialog = require("./VariantFilterDialog");

var aaList = ['G', 'A', 'V', 'L', 'I' //aliphatic
    , 'S', 'T' //hydroxyl
    , 'C', 'M' //sulfur-containing
    , 'D', 'N', 'E', 'Q' //acidic
    , 'R', 'K', 'H' //basic
    , 'F', 'Y', 'W' //aromatic
    , 'P' //imino
    , '*']; //stop gained or lost

var drawMainSequence = function(variantViewer, bars) {
    var circle = bars.selectAll('circle')
        .data(function(d) {
            return [d];
        });

    circle
        .enter()
        .append('circle');

    circle.attr('cx', function(d) {
        return variantViewer.xScale(d.pos);
    })
        .attr('cy', function(d) {
            return variantViewer.yScale(d.normal);
        })
        .attr('r', 1)
        .attr('style','visibility:hidden')
        .attr('class', 'main-seq');

    circle.exit().remove();
};

var drawVariants = function(variantViewer, bars, frequency, fv, container) {
    var variantCircle = bars.selectAll('circle')
        .data(function(d) {
            return d.variants;
        });

    variantCircle.enter().append('circle');

    variantCircle
        .attr('cx', function(d) {
            return variantViewer.xScale(Math.min(d.begin, fv.sequence.length));
        })
        .attr('cy', function(d) {
            return variantViewer.yScale(d.mutation);
        })
        .attr('r', function() {
            return frequency(0);
        })
        .attr('fill', function(d) {
            if((d.mutation === '*') || (d.begin > fv.maxPos)) {
                return LegendFactory.othersColor;
            }
            else if(d.sp && d.association) {
                return LegendFactory.UPDiseaseColor;
            } else if (d.sp) {
                return LegendFactory.UPNonDiseaseColor;
            } else if (d.siftScore !== undefined) {
                return LegendFactory.getPredictionColor((d.siftScore + (1-d.polyphenScore))/2);
            } else {
                return LegendFactory.othersColor;
            }
        })
        .style('opacity', function(d) {
            return VariantFilterDialog.displayFeature(d) ? "" : 0;
        })
    ;

    ViewerFactory.addEventsClassAndTitle(variantCircle, fv, container);

    variantCircle.exit().remove();
};

var createDataSeries = function(variantViewer, svg, features, series) {
    var mainChart = svg.append('g')
        .attr('transform','translate(0,' + variantViewer.margin.top + ')');

    var chartArea = mainChart.append('g')
        .attr('clip-path', 'url(#plotAreaClip)');

    mainChart.append('clipPath')
        .attr('id', 'plotAreaClip')
        .append('rect')
        .attr({ width: (variantViewer.width -20) , height: variantViewer.height})
        .attr('transform','translate(10, -10)');

    var dataSeries = chartArea
        .datum(features)
        .call(series);

    var yAxis = d3.svg.axis()
        .scale(variantViewer.yScale)
        .tickSize(-variantViewer.width)
        .orient('left');

    var yAxis2 = d3.svg.axis()
        .scale(variantViewer.yScale)
        .orient('right');

    mainChart.append('g')
        .attr('transform','translate(12 ,0)')
        .attr('class','variation-y axis')
        .call(yAxis);

    mainChart.append('g')
        .attr('transform','translate(' + (variantViewer.width - 18) + ', 0)')
        .attr('class','variation-y axis')
        .call(yAxis2);

    return dataSeries;
};

var VariantViewer = function(features, container, fv) {
    var variantViewer = this;
    variantViewer.height = 430;
    variantViewer.width = fv.width;
    variantViewer.showManual = true;
    variantViewer.showAutomatic = true;
    variantViewer.xScale = fv.xScale;
    variantViewer.margin = {top:20, bottom:10};

    variantViewer.yScale = d3.scale.ordinal()
        .domain(aaList)
        .rangePoints([0, variantViewer.height - variantViewer.margin.top - variantViewer.margin.bottom]);

    var variationPlot = function() {
        var xScale = d3.scale.ordinal(),
            yScale = d3.scale.linear();

        var frequency = d3.scale.pow()
            .exponent(0.001)
            .domain([0, 1])
            .range([5, 10]);

        var variationPlot = function(selection) {
            var series, bars;

            selection.each(function(data) {
                // Generate chart
                series = d3.select(this);

                bars = series.selectAll('.up_pftv_var-series')
                    .data(data, function(d) {
                        return d.pos;
                    });

                bars.enter()
                    .append('g')
                    .classed('up_pftv_var-series', true);

                // drawMainSequence(variantViewer, bars);
                drawVariants(variantViewer, bars, frequency, fv, container);

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

    var svg = ViewerFactory.createSVG(container, variantViewer.width, variantViewer.height, fv, 'up_pftv_variants-svg');

    // Data series
    var series = variationPlot()
        .xScale(variantViewer.xScale)
        .yScale(variantViewer.yScale);

    var dataSeries = createDataSeries(variantViewer, svg, features, series);

    this.update = function() {
        dataSeries.call(series);
        if (fv.selectedFeature) {
            ViewerFactory.updateShadow(fv.selectedFeature, fv);
        }
    };

    return this;
};

module.exports = VariantViewer;