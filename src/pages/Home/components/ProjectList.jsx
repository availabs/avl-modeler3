import React, { useState, useEffect, useCallback } from "react";
import { withAuth } from "../../../modules/avl-components/src";
import ProjectThumb from "./ProjectThumb";
import { useNavigate } from "react-router-dom";

const ProjectList = ({ user }) => {
  let [projects, setProjects] = useState([]);

  const history = useNavigate();
  console.log("uer id------------", user)

  // window.location.reload();
  useEffect(() => {
    console.log("projectList fetch data");
    fetch(`http://localhost:5000/projects/${user.id}`)
      .then((response) => response.json())
      .then((data) => {
        setProjects(data);
        console.log("projectList data received", data);
      });
  }, [user]);

  const deleteProject =
    // useCallback(
    (projectId) => {
      console.log("delete project id", projectId);

      fetch(`http://localhost:5000/project/${projectId}/delete`)
        .then((r) => r.json())
        .then((d) => {
          console.log("delete fetch response--", d);
          if (d.response === "deleted") {
            setProjects(projects.filter((d) => d.id !== projectId));
            // window.location.reload();
            // history.push("/");
          }
        });
    };
  // ,
  // [projects]
  //  );

  console.log("final project---------------", projects);

  return (
    <ul
      role="list"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {projects.map((project) => (
        <ProjectThumb
          projectId={project.id}
          project={project}
          deleteProject={deleteProject}
        />
      ))}

      {/* {reload} */}
    </ul>
  );
};

export default withAuth(ProjectList);
