var _ = require("underscore");
var DataLoader = require("./dataLoader");
var CategoryFactory = require("./CategoryFactory");

var FeaturesViewer = function(opts) {
	var fv = this;

	var width = 760;

	var categories = [];

	fv.load = function() {
		var dataLoader = DataLoader.get('uniprotacc');
		dataLoader.done(function(d) {
			init(d);
		});
	}

	var init = function(d) {
		var xScale = d3.scale.linear()
			.domain([1, d.sequence.length + 1])
			.range([0, width]);

		var fvContainer = d3.select(opts.el)
			.append('div')
			.attr('class', 'fv-container');

		createNavRuler(fvContainer, xScale, d.sequence.length + 1);
		fv.aaViewer = createAAViewer(fvContainer, xScale, d.sequence);

		var container = fvContainer
								.append('div')
								.attr('class', 'fv-category-container');

		addCategory(CategoryFactory.createCategory(d.domainsAndSites, 'basic', container, xScale, width));
		addCategory(CategoryFactory.createCategory(d.moleculeProcessing, 'basic', container, xScale, width));
		addCategory(CategoryFactory.createCategory(d.mutagenesis, 'basic', container, xScale, width));
		addCategory(CategoryFactory.createCategory(d.ptm, 'basic', container, xScale, width));
		addCategory(CategoryFactory.createCategory(d.seqInfo, 'basic', container, xScale, width));
		addCategory(CategoryFactory.createCategory(d.structural, 'basic', container, xScale, width));
		addCategory(CategoryFactory.createCategory(d.topology, 'basic', container, xScale, width));
		addCategory(CategoryFactory.createCategory(d.variants, 'variant', container, xScale, width));
	};

	var update = function(count) {
		fv.aaViewer.update(count);
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
				if((s[1] - s[0]) >= 30) {
					xScale.domain(viewport.empty() ? navXScale.domain() : viewport.extent());
					update(s[1] - s[0]);
				} else {
					d3.event.target.extent([s[0],s[0] + 30]); d3.event.target(d3.select(this));
				}
			});

		svg.append("g")
		    .attr("class", "viewport")
		    .call(viewport)
		    .selectAll("rect")
		    .attr("height", navHeight);

	};

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

					aminoAcids.enter().append('text');

					aminoAcids.attr('x', function(d, i) {
							return xScale(i);
						})
						.attr('y', aaViewHeight / 2)
						.text(function(d) {
							return d.toUpperCase();
						})
						.attr('class','amino-acid');

					aminoAcids.exit().remove();
				});
			}

			return aaPlot;
		}

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

		aaViewer.update = function(count) {
			g.call(series);
			if(count>70) {
				g.transition(50).style('opacity','0');
			}
			else {
				g.transition(50).style('opacity','1');
			}
		}
		return aaViewer;
	}

	fv.load();
	var addCategory = function(category) {
		categories.push(category);
	};

}

module.exports = FeaturesViewer;