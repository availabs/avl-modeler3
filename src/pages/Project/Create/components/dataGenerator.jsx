import React, { useState, Fragment, useRef } from "react";
import { Dialog, Transition, Menu } from "@headlessui/react";
import flatten from "lodash.flatten";
import Papa from "papaparse";
// import { useFalcor, withAuth } from "../../../../modules/avl-components/src";
import {useFalcor} from "../../../../modules/avl-falcor";
import {withAuth} from '../../../../modules/ams/src'
import JSZip from "jszip";
import { saveAs } from "file-saver";
import controlConfigJson from "./controlConfig.json";
// import CreateNewProject from "./createProject_old";
import VarSelector from "./varSelector";
// import VarSelector from "./varSelector_1.js";
import CreateProject from "./createProject";
import { useNavigate } from "react-router-dom";

// import GenerateCrosswalk from "./dataProcessing/generateCrosswalk";
import {
  generateCrosswalk,
  generateSeedData,
  generateControlConfig,
} from "./dataProcessing/processData";

import generateControl from "./dataProcessing/processControlData";

import { stringify } from "postcss";

//let controlConfigJson = require('./control_config.json')  //if public data folder
// const host = "http://localhost:5000/";

const DataGenerator = ({ layer, user }) => {
  console.log("layer----", layer, user, layer.state);
  const { falcor, falcoCache } = useFalcor();
  const [process, setProcess] = useState(false);
  const [open, setOpen] = useState(true);
  const [selectedVar, setSelectedVar] = useState([]);
  const history = useNavigate();

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
    // let controlData = await generateControl(crosswalkData);
    // let controlData = await generateControl(crosswalkData, selectedVar, layer); // because fetch--promise
    let controlData = await generateControl(
      crosswalkData,
      selectedVar,
      layer,
      falcor
    ); // because fetch--promise
    console.timeEnd("generate control");

    console.time("generate controlControl");
    // let controlConfig = generateControlConfig(controlData);
    //expression is hard to generate so decide to manually creat object json and import

    // let controlConfig = controlConfigJson;

    let controlConfig = flatten(generateControlConfig(selectedVar));
    controlConfig.splice(1, 3);
    console.timeEnd("generate controlControl");

    const projectData = {
      crosswork_data: crosswalkData,
      seed_data: seedData,
      control_data: controlData,
      control_config: controlConfig,
      setting: selectedVar[0].setting,
    };

    console.log("projectData---", projectData);

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

    // return null;
  };

  const requestCreate = (data) => {
    console.log("final_data---",)
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
      .then((d) => {
        //
        // history.push("/");
        console.log("create project response", d);
      });
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
                        Create New Project
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
