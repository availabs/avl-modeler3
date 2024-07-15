import React, { useState, useEffect } from "react";
// import BarChart from "./barCharts";
import VarSelector from "./varSelector";
import Dropdown from "./dropdown";
import get from "lodash.get";

const ProjectView = ({ projectId, selectedBlockGroups, layer }) => {
  // console.log("projectview render");

  console.log("project_layers------", projectId, selectedBlockGroups, layer);

  const colors = {
    primary: "#333",
    light: "#aaa",
  };

  let [overviewProject, setOverviewProject] = useState({
    Households: 0,
    Persons: 0,
  });

  let [varList, setVarList] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/project/${projectId}/list_vars`)
      .then((response) => response.json())
      .then((data) => {
        if (data !== null) {
          setVarList([...data]);
        }
      });
  }, [projectId]);

  console.log("varList--", varList);

  // useEffect(() => {
  //   fetch(`http://localhost:5000/project/${projectId}/view`)
  //     .then((response) => response.json())
  //     .then((data) => {
  //       if (data !== null) {
  //         console.log("view data--------------------", data);
  //         setProjectData({
  //           ...data,
  //         });
  //       }
  //     });
  // }, [projectId]);

  useEffect(() => {
    fetch(`http://localhost:5000/project/${projectId}/overview`)
      .then((response) => response.json())
      .then((data) => {
        if (data !== null) {
          console.log("overview data--------------------", data);
          setOverviewProject({
            ...data,
          });
        }
      });
  }, [projectId]);
  console.log(
    "overviewProject--",
    overviewProject
    // projectData
    // overviewProject.Households["num_hh"]
    // overviewProject.totalHouseholds[0]
    // overviewProject.totalPersons[0]["COUNT(1)"]
    // Object.values(overviewProject.totalHouseholds[0])[0]
  );

  // const totalHHCounts = Object.values(overviewProject.totalHouseholds[0])[0]
  //   ? Object.values(overviewProject.totalHouseholds[0])[0]
  //   : 0;

  // const totalHHCountsObject = overviewProject.totalHouseholds[0];
  // const totalHHCounts = get(
  //   totalHHCountsObject,
  //   `${Object.values(totalHHCountsObject)}`,
  //   0
  // );

  const totalHHCounts = get(
    overviewProject,
    "totalHouseholds"[0]["COUNT(1)"],
    {}
  );
  // // const totalPCounts = overviewProject.totalPersons[0];
  // console.log("totalHHCounts", totalHHCounts);

  return (
    <div style={{ backgroundColor: "#fff", padding: 15 }}>
      <div>
        <div
          style={{
            fontSize: "1.3em",
            fontWeigh: 500,
            borderBottom: `1px solid ${colors.primary}`,
            color: colors.primary,
          }}
        >
          Project View: {projectId}
        </div>
        <div>
          {/* <h3 className="mt-6 text-gray-900 text-sm font-medium">
            Total households: {projectData.Households.length}, Total population:
            {projectData.Persons.length}
          </h3> */}
          <h3 className="mt-6 text-gray-900 text-sm font-medium">
            Total households: {overviewProject.Households}, Total persons:
            {overviewProject.Persons}
          </h3>
        </div>
        <div>
          {/* <BarChart data={projectData} /> */}
          {/* <VarSelector projectData={projectData} varList={varList} /> */}
          <Dropdown
            varList={varList}
            projectId={projectId}
            selectedBlockGroups={selectedBlockGroups}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectView;
