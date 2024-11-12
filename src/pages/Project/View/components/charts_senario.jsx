import React from "react";
import BarChart from "./barChart_senario";

import BarChartbyMeta from "./barChart_senario_meta";

const Charts = ({
  chartData,
  selectedValue,
  senarioId,
  selectedBlockGroups,
  selectedMetaKey,
}) => {
  console.log(
    "charts_senario_props---------",
    chartData,
    selectedValue,
    senarioId,
    selectedBlockGroups,
    selectedMetaKey,
  );


  return (
    <div>
      <div style={{ height: 400 }}>
        {(selectedValue === 'origin' || selectedValue === 'destination') && (
          <BarChart keys={["Total"]} data={chartData} />
        )}
        {(selectedValue === 'trip_mode' || selectedValue === 'purpose') && (
          // <BarChart_tripMode 
          //   keys={selectedValue === 'trip_mode' ? tripModeKeys : purposeKeys} 
          //   data={chartData} 
          // />

          <BarChartbyMeta
          // keys={selectedValue === 'trip_mode' ? ["Counts by mode"] : ["Counts by purpose"] } 
          keys={["Total"]} 
          data={chartData} 
          selectedValue={selectedValue}
        />





        )}
      </div>
    </div>
  );
};

export default Charts;