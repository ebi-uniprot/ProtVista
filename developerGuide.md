---
layout: blank_container
title: Developer Guide
---

# biojs-vis-proteinFeaturesViewer

## Getting the code
As well as ```featuresviewer.min.js``` which contains the minified JavaScript code required to run the application, two css files are required: ```main.css``` (general styling, including feature styles) and ```fontello.css``` (icon font).

### The easy way (CDN)
We host all our releases on Github, using Github pages as a CDN. The latest release is available here:

```
<script src="http://ebi-uniprot.github.io/CDN/feature-viewer/featuresviewer.js"></script>
<link href="http://ebi-uniprot.github.io/CDN/feature-viewer/css/main.css" rel="stylesheet"/>
<link href="http://ebi-uniprot.github.io/CDN/feature-viewer/css/fontello.css" rel="stylesheet"/>   
```

We also archive previous versions:

```
<script src="http://ebi-uniprot.github.io/CDN/feature-viewer/1.0.0/featuresviewer.js"></script>
<link href="http://ebi-uniprot.github.io/CDN/feature-viewer/1.0.0/css/main.css" rel="stylesheet"/>
<link href="http://ebi-uniprot.github.io/CDN/feature-viewer/1.0.0/css/fontello.css" rel="stylesheet"/>   
```

### The node way
`>npm install biojs-vis-proteinfeaturesviewer`
This is probably the preferred way if you are developing a new component or application that uses our feature viewer. It would be useful as well if you are modifying this component. Some more information about [node](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/).

## Loading the Feature Viewer
In order to use this component, you need an HTML element such as <div\> or <span\> or anything else that can act as a container where the viewer will be located. In the following lines, we use a DIV element identified as *yourDiv*, it could have any other name.

When creating the instance, you need to specify the object where the component will be located, *el*, as well as the UniProt accession whose sequence annotations will be visualized, *uniprotacc*. We are supposing here that you will instantiate the component as soon as the window has been loaded, i.e., window.onload function.

```html
<div id='yourDiv'/>
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

That's it, you should now see the Feature Viewer in your web page!

## API
The protein feature viewer offer some public methods that can be used to programmatically interact with the component.

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

Here is the list of the currently supported feature types:


**Category: Domains and sites**

**ftType** | **Label** | **Description**
--- | --- | ---
[domain](http://www.uniprot.org/help/domain) | Domain | Position and type of each modular protein domain
[repeat](http://www.uniprot.org/help/repeat) | Repeat | Positions of repeated sequence motifs or repeated domains
[ca_bind](http://www.uniprot.org/help/ca_bind) | Calcium binding | Position(s) of calcium binding region(s) within the protein
[zn_fing](http://www.uniprot.org/help/zn_fing) | Zinc finger | Position(s) and type(s) of zinc fingers within the protein
[dna_bind](http://www.uniprot.org/help/dna_bind) | DNA binding | Position and type of a <span class="caps](http://www.uniprot.org/help/DNA</span>-binding domain
[np_bind](http://www.uniprot.org/help/np_bind) | Nucleotide binding | Nucleotide phosphate binding region
[region](http://www.uniprot.org/help/region) | Region | Region of interest in the sequence
[coiled](http://www.uniprot.org/help/coiled) | Coiled coil | Positions of regions of coiled coil within the protein
[motif](http://www.uniprot.org/help/motif) | Motif | Short (up to 20 amino acids) sequence motif of biological interest
[act_site](http://www.uniprot.org/help/act_site) | Active site | Amino acid(s) directly involved in the activity of an enzyme
[metal](http://www.uniprot.org/help/metal) | Metal binding | Binding site for a metal ion
[binding](http://www.uniprot.org/help/binding) | Binding site | Binding site for any chemical group (co-enzyme, prosthetic group, etc.)
[site](http://www.uniprot.org/help/site) | Site | Any interesting single amino acid site on the sequence

 **Category: Molecule processing**

 **ftType** | **Label** | **Description**
 --- | --- | ---
[init_met](http://www.uniprot.org/help/init_met) | Initiator methionine |  Cleavage of the initiator methionine
[signal](http://www.uniprot.org/help/signal) | Signal | Sequence targeting proteins to the secretory pathway or periplasmic space
[transit](http://www.uniprot.org/help/transit) | Transit peptide | Extent of a transit peptide for organelle targeting
[propep](http://www.uniprot.org/help/propep) | Propeptide | Part of a protein that is cleaved during maturation or activation
[chain](http://www.uniprot.org/help/chain) | Chain | Extent of a polypeptide chain in the mature protein
[peptide](http://www.uniprot.org/help/peptide) | Peptide | Extent of an active peptide in the mature protein

**Category: Post translational modifications**

**ftType** | **Label** | **Description**
 --- | --- | ---
[mod_res](http://www.uniprot.org/help/mod_res) | Modified residue | Modified residues excluding lipids, glycans and protein cross-links
[lipid](http://www.uniprot.org/help/lipid) | Lipidation | Covalently attached lipid group(s)
[carbohyd](http://www.uniprot.org/help/carbohyd) | Glycosylation | Covalently attached glycan group(s)
[disulfid](http://www.uniprot.org/help/disulfid) | Disulfide bond | Cysteine residues participating in disulfide bonds
[crosslnk](http://www.uniprot.org/help/crosslnk) | Cross-link | Residues participating in covalent linkage(s) between proteins

**Category: Sequence information**

**ftType** | **Label** | **Description**
 --- | --- | ---
[compbias](http://www.uniprot.org/help/compbias) | Compositional biased | Region of compositional bias in the protein
[non_std](http://www.uniprot.org/help/non_std) | Non-standard residue | Occurence of non-standard amino acids (selenocysteine and pyrrolysine) in the protein sequence
[unsure](http://www.uniprot.org/help/unsure) | Sequence uncertainty | Regions of uncertainty in the sequence
[conflict](http://www.uniprot.org/help/conflict) | Sequence conflict | Description of sequence discrepancies of unknown origin
[non_cons](http://www.uniprot.org/help/non_cons) | Non-adjacent residues | Indicates that two residues in a sequence are not consecutive
[non_ter](http://www.uniprot.org/help/non_ter) | Non-terminal residue | The sequence is incomplete. Indicate that a residue is not the terminal residue of the complete protein

**Category: Structural features**

**ftType** | **Label** | **Description**
 --- | --- | ---
[helix](http://www.uniprot.org/help/helix) | Helix | Helical regions within the experimentally determined protein structure
[turn](http://www.uniprot.org/help/turn) | Turn | Turns within the experimentally determined protein structure
[strand](http://www.uniprot.org/help/strand) | Beta strand | Beta strand regions within the experimentally determined protein structure

**Category: Topology**

**ftType** | **Label** | **Description**
 --- | --- | ---
[topo_dom](http://www.uniprot.org/help/topo_dom) | Topological domain | Location of non-membrane regions of membrane-spanning proteins
[transmem](http://www.uniprot.org/help/transmem) | Transmembrane | Extent of a membrane-spanning region
[intramem](http://www.uniprot.org/help/intramem) | Intramembrane | Extent of a region located in a membrane without crossing it

**Category: Mutagenesis**

**ftType** | **Label** | **Description**
 --- | --- | ---
[mutagen](http://www.uniprot.org/help/mutagen) | Mutagenesis | Site which has been experimentally altered by mutagenesis

**Category: Variants**

**ftType** | **Label** | **Description**
 --- | --- | ---
[variant](http://www.uniprot.org/help/variant) | Natural variant | Description of a natural variant of the protein |



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
