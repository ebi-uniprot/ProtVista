# ProtVista
## Feature viewer for protein sequence annotation

[![NPM version](http://img.shields.io/npm/v/ProtVista.svg)](https://www.npmjs.org/package/ProtVista)
[![Build Status](https://secure.travis-ci.org/ebi-uniprot/ProtVista.png?branch=master)](http://travis-ci.org/ebi-uniprot/ProtVista)

### 2.0.5
- Added antigen track
- New icons
- pre-highlight specified region

### 2.0.4
- Changed colour scale for SIFT/Polyphen variant predictions.
- Minor improvements.

### 2.0.3
- Added possibility to display your variants.
- Added download functionality (XML/JSON/GFF).

### 2.0.2
- Added possibility to display your own data (except variants).

### 2.0.1
- Fix typo.
- Fix shadow bug showing it slightly to the right on the bottom ruler.
- Update css concat changes.
- Update BLAST changes.
- Add missing xrefs for LSS variants.
- Reduce top margin for first filter title so reset button will be closer.
- Implement reset filter behaviour.
- Add BLAST option to tooltip.
- Concat css files into one named main.css.
- Allow category exclusion.

### 2.0.0
- Addition of "Proteomics" track, showing unique and non-unique peptides
- Updates to typography which was causing issues with some users
- Model changes to the REST api the feature viewer uses
- Supports multiple data sources (first steps towards being able to use your own data)
- New filtering mechanism
- Improved tooltip for variants including more information related to cross-references

## Documentation
[Developer documentation](http://ebi-uniprot.github.io/ProtVista/developerGuide.html)

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
