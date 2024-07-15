import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
// import { withAuth } from "modules/avl-components/src";
import {withAuth} from '../../../modules/ams/src'
import { AvlMap } from "../../../modules/avl-maplibre/src";
import ViewLayer from "./components/projectView.layer";
import { MAPBOX_TOKEN } from "../../../config";

const ProjectView = ({ user }) => {
  const { projectId } = useParams();
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="pl-14 h-screen  h-full">
        <AvlMap
          accessToken={MAPBOX_TOKEN}
          mapOptions={{
            zoom: 6.5,
            styles: [
              {
                name: "Light",
                // style: "mapbox://styles/am3081/ckm86j4bw11tj18o5zf8y9pou",
                style: "https://api.maptiler.com/maps/dataviz-light/style.json?key=mU28JQ6HchrQdneiq6k9",
                // style: "mapbox://styles/am3081/cjya70364016g1cpmbetipc8u",
              },
            ],
          }}
          layers={[ViewLayer({ projectId })]}
          sidebar={{
            title: "Create Project",
            tabs: ["styles"],
            open: false,
          }}
          customTheme={{
            menuBg: "bg-gray-600",
            bg: "bg-gray-600",
            sidebarBg: "bg-gray-800",
            accent1: "bg-gray-600",
            accent2: "bg-gray-800",
            accent3: "bg-gray-700",
            accent4: "bg-gray-500",
            menuText: "text-gray-100",

            inputBg: "bg-gray-800 hover:bg-gray-700",
            inputBgFocus: "bg-gray-700",
            itemText: "text-gray-100 hover:text-white text-sm",
            menuBgActive: "bg-transparent",

            input: "bg-gray-600 w-full text-gray-100 text-sm p-2",
          }}
        />
      </div>
    </div>
  );
};

const page = {
  name: "View Project",
  path: "/project/:projectId",
  exact: true,
  auth: true,
  mainNav: false,
  sideNav: {
    color: "dark",
    size: "micro",
  },
  component: withAuth(ProjectView),
};
export default page;
