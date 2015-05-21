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
		console.log(opts.el);
        var container = d3.select(opts.el)
                           .append('div')
                                .attr('class','fv-category-container');

        var xScale = d3.scale.linear()
                                .domain([1,  d.sequence.length + 1])
                                .range([0, width]);

        addCategory(CategoryFactory.createCategory(d.domainsAndSites,'basic', container, xScale));
        addCategory(CategoryFactory.createCategory(d.moleculeProcessing,'basic', container, xScale));
        addCategory(CategoryFactory.createCategory(d.mutagenesis,'basic', container, xScale));
        addCategory(CategoryFactory.createCategory(d.ptm,'basic', container, xScale));
        addCategory(CategoryFactory.createCategory(d.seqInfo,'basic', container, xScale));
        addCategory(CategoryFactory.createCategory(d.structural,'basic', container, xScale));
        addCategory(CategoryFactory.createCategory(d.topology,'basic', container, xScale));
        addCategory(CategoryFactory.createCategory(d.variants,'variant', container, xScale));		
	}

    var addCategory = function(category) {
        categories.push(category);
    }

    fv.load();
}

module.exports = FeaturesViewer;