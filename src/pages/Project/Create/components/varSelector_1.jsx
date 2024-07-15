import React, { useState, useEffect, useMemo } from "react";
// import Select, { components } from "react-select";
// import makeAnimated from "react-select/animated";

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

  let newVariables = useMemo(() => {
    return Object.keys(variables)
      .filter((k) => !modelVars.includes(k))
      .reduce((obj, key) => {
        obj[key] = variables[key];
        return obj;
      }, {});
    // .map((k, i) => {
    //   return variables[k];
    // });
  }, [modelVars]);

  console.log("variables---", variables, modelVars, newVariables);

  const addVar = (e) => {
    console.log("event", e, e.target.value);
    if (e.target.value) {
      setModelVars([...modelVars, e.target.value]);
      // setSelectedVar([...modelVars, e.target.value]);
      setSelectedVar(
        [...modelVars, e.target.value].map((key) => variables[key])
      );
    }
  };

  const removeVar = (key) => {
    if (variables[key].required) {
      return;
    }
    setModelVars(modelVars.filter((k) => k !== key));
    // setSelectedVar(modelVars.filter((k) => k !== key));
    setSelectedVar(
      modelVars.filter((k) => k !== key).map((key) => variables[key])
    );
  };

  return (
    <div className="mt-1 mb-2 ml-auto px-2 py-2">
      <select onChange={addVar}>
        <option key={0} value={""}>
          choose your variable(s)
        </option>
        {Object.keys(newVariables).map((k, i) => {
          return (
            <option key={i} value={k}>
              {newVariables[k].name}
            </option>
          );
        })}
      </select>
      <div>
        {modelVars.map((key) => {
          return (
            <div className="flex  border-b">
              <div className="flex-1 p-1 ">{variables[key].name}</div>
              <div
                className={`${
                  variables[key].required
                    ? "cursor-not-allowed text-gray-300"
                    : "cursor-pointer "
                } p-2`}
                onClick={() => removeVar(key)}
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
