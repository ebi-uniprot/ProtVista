/*jshint laxbreak: true */
/*jshint laxcomma: true */

var _ = require("underscore");
var DataLoader = require("./dataLoader");
var CategoryFactory = require("./CategoryFactory");
var d3 = require("d3");
var ViewerFactory = require("./ViewerFactory");

var updateZoomFromChart = function(fv) {
    fv.zoom.x(fv.xScale);

    // remove if no zoom
    var fullDomain = fv.maxPos - 1,
        currentDomain = fv.xScale.domain()[1] - fv.xScale.domain()[0];

    var minScale = currentDomain / fullDomain,
        maxScale = minScale * 20;

    fv.zoom.scaleExtent([minScale, maxScale]);
    //end remove
};

var updateViewportFromChart = function (fv) {
    fv.viewport.extent(fv.xScale.domain());
    d3.select('.up_pftv_viewport').call(fv.viewport);
    fv.viewport.updateTrapezoid();
};

var update = function(fv, categories) {
    fv.aaViewer.update();
    fv.aaViewer2.update();
    _.each(categories, function(category) {
        category.update();
    });
};

var updateZoomButton = function(currentClass, newClass, newTitle) {
    try {
        var zoomBtn = d3.select('.' + currentClass);
        zoomBtn.classed(currentClass, false);
        zoomBtn.classed(newClass, true);
        zoomBtn.attr('title', newTitle);
    } catch(er) {}
};

var zoomIn = function(fv, categories) {
    fv.xScale.domain([
        1,
        fv.maxZoomSize
    ]);
    if (fv.selectedFeature) {
        var domain = fv.xScale.domain();
        var max = domain[domain.length-1];
        var ftMiddle = +fv.selectedFeature.begin +
            (fv.selectedFeature.end ? Math.floor((+fv.selectedFeature.end - +fv.selectedFeature.begin)/2) : 0);
        var init = (ftMiddle - max/2) < 1 ? 1 : ftMiddle - max/2;
        init = ((init + max) > fv.sequence.length) ? init = fv.sequence.length - max : init;
        fv.xScale.domain([
            init,
            init + max
        ]);
    }
    update(fv, categories);
    updateViewportFromChart(fv);
    updateZoomFromChart(fv);
    updateZoomButton('up_pftv_icon-zoom-in', 'up_pftv_icon-zoom-out', 'Zoom out to overview');
};

var resetZoom = function(fv, categories) {
    update(fv, categories);
    updateViewportFromChart(fv);
    updateZoomFromChart(fv);
};

var zoomOut = function(fv, categories) {
    fv.xScale.domain([
        1,
        fv.maxPos
    ]);
    resetZoom(fv, categories);
    updateZoomButton('up_pftv_icon-zoom-out', 'up_pftv_icon-zoom-in', 'Zoom in to sequence view');
};

var resetZoomAndSelection = function(fv, categories) {
    fv.xScale.domain([
        1,
        fv.maxPos
    ]);
    if (fv.selectedFeature) {
        ViewerFactory.selectFeature(fv.selectedFeature, fv.selectedFeatureElement, fv);
    }
    resetZoom(fv, categories);
    updateZoomButton('up_pftv_icon-zoom-out', 'up_pftv_icon-zoom-in', 'Zoom in to sequence view');
};

var createZoom = function(fv, categories) {
    var zoom = d3.behavior.zoom()
        .x(fv.xScale)
        // .scaleExtent([1,1])
        .on('zoom', function() {
            if (fv.xScale.domain()[0] < 1) {
                var tempX = zoom.translate()[0] - fv.xScale(1) + fv.xScale.range()[0];
                zoom.translate([tempX, 0]);
            } else if (fv.xScale.domain()[1] > fv.maxPos) {
                var translatedX = zoom.translate()[0] - fv.xScale(fv.maxPos) + fv.xScale.range()[1];
                zoom.translate([translatedX, 0]);
            }
            update(fv, categories);
            updateViewportFromChart(fv);
        });
    return zoom;
};

var closeTooltip = function(fv) {
    if (!fv.overFeature && !fv.overTooltip) {
        var tooltipContainer = d3.selectAll('.up_pftv_tooltip-container')
            .transition(20)
            .style('opacity', 0)
            .style('display', 'none');
        tooltipContainer.remove();
    }
};

