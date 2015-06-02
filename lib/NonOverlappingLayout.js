'use strict';

var _ = require('underscore');

var NonOverlappingLayout = function(features) {
	var nonOverlappingLayout = this,
		rows = [];

	var Row = function() {
		var row = this,
			rowFeatures = [];

		row.containsOverlap = function(feature) {
			_.each(rowFeatures, function(d){
				if((feature.begin === d.begin) ||
				(feature.begin > d.begin && feature.begin < d.end) ||
				(feature.end < d.begin && feature.end > d.end)) {
					// continue;
				} else {
					return false;
				}
			});
			return true;
		}

		row.addFeature = function(feature) {
			rowFeatures.push(feature);
		}
	}

	nonOverlappingLayout.calculate = function(){

	};

	rows.push(new Row());

	_.each(features, function(feature){
		_.each(rows, function(row){
			if(!row.containsOverlap(feature)) {
				row.addFeature(feature);
				return;
			} else {
				var newRow = new Row();
				newRow.addFeature(feature);
				rows.push(newRow);
			}
		});
	});

}

module.exports = NonOverlappingLayout;