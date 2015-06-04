'use strict';

var $ = require('jquery');
var _ = require('underscore');

var NonOverlappingLayout = function(features) {
	var nonOverlappingLayout = this,
		rows = [],
		rowHeight = 0;

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
		}

		row.addFeature = function(feature) {
			row.rowFeatures.push(feature);
		}
	}

	nonOverlappingLayout.calculate = function(totalHeight){
		rowHeight = (totalHeight/rows.length < 10)? totalHeight/rows.length : 10;
	};

	nonOverlappingLayout.getYPos = function(feature) {
		var yPos;
		_.each(rows, function(row, i) {
			_.each(row.rowFeatures, function(currFeature){
				if(currFeature === feature) {
					yPos = i * rowHeight;
				}
			});
		});
		return yPos;
	}

	nonOverlappingLayout.getRows = function() {
		return rows;
	}

	nonOverlappingLayout.getFeatureHeight = function() {
		return rowHeight;
	}

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
	console.log(rows);
}

module.exports = NonOverlappingLayout;