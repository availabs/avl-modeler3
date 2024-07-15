import React, { useState, useEffect } from "react";
import Dropdown from "./dropdown_senario";
import get from "lodash.get";

const SenarioView = ({
  projectId,
  selectedBlockGroups,
  layer,
  onGetColors,
}) => {
  // console.log("SenarioView render");

  const colors = {
    primary: "#333",
    light: "#aaa",
  };

  const [data, setData] = useState();

  const [process, setProcess] = useState(false);
  const [status, setStatus] = useState(false);

  const [senarioId, setSenarioId] = useState();

  console.log("new senario input---------------", data);

  //add senario title to the data
  const getTitle = (e) => {
    setData({
      senario_name: e.target.value,
      status: "processing",
      project_id: projectId,
    });
  };

  const requestCreate = async (data) => {
    setProcess(true);

    const options = {
      // mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    };

    console.log("options", options);

    await fetch(`http://localhost:5000/senario/create`, options)
      .then((r) => r.json())
      .then((d) => {
        console.log("New senario is added to the senario table");
      });

    // setProcess(false);
    // await fetch(`http://localhost:5000/senarios/${senarioId}/status`)
    //   .then((r) => r.json())
    //   .then((data) => {
    //     console.log("senario view status------------------------", data);
    //     // if (data[0].status === "complete") setProcess(false);
    //   });

    // fetch destination test

    // await fetch(
    //   `http://localhost:5000/senarios/${senarioId}/${projectId}/destination`
    // )
    //   .then((r) => r.json())
    //   .then((data) => {
    //     console.log("senario view destination------------------------", data);
    //     // if (data[0].status === "complete") setProcess(false);
    //   });
  };
  console.log("process-------------", process);

  // useEffect(() => {
  //     fetch(`http://localhost:5000/senarios/${senarioId}/status`)
  //       .then((r) => r.json())
  //       .then((data) => {
  //         console.log("senario view status------------------------", data);
  //         if ( data[0].status === "complete" )
  //           setProcess(false);

  //       });

  // }, [process]);

  return (
    // <div style={{ backgroundColor: "#fff", padding: 15 }}>
    <div
      className=" py-6 px-4 sm:px-6 mt-5"
      style={{ backgroundColor: "#fff", padding: 15 }}
    >
      <div>
        <div
          style={{
            fontSize: "1.3em",
            fontWeigh: 500,
            borderBottom: `1px solid ${colors.primary}`,
            color: colors.primary,
          }}
        >
          Senario View: {senarioId}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-gray-900 mr-2 ">
              Name your Senario:
            </h3>

            <input
              name="project-name"
              id="project-name"
              className="p-1 rounded-md border border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-md"
              placeholder="Your Project Name"
              // onChange={() => {}}
              // onChange={(e) => setProjectName(e.target.value)}
              onChange={getTitle}
            />
          </div>
          <div className="flex flex-shrink-0 justify-center px-4 py-4 mt-2">
            <button
              type="button"
              // disabled={layer.state.selectedPumas.length === 0}
              className="ml-4 rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed "
              // onClick={async () => {
              //   if (data) await requestCreate(data);
              // }}

              onClick={() => {
                if (data) requestCreate(data);
              }}
            >
              Create New Senario
              {process ? "  (Creating senario...)" : ""}
            </button>
          </div>
          {/* process: {process ? "true" : "false"} */}
          <div>
            <Dropdown
              projectId={projectId}
              selectedBlockGroups={selectedBlockGroups}
              layer={layer}
              selectedSenario={setSenarioId}
              onGetColors={onGetColors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SenarioView;
