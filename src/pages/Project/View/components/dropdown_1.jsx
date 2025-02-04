import React, { useState, useEffect } from "react";
// import get from "lodash.get";

import Charts from "./charts";

const Dropdown = ({ varList, projectId, selectedBlockGroups, bgIds}) => {
  const [selectedValue, setSelectedValue] = useState("");
  const [metaVariables, setMetaVariables] = useState({});

  const handleChange = (e) => {
    if (e.target.value) {
      console.log("e.target.value-------", e.target.value);

      setSelectedValue([e.target.value]);
    }
  };

  useEffect(() => {
    const getVariables = async () => {
      const response = await fetch("/data/model_variables.json");
      const data = await response.json();
      console.log("metaData--", data);

      setMetaVariables(data);
    };
    getVariables();
  }, []);




  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bgIds: bgIds }),
  };
  
  const sendNetworkBgIds = () => {
    fetch(`http://localhost:5000/network/createskim`, options)
      .then((r) => {
        // if (!r.ok) {
        //   throw new Error('Network response was not ok');
        // }
        return r.json();
      })
      .then((d) => console.log("sendNetworkBgIds", d))
      .catch((error) => console.error('Error:', error));
  };


  return (
    <div>
      <div>
        <label className="mt-2 text-gray-900 text-sm font-medium">
          Select a variable :<br />
        </label>

        <select onChange={handleChange}>
          <option key={0} value={""}></option>
          {Object.keys(metaVariables)
            .slice(4)
            .map((k, i) => {
              let varSelected = varList.filter((v) => v.slice(2) === k);
              // console.log("varSelected----", varSelected);
              // let selectedVarName = get(metaVariables, `[${k}].name`, "");  // how to do with loadash get
              return (
                <option key={i} value={varSelected}>
                  {/* {k} */}
                  {metaVariables[k].name}
                </option>
              );
            })}
        </select>
      </div>

      <div>
        <Charts
          selectedValue={selectedValue}
          metaVariables={metaVariables}
          projectId={projectId}
          selectedBlockGroups={selectedBlockGroups}
        />
      </div>
      <button
        type="button"

        className="ml-4 rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed "
        onClick={() => {
          // setOpen(true);
          // console.log("finalData----", data);
          console.log( "createskim_bgids", bgIds)
          sendNetworkBgIds()

        }}
      >
        Create Skim table
        {/* {process ? "  (Loading...)" : ""} */}
      </button>
    </div>
  );
};

export default Dropdown;
