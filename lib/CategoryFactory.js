"use strict";

var $ = require("jquery");
var d3 = require("d3");

var Category = function(label) {
	var id = label.replace(/\s+/g, '-').toLowerCase();
	var categoryContainer = $('<div class="fv-category"></div>');
	categoryContainer.append('<span class="fv-category-name">' + label + '</span');
	categoryContainer.append('<svg class="fv-category-view" id=' + id + '></svg>');	
	return categoryContainer;
};

Category.basic = function(features) {
	this.categoryViewer = new BasicCategoryViewer(features);
};

Category.variant = function(features) {
	// this.categoryViewer = new VariantCategoryViewer(features);
}

var CategoryFactory = function() {
	return {
		createCategory: function(data, type) {
			var categoryViewerType = type,
				category;

			// error if the constructor doesn't exist
			if (typeof Category[type] !== "function") {
				console.log(type + " doesn't exist");
			}

			//inherit parent constructor
			Category[type].prototype = new Category(data.label);
			category = new Category[type](data.features);

			return category;
		}
	}
}();

var BasicCategoryViewer = function(features) {
	d3.select('#' + id)
		.selectAll('.feature')
		.data(features, function(d){
			console.log(d);
			return d;
		})
		.enter()
		.append('rect');
        // var typeClass = FTVUtils.stringToClass(type.type);
        // $.each(type.locations, function(location) {
        //     var locationType = FTVUtils.stringToClass(location.locationType);
        //     categoryViewer._featureSVGGroup.selectAll("path." + typeClass + "." + locationType)
        //         .attr("d", function (feature) {
        //             if (feature.color == undefined) {
        //                 feature.color = d3.select(this).style("fill");
        //             }
        //             categoryViewer._calculatePosition(location.locationType, feature);
        //             return FTVUtils.getShape(location.locationType, feature, categoryViewer._pixelPerAA, categoryViewer.opt.useShapes, typeClass);
        //         })
        //     ;
        // });
};

module.exports = CategoryFactory;