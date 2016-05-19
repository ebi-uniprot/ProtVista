---
layout: blank_container
title: Data sources and data format
---

# Default data sources
By default, the Protein Feature Viewer uses three data RESTful sources provided by [UniProt](http://www.ebi.ac.uk/uniprot/api/doc/index.html). Particularly, it uses the feature source, the variation source and the proteomics source. 

# Adding your own source
You can add your own data source by using the dataSources option when instantiating the viewer. Please keep in mind that the response should follow the data format expected by the viewer. You will need to specify the URL and the type. Supported types are *basic* and *variant*.

The protein accession will be added at the end of the URL, and the expected response format is JSON. Make sure you allow Cross-origin-resource-sharing.

In the following example, we use the default UniProt data sources as well as an additional one. If the data source type is not specied, *basic* will be used as default.

```html
<div id='yourDiv'/>
<script>
    window.onload = function() {
        var yourDiv = document.getElementById('yourDiv');
        var biojs_vis_proteinFeaturesViewer = require('biojs-vis-proteinfeaturesviewer');
        var instance = new biojs_vis_proteinFeaturesViewer({
            el: yourDiv,
            uniprotacc: 'P05067',
            defaultSources: true,
            dataSources: [
              {
                url: 'https://mydomain/mysource/',
                type: 'basic'
              }
            ]
        });
    }
</script>
```

Things to keep in mind:
* Get familiar with the [feature categories and types supported by the viewer](./userGuide.html#feature-categories-and-types)
* If you use the same feature categories and types supported by the viewer, your features will be mixed with the UniProt default ones.
* If you use the same features categories but different feature types, your features will be mixed with the default ones in the overview (category close) but will be displayed on their own track in the detailed view (category open).
* If you use different feature categories, then your features will be visually separated from the default ones.
* Whenever you use a supported feature type, the predefined shape and color for that type will be used. You can also specify the color as part of the feature data provided by your data source.

# Data format

All data sources are expected to provide a sequence and a list of features. The sequence is mandatory so the sequence length can be loaded as soon as the first data source has been resolved. The sequence length is used for layout calculations.

You can omit the sequence if you are using the default UniProt data sources as those will be loaded first. Otherwise you *must* provide the sequence.

This is how a response with no features looks like:

```
{
  "sequence": "MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDS",
  "features": []
}   
```

## *Basic* data source type

The *basic* data source type is used for all sort of features but natural variants. Here is the data format for basic features.

```
{
  "type": String - mandatory
  "category": String - mandatory - no spaces, use _ instead
  "ftId": String - optional
  "description": String - optional
  "begin": Integer string or integer - mandatory - it must be a valid position within the sequence
  "end": Integer string or integer - mandatory - it must be a valid position within the sequence
  "alternativeSequence": String - optional - useful for Mutagenesis and Conflict feature types
  "color": String - optional - will be used if provided, should be a valid color
  "evidences": Array - optional 
  [
    {
       "code": String - mandatory - should be a valid ECO code
       "source": Object - optional 
       {
         "name": String - mandatory
         "id": String - mandatory
         "url": String - optional - should be a valid URL
       }
    }
  ]
}   
```

Examples of valid *basic* features:

```
"features": [
  {    
    "type": "TOPO_DOM",
    "category": "TOPOLOGY",
    "description": "Cytoplasmic",
    "begin": "724",
    "end": "770",
    "evidences": [    
      {
        "code": "ECO:0000255"
      }
    ]    
  },
  {    
    "type": "TRANSMEM",
    "category": "TOPOLOGY",
    "begin": "700",
    "end": "723"    
  },
  {    
    "type": "MY_TRANSMEM",
    "category": "TOPOLOGY",
    "begin": "708",
    "end": "723"    
  },
  {    
    "type": "ACT_SITE",
    "category": "MY_CATEGORY",
    "begin": "600",
    "end": "600",
    "color": "#00F5B8"        
  },
  {    
    "type": "MY_REGIOM",
    "category": "MY_CATEGORY",
    "begin": "610",
    "end": "623",
    "color": "#FF7094"        
  },  
  {    
    "type": "SIGNAL",
    "category": "MOLECULE_PROCESSING",
    "description": "",
    "begin": "1",
    "end": "17",
    "color:" "#FF3366",
    "evidences": [    
      {    
        "code": "ECO:0000269",
        "source": {
          "name": "PubMed",
          "id": "12665801",
          "url": "http://www.ncbi.nlm.nih.gov/pubmed/12665801"
        }    
      },
      {    
        "code": "ECO:0000269",
        "source": {
          "name": "PubMed",
          "id": "2900137",
          "url": "http://www.ncbi.nlm.nih.gov/pubmed/2900137"          
        }    
      }
    ]  
  }
]
```

## *Variant* data source type

The *variant* data source type is used only for natural variations. Using the *variant* data source type will result in [customized visualization for variants](./userGuide.html#natural-variant-track). If you want to add your own variants but do not want to use this visualization, use the *basic* data source type. Keep in mind that variants require more data than other features. 

Here is the data format for the variant features:

```
{
  "type": "VARIANT" - mandatory
  "ftId": String - optional
  "description": String - optional
  "begin": Integer string or integer - mandatory - it must be a valid position within the sequence
  "end": Integer string or integer - mandatory - it must be a valid position within the sequence
  "alternativeSequence": String - mandatory - '-' must be used for deletions, '*' for stop gained and stop lost
  "wildType": String - mandatory
  "color": String - optional - will be used if provided, should be a valid color
  "polyphenPrediction": String - optional
  "polyphenScore": ​double - optional - most probably present if polyphenPrediction is known
  "siftPrediction": String - optional
  "siftScore": double - optional - most probably present if siftPrediction is known
  "sourceType": "custom_data" - mandatory - other types are allowed for data provided by UniProt
  "evidences": Array - optional 
  [
    {
       "code": String - mandatory - should be a valid ECO code
       "source": Object - optional 
       {
         "name": String - mandatory
         "id": String - mandatory
         "url": String - optional - should be a valid URL
       }
    }
  ],
  "xrefs": Array - optional
  [  
    {
      "name": String - mandatory
      "id": String - mandatory
      "url": String - optional - should be a valid URL
    }  
  ]
}   
```

Examples of valid *variant* features:

```
"features": [
  {  
      "type": "VARIANT",
      "ftId": "VAR_010109",
      "alternativeSequence": "P",
      "begin": "723",
      "end": "723",
      "wildType": "L",
      "description": "missense, known association with Alzheimer disease",
      "sourceType": "custom_data"
  },
  {  
      "type": "VARIANT",
      "alternativeSequence": "R",
      "begin": "71",
      "end": "71",
      "xrefs": [  
        {
          "name": "ExAC",
          "id": "rs757264249",
          "url": "http://exac.broadinstitute.org/dbsnp/rs757264249"
        }
      ],
      "wildType": "Q",
      "polyphenPrediction": "benign",
      "polyphenScore": ​0.0,
      "siftPrediction": "deleterious",
      "siftScore": ​0.02,
      "sourceType": "custom_data"
  },
  {  
    "type": "VARIANT",
    "description": "primary tissue(s): large intestine",
    "alternativeSequence": "L",
    "begin": "727",
    "end": "727",
    "color": "violet",
    "xrefs": [  
      {
        "name": "my_data curated",
        "id": "CUR1413494",
        "url": "http://mydomain/overview?id=1413494"
      }  
    ],
    "evidences": [  
      {  
        "code": "ECO:0000313",
        "source": {
          "name": "internal_study",
          "id": "STUDY:376",
          "url": "http://mydomain/overview?study_id=376"
        }
      }
    ],
    "wildType": "Q",
    "polyphenPrediction": "benign",
    "polyphenScore": ​0.4,
    "siftPrediction": "deleterious",
    "siftScore": ​0.04,    
    "sourceType": "custom_data"  
  }  
]
```

