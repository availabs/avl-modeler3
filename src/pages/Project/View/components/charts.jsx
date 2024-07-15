import React, { Component, useState, useEffect, useMemo } from "react";
import BarChart from "./barChart";
import get from "lodash.get";

const Charts = ({
  metaVariables,
  selectedValue,
  projectId,
  selectedBlockGroups,
}) => {
  console.log(
    "charts_props---------",
    metaVariables,
    selectedValue,
    selectedValue[0]?.slice(2),
    projectId,
    selectedBlockGroups
  );

  let [totalVarData, setTotalVarData] = useState([]);

  let selectedVar = selectedValue[0]?.slice(2);
  // let selectedVar = selectedValue;

  // reformat selectedVarDat [{total:, selected:,GEOID: }, ...]
  useEffect(() => {
    // if (selectedValue) {
    fetch(`http://localhost:5000/project/${projectId}/${selectedValue}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("TotalVar data fetched--", data[0], data);
        // setSelectedVarData(data);
        setTotalVarData(data);
      });
    // }
  }, [selectedValue, projectId]);

  console.log("chart_states--------------", selectedVar, totalVarData);

  let chartData = useMemo(() => {
    //console.log("updateCharData", selectedVar, totalVarData[0]);

    if (selectedValue) {
      let selectedBins = metaVariables[selectedVar].binsCompare;

      const bins = selectedBins.map((d) => Function("v", d.comp));
      // setSelectedVar = selectedValue[0]?.slice(2);
      //console.log("bins---------", bins, selectedBins);

      // console.time("evval bins");
      return totalVarData
        .reduce(
          (a, c) => {
            const value = parseInt(c[selectedVar]) || 0;

            for (let i = 0; i < bins.length; i++) {
              //counting 1 if values meet the condition
              if (bins[i](value)) {
                a[i].total += 1;
                if (selectedBlockGroups.includes(c.GEOID)) {
                  a[i].selected += 1;
                }
                break;
              }
            }
            return a;
          },
          bins.map(() => {
            return { selected: 0, total: 0 };
          })
        )
        .map((d, i) => {
          // console.log("d-------------", d);

          return {
            bin: selectedBins[i].name,
            Selected: d.selected,
            Total: d.total,
          };
        });

      //console.timeEnd("evval bins");

      // return { bin: bin.name, [selectedVar]: binValue };
    }
  }, [totalVarData, selectedBlockGroups]);

  let totalSelectedVarData = 0;
  if (chartData) {
    totalSelectedVarData = chartData.reduce((a, c) => a + c.Selected, 0);
  }

  console.log("finalChartData", chartData);

  let selectedVarName = get(metaVariables, `[${selectedVar}].name`, "");

  // let selectedVarName = metaVariables[selectedVar].name
  //   ? metaVariables[selectedVar].name
  //   : "";

  return (
    <div>
      <div className="mt-1 text-gray-900 text-sm font-medium">
        {" "}
        Total Selected BGs: {selectedBlockGroups.length}{" "}
      </div>
      <div className="mt-1 text-gray-900 text-sm font-medium">
        Total Selected value of {selectedVarName}: {totalSelectedVarData}{" "}
      </div>
      <div style={{ height: 400 }}>
        <BarChart keys={["Total", "Selected"]} data={chartData} />
      </div>
    </div>
  );
};

export default Charts;
