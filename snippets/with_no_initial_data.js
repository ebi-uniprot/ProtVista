// if you don't specify a html file, the sniper will generate a div
var app = require("ProtVista");
var myInstance = new app(
    {
        el: yourDiv,
        uniprotacc : '',
        overwritePredictions: true,
        defaultSources: false
    }
);

var data = {
    "accession": "P05067",
    "entryName": "A4_HUMAN",
    "sequence": "MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTKTCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVGEFVSDALLVPDKCKFLHQERMDVCETHLHWHTVAKETCSEKSTNLHDYGMLLPCGIDKFRGVEFVCCPLAEESDNVDSADAEEDDSDVWWGGADTDYADGSEDKVVEVAEEEEVAEVEEEEADDDEDDEDGDEVEEEAEEPYEEATERTTSIATTTTTTTESVEEVVREVCSEQAETGPCRAMISRWYFDVTEGKCAPFFYGGCGGNRNNFDTEEYCMAVCGSAMSQSLLKTTQEPLARDPVKLPTTAASTPDAVDKYLETPGDENEHAHFQKAKERLEAKHRERMSQVMREWEEAERQAKNLPKADKKAVIQHFQEKVESLEQEAANERQQLVETHMARVEAMLNDRRRLALENYITALQAVPPRPRHVFNMLKKYVRAEQKDRQHTLKHFEHVRMVDPKKAAQIRSQVMTHLRVIYERMNQSLSLLYNVPAVAEEIQDEVDELLQKEQNYSDDVLANMISEPRISYGNDALMPSLTETKTTVELLPVNGEFSLDDLQPWHSFGADSVPANTENEVEPVDARPAADRGLTTRPGSGLTNIKTEEISEVKMDAEFRHDSGYEVHHQKLVFFAEDVGSNKGAIIGLMVGGVVIATVIVITLVMLKKKQYTSIHHGVVEVDAAVTPEERHLSKMQQNGYENPTYKFFEQMQN",
    "sequenceChecksum": "A12EE761403740F5",
    "taxid" : 9606,
    "features":
        [
            {
                "type": "PROTEOMICS",
                "begin": "64",
                "end": "70",
                "peptide": "DTKEGIL",
                "unique": false
            },
            {
                "type": "PROTEOMICS",
                "begin": "464",
                "end": "470",
                "xrefs":
                    [
                        {
                            "name": "Proteomes",
                            "id": "UP000005640"
                        }
                    ],
                "evidences":
                    [
                        {
                            "code": "ECO:0000213",
                            "source":

                                {
                                    "name": "PeptideAtlas",
                                    "id": "P05067"
                                }
                        }
                    ],
                "peptide": "MLNDRRR",
                "unique": true
            },
            {
                "type": "PROTEOMICS",
                "begin": "725",
                "end": "736",
                "xrefs":
                    [
                        {
                            "name": "Proteomes",
                            "id": "UP000005640"
                        }
                    ],
                "evidences":
                    [
                        {
                            "code": "ECO:0000213",
                            "source":
                                {
                                    "name": "PeptideAtlas",
                                    "id": "P05067"
                                }
                        },
                        {
                            "code": "ECO:0000213",
                            "source":
                                {
                                    "name": "MaxQB",
                                    "id": "P05067"
                                }
                        },
                        {
                            "code": "ECO:0000213",
                            "source":
                                {
                                    "name": "EPD",
                                    "id": "P05067"
                                }
                        }
                    ],
                "peptide": "KKQYTSIHHGVV",
                "unique": true

            }
        ]
};

var input = d3.select('body').append('div');
input.append('button').text('Set data')
    .on('click', function() {
        myInstance.setData('P05067', data, 'MyJustCreatedData');
    });
