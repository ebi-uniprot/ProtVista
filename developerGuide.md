---
layout: blank_container
title: Developer Guide
---

# ProtVista

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Getting the code](#getting-the-code)
  - [The easy way (CDN-like)](#the-easy-way-cdn-like)
  - [The node way](#the-node-way)
- [Starting the ProtVista](#starting-protvista)
  - [Excluding some categories](#excluding-some-categories)
- [API](#api)
  - [selectFeature(ftType, begin, end, altSequence)](#selectfeaturefttype-begin-end-altsequence)
  - [Currently supported features](#currently-supported-features)
- [Events](#events)
  - ["ready"](#ready)
  - ["noDataAvailable"](#nodataavailable)
  - ["noDataRetrieved"](#nodataretrieved)
  - ["featureSelected"](#featureselected)
  - ["featureDeselected"](#featuredeselected)
  - ["notFound"](#notfound)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting the code
You will need the ```featuresviewer.min.js``` which contains the minified JavaScript code required to run the application, as well as the CSS file ```main.css``` (general styling, including feature styles and icon fonts).

### The easy way (CDN-like)
We host all our releases on Github, using Github pages as a CDN. The latest release is available here:

```
<script src="http://ebi-uniprot.github.io/CDN/feature-viewer/featuresviewer.js"></script>
<link href="http://ebi-uniprot.github.io/CDN/feature-viewer/css/main.css" rel="stylesheet"/>   
```

We also archive previous versions, for instance:

```
<script src="http://ebi-uniprot.github.io/CDN/feature-viewer/1.0.0/featuresviewer.js"></script>
<link href="http://ebi-uniprot.github.io/CDN/feature-viewer/1.0.0/css/main.css" rel="stylesheet"/>
<link href="http://ebi-uniprot.github.io/CDN/feature-viewer/1.0.0/css/fontello.css" rel="stylesheet"/>   
```

### The node way
`>npm install ProtVista`
This is probably the preferred way if you are developing a new component or application that uses our feature viewer. It would be useful as well if you are modifying this component. Some more information about [node](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/).

## Starting ProtVista
In order to use this component, you need an HTML element such as <div\> or <span\> or anything else that can act as a container where ProtVista will be located. In the following lines, we use a DIV element identified as *yourDiv*, it could have any other name.

When creating the instance, you need to specify the object where the component will be located, *el*, as well as the UniProt accession whose sequence annotations will be visualized, *uniprotacc*. We are supposing here that you will instantiate the component as soon as the window has been loaded, i.e., window.onload function.

```html
<div id='yourDiv'/>
<script>
    window.onload = function() {
        var yourDiv = document.getElementById('yourDiv');
        var ProtVista = require('ProtVista');
        var instance = new ProtVista({
            el: yourDiv,
            uniprotacc: 'P05067'
        });
    }
</script>
```

That's it, you should now see ProtVista in your web page!

### Excluding some categories

If you are not interested in all the categories supported by ProtVista, you can exclude some of them, make sure you use the right spelling and CAPITAL letters. The available categories are: DOMAINS_AND_SITES, MOLECULE_PROCESSING, PTM, SEQUENCE_INFORMATION, STRUCTURAL, TOPOLOGY, MUTAGENESIS, PROTEOMICS and VARIATION. For more information on features belongin to each category, please read the API section in this guide.
 
```html
<div id='yourDiv'/>
<script>
    window.onload = function() {
        var yourDiv = document.getElementById('yourDiv');
        var ProtVista = require('ProtVista');
        var instance = new ProtVista({
            el: yourDiv,
            uniprotacc: 'P05067',
            exclusions: ['SEQUENCE_INFORMATION', 'STRUCTURAL']
        });
    }
</script>
```

## API
ProtVista offers some public methods that can be used to programmatically interact with the component.

### selectFeature(ftType, begin, end, altSequence)
If you want to select a feature you can use the *selectFeature method*. The parameters ftType, begin and end are mandatory while altSequence is optional. Whenever you want to select variants, mutagenesis or conflict sequences you need to pass the altSequence, i.e., the bit of sequence reported by that feature.

```javascript
<script>
    instance.selectFeature('region', 27, 83);
    instance.selectFeature('act_site', 47, 47);
</script>
```

```javascript
<script>
    instance.selectFeature('variant', 33, 34, 'QH');
    instance.selectFeature('conflict', 53, 58, 'KGLMTW');
    instance.selectFeature('mutagen', 115, 115, 'K');
</script>
```

### Currently supported features
Please take look to the [currently supported categories, types and features](userGuide.html#feature-categories-and-types). 

## Events
ProtVista triggers five events. In order to listen to those events, you need to get the dispatcher.

```javascript
instance.getDispatcher().on("ready", function(obj) {
    console.log('ready');
    console.log(obj);
});
```

### "ready"
As soon as data from at least one of the data service has been loaded, this event will be triggered. The object provided by this event corresponds to all the data retrieved from the data service plus some parsing, it will be ready to be used by ProtVista or any other JavaScript component.

### "noDataAvailable"
Triggered when the protein accession retrieved has no sequence annotations. No object is provided in this case.

### "noDataRetrieved"
Triggered when the data failed to be loaded. No object is provided in this case. Check the console logs for errors.

### "featureSelected"
As soon as a feature has been selected, meaning a click on it has happened, this event will be triggered. This event will also be triggered after using the method _selectFeature_ if the selection was successful. The object provided by this event looks like:

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
Please submit all issues and pull requests to the [ebi-uniprot/ProtVista](http://github.com/ebi-uniprot/ProtVista) repository!

## Support
If you have any problem or suggestion please open an issue [here](https://github.com/ebi-uniprot/ProtVista/issues).

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
