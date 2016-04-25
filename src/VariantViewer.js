/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var ViewerHelper = require("./ViewerHelper");
var LegendDialog = require("./VariantLegendDialog");
var VariantFilterDialog = require("./VariantFilterDialog");
var Evidence = require('./Evidence');

//'G', 'A', 'V', 'L', 'I' aliphatic. 'S', 'T' hydroxyl. 'C', 'M' sulfur-containing. 'D', 'N', 'E', 'Q' acidic.
// 'R', 'K', 'H' basic. 'F', 'Y', 'W' aromatic. 'P' imino. '*' stop gained or lost.
var aaList = ['G', 'A', 'V', 'L', 'I'
    , 'S', 'T'
    , 'C', 'M'
    , 'D', 'N', 'E', 'Q'
    , 'R', 'K', 'H'
    , 'F', 'Y', 'W'
    , 'P'
    , '*'];

var variantsFill = function(d, fv) {
    if((d.alternativeSequence === '*') || (d.begin > fv.maxPos)) {
        return LegendDialog.othersColor;
    } else if((d.sourceType === Evidence.variantSourceType.uniprot) ||
        (d.sourceType === Evidence.variantSourceType.mixed)) {
        if (Evidence.existAssociation(d.association)) {
            return LegendDialog.UPDiseaseColor;
        } else {
            return LegendDialog.UPNonDiseaseColor;
        }
    } else if (d.siftScore !== undefined) {
        return LegendDialog.getPredictionColor((d.siftScore + (1-d.polyphenScore))/2);
    } else {
        return LegendDialog.othersColor;
    }
};

var drawVariants = function(variantViewer, bars, frequency, fv, container, catTitle) {
    var variantCircle = bars.selectAll('circle')
        .data(function(d) {
            return d.variants;
        });

    var newCircles = variantCircle.enter().append('circle')
        .classed('up_pftv_variant', true)
        .attr('name', function(d, index) {
            d.internalId = d.internalId == undefined ? 'var_' + index : d.internalId;
            return d.internalId;
        })
        .attr('fill', function(d) {
            return variantsFill(d, fv);
        })
        .attr('cy', function(d) {
            return variantViewer.yScale(d.alternativeSequence);
        })
    ;

    variantCircle
        .attr('r', function(d) {
            return frequency(0);
        })
        .attr('cx', function(d) {
            return variantViewer.xScale(Math.min(d.begin, fv.sequence.length));
        })
    ;

    ViewerHelper.addEventsClassAndTitle(catTitle, newCircles, fv, container);
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

var VariantViewer = function(catTitle, features, container, fv, variantHeight, titleContainer) {
    var variantViewer = this;
    variantViewer.height = variantHeight;
    variantViewer.width = fv.width;
    variantViewer.showManual = true;
    variantViewer.showAutomatic = true;
    variantViewer.xScale = fv.xScale;
    variantViewer.margin = {top:20, bottom:10};
    variantViewer.features = features;

    var filter = new VariantFilterDialog(titleContainer, variantViewer);

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
                    .transition()
                    .duration(250)
                    .attr('class','up_pftv_var-series');

                drawVariants(variantViewer, bars, frequency, fv, container, catTitle);

                bars.exit().transition().duration(250).remove();
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

    var svg = ViewerHelper.createSVG(container, variantViewer.width, variantViewer.height, fv, 'up_pftv_variants-svg');

    // Data series
    var series = variationPlot()
        .xScale(variantViewer.xScale)
        .yScale(variantViewer.yScale);

    var dataSeries = createDataSeries(variantViewer, svg, features, series);

    this.update = function() {
        dataSeries.call(series);
        if (fv.selectedFeature) {
            ViewerHelper.updateShadow(fv.selectedFeature, fv);
        }
    };

    this.updateData = function(data) {
      dataSeries.datum(data);
      this.update();
    };

    return this;
};

module.exports = VariantViewer;
