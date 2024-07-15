//import { useFalcor, withAuth } from "modules/avl-components/src";
import flatten from "lodash.flatten";

const generateControl = (crosswalkData, selectedVar, layer, falcor) => {
  let BgsPuma = crosswalkData.reduce((acc, obj) => {
    acc[obj.BLKGRP] = obj.PUMA;
    return acc;
  }, {});

  let TractsPuma = crosswalkData.reduce((acc, obj) => {
    acc[obj.GEOID] = obj.PUMA;
    return acc;
  }, {});
  console.log("BgsPuma---", BgsPuma, TractsPuma);

  // create census api call for bgs with variable using falcor
  // create census api call for tracts with variables
  // falcor.get(['acs',${geoids},${years},${censusvars}]]) // falcor.get function format
  // parse returned data into control format

  console.log(
    "Selected ACS----",
    selectedVar
    // flatten(Object.values(selectedVar.acs_vars), selectedVar.binsCompare)
  );

  // let selectedACSKeys = flatten(Object.values(selectedVar.acs_vars));

  let selectedACSKeysTest = selectedVar.map((selectedVariable) =>
    flatten(Object.values(selectedVariable.acs_vars))
  );
  let selectedACSKeys = flatten(selectedACSKeysTest);

  console.log("selectedACSKeys", selectedACSKeys);

  let bgs = Object.values(layer.state.selectedPumasBgs);
  let flattenBgs = flatten(bgs); //.filter((r, i) => i < 30)

  let tracts = flattenBgs.map((d) => d.slice(0, -1));
  let uniqueTracts = [...new Set(tracts)];

  // console.log(
  //   "bgs-----",
  //   bgs,
  //   flattenBgs,
  //   flattenBgs.length,
  //   uniqueTracts,
  //   uniqueTracts.length
  // );

  console.time("call acs");

  return falcor
    .chunk(
      //instead of falcor.get, use falcor.chunk & return falcor.getCache b/c long http call length
      // ["acs", [...uniqueTracts], [2019], [...Object.values(tract_cenvars)]],
      // ["acs", [...flattenBgs], [2019], [...Object.values(bg_cenvars)]],
      ["acs", [...uniqueTracts], [2019], selectedACSKeys],
      ["acs", [...flattenBgs], [2019], selectedACSKeys],
      { chunkSize: 200 }
    )
    .then((d) => {
      console.timeEnd("call acs");
      let acsFalcorData = falcor.getCache();
      console.log("acsFalcorData", acsFalcorData);
      return acsFalcorData;
    })

    .then((output) => {
      let tractData = Object.values(output).map((d) => {
        let geoIds = Object.keys(d);
        let acsVarKeysValuesArray = selectedVar.map((selectedVariable) =>
          Object.entries(selectedVariable.acs_vars)
        );
        // let acsVarName = selectedVar.var;

        let acsVarName = selectedVar.map((selectedVariable) => {
          return Object.keys(selectedVariable.acs_vars).map(
            (bin) => selectedVariable.var + bin
          );
        });
        // let acsVarValuesArray = Object.values(selectedVar.acs_vars);
        // let acsVarObject = selectedVar;

        console.log(
          "test------",
          d,
          acsVarKeysValuesArray,
          flatten(acsVarName),
          flatten(acsVarKeysValuesArray)
          // flatten(acsVarName)
          // acsVarValuesArray,
          // acsVarObject
        );

        return geoIds
          .filter((geoId) => geoId.length === 11)
          .map((geoId) => {
            let ACSOutput = Object.values(d[geoId]);
            console.log("ACSOutputValues---", ACSOutput);

            let binnedVarNamesKeys = flatten(acsVarKeysValuesArray).map(
              (d, i) => {
                //refine this code to findStatus:finished value
                // console.log("binnedD--", d);

                let binnedVarName = flatten(acsVarName)[i];
                let binnedVarKeys = Object.keys(ACSOutput[0]).filter((item) =>
                  flatten(d[1]).includes(item)
                );

                console.log("binnedVars", binnedVarName, binnedVarKeys);

                return {
                  binned_var_name: binnedVarName,
                  binned_var_key: binnedVarKeys,
                };
              }
            );

            console.log("binnedVarNamesKeys----", binnedVarNamesKeys);

            let binnedVarNamesValues = binnedVarNamesKeys.map((d) => {
              let binnedACSName = Object.values(d)[0];
              let binnedACSKeys = Object.values(d)[1];
              // let ACSOutput = ACSOutput;
              let binnedACSValue = Object.keys(ACSOutput[0])
                .filter((key) => binnedACSKeys.includes(key))
                .reduce((sum, key) => sum + ACSOutput[0][key], 0);

              let binnedACSValueTest = Object.keys(ACSOutput[0])
                .filter((key) => binnedACSKeys.includes(key))
                .reduce((obj, key) => {
                  obj[key] = ACSOutput[0][key];
                  return obj;
                }, {});

              console.log(
                "binnedACSKey",
                d,
                binnedACSName,
                binnedACSKeys,
                ACSOutput,
                binnedACSValue
              );

              return {
                binned_var_name: binnedACSName,
                binned_var_value: binnedACSValue,
                // binned_var_value_test: binnedACSValueTest,
                // HHBase_Tracts: ACSOutput[0]["B25001_001E"],
                // PopBase_Tracts: ACSOutput[0]["B01003_001E"],
                HHBase_Tracts: ACSOutput[0][selectedACSKeys[2]],
                PopBase_Tracts: ACSOutput[0][selectedACSKeys[3]],
              };
            });

            console.log("TractsBinnedVarNamesValues---", binnedVarNamesValues);

            let binnedVarNamesValuesNew = binnedVarNamesValues.map((d) => {
              let obj = {};
              let name = Object.values(d)[0];
              let value = Object.values(d)[1];

              obj[name] = value;
              return obj;
            });

            let binnedVarNamesValuesNewFinal = Object.assign(
              {},
              ...binnedVarNamesValuesNew.slice(4)
            );

            console.log(
              "TractsBinnedVarNamesValuesNewFinal--",
              binnedVarNamesValuesNew,
              ...binnedVarNamesValuesNew,
              binnedVarNamesValuesNewFinal
            );

            return {
              STATEFIPS: geoId.slice(0, 2),
              COUNTY: geoId.slice(2, 5),
              TRACT: geoId.slice(5, 11),
              TRACTGEOID: geoId,
              PUMA: TractsPuma[geoId],
              REGION: 1,
              HHBASE: binnedVarNamesValues[0]["HHBase_Tracts"],
              POPBASE: binnedVarNamesValues[0]["PopBase_Tracts"],
              ...binnedVarNamesValuesNewFinal,
            };
          });
      });

      ///BG start here--- do correct!!

      let BgData = Object.values(output).map((d) => {
        let geoIds = Object.keys(d);

        let acsVarKeysValuesArray = selectedVar.map((selectedVariable) =>
          Object.entries(selectedVariable.acs_vars)
        );

        let acsVarName = selectedVar.map((selectedVariable) => {
          return Object.keys(selectedVariable.acs_vars).map(
            (bin) => selectedVariable.var + bin
          );
        });

        return geoIds
          .filter((geoId) => geoId.length === 12)
          .map((geoId, i) => {
            let ACSOutput = Object.values(d[geoId]);

            console.log("ACSOutputValuesBGs---", ACSOutput);

            // let binnedVarNamesKeys = acsVarKeysValuesArray.map((d) => {
            let binnedVarNamesKeys = flatten(acsVarKeysValuesArray).map(
              (d, i) => {
                // let binnedVarName = acsVarName + d[0];
                let binnedVarName = flatten(acsVarName)[i];

                let binnedVarKeys = Object.keys(ACSOutput[0]).filter((item) =>
                  flatten(d[1]).includes(item)
                );

                console.log("binnedVars", binnedVarName, binnedVarKeys);

                return {
                  binned_var_name: binnedVarName,
                  binned_var_key: binnedVarKeys,
                };
              }
            );

            console.log("binnedVarNamesKeys----", binnedVarNamesKeys);

            let binnedVarNamesValues = binnedVarNamesKeys.map((d) => {
              let binnedACSName = Object.values(d)[0];
              let binnedACSKeys = Object.values(d)[1];
              // let ACSOutput = ACSOutput;
              let binnedACSValue = Object.keys(ACSOutput[0])
                .filter((key) => binnedACSKeys.includes(key))
                .reduce((sum, key) => sum + ACSOutput[0][key], 0);

              let binnedACSValueTest = Object.keys(ACSOutput[0])
                .filter((key) => binnedACSKeys.includes(key))
                .reduce((obj, key) => {
                  obj[key] = ACSOutput[0][key];
                  return obj;
                }, {});

              console.log(
                "binnedACSKeyBgs",
                d,
                binnedACSName,
                binnedACSKeys,
                ACSOutput,
                binnedACSValue
              );

              return {
                binned_var_name: binnedACSName,
                binned_var_value: binnedACSValue,
                // HHBase_Bgs: ACSOutput[0]["B25001_001E"],
                // PopBase_Bgs: ACSOutput[0]["B01003_001E"],
                HHBase_Bgs: ACSOutput[0][selectedACSKeys[0]],
                PopBase_Bgs: ACSOutput[0][selectedACSKeys[1]],
              };
            });

            console.log("BgsBinnedVarNamesValues---", binnedVarNamesValues);

            let binnedVarNamesValuesNew = binnedVarNamesValues.map((d) => {
              let obj = {};
              let name = Object.values(d)[0];
              let value = Object.values(d)[1];

              obj[name] = value;
              return obj;
            });

            let binnedVarNamesValuesNewFinal = Object.assign(
              {},
              ...binnedVarNamesValuesNew.slice(4)
            );

            console.log(
              "BgsBinnedVarNamesValuesNewBgs--",
              binnedVarNamesValuesNew,
              binnedVarNamesValuesNewFinal
            );

            return {
              BG: geoId.slice(-7), //.slice(5, 12)
              BGGEOID: geoId,
              STATEFP: geoId.slice(0, 2),
              COUNTYFP: geoId.slice(2, 5),
              TRACT: geoId.slice(5, 11),
              TRACTGEOID: geoId.slice(0, 11),
              PUMA: BgsPuma[geoId],
              REGION: 1,
              MAZ: i + 1,
              TAZ: geoId.slice(5, 11),
              HHBASE: binnedVarNamesValues[0]["HHBase_Bgs"],
              POPBASE: binnedVarNamesValues[0]["PopBase_Bgs"],
              ...binnedVarNamesValuesNewFinal,
            };
          });
      });
      console.log("Control_data--", BgData, tractData);
      return { control_tracts: tractData[0], control_bgs: BgData[0] };
    });
};

export default generateControl;
