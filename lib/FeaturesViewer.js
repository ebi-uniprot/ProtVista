var _ = require("underscore");
var DataLoader = require("./dataLoader");
var CategoryFactory = require("./CategoryFactory");

var FeaturesViewer = function(opts) {
	var fv = this;

	var width = 760,
		padding = {
			top:2,
			right:10,
			bottom:2,
			left:10
		};

	var categories = [];

	fv.load = function() {
		var dataLoader = DataLoader.get(opts.uniprotacc);
		dataLoader.done(function(d) {
			init(d);
		});
	};

	var init = function(d) {
		var xScale = d3.scale.linear()
			.domain([1, d.sequence.length + 1])
			.range([padding.left, width - padding.right]);

		var fvContainer = d3.select(opts.el)
			.text('') //remove any previous
			.append('div')
			.attr('class', 'fv-container');

		fv.viewport = createNavRuler(fvContainer, xScale, d.sequence.length + 1);
		fv.aaViewer = createAAViewer(fvContainer, xScale, d.sequence);
		fv.zoom = createZoom(xScale, d.sequence.length + 1);

		var container = fvContainer
								.append('div')
								.attr('class', 'fv-category-container');

		addCategory(CategoryFactory.createCategory(d.domainsAndSites, 'basic', container, xScale, width, fv.zoom));
		addCategory(CategoryFactory.createCategory(d.moleculeProcessing, 'basic', container, xScale, width, fv.zoom));
		addCategory(CategoryFactory.createCategory(d.mutagenesis, 'basic', container, xScale, width, fv.zoom));
		addCategory(CategoryFactory.createCategory(d.ptm, 'basic', container, xScale, width, fv.zoom));
		addCategory(CategoryFactory.createCategory(d.seqInfo, 'basic', container, xScale, width, fv.zoom));
		addCategory(CategoryFactory.createCategory(d.structural, 'basic', container, xScale, width, fv.zoom));
		addCategory(CategoryFactory.createCategory(d.topology, 'basic', container, xScale, width, fv.zoom));
		addCategory(CategoryFactory.createCategory(d.variants, 'variant', container, xScale, width, fv.zoom));
	};

	var update = function() {
		fv.aaViewer.update();
		_.each(categories, function(category) {
			category.update();
		});
	};


	var createNavRuler = function(container, xScale, maxPos) {
		var navWidth = width
			, navHeight = 40;

		var navXScale = d3.scale.linear()
					.domain([1,maxPos])
					.range([0,navWidth]);

		var svg = container
			.append('div')
			.attr('class', 'ft-navruler')
			.append('svg')
			.attr('width', width)
			.attr('height', navHeight);
		var navXAxis = d3.svg.axis()
			.scale(xScale)
			.ticks(20)
			.orient('bottom');

		var g = svg.append('g')
			.attr('class', 'x axis')
			.call(navXAxis);

		var viewport = d3.svg.brush()
			.x(navXScale)
			.on("brush", function() {
				var s = d3.event.target.extent();
				if((s[1] - s[0]) < 30) {
					d3.event.target.extent([s[0],s[0] + 30]); 
					d3.event.target(d3.select(this));
				}
				xScale.domain(viewport.empty() ? navXScale.domain() : viewport.extent());
				update(s[1] - s[0]);
			});

		viewport.on("brushend", function () {
        	updateZoomFromChart(xScale, maxPos);
    	});

		svg.append("g")
		    .attr("class", "viewport")
		    .call(viewport)
		    .selectAll("rect")
		    .attr("height", navHeight);

		return viewport;
	};

	var createZoom = function(xScale, maxPos) {
		var zoom = d3.behavior.zoom()
			.x(xScale)
			.on('zoom', function() {
				if (xScale.domain()[0] < 1) {
					var x = zoom.translate()[0] - xScale(1) + xScale.range()[0];
					zoom.translate([x, 0]);
				} else if (xScale.domain()[1] > maxPos) {
					var x = zoom.translate()[0] - xScale(maxPos) + xScale.range()[1];
					zoom.translate([x, 0]);
				}
				update();				
				updateViewportFromChart(xScale);
			});
		return zoom;
	};

	var updateZoomFromChart = function(xScale, maxPos) {
		fv.zoom.x(xScale);

		var fullDomain = maxPos - 1,
			currentDomain = xScale.domain()[1] - xScale.domain()[0];

		var minScale = currentDomain / fullDomain,
			maxScale = minScale * 20;

		fv.zoom.scaleExtent([minScale, maxScale]);
	};

	function updateViewportFromChart(xScale, maxPos) {
		if ((xScale.domain()[0] <= 1) && (xScale.domain()[1] >= maxPos)) {
			fv.viewport.clear();
		} else {
			fv.viewport.extent(xScale.domain());
		}
		d3.select('.viewport').call(fv.viewport);
	}

	var createAAViewer = function(container, xScale, sequence) {
		var aaViewer = this;
		var aaViewWidth = width,
			aaViewHeight = 20;

		var aaPlot = function(){
			var series,
				aminoAcids;

			var aaPlot = function(selection){

				selection.each(function(data){
					series = d3.select(this);
					aminoAcids = series.selectAll('.amino-acid')
									.data(data);

					aminoAcids.enter().append('text').style('text-anchor','middle');

					aminoAcids.attr('x', function(d, i) {
							return xScale(i+1);
						})
						.attr('y', aaViewHeight / 2)
						.text(function(d) {
							return d.toUpperCase();
						})
						.attr('class','amino-acid');

					aminoAcids.exit().remove();
				});
			};

			return aaPlot;
		};

		var series = aaPlot();

		var svg = container
					.append('div')
					.attr('class','ft-aaviewer')
					.append('svg')
					.attr('width', aaViewWidth)
					.attr('height',aaViewHeight);

		var g = svg.append('g')
					.attr('clip-path','url(#aaViewClip)')
					.style('opacity','0');

		g.datum(sequence.split(''))
			.call(series);

		aaViewer.update = function() {
			g.call(series);
			var count = xScale.domain()[1] - xScale.domain()[0];
			if(count>70) {
				g.transition(50).style('opacity','0');
			}
			else {
				g.transition(50).style('opacity','1');
			}
		};
		return aaViewer;
	};

	fv.load();
	var addCategory = function(category) {
		categories.push(category);
	};

};

module.exports = FeaturesViewer;