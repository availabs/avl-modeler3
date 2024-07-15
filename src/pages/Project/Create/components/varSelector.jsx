import React, { useState, useEffect, useMemo } from "react";
import Select, { components } from "react-select";
import makeAnimated from "react-select/animated";

const VarSelector = ({ layer, setSelectedVar }) => {
  const [variables, setVariables] = useState({});
  const [modelVars, setModelVars] = useState([]);

  useEffect(() => {
    const getVariables = async () => {
      const response = await fetch("/data/model_variables.json");
      const data = await response.json();
      console.log("meta--", data);

      setVariables(data);
      setModelVars(Object.keys(data).filter((key) => data[key].required));
    };
    getVariables();
  }, []);

  console.log("variables---", variables, modelVars);

  let options = useMemo(() => {
    return Object.keys(variables)
      .filter((k) => !modelVars.includes(k))
      .map((k, i) => {
        return {
          value: k,
          label: variables[k].name,
        };
      });
  }, [modelVars]);

  const addVar = (e) => {
    console.log("event", e);
    setModelVars([...modelVars, e.value]);
    setSelectedVar([...modelVars, e.value].map((key) => variables[key]));
    // setSelectedVar(selectedKeyArray.map((key) => variables[key]));
  };

  const removeVar = (key) => {
    if (variables[key].required) {
      return;
    }
    setModelVars(modelVars.filter((k) => k !== key));
    setSelectedVar(
      modelVars.filter((k) => k !== key).map((key) => variables[key])
    );
  };

  return (
    <div className="mt-1 mb-2 ml-auto px-2 py-2">
      <Select
        // isMulti
        // isSearchable
        options={options}
        value={""}
        onChange={addVar}
        placeholder="Select a variable or multiple variables"
        components={makeAnimated()}
      />
      <div>
        {modelVars.map((d) => {
          return (
            <div className="flex  border-b">
              <div className="flex-1 p-1 ">{variables[d].name}</div>
              <div
                className={`${
                  variables[d].required
                    ? "cursor-not-allowed text-gray-300"
                    : "cursor-pointer "
                } p-2`}
                onClick={() => removeVar(d)}
              >
                <i className="fa fa-times" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VarSelector;
