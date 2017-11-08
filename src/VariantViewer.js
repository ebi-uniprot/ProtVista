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
var Constants = require("./Constants");

//'G', 'A', 'V', 'L', 'I' aliphatic. 'S', 'T' hydroxyl. 'C', 'M' sulfur-containing. 'D', 'N', 'E', 'Q' acidic.
// 'R', 'K', 'H' basic. 'F', 'Y', 'W' aromatic. 'P' imino. '*' stop gained or lost.
var aaList = ['G', 'A', 'V', 'L', 'I', 'S', 'T', 'C', 'M', 'D', 'N', 'E', 'Q', 'R', 'K', 'H', 'F', 'Y', 'W', 'P', 'd', '*'];

var getPredictionColorScore = function(siftScore, siftPrediction, polyphenScore, polyphenPrediction) {
    var sift = false,
        polyphen = false;
    if ((polyphenPrediction !== undefined) && (polyphenPrediction !== 'unknown')) {
        polyphen = polyphenScore !== undefined ? true : false;
    }
    if (siftPrediction !== undefined) {
        sift = siftScore !== undefined ? true : false;
    }
    if (sift && polyphen) {
        return (siftScore + (1 - polyphenScore)) / 2;
    } else if (sift && !polyphen) {
        return siftScore;
    } else if (!sift && polyphen) {
        return 1 - polyphenScore;
    } else if (polyphenPrediction === 'unknown') {
        return 1;
    } else {
        return undefined;
    }
};

var getVariantsFillColor = function(fv, d, extDatum, externalPrediction, predictionScore) {
    if (d.externalData && extDatum.consequence) {
        var pos = Constants.getConsequenceTypes().indexOf(extDatum.consequence);
        return pos !== -1 ? LegendDialog.consequenceColors[pos%LegendDialog.consequenceColors.length] : 'black';
    }

    if (fv.overwritePredictions === true) {
        if (externalPrediction !== undefined) {
            d.siftInUse = false;
            d.polyphenInUse = false;
            extDatum.siftInUse = true;
            extDatum.polyphenInUse = true;
            return LegendDialog.getPredictionColor(externalPrediction);
        } else if (predictionScore !== undefined) {
            return LegendDialog.getPredictionColor(predictionScore);
        }
    } else {
        if (predictionScore !== undefined) {
            return LegendDialog.getPredictionColor(predictionScore);
        } else if (externalPrediction !== undefined) {
            d.siftInUse = false;
            d.polyphenInUse = false;
            extDatum.siftInUse = true;
            extDatum.polyphenInUse = true;
            return LegendDialog.getPredictionColor(externalPrediction);
        }
    }

    if (d.externalData) {
        return 'black';
    } else {
        return LegendDialog.othersColor;
    }
};

var variantsFill = function(d, fv) {
    if ((d.alternativeSequence === '*') || (d.begin > fv.maxPos)) {
        return LegendDialog.othersColor;
    } else if ((d.sourceType === Evidence.variantSourceType.uniprot) ||
        (d.sourceType === Evidence.variantSourceType.mixed)) {
        if (Evidence.existAssociation(d.association)) {
            return LegendDialog.UPDiseaseColor;
        } else {
            return LegendDialog.UPNonDiseaseColor;
        }
    } else {
        var externalPrediction, extDatum = {};
        if (d.externalData) {
            var keys = _.keys(d.externalData);
            extDatum = d.externalData[keys[0]];
            externalPrediction = getPredictionColorScore(extDatum.siftScore, extDatum.siftPrediction,
                extDatum.polyphenScore, extDatum.polyphenPrediction);
            extDatum.siftInUse = false;
            extDatum.polyphenInUse = false;
        }
        var predictionScore = getPredictionColorScore(d.siftScore, d.siftPrediction, d.polyphenScore,
            d.polyphenPrediction);

        return getVariantsFillColor(fv, d, extDatum, externalPrediction, predictionScore);
    }
};

