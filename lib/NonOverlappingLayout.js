'use strict';

var $ = require('jquery');
var _ = require('underscore');

var NonOverlappingLayout = function(features, totalHeight) {
	var nonOverlappingLayout = this,
		rows = [],
		rowHeight = 0,
		padding = 1,
		minHeight = 15;

	nonOverlappingLayout.totalHeight = totalHeight;

	var Row = function() {
		var row = this;
		
		row.rowFeatures = [];

		row.containsOverlap = function(feature) {
			var overlapping = false;
			$.each(row.rowFeatures, function(i,d){
				if((Number(feature.begin) >= Number(d.begin) && Number(feature.begin) <= Number(d.end))
					|| (Number(feature.end) >= Number(d.begin)) && (Number(feature.end) <= Number(d.end))) {
					overlapping = true;
					return false;
				}
			});
			return overlapping;
		};

		row.addFeature = function(feature) {
			row.rowFeatures.push(feature);
		};
	};

	nonOverlappingLayout.calculate = function(){
		rowHeight = ((nonOverlappingLayout.totalHeight /rows.length < minHeight)? nonOverlappingLayout.totalHeight /rows.length : minHeight ) - 2 * padding;
	};

	nonOverlappingLayout.getYPos = function(feature) {
		var yPos,
			yOffset = (nonOverlappingLayout.totalHeight /rows.length > minHeight) ? (nonOverlappingLayout.totalHeight - (rows.length*minHeight))/2 : 0;
		_.each(rows, function(row, i) {
			_.each(row.rowFeatures, function(currFeature){
				if(currFeature === feature) {
					yPos = (i * (rowHeight + 2*padding) 
						+ yOffset);
				}
			});
		});
		return yPos;
	};

	nonOverlappingLayout.getRows = function() {
		return rows;
	};

	nonOverlappingLayout.getFeatureHeight = function() {
		return rowHeight;
	};

	$.each(features, function(i, feature){
		var createNewRow = true;
		$.each(rows, function(i, row){
			if(!row.containsOverlap(feature)) {
				row.addFeature(feature);
				createNewRow = false;
				return false;
			} 
		});
		if(createNewRow) {
			var row = new Row();
			row.addFeature(feature);
			rows.push(row);
		}
	});
};

module.exports = NonOverlappingLayout;