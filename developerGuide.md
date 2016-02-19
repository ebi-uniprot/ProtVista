---
layout: blank_container
title: Developer Guide
---

# biojs-vis-proteinFeaturesViewer

## Getting Started
You can find the latest built version in our Github Pages [CDN-like repository](https://github
.com/ebi-uniprot/CDN/tree/gh-pages/feature-viewer). You will need the **css** folder, the **font** folder and any of the **JavaScript** files in there.

Alternatively, you can install the module with: 
`npm install biojs-vis-proteinfeaturesviewer`
This is probably the preferred way if you are developing a new component or application that uses our feature viewer. It would be useful as well if you are modifying this component. Some more information about [node](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/). 
 
In order to use this component, you need an HTML element such as <div\> or <span\> or anything else that can act as a container where the viewer will be located. In the following lines, we use a DIV element identified as *yourDiv*, it could have any other name. Do not forget to add a link to the **js**, the **css** and the **font** files. We are supposing here that you are using our **CDN-like repository**, if not, then please adjust the paths to your own environment.

```
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <script src="http://ebi-uniprot.github.io/CDN/feature-viewer/featuresviewer.js"></script>
    <link href="http://ebi-uniprot.github.io/CDN/feature-viewer/css/main.css" rel="stylesheet"/>
    <link href="http://ebi-uniprot.github.io/CDN/feature-viewer/css/fontello.css" rel="stylesheet"/>    
  </head>
  <body>
    <div id='yourDiv'/>
  </body>
</html>
```

Now you can include the component in your code and create an instance. In order to create an instance, you need to provide some configuration options. Particularly, you need to specify the object where the component will be located, *el*, as well as the UniProt accession whose sequence annotations will be visualized, *uniprotacc*. We are supposing here that you will instantiate the component as soon as the window has been loaded, i.e., window.onload function. Remember to place this script at the end of the *head* section of your HTML. 

```javascript
<script>
    window.onload = function() {
        var yourDiv = document.getElementById('yourDiv');
        var biojs_vis_proteinFeaturesViewer = require('biojs-vis-proteinfeaturesviewer');
        var instance = new biojs_vis_proteinFeaturesViewer({
            el: yourDiv,
            uniprotacc : 'P05067'
        });
    }
</script>
```

There is a third option that can be specified, *pinPad* with possible values *true* or *false*. This option is used to activate a notepad on the right where tooltip can be pinned. If you set up that option to true, you **must** include pp_main.css.

## Events
The Protein Feature Viewer triggers five events. In order to listen to those events, you need to get the dispatcher.

```javascript
instance.getDispatcher().on("ready", function(obj) {
    console.log('ready');
    console.log(obj);
});
``` 

### "ready"
As soon as data has been loaded and visualized, this event will be triggered. The object provided by this event corresponds to all the data retrieved from the data service plus some parsing, it will be ready to be used by the viewer or any other JavaScript component. 

### "featureSelected"
As soon as a feature has been selected, meaning a click on it has happened, this event will be triggered. The object provided by this event looks like:

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
As soon as a feature has been deselected, this event will be triggered. A feature is deselected when it is selected and a clicked on it happens, or when another feature is selected. The object provided by this event looks like the one provided by the event "featureSelected".

### "noData"
Triggered when the data failed to be loaded. The object provided by this event will be an **error** return by a jQuery.ajax request.

### "noFeatures"
Triggered when the Uniprot accession has no sequence annotations. The object provided by this event corresponds to the data retrieved from the data service.

### "notFound"
Triggered when the method **selectFeature** is used but no corresponding feature has been found. The object provided by this event will contain the information passed as parameters to the method, for instance

```javascript
{
  "ftType": "REGION",
  "begin": 5,
  "end": 27
}
```

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
