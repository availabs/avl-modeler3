import React, { useState, useEffect } from "react";
import { scaleThreshold } from "d3-scale";
import ckmeans from "../../../../utils/ckmeans";
import Charts from "./charts_senario";

//for senarioMap fill color domain functions
// const colors = ["#FEEDDE", "#FDBE85", "#FD8D3C", "#E6550D", "#A63603"];
const colors = ["#FEF0D9", "#FDCC8A", "#FC8D59", "#E34A33", "#B30000"];


const getDomain = (data = [], range = []) => {
  if (!data?.length || !range?.length) return [];
  return data?.length && range?.length
    ? ckmeans(data, Math.min(data?.length, range?.length))
    : [];
};

const getColorScale = (data, colors) => {
  const domain = getDomain(data, colors);

  return scaleThreshold().domain(domain).range(colors);
};

const Dropdown = ({
  projectId,
  selectedBlockGroups,
  layer,
  selectedSenario,
  onGetColors,
}) => {
  const [senarioData, setSenarioData] = useState([]);
  const [senarioOverview, setSenarioOverview] = useState({});
  // const [senarioDestination, setSenarioDestination] = useState([]);
  const [senarioMapData, setSenarioMapData] = useState([]);
  const [senarioMetaKeyData, setSenarioMetaKeyData] = useState([]);
  const [senarioId, setSenarioId] = useState("");
  const bgsGeometryIds = layer.state.bgsGeometryIds
  const [selectedSenarioVariable, setSelectedSenarioVariable] = useState("");
  
  const [selectedTazVariable, setSelectedTazVariable] = useState("")
  const [selectedMetaVariable, setSelectedMetaVariable] = useState("")
  const [selectedMetaKey, setSelectedMetaKey] = useState("")
  
  // const [senarioUpdatedMapData, setSenarioUpdatedMapData] = useState([]);

  const senarioMapVariables = ["destination", "origin"]
  const senarioTripVariables = ["trip_mode", "purpose"]

    const senarioTripmodeKeys = [
      "BIKE",
      "DRIVEALONEFREE",
      "DRIVEALONEPAY",
      "DRIVE_COM",
      "DRIVE_EXP",
      "DRIVE_HVY",
      "DRIVE_LOC",
      "DRIVE_LRF",
      "SHARED2FREE",
      "SHARED2PAY",
      "SHARED3FREE",
      "SHARED3PAY",
      "TAXI",
      "TNC_SHARED",
      "TNC_SINGLE",
      "WALK",
      "WALK_COM",
      "WALK_EXP",
      "WALK_HVY",
      "WALK_LOC",
      "WALK_LRF",
    ];


    const senarioPurposeKeys = [
      "atwork",
      "eatout",
      "escort",
      "home",
      "othdiscr",
      "othmaint",
      "school",
      "shopping",
      "social",
      "univ",
      "work",

    ];
  


  console.log("senario_dropdown_props", projectId, layer, layer.state.bgsGeometryIds);

  console.log("senarioMapData---", senarioMapData);

  const handleChange = (e) => {
    if (e.target.value) {
      console.log("e.target.value-------", e.target.value);

      selectedSenario(e.target.value);
      setSenarioId(e.target.value)

      fetch(`http://localhost:5000/senarios/${e.target.value}/overview`)
        .then((response) => response.json())
        .then((data) => {
          if (data !== null) {
            console.log("view senario overview--------------------", data);
            setSenarioOverview(data);
          }



        });

    }
  };


  const handleTripChange = (e) => {
    const variable = e.target.value;
    if (variable) {
      console.log("trip table name-------", variable);
      setSelectedSenarioVariable(variable);
    
    // Reset 
      setSelectedMetaKey("");

  
      let url;
      if (variable === 'trip_mode'|| variable === 'purpose') {
        // url = `http://localhost:5000/senarios/${senarioId}/${variable}/trips`;
        url = `http://localhost:5000/senarios/${senarioId}/${variable}/overviewByMode/`;
        setSelectedMetaVariable(variable)
   
      } else if (variable === 'origin' || variable === 'destination') {
        url = `http://localhost:5000/senarios/${senarioId}/${projectId}/${variable}/trip`;
        setSelectedTazVariable(variable)
      }
      
  
      if (url) {
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            if (data !== null) {
              console.log(
                "senario map data------------------------",
                data
              );
              setSenarioMapData(data);
              // senarioMap()
            }
          });
      }
    }
  }





  const handleMetaKeyMapChange = (metaKey) => {

    const lastBlockGroup = selectedBlockGroups[selectedBlockGroups.length - 1];

 

      fetch(`http://localhost:5000/senarios/${senarioId}/${projectId}/${selectedTazVariable}/${selectedMetaVariable}/${metaKey}/${lastBlockGroup}/trip`)
        .then((response) => response.json())
        .then((data) => {

          console.log("metaKeyfetchData", data)
          if (data !== null) {

            setSenarioMapData(data);
            console.log ("updatedSenarioMapData", senarioMapData)
            senarioMap();
          }
        });

    
  };

  const handleMetaKeyChange = (senarioId, selectedMetaVariable, metaKey) => {

    console.log("handleMetaKeyChange tiggered?", metaKey, senarioId, selectedMetaVariable)

  
      fetch(`http://localhost:5000/senarios/${senarioId}/${selectedMetaVariable}/${metaKey}/overviewByMode/`)
      .then((response) => response.json())
      .then((data) => {

        console.log("metaKeyData", data)
        if (data !== null) {

          setSenarioMetaKeyData(data);
       
        }
      });
    
  };

  const BGmapping = bgsGeometryIds.reduce((acc, bg) => {
    acc[parseInt(bg.slice(5, 12)).toString()] = bg;
    return acc;
  }, {});
  console.log("BGmapping--",  BGmapping);

 

  const senarioMap = () => {

    // console.log("senarioMapData_updated", senarioMapData )
   
    const senarioDestinationbyBgs = senarioMapData.reduce(
      (obj, c) => {
        obj[c.bg] = c.Total;
        return obj;
      },
      {}
    );
    const colorScale = getColorScale(
      Object.values(senarioDestinationbyBgs),
      colors
    );

    console.log(
      "values_senarioDestinationbyBgs",
      Object.values(senarioDestinationbyBgs).map((v) => colorScale(v))
    );

    //format color with GEOID(full)
    const geoColors = Object.keys(senarioDestinationbyBgs).reduce((acc, k) => {
      acc[BGmapping[k].toString()] = colorScale(senarioDestinationbyBgs[k]);
      return acc;
    }, {});

    onGetColors(geoColors);

    console.log(
      "senarioDestinationbyBgs---",
      senarioDestinationbyBgs,
      geoColors
    );
  };

  useEffect(() => {
    fetch(`http://localhost:5000/senarios/${projectId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data !== null) {
          console.log("view senario names--------------------", data);
          setSenarioData(data);
        }
      });
  }, [projectId]);


  useEffect(() => {
    if (selectedMetaKey) {
      handleMetaKeyChange(senarioId, selectedMetaVariable, selectedMetaKey);
    }
  }, [senarioId, selectedMetaVariable, selectedMetaKey]);



  return (
    <div>
      <div>
        <label className="mt-2 text-gray-900 text-sm font-medium">
          Or select a senario :
          <br />
        </label>

        <select onChange={handleChange}>
          <option key={0} value={""}>
            choose your senario
          </option>
          {senarioData.map((e, i) => {
            return (
              <option key={i} value={e.id}>
                {e.name}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        Households: {senarioOverview.Households}, Persons:
        {senarioOverview.Persons}, Trips: {senarioOverview.Trips}
      </div>

      {/* <div> */}

      <div className="flex flex-shrink-0 justify-center px-4 py-4 mt-2">

      <label className="mt-2 text-gray-900 text-sm font-medium">
          select a trip direction from a selected TAZ :
          <br />
        </label>

        <select onChange={handleTripChange}>
          <option key={0} value={""}>
            choose your variable
          </option>
          {senarioMapVariables.map((e, i) => {
            return (
              <option key={i} value={e}>
                {e}
              </option>
            );
          })}
        </select>

        <button
          type="submit"
          disabled={
            senarioMapData.length === 0
          }
          className="ml-4 rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2  disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => {
            senarioMap();
          }}
        > Map Total counts
        </button>


      </div>

      <div className="flex flex-shrink-0 justify-center px-4 py-4 mt-2">

      <label className="mt-2 text-gray-900 text-sm font-medium">
          select a varialbe in trip table :
          <br />
        </label>

      <select onChange={handleTripChange}>
        <option key={0} value="">
          choose your variable
        </option>
        {senarioTripVariables.map((e, i) => (
          <option key={i} value={e}>
            {e}
          </option>
        ))}
      </select>

      {/* Conditionally render second dropdown */}
      {selectedSenarioVariable === "trip_mode" && (
        <select
          onChange={(e) => {
            const metaKey = e.target.value;
            setSelectedMetaKey(metaKey); 
            if (metaKey) {
              handleMetaKeyMapChange(metaKey); 
            }
          }}
        >
          <option key={0} value="">
            choose your trip mode
          </option>
          {senarioTripmodeKeys.map((e, i) => (
            <option key={i} value={e}>
              {e}
            </option>
          ))}
        </select>
      )}

   
      {selectedSenarioVariable === "purpose" && (
        <select
          onChange={(e) => {
            const metaKey = e.target.value;
            setSelectedMetaKey(metaKey); 
            if (metaKey) {
              handleMetaKeyMapChange(metaKey);
            }
          }}
        >
          <option key={0} value="">
            choose your purpose
          </option>
          {senarioPurposeKeys.map((e, i) => (
            <option key={i} value={e}>
              {e}
            </option>
          ))}
        </select>
      )}
    

      <button
        type="submit"
        disabled={!selectedMetaKey || senarioMapData.length === 0}
        className="ml-4 rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        onClick={() => {
          senarioMap();;
        }}
      >
        Update Map & Chart
      </button>


      </div>


      {/* {(selectedSenarioVariable === 'trip_mode' || selectedSenarioVariable === 'purpose' ) && (
          <div>
            <Charts
              selectedValue={selectedSenarioVariable}
              chartData={senarioMapData}
              senarioId={senarioId}
              selectedBlockGroups={selectedBlockGroups}
              selectedMetaKey={selectedMetaKey}
            />
          </div>
        )}
 */}


      <div>
        {selectedMetaKey ? (
          <Charts
            selectedValue={selectedSenarioVariable}
            chartData={senarioMetaKeyData}
            senarioId={senarioId}
            selectedBlockGroups={selectedBlockGroups}
            selectedMetaKey={selectedMetaKey}
          />
        ) : (selectedSenarioVariable === 'trip_mode' || selectedSenarioVariable === 'purpose') ? (
          <Charts
            selectedValue={selectedSenarioVariable}
            chartData={senarioMapData}
            senarioId={senarioId}
            selectedBlockGroups={selectedBlockGroups}
            selectedMetaKey={selectedMetaKey}
          />
        ) : null}
      </div>


    </div>
  );
};

export default Dropdown;
