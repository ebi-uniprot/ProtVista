'use strict';

var _ = require('underscore');

var NonOverlappingLayout = function(features) {
	var nonOverlappingLayout = this,
		rows = [],
		rowHeight = 0;

	var Row = function() {
		var row = this;
		
		row.rowFeatures = [];

		row.containsOverlap = function(feature) {

			var overlapping = true;
			_.each(row.rowFeatures, function(d){
                            // if ( ((start-gap) < trackStart) && ((end+gap) <= trackStart) ) { //starts and ends before
                            //     overlapping = false;
                            // } else if ((start-gap) >= trackEnd) { //starts after
                            //     overlapping = false;
                            // }
                if (feature.begin === feature.end) {
                    if ( (feature.begin < d.begin) && (feature.begin < d.end) ) { //starts and ends before
                        overlapping = false;
                    } else if (feature.begin  > d.end) { //starts after
                        overlapping = false;
                    }
                } else {
                    if ( (feature.begin < d.begin) && (feature.end <= d.begin) ){ //starts and ends before
                        overlapping = false;
                    } else if ((feature.begin >= d.end)) {
                        overlapping = false;
                	}
            	}				

				// if((feature.begin < d.begin && feature.begin > d.end) 
				// 	|| (feature.end > d.begin && feature.end < d.end)
				// 	|| (feature.begin === feature.end && (feature.begin < d.begin || feature.begin > d.end))) {
				// 	overlaps = false;
				// }
			});
			return overlapping;
		}

		row.addFeature = function(feature) {
			row.rowFeatures.push(feature);
		}
	}

	nonOverlappingLayout.calculate = function(totalHeight){
		rowHeight = totalHeight/rows.length;
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

	_.each(features, function(feature){
		var createNewRow = true;
		_.each(rows, function(row){
			if(!row.containsOverlap(feature)) {
				row.addFeature(feature);
				createNewRow = false;
			} 
		});
		if(createNewRow) {
			var row = new Row();
			row.addFeature(feature);
			rows.push(row);
		}
	});
}

module.exports = NonOverlappingLayout;