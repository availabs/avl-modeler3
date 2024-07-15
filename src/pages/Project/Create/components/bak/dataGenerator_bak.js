import React, { useState, Fragment, useRef } from "react";
import { Dialog, Transition, Menu } from "@headlessui/react";
import flatten from "lodash.flatten";
import Papa from "papaparse";
import { useFalcor, withAuth } from "modules/avl-components/src";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import controlConfigJson from "./controlConfig.json";
// import CreateNewProject from "./createProject_old";
import VarSelector from "./varSelector";
// import VarSelector from "./varSelector_1.js";
import CreateProject from "./createProject";
import { useHistory } from "react-router-dom";

// import GenerateCrosswalk from "./dataProcessing/generateCrosswalk";
import {
  generateCrosswalk,
  generateSeedData,
  generateControl,
} from "./dataProcessing/generateCrosswalk";

import { stringify } from "postcss";

//let controlConfigJson = require('./control_config.json')  //if public data folder
// const host = "http://localhost:5000/";

const DataGenerator = ({ layer, user }) => {
  console.log("layer----", layer, user, layer.state);
  const { falcor, falcoCache } = useFalcor();
  const [process, setProcess] = useState(false);
  const [open, setOpen] = useState(true);
  const [selectedVar, setSelectedVar] = useState([]);
  const history = useHistory();

  const [data, setData] = useState();

  //add title to the data
  const getTitle = (e) => {
    setData({ project_name: e.target.value });
  };

  console.log(
    "Selected Var----",
    selectedVar
    // selectedVar[0].setting // this is only work after area selected
  );

  // let generateCrosswalkTest = generateCrosswalk1(layer);

  // // const generateCrosswalkTest = generateCrosswalk(layer);

  // console.log("generateCrosswork-----------", generateCrosswalkTest);

  const startProcess = async () => {
    setProcess(true);

    console.time("generate crosswalk");
    // let crosswalkData = generateCrosswalk();
    let crosswalkData = generateCrosswalk(layer);
    // console.log("crosswalkData1Layer", layer.state, layer);
    // console.log("crosswalkData1", crosswalkData1);

    console.timeEnd("generate crosswalk");

    console.time("generate seed");
    let seedData = await generateSeedData(layer); // because fetch--promise
    console.timeEnd("generate seed");

    console.time("generate control");
    let controlData = await generateControl(crosswalkData, selectedVar, layer); // because fetch--promise
    console.timeEnd("generate control");

    console.time("generate controlControl");
    // let controlConfig = generateControlConfig(controlData);
    //expression is hard to generate so decide to manually creat object json and import

    // let controlConfig = controlConfigJson;

    let controlConfig = flatten(generateControlConfig());
    controlConfig.splice(1, 3);
    console.timeEnd("generate controlControl");

    const projectData = {
      crosswork_data: crosswalkData,
      seed_data: seedData,
      control_data: controlData,
      control_config: controlConfig,
      setting: selectedVar[0].setting,
    };

    // console.log("projectData---", projectData);

    // setData({ ...data, ...{ project_data: projectData } });

    // requestCreate(data);

    requestCreate({
      ...data,
      ...{
        userId: user.id,
        status: "processing",
        project_data: projectData,
      },
    }); //post fullData

    setProcess(false);
    history.push("/");

    // return null;

    //save each Data(inputs data) as zip file
    //how to --https://github.com/Stuk/jszip

    // var zip = new JSZip();
    // zip.file("geo_cross_walk.csv", Papa.unparse(crosswalkData)); //use Papa.unparse to put json back to csv
    // zip.file("seed_households.csv", Papa.unparse(seedData.household));
    // zip.file("seed_persons.csv", Papa.unparse(seedData.person));
    // zip.file("control_totals_bg.csv", Papa.unparse(controlData.control_bgs));
    // zip.file(
    //   "control_totals_tract.csv",
    //   Papa.unparse(controlData.control_tracts)
    // );
    // zip.file("controls.csv", Papa.unparse(controlConfig));

    // let zipFile = await zip.generateAsync({ type: "blob" });
    // saveAs(zipFile, "pop_synth_input_new.zip");
  };

  // const generateCrosswalk = () => {
  //   // TAZ	BLKGRP	STATEFP	COUNTYFP	TRACTCE	GEOID	NAME	NAMELSAD	PUMA	REGION

  //   console.log("selectedPumasBgs", layer.state.selectedPumasBgs);

  //   let output = Object.keys(layer.state.selectedPumasBgs).map((key) => {
  //     // console.log("test---", key)
  //     return layer.state.selectedPumasBgs[key].map((bg) => {
  //       // console.log('BLKGRP',bg);
  //       return {
  //         BG: bg.slice(-7), //last 5 digits of bg
  //         BLKGRP: bg,
  //         STATEFP: bg.slice(0, 2), //first 2 dgitsd of bg
  //         COUNTYFP: parseInt(bg.slice(2, 5)),
  //         TRACTCE: parseInt(bg.slice(5, 11)),
  //         GEOID: bg.slice(0, 11),
  //         NAME: parseInt(bg.slice(5, 11)),
  //         NAMELSAD: `Census Tract ${parseInt(bg.slice(5, 11))}`,
  //         PUMA: key.slice(3, 7),
  //         REGION: 1,
  //       };
  //     });
  //     //console.log('output--', data)
  //     // return data
  //   });
  //   console.log("outputCrosswalk---", output);
  //   return flatten(output);
  // };

  //Seed data start here------------------------------------------

  // const generateSeedData = () => {
  //   console.log("fetching households");

  //   let selectedPumas = layer.state.selectedPumas;

  //   console.log("selectedPumas---", selectedPumas);

  //   const household = selectedPumas.map((pumaId) => {
  //     let puma_id = pumaId.slice(2, 7);
  //     let url = `${host}pums/psam/h/${puma_id}`;
  //     return fetch(url)
  //       .then((r) => r.json())
  //       .then((d) => {
  //         return {
  //           type: "h",
  //           data: d,
  //         };
  //       });
  //   });

  //   const persons = selectedPumas.map((pumaId) => {
  //     let puma_id = pumaId.slice(2, 7);
  //     let url = `${host}pums/psam/p/${puma_id}`;
  //     return fetch(url)
  //       .then((r) => r.json())
  //       .then((d) => {
  //         return {
  //           type: "p",
  //           data: d,
  //         };
  //       });
  //   });

  //   console.time("load pums");
  //   // console.log("api-return---", household, persons);

  //   return Promise.all([...household, ...persons]).then((pumsData) => {
  //     console.timeEnd("load pums");
  //     // console.log("api-Data-return-----", pumsData);

  //     let hhdata = flatten(
  //       pumsData.filter((d) => d.type === "h").map((d) => d.data)
  //     );

  //     let pdata = flatten(
  //       pumsData.filter((d) => d.type === "p").map((d) => d.data)
  //     );

  //     // b/c papa parse output = { data: [ ... ], errors: [ ... ], meta: {	... }}

  //     console.log("api-return-seed data simple", hhdata, pdata);

  //     let hhindex = 1;

  //     let hhnumLookup = hhdata.reduce((lookup, hh) => {
  //       if (!lookup[hh.SERIALNO]) {
  //         lookup[hh.SERIALNO] = hhindex;
  //         hh.hhnum = hhindex;
  //         hhindex += 1;
  //       }
  //       hh.hhnum = lookup[hh.SERIALNO];
  //       return lookup;
  //     }, {});

  //     console.log("after hhnum", hhdata, hhnumLookup);

  //     pdata.forEach((d) => (d.hhnum = hhnumLookup[d.SERIALNO])); // better than .map b/c no need to return

  //     // let test = pdata.map(d => d.hhnum = hhnumLookup[d.SERIALNO] )

  //     console.log("after p.hhnum", pdata);

  //     //console.log('seedPdata----', pdata,pdata[0], flatten(pdata), newpdata, test)
  //     //console.log('seedData_flatten' ,flatten(hhdata), pdata[0], flatten(pdata)),

  //     return {
  //       household: flatten(hhdata), // flatten(hhdata),
  //       person: flatten(pdata), //flatten(pdata)
  //     };
  //   });
  // };
  // console.log("output----", process, generateCrosswalk());

  // Control data start here ------------------------------

  // const generateControl = (crosswalkData) => {
  //   let BgsPuma = crosswalkData.reduce((acc, obj) => {
  //     acc[obj.BLKGRP] = obj.PUMA;
  //     return acc;
  //   }, {});

  //   let TractsPuma = crosswalkData.reduce((acc, obj) => {
  //     acc[obj.GEOID] = obj.PUMA;
  //     return acc;
  //   }, {});
  //   console.log("BgsPuma---", BgsPuma, TractsPuma);

  //   // create census api call for bgs with variable using falcor
  //   // create census api call for tracts with variables
  //   // falcor.get(['acs',${geoids},${years},${censusvars}]]) // falcor.get function format
  //   // parse returned data into control format

  //   console.log(
  //     "Selected ACS----",
  //     selectedVar
  //     // flatten(Object.values(selectedVar.acs_vars), selectedVar.binsCompare)
  //   );

  //   // let selectedACSKeys = flatten(Object.values(selectedVar.acs_vars));

  //   let selectedACSKeysTest = selectedVar.map((selectedVariable) =>
  //     flatten(Object.values(selectedVariable.acs_vars))
  //   );
  //   let selectedACSKeys = flatten(selectedACSKeysTest);

  //   console.log("selectedACSKeys", selectedACSKeys);

  //   let bgs = Object.values(layer.state.selectedPumasBgs);
  //   let flattenBgs = flatten(bgs); //.filter((r, i) => i < 30)

  //   let tracts = flattenBgs.map((d) => d.slice(0, -1));
  //   let uniqueTracts = [...new Set(tracts)];

  //   // console.log(
  //   //   "bgs-----",
  //   //   bgs,
  //   //   flattenBgs,
  //   //   flattenBgs.length,
  //   //   uniqueTracts,
  //   //   uniqueTracts.length
  //   // );

  //   console.time("call acs");

  //   return falcor
  //     .chunk(
  //       //instead of falcor.get, use falcor.chunk & return falcor.getCache b/c long http call length
  //       // ["acs", [...uniqueTracts], [2019], [...Object.values(tract_cenvars)]],
  //       // ["acs", [...flattenBgs], [2019], [...Object.values(bg_cenvars)]],
  //       ["acs", [...uniqueTracts], [2019], selectedACSKeys],
  //       ["acs", [...flattenBgs], [2019], selectedACSKeys],
  //       { chunkSize: 200 }
  //     )
  //     .then((d) => {
  //       console.timeEnd("call acs");
  //       let acsFalcorData = falcor.getCache();
  //       console.log("acsFalcorData", acsFalcorData);
  //       return acsFalcorData;
  //     })

  //     .then((output) => {
  //       let tractData = Object.values(output).map((d) => {
  //         let geoIds = Object.keys(d);
  //         let acsVarKeysValuesArray = selectedVar.map((selectedVariable) =>
  //           Object.entries(selectedVariable.acs_vars)
  //         );
  //         // let acsVarName = selectedVar.var;

  //         let acsVarName = selectedVar.map((selectedVariable) => {
  //           return Object.keys(selectedVariable.acs_vars).map(
  //             (bin) => selectedVariable.var + bin
  //           );
  //         });
  //         // let acsVarValuesArray = Object.values(selectedVar.acs_vars);
  //         // let acsVarObject = selectedVar;

  //         console.log(
  //           "test------",
  //           d,
  //           acsVarKeysValuesArray,
  //           flatten(acsVarName),
  //           flatten(acsVarKeysValuesArray)
  //           // flatten(acsVarName)
  //           // acsVarValuesArray,
  //           // acsVarObject
  //         );

  //         return geoIds
  //           .filter((geoId) => geoId.length === 11)
  //           .map((geoId) => {
  //             let ACSOutput = Object.values(d[geoId]);
  //             console.log("ACSOutputValues---", ACSOutput);

  //             let binnedVarNamesKeys = flatten(acsVarKeysValuesArray).map(
  //               (d, i) => {
  //                 //refine this code to findStatus:finished value
  //                 // console.log("binnedD--", d);

  //                 let binnedVarName = flatten(acsVarName)[i];
  //                 let binnedVarKeys = Object.keys(ACSOutput[0]).filter((item) =>
  //                   flatten(d[1]).includes(item)
  //                 );

  //                 console.log("binnedVars", binnedVarName, binnedVarKeys);

  //                 return {
  //                   binned_var_name: binnedVarName,
  //                   binned_var_key: binnedVarKeys,
  //                 };
  //               }
  //             );

  //             console.log("binnedVarNamesKeys----", binnedVarNamesKeys);

  //             let binnedVarNamesValues = binnedVarNamesKeys.map((d) => {
  //               let binnedACSName = Object.values(d)[0];
  //               let binnedACSKeys = Object.values(d)[1];
  //               // let ACSOutput = ACSOutput;
  //               let binnedACSValue = Object.keys(ACSOutput[0])
  //                 .filter((key) => binnedACSKeys.includes(key))
  //                 .reduce((sum, key) => sum + ACSOutput[0][key], 0);

  //               let binnedACSValueTest = Object.keys(ACSOutput[0])
  //                 .filter((key) => binnedACSKeys.includes(key))
  //                 .reduce((obj, key) => {
  //                   obj[key] = ACSOutput[0][key];
  //                   return obj;
  //                 }, {});

  //               console.log(
  //                 "binnedACSKey",
  //                 d,
  //                 binnedACSName,
  //                 binnedACSKeys,
  //                 ACSOutput,
  //                 binnedACSValue
  //               );

  //               return {
  //                 binned_var_name: binnedACSName,
  //                 binned_var_value: binnedACSValue,
  //                 // binned_var_value_test: binnedACSValueTest,
  //                 // HHBase_Tracts: ACSOutput[0]["B25001_001E"],
  //                 // PopBase_Tracts: ACSOutput[0]["B01003_001E"],
  //                 HHBase_Tracts: ACSOutput[0][selectedACSKeys[2]],
  //                 PopBase_Tracts: ACSOutput[0][selectedACSKeys[3]],
  //               };
  //             });

  //             console.log(
  //               "TractsBinnedVarNamesValues---",
  //               binnedVarNamesValues
  //             );

  //             let binnedVarNamesValuesNew = binnedVarNamesValues.map((d) => {
  //               let obj = {};
  //               let name = Object.values(d)[0];
  //               let value = Object.values(d)[1];

  //               obj[name] = value;
  //               return obj;
  //             });

  //             let binnedVarNamesValuesNewFinal = Object.assign(
  //               {},
  //               ...binnedVarNamesValuesNew.slice(4)
  //             );

  //             console.log(
  //               "TractsBinnedVarNamesValuesNewFinal--",
  //               binnedVarNamesValuesNew,
  //               ...binnedVarNamesValuesNew,
  //               binnedVarNamesValuesNewFinal
  //             );

  //             return {
  //               STATEFIPS: geoId.slice(0, 2),
  //               COUNTY: geoId.slice(2, 5),
  //               TRACT: geoId.slice(5, 11),
  //               TRACTGEOID: geoId,
  //               PUMA: TractsPuma[geoId],
  //               REGION: 1,
  //               HHBASE: binnedVarNamesValues[0]["HHBase_Tracts"],
  //               POPBASE: binnedVarNamesValues[0]["PopBase_Tracts"],
  //               ...binnedVarNamesValuesNewFinal,
  //             };
  //           });
  //       });

  //       ///BG start here--- do correct!!

  //       let BgData = Object.values(output).map((d) => {
  //         let geoIds = Object.keys(d);

  //         let acsVarKeysValuesArray = selectedVar.map((selectedVariable) =>
  //           Object.entries(selectedVariable.acs_vars)
  //         );

  //         let acsVarName = selectedVar.map((selectedVariable) => {
  //           return Object.keys(selectedVariable.acs_vars).map(
  //             (bin) => selectedVariable.var + bin
  //           );
  //         });

  //         return geoIds
  //           .filter((geoId) => geoId.length === 12)
  //           .map((geoId, i) => {
  //             let ACSOutput = Object.values(d[geoId]);

  //             console.log("ACSOutputValuesBGs---", ACSOutput);

  //             // let binnedVarNamesKeys = acsVarKeysValuesArray.map((d) => {
  //             let binnedVarNamesKeys = flatten(acsVarKeysValuesArray).map(
  //               (d, i) => {
  //                 // let binnedVarName = acsVarName + d[0];
  //                 let binnedVarName = flatten(acsVarName)[i];

  //                 let binnedVarKeys = Object.keys(ACSOutput[0]).filter((item) =>
  //                   flatten(d[1]).includes(item)
  //                 );

  //                 console.log("binnedVars", binnedVarName, binnedVarKeys);

  //                 return {
  //                   binned_var_name: binnedVarName,
  //                   binned_var_key: binnedVarKeys,
  //                 };
  //               }
  //             );

  //             console.log("binnedVarNamesKeys----", binnedVarNamesKeys);

  //             let binnedVarNamesValues = binnedVarNamesKeys.map((d) => {
  //               let binnedACSName = Object.values(d)[0];
  //               let binnedACSKeys = Object.values(d)[1];
  //               // let ACSOutput = ACSOutput;
  //               let binnedACSValue = Object.keys(ACSOutput[0])
  //                 .filter((key) => binnedACSKeys.includes(key))
  //                 .reduce((sum, key) => sum + ACSOutput[0][key], 0);

  //               let binnedACSValueTest = Object.keys(ACSOutput[0])
  //                 .filter((key) => binnedACSKeys.includes(key))
  //                 .reduce((obj, key) => {
  //                   obj[key] = ACSOutput[0][key];
  //                   return obj;
  //                 }, {});

  //               console.log(
  //                 "binnedACSKeyBgs",
  //                 d,
  //                 binnedACSName,
  //                 binnedACSKeys,
  //                 ACSOutput,
  //                 binnedACSValue
  //               );

  //               return {
  //                 binned_var_name: binnedACSName,
  //                 binned_var_value: binnedACSValue,
  //                 // HHBase_Bgs: ACSOutput[0]["B25001_001E"],
  //                 // PopBase_Bgs: ACSOutput[0]["B01003_001E"],
  //                 HHBase_Bgs: ACSOutput[0][selectedACSKeys[0]],
  //                 PopBase_Bgs: ACSOutput[0][selectedACSKeys[1]],
  //               };
  //             });

  //             console.log("BgsBinnedVarNamesValues---", binnedVarNamesValues);

  //             let binnedVarNamesValuesNew = binnedVarNamesValues.map((d) => {
  //               let obj = {};
  //               let name = Object.values(d)[0];
  //               let value = Object.values(d)[1];

  //               obj[name] = value;
  //               return obj;
  //             });

  //             let binnedVarNamesValuesNewFinal = Object.assign(
  //               {},
  //               ...binnedVarNamesValuesNew.slice(4)
  //             );

  //             console.log(
  //               "BgsBinnedVarNamesValuesNewBgs--",
  //               binnedVarNamesValuesNew,
  //               binnedVarNamesValuesNewFinal
  //             );

  //             return {
  //               BG: geoId.slice(-7), //.slice(5, 12)
  //               BGGEOID: geoId,
  //               STATEFP: geoId.slice(0, 2),
  //               COUNTYFP: geoId.slice(2, 5),
  //               TRACT: geoId.slice(5, 11),
  //               TRACTGEOID: geoId.slice(0, 11),
  //               PUMA: BgsPuma[geoId],
  //               REGION: 1,
  //               MAZ: i + 1,
  //               xTAZ: geoId.slice(5, 11),
  //               HHBASE: binnedVarNamesValues[0]["HHBase_Bgs"],
  //               POPBASE: binnedVarNamesValues[0]["PopBase_Bgs"],
  //               ...binnedVarNamesValuesNewFinal,
  //             };
  //           });
  //       });
  //       console.log("Control_data--", BgData, tractData);
  //       return { control_tracts: tractData[0], control_bgs: BgData[0] };
  //     });
  // };

  const generateControlConfig = () => {
    let objectItem = selectedVar.map((variable) => {
      return Object.keys(variable.acs_vars).map((bin, i) => {
        let target = variable.var + bin;

        console.log("expression", variable.expression);
        return {
          target: variable.target ? variable.target : target,
          geography: variable.acs_type,
          seed_table: variable.synpop_type,
          importance: variable.importance,
          control_field: target,
          expression: variable.expression[i],
        };
      });
    });

    return objectItem;
  };

  const requestCreate = (data) => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    };
    fetch(`http://localhost:5000/project/create_1`, options)
      .then((r) => r.json())
      .then((d) => console.log("create project response", d));
  };

  return (
    //Test Slide over
    <Transition.Root show={open} as={Fragment}>
      {/* <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden"
        onClose={setOpen}
      > */}
      <div className="absolute inset-0 overflow-hidden">
        {/* <Dialog.Overlay className="absolute inset-0" /> */}

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-500 sm:duration-700"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-500 sm:duration-700"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <div className="pointer-events-auto w-screen max-w-md">
              <form className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                <div className="h-0 flex-1 overflow-y-auto">
                  <div className="bg-gray-600 py-6 px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      {/* <Dialog.Title className="text-lg font-medium text-white">
                        {" "}
                        Create New Project{" "}
                      </Dialog.Title> */}
                      <h3 className="text-lg font-medium text-white">
                        Create New Project (New)
                      </h3>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          className="rounded-md bg-gray-600 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                          onClick={() => setOpen(false)}
                        >
                          <span className="sr-only">Close panel</span>
                          {/* <XIcon className="h-6 w-6" aria-hidden="true" /> */}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className=" mt-4 ml-auto mr-auto">
                    <div>
                      {" "}
                      <h3 className="text-sm font-medium text-gray-900 mt-2 ml-6 ">
                        1. Click on PUMAs at the map to define project area
                      </h3>{" "}
                      <table
                        style={{
                          marginTop: `3px`,
                          marginLeft: "auto",
                          marginRight: "auto",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td className="max-w-sm px-6 py-2 text-left  text-sm font-light text-gray-900">
                              # of PUMAs selected:
                            </td>

                            <td className="max-w-sm px-6 py-2 text-right  text-sm font-light text-gray-900">
                              {layer.state.selectedPumas
                                ? layer.state.selectedPumas.length
                                : 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="max-w-sm px-6 py-2 text-left  text-sm font-light text-gray-900">
                              # of Block Groups selected:
                            </td>
                            <td className="max-w-sm px-6 py-2 text-right  text-sm font-light text-gray-00">
                              {layer.state.selectedBlockGroups
                                ? layer.state.selectedBlockGroups.length
                                : 0}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <h3 className="text-sm font-medium text-gray-900 mt-2 ml-6 ">
                        2. Select a variable (or multiple)
                      </h3>
                      <div className="setProcessflex justify-end mr-6">
                        <VarSelector setSelectedVar={setSelectedVar} />
                        {/* <VarTest1 setSelectedVar={setSelectedVar} /> */}
                      </div>
                    </div>
                  </div>

                  {/* <CreateProject
                    user={user}
                    open={open}
                    setOpen={setOpen}
                    finaldata={finalData}
                  /> */}
                  <div className=" py-6 px-4 sm:px-6 mt-5">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900 mt-2 ">
                        3. Name your project:
                      </h3>

                      <div className="mt-1 ml-3">
                        <input
                          name="project-name"
                          id="project-name"
                          className="rounded-md border border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-md"
                          placeholder="Your Project Name"
                          // onChange={() => {}}
                          // onChange={(e) => setProjectName(e.target.value)}
                          onChange={getTitle}
                        />
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 justify-center px-4 py-4 mt-2">
                      {/* <button
                        type="button"
                        className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </button> */}
                      <button
                        type="button"
                        disabled={layer.state.selectedPumas.length === 0}
                        className="ml-4 rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed "
                        onClick={() => {
                          // setOpen(true);
                          // console.log("finalData----", data);
                          startProcess().then(() => {
                            // console.log("do I get here", projectData);
                            //   history.push("/");
                            //   // if () {
                            //   setProcess(false);
                            //   // requestCreate(data);
                            //   // }
                            //   // window.location.reload();
                          });
                        }}
                      >
                        Create Project
                        {process ? "  (Loading...)" : ""}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </Transition.Child>
        </div>
      </div>
      {/* </Dialog> */}
    </Transition.Root>
  );
};

export default withAuth(DataGenerator);
// export default DataGenerator;