var createNavRuler = function(fv, categories, padding, container) {
    var navHeight = 40, navWithTrapezoid = 50;

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
            update(fv, categories);
            viewport.updateTrapezoid();
        });
    viewport.on("brushstart", function () {
        closeTooltip(fv);
    });
    viewport.on("brushend", function () {
        updateZoomFromChart(fv);
        var navigator = d3.select('.up_pftv_navruler .extent');
        if (+navigator.attr('width') >= fv.width-padding.left-padding.right) {
            updateZoomButton('up_pftv_icon-zoom-out', 'up_pftv_icon-zoom-in', 'Zoom in to sequence view');
        }
    });

    var arc = d3.svg.arc()
        .outerRadius(navHeight / 4)
        .startAngle(0)
        .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });

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

    svg.selectAll(".resize").append("path")
        .attr("transform", "translate(0," +  ((navHeight / 2) - 5) + ")")
        .attr('class','handle')
        .attr("d", arc);

    viewport.updateTrapezoid = function() {
        var begin = d3.select(".up_pftv_navruler .extent").attr("x");
        var tWidth = d3.select(".up_pftv_navruler .extent").attr("width");
        var end = (+begin) + (+tWidth);
        var path =  "M0," + (navWithTrapezoid) + "L0" + "," + (navWithTrapezoid-2)
            + "L" + begin + "," + (navHeight-12) + "L" + begin + "," + navHeight
            + "L" + end + "," + navHeight + "L" + end + "," + (navHeight-12)
            + "L" + fv.width + "," + (navWithTrapezoid-2) + "L" + fv.width + "," + (navWithTrapezoid) + "Z";
        this.trapezoid.attr("d", path);
        this.domainStartLabel.text(Math.round(fv.xScale.domain()[0]));
        this.domainEndLabel.text(Math.min(Math.round(fv.xScale.domain()[1]), fv.maxPos));
    };

    viewport.clearTrapezoid = function() {
        this.trapezoid.attr("d", "M0,0");
    };

    return viewport;
};

var createButtons = function(fv, categories, container) {
    var buttons = container.append('div')
        .attr('class','up_pftv_buttons');
    buttons.append('span')
        .attr('class','up_pftv_icon-arrows-cw')
        .attr('title','Reset view')
        .on('click', function(){
            resetZoomAndSelection(fv, categories);
        });
    buttons.append('span')
        .attr('class','up_pftv_icon-zoom-in')
        .attr('title','Zoom in to sequence view')
        .on('click', function(){
            if ( d3.select(this).classed('up_pftv_icon-zoom-in')) {
                zoomIn(fv, categories);
            } else {
                zoomOut(fv, categories);
            }
        });
    buttons.append('span')
        .attr('class','up_pftv_icon-info')
        .attr('title','Help')
        .on('click', function(){
        });
};

var createAAViewer = function(fv, container, sequence) {
    var aaViewer = {}, aaViewWidth = fv.width, aaViewHeight = 30;
    var svg = container
        .append('div')
        .attr('class','up_pftv_aaviewer')
        .append('svg')
        .attr('width', aaViewWidth)
        .attr('height',aaViewHeight);

    //amino acids selector
    var aaSelectorPlot = function(){
        var series, aminoAcids;
        var aaSelectorPlot = function(selection) {
            selection.each(function(data) {
                series = d3.select(this);
                aminoAcids = series.selectAll('.up_pftv_amino_acid_selector').data(data);
                aminoAcids.enter().append('rect');

                aminoAcids
                    .attr('x', function(d) {
                        var gapRegion = (fv.xScale(2)-fv.xScale(1))/2;
                        return fv.xScale(d.feature.begin) - gapRegion;
                    })
                    .attr('y', 0)
                    .attr('width', function(d) {
                        return ((d.feature.end) ? d.feature.end - d.feature.begin + 1 : 1) * (fv.xScale(2)-fv.xScale(1));
                    })
                    .attr('height', aaViewHeight)
                    .classed('up_pftv_amino_acid_selector', true);

                aminoAcids.exit().remove();
            });
        };
        return aaSelectorPlot;
    };

    var selectorSeries = aaSelectorPlot();

    var selectorGroup = svg.append('g')
        .attr('clip-path','url(#aaSelectorViewClip)')
        .style('opacity',1);

    selectorGroup.datum([{"feature": {"begin": -10, "end": -10}}])
        .call(selectorSeries);

    //scale
    var xAxis = d3.svg.axis().scale(fv.xScale);

    var gAxis = svg.append("g")
                .attr("class", "x axis")
                .attr('transform','translate(0, -7)')
                .call(xAxis);


    //amino acids
    var aaPlot = function(){
        var series, aminoAcids;
        var aaPlot = function(selection) {
            selection.each(function(data) {
                series = d3.select(this);
                aminoAcids = series.selectAll('.up_pftv_amino-acid').data(data);
                aminoAcids.enter().append('text').style('text-anchor','middle');
                aminoAcids
                    .attr('x', function(d, i) {
                        return fv.xScale(i+1);
                    })
                    .attr('y', aaViewHeight / 2)
                    .text(function(d) {
                        return d.toUpperCase();
                    })
                    .attr('title', function(d, i) {
                        return (i+1);
                    })
                    .attr('class','up_pftv_amino-acid');

                aminoAcids.exit().remove();
            });
        };
        return aaPlot;
    };

    var series = aaPlot();

    var g = svg.append('g')
        .attr('class','up_pftv_aa-text')
        .attr('clip-path','url(#aaViewClip)')
        .attr('transform','translate(0,' + aaViewHeight/5 +  ')')
        .style('opacity',0);

    g.datum(sequence.split('')).call(series);

    aaViewer.update = function() {
        g.call(series);
        gAxis.call(xAxis);
        selectorGroup.call(selectorSeries);
        var count = fv.xScale.domain()[1] - fv.xScale.domain()[0];
        if(count>70) {
            g.transition(50).style('opacity',0);
        }
        else {
            g.transition(50).style('opacity',1);
        }
    };

    aaViewer.selectFeature = function() {
        if (fv.selectedFeature) {
            selectorGroup.datum([{"feature": fv.selectedFeature}]).call(selectorSeries);
        } else {
            selectorGroup.datum([{"feature": {"begin": -10, "end": -10}}]).call(selectorSeries);
        }
    };
    return aaViewer;
};

