
var app = require("ProtVista");

var themeClassName = 'pv-theme-grey';

var body = d3.select("body");

// add container without theme
body.append("h2").text("No Theme")
body.append("div")
    .attr("id", "app-no-theme")

// add container with theme
body.append("h2").text("With Theme")
body.append("div")
    .attr("id", "app-with-theme")
    .attr("class", themeClassName);

// app instance without theme
var app1 = new app({el: document.getElementById('app-no-theme'), text: 'biojs', uniprotacc : 'P05067'});

// app instance with theme
var app2 = new app({el: document.getElementById('app-with-theme'), text: 'biojs', uniprotacc : 'P05067'});

