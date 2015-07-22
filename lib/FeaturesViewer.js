/*jshint laxbreak: true */
/*jshint laxcomma: true */

var _ = require("underscore");
var DataLoader = require("./dataLoader");
var CategoryFactory = require("./CategoryFactory");
var d3 = require("d3");
var ViewerFactory = require("./ViewerFactory");

var FeaturesViewer = function(opts) {
    var fv = this;

    fv.dispatcher = d3.dispatch("featureSelected", "featureDeselected", "ready");
    fv.width = 760;
    fv.maxZoomSize = 30;
    fv.selectedFeature = undefined;
    fv.selectedFeatureElement = undefined;
    fv.sequence = "";
    fv.categoryOrderAndType = {
        domainsAndSites: 'basic',
        moleculeProcessing: 'basic',
        ptm: 'basic',
        seqInfo: 'basic',
        structural: 'basic',
        topology: 'basic',
        mutagenesis: 'basic',
        variants: 'variant'
    };
    var	padding = {
        top:2,
        right:10,
        bottom:2,
        left:10
    };

    var categories = [];

    var updateZoomFromChart = function() {
        fv.zoom.x(fv.xScale);
    };

    var updateViewportFromChart = function () {
        if ((fv.xScale.domain()[0] <= 1) && (fv.xScale.domain()[1] >= fv.maxPos)) {
            fv.viewport.clear();
        } else {
            fv.viewport.extent(fv.xScale.domain());
        }
        d3.select('.up_pftv_viewport').call(fv.viewport);
        if (((fv.xScale.domain()[0] <= 1) && (fv.xScale.domain()[1] >= fv.maxPos))) {
            fv.viewport.clearTrapezoid();
        } else {
            fv.viewport.updateTrapezoid();
        }
    };

    var update = function() {
        fv.aaViewer.update();
        _.each(categories, function(category) {
            category.update();
        });
    };

    var zoomIn = function() {
        fv.xScale.domain([
            1,
            fv.maxZoomSize
        ]);
        update();
        updateViewportFromChart();
        updateZoomFromChart();
    };

    var resetZoomAndSelection = function() {
        fv.xScale.domain([
            1,
            fv.maxPos
        ]);
        if (fv.selectedFeature) {
            ViewerFactory.selectFeature(fv.selectedFeature, fv.selectedFeatureElement, fv);
        }
        update();
        updateViewportFromChart();
        updateZoomFromChart();
    };

    var createZoom = function() {
        var zoom = d3.behavior.zoom()
            .x(fv.xScale)
            .scaleExtent([1,1])
            .on('zoom', function() {
                if (fv.xScale.domain()[0] < 1) {
                    var tempX = zoom.translate()[0] - fv.xScale(1) + fv.xScale.range()[0];
                    zoom.translate([tempX, 0]);
                } else if (fv.xScale.domain()[1] > fv.maxPos) {
                    var translatedX = zoom.translate()[0] - fv.xScale(fv.maxPos) + fv.xScale.range()[1];
                    zoom.translate([translatedX, 0]);
                }
                update();
                updateViewportFromChart();
            });
        return zoom;
    };

    var createNavRuler = function(container) {
        var navHeight = 40
            , navWithTrapezoid = 50;

        var navXScale = d3.scale.linear()
            .domain([1,fv.maxPos])
            .range([padding.left, fv.width - padding.right]);

        var svg = container
            .append('div')
            .attr('class', 'up_pftv_navruler')
            .append('svg')
            .attr('id','up_pftv_svg-navruler')
            .attr('width', fv.width)
            .attr('height', (navWithTrapezoid));

        var navXAxis = d3.svg.axis()
            .scale(fv.xScale)
            .orient('bottom');

        svg.append('g')
            .attr('class', 'x axis')
            .call(navXAxis);

        var viewport = d3.svg.brush()
            .x(navXScale)
            .on("brush", function() {
                var s = d3.event.target.extent();
                if((s[1] - s[0]) < fv.maxZoomSize) {
                    d3.event.target.extent([s[0],s[0] + fv.maxZoomSize]);
                    d3.event.target(d3.select(this));
                }
                fv.xScale.domain(viewport.empty() ? navXScale.domain() : viewport.extent());
                update();
                viewport.updateTrapezoid();
            });

        viewport.on("brushend", function () {
            updateZoomFromChart();
        });

        svg.append("g")
            .attr("class", "up_pftv_viewport")
            .call(viewport)
            .selectAll("rect")
            .attr("height", navHeight);

        viewport.trapezoid = svg.append("g")
            .selectAll("path")
            .data([0]).enter().append("path")
            .classed("up_pftv_trapezoid", true);

        viewport.domainStartLabel = svg.append("text")
            .attr('class', 'domain-label')
            .attr('x',0)
            .attr('y',navHeight);

        viewport.domainEndLabel = svg.append("text")
            .attr('class', 'domain-label')
            .attr('x',fv.width)
            .attr('y',navHeight)
            .attr('text-anchor','end');

        viewport.updateTrapezoid = function() {
            var begin = d3.select(".up_pftv_navruler .extent").attr("x");
            var tWidth = d3.select(".up_pftv_navruler .extent").attr("width");
            var end = (+begin) + (+tWidth);
            var path =  "M0," + (navWithTrapezoid)
                + "L0" + "," + (navWithTrapezoid-2)
                + "L" + begin + "," + navHeight
                + "L" + end + "," + navHeight
                + "L" + fv.width + "," + (navWithTrapezoid-2)
                + "L" + fv.width + "," + (navWithTrapezoid) + "Z";
            this.trapezoid.attr("d", path);
            this.domainStartLabel.text(Math.round(fv.xScale.domain()[0]));
            this.domainEndLabel.text(Math.round(fv.xScale.domain()[1]));
        };

        viewport.clearTrapezoid = function() {
            this.trapezoid.attr("d", "M0,0");
        };

        return viewport;
    };

    var createButtons = function(container) {
        var buttons = container.append('div')
            .attr('class','up_pftv_buttons');
        buttons.append('span')
            .attr('class','up_pftv_icon-arrows-cw')
            .attr('title','Reset view')
            .on('click', function(){
                resetZoomAndSelection();
            });
        buttons.append('span')
            .attr('class','up_pftv_icon-zoom-in')
            .attr('title','Zoom in')
            .on('click', function(){
                zoomIn();
            });
        buttons.append('span')
            .attr('class','up_pftv_icon-filter')
            .attr('title','Filter')
            .on('click', function(){
            });
        buttons.append('span')
            .attr('class','up_pftv_icon-info')
            .attr('title','Help')
            .on('click', function(){
            });
    };

    var createAAViewer = function(container, sequence) {
        var aaViewer = this;
        var aaViewWidth = fv.width,
            aaViewHeight = 15;

        var svg = container
            .append('div')
            .attr('class','up_pftv_aaviewer')
            .append('svg')
            .attr('width', aaViewWidth)
            .attr('height',aaViewHeight);

        //amino acids
        var aaPlot = function(){
            var series,
                aminoAcids;

            var aaPlot = function(selection){

                selection.each(function(data){
                    series = d3.select(this);
                    aminoAcids = series.selectAll('.up_pftv_amino-acid')
                        .data(data);

                    aminoAcids.enter().append('text').style('text-anchor','middle');

                    aminoAcids.attr('x', function(d, i) {
                        return fv.xScale(i+1);
                    })
                        .attr('y', aaViewHeight / 2)
                        .text(function(d) {
                            return d.toUpperCase();
                        })
                        .attr('class','up_pftv_amino-acid');

                    aminoAcids.exit().remove();
                });
            };

            return aaPlot;
        };

        var series = aaPlot();

        var g = svg.append('g')
            .attr('clip-path','url(#aaViewClip)')
            .attr('transform','translate(0,' + aaViewHeight/5 +  ')')
            .style('opacity',0);

        g.datum(sequence.split(''))
            .call(series);

        //amino acids selector
        var aaSelectorPlot = function(){
            var series,
                aminoAcids;

            var aaSelectorPlot = function(selection) {
                selection.each(function(data) {
                    series = d3.select(this);
                    aminoAcids = series.selectAll('.up_pftv_amino_acid_selector')
                        .data(data);

                    aminoAcids.enter().append('rect');

                    aminoAcids.attr('x', function(d) {
                        var gapRegion = (fv.xScale(2)-fv.xScale(1))/2;
                        return fv.xScale(d.feature.begin) - gapRegion;
                    })
                        .attr('y', 0)
                        .attr('width', function(d) {
                            return ((d.feature.end) ? d.feature.end - d.feature.begin + 1 : 1) * (fv.xScale(2)-fv.xScale(1));
                        })
                        .attr('height', 12)
                        .classed('up_pftv_amino_acid_selector', true);

                    aminoAcids.exit().remove();
                });
            };

            return aaSelectorPlot;
        };

        var selectorSeries = aaSelectorPlot();

        var selectorGroup = svg.append('g')
            .attr('clip-path','url(#aaSelectorViewClip)')
            .style('opacity',0);

        selectorGroup.datum([{"feature": {"begin": -10, "end": -10}, "clazz": ""}])
            .call(selectorSeries);

        aaViewer.update = function() {
            g.call(series);
            selectorGroup.call(selectorSeries);
            var count = fv.xScale.domain()[1] - fv.xScale.domain()[0];
            if(count>70) {
                g.transition(50).style('opacity',0);
                selectorGroup.transition(50).style('opacity',0);
            }
            else {
                g.transition(50).style('opacity',1);
                selectorGroup.transition(50).style('opacity',1);
            }
        };

        aaViewer.selectFeature = function(clazz) {
            if (fv.selectedFeature) {
                selectorGroup.datum([{"feature": fv.selectedFeature, "clazz": clazz}]).call(selectorSeries);
            } else {
                selectorGroup.datum([{"feature": {"begin": -10, "end": -10}, "clazz": ""}]).call(selectorSeries);
            }

        };

        return aaViewer;
    };

    var addCategory = function(category) {
        categories.push(category);
    };

    var init = function(d) {
        fv.sequence = d.sequence;
        fv.maxPos = d.sequence.length;
        fv.xScale = d3.scale.linear()
            .domain([1, d.sequence.length + 1])
            .range([padding.left, fv.width - padding.right]);
        //remove any previous text
        var fvContainer = d3.select(opts.el)
            .text('')
            .append('div')
            .attr('class', 'up_pftv_container');

        fv.viewport = createNavRuler(fvContainer);
        createButtons(fvContainer);
        fv.aaViewer = createAAViewer(fvContainer, d.sequence);
        fv.zoom = createZoom(d.sequence.length + 1);

        fv.container = fvContainer
            .append('div')
            .attr('class', 'up_pftv_category-container');

        _.each( _.keys(fv.categoryOrderAndType), function(category) {
            if (!_.contains(opts.exclusion, category)) {
                addCategory(CategoryFactory.createCategory(d[category], fv.categoryOrderAndType[category], fv));
            }
        });

    };

    fv.load = function() {
        var dataLoader = DataLoader.get(opts.uniprotacc);
        dataLoader.done(function(d) {
            init(d);
            fv.dispatcher.ready(d);
        });
    };

    fv.shortenDisplayName = function(name) {
        var maxLength = 26;
        return (name.length>maxLength) ? name.substring(0,maxLength-3) + '...' : name;
    };

    fv.load();
};

FeaturesViewer.prototype.getDispatcher = function getDispatcher() {
    return this.dispatcher;
};

module.exports = FeaturesViewer;