var init = function(fv, categories, filterCategories, opts, d, padding) {
    fv.sequence = d.sequence;
    fv.maxPos = d.sequence.length;
    fv.xScale = d3.scale.linear()
        .domain([1, d.sequence.length + 1])
        .range([padding.left, fv.width - padding.right]);
    //remove any previous text
    var fvContainer = d3.select(opts.el)
        .text('')
        .append('div')
        .attr('class', 'up_pftv_container')
        .on('mousedown', function() {
            closeTooltip(fv);
        });

    fv.viewport = createNavRuler(fv, categories, padding, fvContainer);
    createButtons(fv, categories, fvContainer);
    fv.aaViewer = createAAViewer(fv, fvContainer, d.sequence);
    fv.zoom = createZoom(fv, categories);

    fv.container = fvContainer
        .append('div')
        .attr('class', 'up_pftv_category-container');

    _.each( _.keys(fv.categoryOrderAndType), function(category) {
        if (!_.contains(opts.exclusions, category)) {
            var cat = CategoryFactory.createCategory(d[category], fv.categoryOrderAndType[category].type, fv);
            categories.push(cat);
            if (fv.categoryOrderAndType[category].filter) {
                filterCategories.push(cat);
            }
        }
    });
    var bottomAAViewerContainer = fvContainer.append('div').attr('class','bottom-aa-container');
    fv.aaViewer2 = createAAViewer(fv, bottomAAViewerContainer, d.sequence);
    updateViewportFromChart(fv);
    updateZoomFromChart(fv);
};

var FeaturesViewer = function(opts) {
    var fv = this;
    fv.dispatcher = d3.dispatch("featureSelected", "featureDeselected", "ready");
    fv.width = 760;
    fv.maxZoomSize = 30;
    fv.selectedFeature = undefined;
    fv.selectedFeatureElement = undefined;
    fv.sequence = "";
    fv.categoryOrderAndType = {
        domainsAndSites: {type: 'basic', filter: false},
        moleculeProcessing: {type: 'basic', filter: false},
        ptm: {type: 'basic', filter: false},
        seqInfo: {type: 'basic', filter: false},
        structural: {type: 'basic', filter: false},
        topology: {type: 'basic', filter: false},
        mutagenesis: {type: 'basic', filter: false},
        variants: {type: 'variant', filter: true}
    };
    fv.filter = {
        isManual: {
            value: true,
            subFilter: {
                disease: true,
                notDisease: true
            }
        },
        isAutomatic: {
            value: true
        }
    };

    var	padding = {top:2, right:10, bottom:2, left:10};
    var categories = [];
    var filterCategories = [];

    fv.load = function() {
        var dataLoader = DataLoader.get(opts.uniprotacc);
        dataLoader.done(function(d) {
            init(fv, categories, filterCategories, opts, d, padding);
            fv.dispatcher.ready(d);
        });
    };

    fv.shortenDisplayName = function(name) {
        var maxLength = 26;
        return (name.length>maxLength) ? name.substring(0,maxLength-3) + '...' : name;
    };

    fv.applyFilter = function(filter) {
        _.each(_.keys(fv.filter), function(key) {
            fv.filter[key].value = filter[key] === undefined ? true : filter[key];
            _.each(_.keys(fv.filter[key].subFilter), function(subKey) {
                fv.filter[key].subFilter[subKey] = filter[subKey] === undefined ? true : filter[subKey];
            })
        });
        _.each(filterCategories, function(category) {
            category.update();
        });
        //TODO
        if (fv.selectedFeature) {
            var display = false;
            _.each(_.keys(fv.filter), function(key) {
                var parentDisplay = fv.filter[key].value && fv.selectedFeature[key];
                if (parentDisplay && fv.filter[key].subFilter) {
                    var subDisplay = false;
                    _.each(_.keys(fv.filter[key].subFilter), function(subKey) {
                        subDisplay = subDisplay || (fv.filter[key].subFilter[subKey] && fv.selectedFeature[subKey]);
                    });
                    display = display || (parentDisplay && subDisplay);
                } else {
                    display = display || parentDisplay;
                }
            });
            if ( !display ) {
                ViewerFactory.selectFeature(fv.selectedFeature, fv.selectedFeatureElement, fv);
            }
        }
    };

    fv.updateFeatureSelector = function() {
        fv.aaViewer.selectFeature();
        fv.aaViewer2.selectFeature();
    };

    fv.load();
};

FeaturesViewer.prototype.getDispatcher = function getDispatcher() {
    return this.dispatcher;
};

module.exports = FeaturesViewer;