import React, { useState, useEffect } from "react";
// import get from "lodash.get";

import Charts from "./charts";

const Dropdown = ({ varList, projectId, selectedBlockGroups }) => {
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
    </div>
  );
};

export default Dropdown;
