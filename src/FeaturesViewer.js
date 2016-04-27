/*jshint laxbreak: true */
/*jshint laxcomma: true */

var _ = require("underscore");
var d3 = require("d3");

var Constants = require("./Constants");
var DataLoader = require("./DataLoader");
var CategoryFactory = require("./CategoryFactory");
var ViewerHelper = require("./ViewerHelper");
var FeatureFactory = require("./FeatureFactory");
var VariantFilterDialog = require("./VariantFilterDialog");
var CategoryFilterDialog = require("./CategoryFilterDialog");
var TooltipFactory = require('./TooltipFactory');

var updateZoomFromChart = function(fv) {
    fv.zoom.x(fv.xScale);

    // remove if no zoom
    var fullDomain = fv.maxPos - 1,
        currentDomain = fv.xScale.domain()[1] - fv.xScale.domain()[0];

    var minScale = currentDomain / fullDomain,
        maxScale = minScale * Math.floor(fv.sequence.length/fv.maxZoomSize);
    fv.zoom.scaleExtent([minScale, maxScale]);
    //end remove
};

var updateViewportFromChart = function (fv) {
    fv.viewport.extent(fv.xScale.domain());
    d3.select('.up_pftv_viewport').call(fv.viewport);
    fv.viewport.updateTrapezoid();
};

var update = function(fv) {
    fv.aaViewer.update();
    fv.aaViewer2.update();
    _.each(fv.categories, function(category) {
        category.update();
    });
};

var updateZoomButton = function(currentClass, newClass, newTitle) {
    try {
        var zoomBtn = d3.select('.' + currentClass);
        zoomBtn.classed(currentClass, false);
        zoomBtn.classed(newClass, true);
        zoomBtn.attr('title', newTitle);
    } catch(er) {
        console.log('updateZoomButton error: ' + er);
    }
};

var zoomIn = function(fv) {
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
        if ((init + max) > fv.sequence.length) {
            init = fv.sequence.length - max;
        }
        fv.xScale.domain([
            init,
            init + max
        ]);
    }
    update(fv);
    updateViewportFromChart(fv);
    updateZoomFromChart(fv);
    updateZoomButton('icon-zoom-in', 'icon-zoom-out', 'Zoom out to overview');
};

var resetZoom = function(fv) {
    update(fv);
    updateViewportFromChart(fv);
    updateZoomFromChart(fv);
};

var zoomOut = function(fv) {
    fv.xScale.domain([
        1,
        fv.maxPos
    ]);
    resetZoom(fv);
    updateZoomButton('icon-zoom-out', 'icon-zoom-in', 'Zoom in to sequence view');
};

var resetZoomAndSelection = function(fv) {
    fv.xScale.domain([
        1,
        fv.maxPos
    ]);
    if (fv.selectedFeature) {
        ViewerHelper.selectFeature(fv.selectedFeature, fv.selectedFeatureElement, fv);
    }
    resetZoom(fv);
    updateZoomButton('icon-zoom-out', 'icon-zoom-in', 'Zoom in to sequence view');
};

var createZoom = function(fv) {
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
            update(fv);
            updateViewportFromChart(fv);
        });
    return zoom;
};

var closeTooltipAndPopup = function(fv) {
    if (!fv.overFeature && !fv.overTooltip) {
        var tooltipContainer = d3.selectAll('.up_pftv_tooltip-container')
            .transition(20)
            .style('opacity', 0)
            .style('display', 'none');
        tooltipContainer.remove();
    }
    if (!fv.overCatFilterDialog) {
        CategoryFilterDialog.closeDialog();
    }
};