var drawVariants = function(variantViewer, bars, frequency, fv, container, catTitle) {
    var variantCircle = bars.selectAll('circle')
        .data(function(d) {
            return d.variants;
        });

    var newCircles = variantCircle.enter().append('circle')
        .attr('r', function(d) {
            return frequency(0);
        });

    variantCircle
        .attr('class', function(d) {
            if (d === fv.selectedFeature) {
                return 'up_pftv_variant up_pftv_activeFeature';
            } else {
                return 'up_pftv_variant';
            }
        })
        .attr('cx', function(d) {
            return variantViewer.xScale(Math.min(d.begin, fv.sequence.length));
        })
        .attr('cy', function(d) {
            return variantViewer.yScale(d.alternativeSequence.charAt(0));
        })
        .attr('name', function(d) {
            var mutation = d.alternativeSequence === '*' ? 'STOP' :
                d.alternativeSequence;
            d.internalId = 'var_' + d.wildType + d.begin + mutation;
            return d.internalId;
        })
        .attr('fill', function(d) {
            return variantsFill(d, fv);
        })
        .attr('stroke', function(d) {
            if (d.externalData) {
                return 'black';
            } else {
                return 'none';
            }
        });

    ViewerHelper.addEventsClassAndTitle(catTitle, newCircles, fv, container);
    variantCircle.exit().remove();
};

var createDataSeries = function(fv, variantViewer, svg, features, series) {
    var mainChart = svg.append('g')
        .attr('transform', 'translate(0,' + variantViewer.margin.top + ')');

    var chartArea = mainChart.append('g')
        .attr('clip-path', 'url(#plotAreaClip)');

    mainChart.append('clipPath')
        .attr('id', 'plotAreaClip')
        .append('rect')
        .attr({ width: (variantViewer.width - 20), height: variantViewer.height })
        .attr('transform', 'translate(10, -10)');

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
        .attr('transform', 'translate(12 ,0)')
        .attr('class', 'variation-y axis')
        .call(yAxis);

    mainChart.append('g')
        .attr('transform', 'translate(' + (variantViewer.width - 18) + ', 0)')
        .attr('class', 'variation-y axis')
        .call(yAxis2);

    fv.globalContainer.selectAll('g.variation-y g.tick').attr('class', function(d) {
        return 'tick up_pftv_aa_' + (d === '*' ? 'loss' : (d === 'd') || (d === 'del') ? 'deletion' : d);
    });

    return dataSeries;
};

var VariantViewer = function(catTitle, features, container, fv, variantHeight, titleContainer) {
    var variantViewer = this;
    variantViewer.height = variantHeight;
    variantViewer.width = fv.width;
    variantViewer.showManual = true;
    variantViewer.showAutomatic = true;
    variantViewer.xScale = fv.xScale;
    variantViewer.margin = { top: 20, bottom: 10 };
    variantViewer.features = features;

    variantViewer.filter = new VariantFilterDialog(fv, titleContainer, variantViewer);

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

                var withVariants = _.filter(data, function(elem) {
                    return elem.variants.length !== 0;
                });

                bars = series.selectAll('.up_pftv_var-series')
                    .data(withVariants, function(d) {
                        return d.pos;
                    });

                bars.enter()
                    .append('g')
                    .transition()
                    .duration(250)
                    .attr('class', 'up_pftv_var-series');

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

    var dataSeries = createDataSeries(fv, variantViewer, svg, features, series);

    this.update = function() {
        dataSeries.call(series);
        if (fv.selectedFeature) {
            ViewerHelper.updateHighlight(fv);
        } else if (fv.highlight) {
            ViewerHelper.updateHighlight(fv);
        }
    };

    this.updateData = function(data) {
        dataSeries.datum(data);
        this.update();
    };

    this.reset = function() {
        this.filter.reset();
        this.updateData(this.features);
    };

    return this;
};

module.exports = VariantViewer;