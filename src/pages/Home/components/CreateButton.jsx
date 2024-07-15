import React, { useState } from "react";
import { Link } from "react-router-dom";
import CreateModal from "./CreateModal";

export default function CreateButton({ user }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className="w-full md:flex md:items-center md:justify-between mt-2  mb-2  mr-5">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Projects
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            type="button"
            to="/project/create"
            // to="/"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="fa fa-plus pr-2" />
            Create Project
          </Link>
        </div>
      </div>
      {/* {open ? "true" : "false"} */}
      {/* <CreateModal open={open} setOpen={setOpen} user={user} /> */}
    </>
  );
}
