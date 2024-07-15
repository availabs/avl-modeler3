import React, { useState, useEffect } from "react";
// import { withAuth } from "../../modules/avl-components/src";
import {withAuth} from '../../modules/ams/src'
import ProjectList from "./components/ProjectList";
import CreateButton from "./components/CreateButton";

const Home = ({ user }) => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="h-full flex-1 flex flex-col text-gray-900 bg-white p-4">
        <div className="flex-1 flex  flex-col">
          <CreateButton user={user} />
          <ProjectList />

          {/* <div className="max-w-3xl">{JSON.stringify(user, null, 3)}</div> */}
        </div>
      </div>
    </div>
  );
};

const page = {
  name: "Projects",
  path: "/",
  exact: true,
  auth: true,
  mainNav: true,
  icon: "fal fa-home",
  sideNav: {
    color: "dark",
    size: "compact",
  },
  component:withAuth(Home),
};
export default page;
