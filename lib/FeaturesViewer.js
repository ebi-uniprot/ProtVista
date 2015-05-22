var _ = require("underscore");
var DataLoader = require("./dataLoader");
var CategoryFactory = require("./CategoryFactory");

var FeaturesViewer = function(opts) {
	var fv = this;

	var width = 960;

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

		createNavRuler(xScale, d.sequence.length + 1);
		var container = d3.select(opts.el)
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

	var update = function() {
		_.each(categories, function(category) {
			category.update();
		});
	};


	var createNavRuler = function(xScale, maxPos) {
		var navWidth = width
			, navHeight = 40;

		var navXScale = d3.scale.linear()
					.domain([1,maxPos])
					.range([0,navWidth]);

		var svg = d3.select(opts.el)
			.append('div')
			.attr('class', 'ft-navruler')
			.append('svg')
			.attr('width', width)
			.attr('height', navHeight);

		var navXAxis = d3.svg.axis()
			.scale(xScale)
			.orient('bottom');

		var g = svg.append('g')
			.attr('class', 'x axis')
			.call(navXAxis);

		var viewport = d3.svg.brush()
			.x(navXScale)
			.on("brush", function() {
				xScale.domain(viewport.empty() ? navXScale.domain() : viewport.extent());
				update();
			});

		svg.append("g")
		    .attr("class", "viewport")
		    .call(viewport)
		    .selectAll("rect")
		    .attr("height", navHeight);

	};

	fv.load();
	var addCategory = function(category) {
		categories.push(category);
	};

}

module.exports = FeaturesViewer;