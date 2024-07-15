import React, { useState } from "react";

const CreateProject = (user, open, setOpen, finaldata) => {
  console.log("user--", user, open);
  //   const [open, setOpen] = useState(true);
  const [data, setData] = useState({
    userId: user.id,
  });

  const getTitle = (e) => {
    setData({ ...data, ...{ project_name: e.target.value } });
    console.log("Data---", data);
  };

  const getData = () => {
    setData({ ...data, ...{ project_data: finaldata } });
    console.log("final data", data);
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  const sendData = () => {
    fetch(`http://localhost:5000/project/create_1`, options)
      .then((r) => r.json())
      .then((d) => console.log("create project response", d));
  };

  return (
    <div className=" py-6 px-4 sm:px-6 mt-5">
      <div className="flex items-center">
        <h3 className="text-sm font-medium text-gray-900 mt-2 ">
          3. Name your project:
        </h3>

        {/* <label
          htmlFor="project-name"
          className="block text-sm font-medium text-gray-900"
        >
          {" "}
          3. Project name{" "}
        </label> */}

        <div className="mt-1 ml-3">
          <input
            name="project-name"
            id="project-name"
            className="rounded-md border border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-md"
            placeholder="Your Project Name"
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
          type="submit"
          className="ml-4 rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={() => {
            // setOpen(true);
            getData();
            sendData();
            // window.location.reload();
          }}
        >
          Create Project
        </button>
      </div>
    </div>
  );
};

export default CreateProject;