var createNavRuler = function(fv, container) {
    var navHeight = 40, navWithTrapezoid = 50;

    var navXScale = d3.scale.linear()
        .domain([1,fv.maxPos])
        .range([fv.padding.left, fv.width - fv.padding.right]);

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
            update(fv);
            viewport.updateTrapezoid();
        });
    viewport.on("brushstart", function () {
        closeTooltipAndPopup(fv);
    });
    viewport.on("brushend", function () {
        updateZoomFromChart(fv);
        var navigator = d3.select('.up_pftv_navruler .extent');
        if (+navigator.attr('width') >= fv.width - fv.padding.left - fv.padding.right) {
            updateZoomButton('icon-zoom-out', 'icon-zoom-in', 'Zoom in to sequence view');
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

var createButtons = function(fv, data, container) {
    var buttons = container.append('div')
        .attr('class','up_pftv_buttons');
    buttons.append('span').append('a')
        .attr('class','icon-info-circled')
        .attr('title','Help page')
        .attr('href', 'http://ebi-uniprot.github.io/biojs-vis-proteinFeaturesViewer/')
        .attr('target', '_blank');
    buttons.append('span')
        .attr('class','icon-cog')
        .attr('title','Hide/Show tracks')
        .on('click', function(){
            CategoryFilterDialog.displayDialog(fv, data, buttons);
        });
    buttons.append('span')
        .attr('class','icon-arrows-cw')
        .attr('title','Reset view')
        .on('click', function(){
            resetZoomAndSelection(fv);
        });
    buttons.append('span')
        .attr('class','icon-zoom-in')
        .attr('title','Zoom in to sequence view')
        .on('click', function(){
            if ( d3.select(this).classed('icon-zoom-in')) {
                zoomIn(fv);
            } else {
                zoomOut(fv);
            }
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
                aminoAcids.enter().append('path');
                aminoAcids
                    .attr('d', function(d) {
                        return ViewerHelper.shadowPath(d.feature, fv, aaViewHeight);
                    })
                    .attr('transform', function(d) {
                        return 'translate(' + fv.xScale(d.feature.begin) + ',0)';
                    })
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
    var xAxis = d3.svg.axis()
        .scale(fv.xScale);
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
                aminoAcids.enter().append('text')
                    .style('text-anchor','middle')
                    .attr('y', aaViewHeight / 2)
                    .text(function(d) {
                        return d.toUpperCase();
                    })
                    .attr('title', function(d, i) {
                        return (i+1);
                    })
                    .attr('class','up_pftv_amino-acid');
                aminoAcids
                    .attr('x', function(d, i) {
                        return fv.xScale(i+1);
                    });
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
        gAxis.call(xAxis);
        selectorGroup.call(selectorSeries);
        var count = fv.xScale.domain()[1] - fv.xScale.domain()[0];
        if (count > 70) {
            g.transition(50).style('opacity',0);
        } else {
            g.call(series);
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

var findFeature = function(fv, ftType, begin, end, altSequence) {
    var lookup, varLookup;
    _.find(fv.data, function(category) {
        lookup =  _.find(category[1], function(feature) {
            var ftEnd = feature.end ? feature.end : feature.begin;
            if (feature.variants && (feature.type === 'VARIANT')) {
                varLookup = _.find(feature.variants, function(variant) {
                    var varEnd = variant.end ? variant.end : variant.begin;
                    return (+variant.begin === +begin) && (+varEnd === +end)
                        && (variant.alternativeSequence === altSequence);
                });
                return varLookup;
            } else if (feature.type === 'CONFLICT'){
                return (+feature.begin === +begin) && (+ftEnd === +end)
                    && (feature.alternativeSequence === altSequence);
            } else if (feature.type === 'MUTAGEN') {
                return (+feature.begin === +begin) && (+ftEnd === +end)
                    && (feature.alternativeSequence === altSequence);
            } else {
                return (feature.type === ftType) && (+feature.begin === +begin) && (+ftEnd === +end);
            }
        });
        return lookup;
    });
    return varLookup ? varLookup : lookup;
};

var FeaturesViewer = function(opts) {
    var fv = this;
    fv.dispatcher = d3.dispatch("featureSelected", "featureDeselected", "ready", "noData", "noFeatures", "notFound");

    fv.width = 760;
    fv.maxZoomSize = 30;
    fv.selectedFeature = undefined;
    fv.selectedFeatureElement = undefined;
    fv.sequence = "";
    // fv.filterTypes = fv.categoryOrderAndType.variants.ftTypes;
    fv.categories = [];
    fv.filterCategories = [];
    fv.padding = {top:2, right:10, bottom:2, left:10};
    fv.data = [];

    fv.load = function() {
        fv.initLayout(opts);
        var dataSources = Constants.getDataSources();
        _.each(dataSources, function(source){
          var url = source.url + opts.uniprotacc;
          var dataLoader = DataLoader.get(url);
          var container = fv.container.append('div');
          dataLoader.then(function(d){
            if (d instanceof Array) //Workaround to be removed
              d = d[0];
            // First promise to resolve will set global parameters
            if(!fv.sequence) {
              fv.loadZoom(d);
            }
            var features = d.features;
            // group by categories
            if(features.length > 0 && _.has(features[0],'category')){
              features = DataLoader.groupFeaturesByCategory(features);
            } else if (features.length > 0 && features[0].type === 'VARIANT') {
              features = DataLoader.processVariants(features, d.sequence);
            } else if (features.length > 0 && features[0].type === 'PROTEOMICS'){
              features = DataLoader.processProteomics(features);
            } else {
              features = DataLoader.processUngroupedFeatures(features);
            }
            fv.drawCategories(features, source.type, fv, container);
            fv.data = fv.data.concat(features);
            fv.dispatcher.ready();
          }).fail(function(e){
            console.log(e);
          });
        });
    };

    fv.load();
};

FeaturesViewer.prototype.getCategoryTitle = function(type) {
    var fv = this;
    var category = _.find(fv.data, function(cat) {
        var hasType = _.find(cat[1], function(ft) {
            return ft.type === type;
        });
        return hasType;
    });
    return category ? category[0] : undefined;
};

FeaturesViewer.prototype.updateFeatureSelector = function() {
    this.aaViewer.selectFeature();
    this.aaViewer2.selectFeature();
};

FeaturesViewer.prototype.getDispatcher = function() {
    return this.dispatcher;
};

FeaturesViewer.prototype.selectFeature = function(ftType, start, end, altSequence) {
    var fv = this;
    ftType = ftType.toUpperCase();
    altSequence = altSequence ? altSequence.toUpperCase() : altSequence;
    
    var catTitle = fv.getCategoryTitle(ftType);
    var category = _.find(fv.categories, function(cat) {
        return cat.name === catTitle;
    });
    
    var feature = findFeature(fv, ftType, +start, +end, altSequence);
    if (!feature) {
        fv.dispatcher.notFound({ftType: ftType, begin: start, end: end});
        return undefined;
    }

    var elem = d3.select('[name="' + feature.internalId + '"]');
    if (category && feature && elem && !elem.classed('up_pftv_variant_hidden')) {
        var container = category.viewerContainer.style('display') === 'none'
            ? category.tracksContainer : category.viewerContainer;
        if (elem.classed('up_pftv_variant')) {
            var varTrack = d3.select('.up_pftv_category-name[title="' + catTitle + '"]');
            if (varTrack.classed('up_pftv_arrow-right')) {
                category.toggle();
            }
        }
        var elemRect = elem.node().getBoundingClientRect();
        var contRect = container.node().getBoundingClientRect();
        var coordinates = {x: elemRect.x - contRect.x, y: elemRect.y - contRect.y};
        if (fv.selectedFeature) {
            if (fv.selectedFeature.internalId !== feature.internalId) {
                ViewerHelper.selectFeature(feature, elem.node(), fv);
            } else {
                fv.dispatcher.featureSelected({feature: fv.selectedFeature, color: elem.style("fill")});
            }
        } else {
            ViewerHelper.selectFeature(feature, elem.node(), fv);
        }
        TooltipFactory.createTooltip(fv, catTitle, feature, container, coordinates);
        return feature;
    } else {
        fv.dispatcher.notFound({ftType: ftType, begin: start, end: end});
        return undefined;
    }
};

FeaturesViewer.prototype.initLayout = function(opts, d) {
    var fv = this;
    //remove any previous text
    var globalContainer = d3.select(opts.el).text('');
    fvContainer = globalContainer
        .append('div')
        .attr('class', 'up_pftv_container')
        .on('mousedown', function() {
            closeTooltipAndPopup(fv);
        });

    fv.header = fvContainer.append('div');

    fv.container = fvContainer
        .append('div')
        .attr('class', 'up_pftv_category-container');

    fv.footer = fvContainer.append('div').attr('class','bottom-aa-container');
};

FeaturesViewer.prototype.loadZoom = function(d) {
  var fv = this;
  fv.sequence = d.sequence;
  fv.accession = d.accession;
  fv.maxPos = d.sequence.length;

  fv.xScale = d3.scale.linear()
      .domain([1, d.sequence.length + 1])
      .range([fv.padding.left, fv.width - fv.padding.right]);

  fv.viewport = createNavRuler(fv, fv.header);
  createButtons(fv, d, fv.header);
  fv.aaViewer = createAAViewer(fv, fv.header, d.sequence);
  fv.zoom = createZoom(fv);

  fv.aaViewer2 = createAAViewer(fv, fv.footer, d.sequence);
  updateViewportFromChart(fv);
  updateZoomFromChart(fv);
};

FeaturesViewer.prototype.drawCategories = function(data, type, fv, container) {
  _.each(data, function(category) {
    var cat = CategoryFactory.createCategory(category[0], category[1], type, fv, container);
    fv.categories.push(cat);
  });
};

module.exports = FeaturesViewer;
