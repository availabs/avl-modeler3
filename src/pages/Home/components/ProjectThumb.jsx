import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import get from "lodash.get";
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
// import { ChevronDownIcon } from "@heroicons/react/20/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const ProjectThumb = ({ projectId, project, deleteProject }) => {
  console.log("project format------", project);
  const history = useNavigate();

  let [projectData, setProjectData] = useState(project);
  let [status, setStatus] = useState(project.status);

  useEffect(() => {
    if (status === "complete") {
      console.log("fetching satus");
      fetch(`http://localhost:5000/project/${projectId}/overview`)
        .then((response) => response.json())
        .then((total) => {
          if (total !== null) {
            console.log("total----------", total);

            // let totalHouseholds = Object.values(total.totalHouseholds[0]);
            // let totalPersons = Object.values(total.totalPersons[0]);

            let totalHouseholds = total.Households;
            let totalPersons = total.Persons;

            // let totalHouseholds = Object.values(total.totalHouseholds[0]) ?? 0;
            // let totalPersons = Object.values(total.totalPersons[0]) ?? 0;

            // let totalHouseholds = Object.values(total.totalHouseholds[0][0]);
            // let totalPersons = Object.values(total.totalPersons[0][0]);

            // let totalHouseholds = " ";
            // let totalPersons = " ";

            let synPopTotal = {
              household: totalHouseholds,
              population: totalPersons,
            };

            setProjectData({
              ...projectData,
              ...synPopTotal,
              status: "complete",
            });
          }
        });
    }
  }, [projectId, status]);

  useEffect(() => {
    console.log("test 123", projectId);
    let statusCheck = null;
    const getStatus = () => {
      fetch(`http://localhost:5000/project/${projectId}/status`)
        .then((r) => r.json())
        .then((data) => {
          console.log("got status report", data);
          if (
            get(data, "[0].status", false) === "complete" ||
            get(data, "[0].status", false) === "failed"
          ) {
            setStatus("complete");
            clearInterval(statusCheck);

            //window.location.reload();
          }
        });
    };
    console.log("what is my status", projectId, status, status === "complete");
    // if (status !== "complete") {
    if (status === "processing") {
      console.log("status check", projectId);
      statusCheck = setInterval(getStatus, 2000);
    }
  }, [status]);

  console.log("finalStatus--", status);

  let overview;

  if (projectData.status == "complete") {
    overview = (
      <h3 className="mt-6 text-gray-900 text-sm font-medium">
        households: {projectData.household} population:{projectData.population}
      </h3>
    );
  } else
    overview = (
      <h3 className="mt-6 text-gray-900 text-sm font-medium">
        Processing SynPop data
      </h3>
    );
  return (
    <li
      key={project.id}
      className="col-span-1 flex flex-col text-center bg-white rounded-lg shadow-lg divide-y divide-gray-200"
    >
      <div className="flex-1 flex flex-col p-8">
        {/* Thumbnail box */}
        <div
          className="w-32 h-32 flex-shrink-0 mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 rounded"
          alt=""
        />
        {/* Project name */}
        <h3 className="mt-6 text-gray-900 text-sm font-medium">
          {projectData.name}
        </h3>

        <h2 className="mt-6 text-gray-900 text-sm font-medium">
          {projectData.id}
        </h2>

        {/* <h3 className="mt-6 text-gray-900 text-sm font-medium">
          households: {projectData.household} population:
          {projectData.population}
        </h3> */}
        {overview}

        <dl className="mt-1 flex-grow flex flex-col justify-between">
          <dt className="sr-only">Title</dt>
          <dd className="text-gray-500 text-sm">{projectData.geolist}</dd>

          <dt className="sr-only">Role</dt>
          <dd className="mt-3">
            <span className="px-2 py-1 text-green-800 text-xs font-medium bg-green-100 rounded-full">
              {projectData.options}
            </span>
          </dd>

          <dt className="sr-only">Status</dt>
          <dd className="mt-3">
            <span className="px-2 py-1 text-green-800 text-xs font-medium bg-green-100 rounded-full">
              {projectData.status}
            </span>
          </dd>
        </dl>
      </div>
      {/* Two buttons */}
      <div>
        <div className="flex divide-x divide-gray-200 mt-2  ml-2 mr-2">
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
                Setting
                {/* <ChevronDownIcon
                  className="-mr-1 ml-2 h-5 w-5"
                  aria-hidden="true"
                /> */}
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700",
                          "block px-4 py-2 text-sm"
                        )}
                      >
                        Project
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700",
                          "block px-4 py-2 text-sm"
                        )}
                      >
                        Config
                      </a>
                    )}
                  </Menu.Item>
                  {/* <form method="POST" action="#"> */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={(e) => {
                          deleteProject(projectData.id);
                        }}
                        className={classNames(
                          active
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700",
                          "block w-full px-4 py-2 text-left text-sm"
                        )}
                      >
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                  {/* </form> */}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* <div className="w-0 flex-1 flex">
            <div
              onClick={(e) => {
                deleteProject(projectData.id);
              }}
              className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500"
            >
              <span className="ml-3">Settings</span>
            </div>
          </div> */}

          <div className="-ml-px w-0 flex-1 flex">
            <Link
              to={`/project/${projectData.id}`}
              className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500"
            >
              <span className="ml-3">View</span>
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
};

export default ProjectThumb;
