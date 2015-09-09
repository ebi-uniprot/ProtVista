// if you don't specify a html file, the sniper will generate a div
var app = require("biojs-vis-proteinfeaturesviewer");
var instance = new app({el: yourDiv, text: 'biojs', uniprotacc : 'P05067'});
instance.getDispatcher().on("ready", function() {
 console.log('ready');
});
instance.getDispatcher().on("featureSelected", function(obj) {
 console.log('feature selected');
 console.log(obj);
});
instance.getDispatcher().on("featureDeselected", function(obj) {
 console.log('feature deselected');
 console.log(obj);
});
