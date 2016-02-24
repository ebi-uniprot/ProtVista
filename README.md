# biojs-vis-proteinFeaturesViewer

[![NPM version](http://img.shields.io/npm/v/biojs-vis-proteinfeaturesviewer.svg)](https://www.npmjs.org/package/biojs-vis-proteinfeaturesviewer)
[![Build Status](https://secure.travis-ci.org/ebi-uniprot/biojs-vis-proteinFeaturesViewer.png?branch=master)](http://travis-ci.org/ebi-uniprot/biojs-vis-proteinFeaturesViewer)
[![Coverage Status](https://img.shields.io/coveralls/ebi-github/biojs-vis-proteinFeaturesViewer.svg)](https://coveralls.io/r/ebi-uniprot/biojs-vis-proteinFeaturesViewer)

## Getting Started
Install the module with: `npm install biojs-vis-proteinfeaturesviewer`

In order to use this component, you need an HTML element such as <div\> or <span\> or anything else that can act as a container where the viewer will be located. In the following lines, we suppose you have an element identified as *yourDiv*. Do not forget to add a link to the js and the css.

```
<html>
  <head>
    <script src="biojs-vis-proteinFeaturesViewer.js"></script>
    <link href="main.css" rel="stylesheet"/>
  </head>
  <body>
    <div id='yourDiv'/>
  </body>
</html>
```

Now you can include the component in your code and create an instance. In order to create an instance, you need to provide some configuration options. Particularly, you need to specify the object where the component will be located, *el*, as well as the UniProt accession whose sequence annotations will be visualized, *uniprotacc*.
```javascript
var yourDiv = document.getElementById('yourDiv');
var biojs_vis_proteinFeaturesViewer = require('biojs-vis-proteinfeaturesviewer');
var instance = new biojs_vis_proteinFeaturesViewer({
  el: yourDiv,
  uniprotacc : 'UniProt_accession'
});
```

There is a third option that can be specified, *pinPad* with possible values *true* or *false*. This option is used to activate a notepad on the right where tooltip can be pinned. If you set up that option to true, you **must** include pp_main.css.

## Events
The Protein Features viewer triggers five events. In order to listen to those events, you need to get the dispacher.

```javascript
instance.getDispatcher().on("ready", function() {
    console.log('ready');
});
```

### "ready"
As soon as data has been loaded and visualized, this event will be triggered.

### "featureSelected"
As soon as a feature has been selected, meaning a click on it has happened, this event will be triggered. The data provided by this event looks like:
```javascript
{
  "feature":{
    "type":{"name":"REGION","label":"region of interest"},
    "description":"Heparin-binding",
    "begin":"96",
    "end":"110",
    "internalId":"ft_65"
  },
  "color":"rgb(179, 62, 0)"
}
```

### "featureDeselected"
As soon as a feature has been deselected, this event will be triggered. A feature is deselected when it is selected and a clicked on it happens, or when another feature is selected. The data provided by this event looks like the one provided by the event "featureSelected".

### "noData"
Triggered when the data failed to be loaded. the data provided by this event will be an error return by a jQuery.ajax request.

### "noFeatures"
Triggered when the Uniprot accession has no sequence annotations.

## Contributing
Please submit all issues and pull requests to the [ebi-uniprot/biojs-vis-proteinFeaturesViewer](http://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer) repository!

## Support
If you have any problem or suggestion please open an issue [here](https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer/issues).

## License
This software is licensed under the Apache 2 license, quoted below.

Copyright (c) 2014, ebi-uniprot

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
