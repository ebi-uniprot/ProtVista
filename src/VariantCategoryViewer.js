/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var ViewerHelper = require("./ViewerHelper");

var VariantCategoryViewer = function(category) {
    var varCatViewer = this;
    varCatViewer.features = category.data;

    var height = 40;
    var container = category.viewerContainer,
        xScale = category.fv.xScale,
        width = category.fv.width,
        zoom = category.fv.zoom;

    varCatViewer.varChart = ViewerHelper.createSVG(container, width, height, category.fv, 'up_pftv_variation-chart');

    varCatViewer.variationCountArray = _.map(varCatViewer.features, function(d) {
        return d.variants.length;
    });

    var varYScale = d3.scale.linear()
        .domain([0,d3.max(varCatViewer.variationCountArray)])
        .range([height, 0]);

    var line = d3.svg.line()
        .x(function(d,i) {
            return xScale(i);
        })
        .y(function(d) {
            return varYScale(d);
        })
        .interpolate('linear');

    this.init = function () {
        var varCatViewer = this;
        varCatViewer.varChart.append("path")
            .data(varCatViewer.features)
            .attr("class","up_pftv_block-area")
            .attr("d",line(varCatViewer.variationCountArray))
            .on('click', function(){
                category.toggle();
            })
            .append('title').text('Number of variants per position');

        varCatViewer.varChart.append("path")
            .data(varCatViewer.features)
            .attr("class","up_pftv_line")
            .attr("d",line(varCatViewer.variationCountArray))
            .on('click', function(){
                category.toggle();
            })
            .append('title').text('Number of variants per position');
    };

    this.init();

    this.update = function() {
        var varCatViewer = this;
        varCatViewer.varChart.selectAll(".up_pftv_block-area")
            .data(varCatViewer.features)
            .attr("class","up_pftv_block-area")
            .attr("d",line(varCatViewer.variationCountArray));

        varCatViewer.varChart.selectAll(".up_pftv_line")
            .data(varCatViewer.features)
            .attr("class","up_pftv_line")
            .attr("d",line(varCatViewer.variationCountArray));
    };

    this.updateData = function(data) {
        var varCatViewer = this;
        varCatViewer.features = data;

        varCatViewer.variationCountArray = _.map(varCatViewer.features, function(d) {
            return d.variants.length;
        });

        varCatViewer.varChart.selectAll(".up_pftv_block-area").remove();
        varCatViewer.varChart.selectAll(".up_pftv_line").remove();
        this.init();
    };

    return this;
};

module.exports = VariantCategoryViewer;