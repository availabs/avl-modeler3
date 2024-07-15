import { LayerContainer } from "../../../../modules/avl-maplibre/src";
import { TabPanel } from "../../../../modules/avl-components/src";

// import {TabPanel} from './TabPanel';

import React from "react";
import flatten from "lodash.flatten";
import mapboxgl from "mapbox-gl";
import ProjectView from "./projectView";
import SenarioView from "./senarioView";

const HOST = "http://localhost:5000";

class PopSynthLayer extends LayerContainer {
  filters = {};

  state = {
    bgsGeometryIds: [],
    pumasGeometryIds: [],
    zoomed: false,
    geometry: {},
    coordinates: [],
    selectedBlockGroups: [],
  };
  id = "layer-id";
  // selectedBGs = this.state.selectedBlockGroups;

  sources = [
    {
      id: "pumas",
      source: {
        type: "vector",
        url: "https://tiles.availabs.org/data/census_puma10_ny_2019.json",
      },
    },
    {
      id: "bgs",
      source: {
        type: "vector",
        url: "https://tiles.availabs.org/data/census_block_groups_ny_2019.json",
      },
    },
  ];

  layers = [
    {
      id: "BG",
      "source-layer": "tl_2019_36_bg",
      source: "bgs",
      type: "fill",
      paint: {
        "fill-color": "blue",
        "fill-opacity": 0.2,
      },
    },
    {
      id: "BG-highlight",
      "source-layer": "tl_2019_36_bg",
      source: "bgs",
      type: "fill",
      paint: {
        "fill-color": "white",
        "fill-opacity": 1,
        "fill-outline-color": "red",
      },
      filter: ["in", "GEOID", ""],
    },

    {
      id: "BG-selected",
      "source-layer": "tl_2019_36_bg",
      source: "bgs",
      type: "line",
      paint: {
        "line-color": "gray",
        "line-width": 0.1,
      },
      filter: ["in", "GEOID", ""],
    },

    {
      id: "PUMA-show",
      "source-layer": "tl_2019_36_puma10",
      source: "pumas",
      type: "line",
      paint: {
        "line-color": "white",
        "line-width": 2,
      },
      //   filter: ["in", "GEOID10", ""],
    },
  ];

  infoBoxes = [
    // {
    //   Component: ({ layer }) => {
    //     return <div>View Project: {layer.projectId}</div>;
    //   },
    //   show: true,
    // },

    {
      Component: ({ layer }) => {
        return React.useMemo(
          () => (
            <div className="py-6 px-4 sm:px-6 mt-5" style={{zIndex: 100}}>
              <TabPanel
              tabs={[
                {
                  name: "Project View",
                  Component: () => (
                    <ProjectView
                      projectId={layer.projectId}
                      layer={layer}
                      selectedBlockGroups={layer.state.selectedBlockGroups}
                    />
                  ),
                },
                {
                  name: "Scenario View",
                  Component: () => (
                    <SenarioView
                      projectId={layer.projectId}
                      layer={layer}
                      selectedBlockGroups={layer.state.selectedBlockGroups}
                      onGetColors={(colors) => this.updateState({ colors })}
                    />
                  ),
                },
              ]}
            />
            </div>
          ),
          [layer.state.selectedBlockGroups]
        );
      },
      show: true,
    },
    // {
    //   Component: CreateNewProject,
    //   show: false,
    // },
  ];

  // onHover = {
  //   layers: ["BG"],
  //   callback: (layerId, features, lngLat) => {
  //     // console.log("hover-----", layerId, features);
  //     let { GEOID } = features[0].properties;

  //     return [[GEOID]];
  //     // return [[NAMELSAD10], ["geoid_hover", GEOID10]];
  //   },
  // };

  onClick = {
    layers: ["BG"],
    callback: (layerId, features, lngLat) => {
      console.log("onClick", layerId, features, lngLat);
      let { GEOID } = features[0].properties;
      // console.log("onClick", GEOID, features);

      let selected = this.state.selectedBlockGroups;

      if (!selected.includes(GEOID)) {
        this.updateState({
          selectedBlockGroups: [...selected, GEOID],
        });
        // console.log("add", selected);
      } else {
        let removed = selected.filter((item) => item !== GEOID);
        this.updateState({
          selectedBlockGroups: [...removed],
        });
        // console.log("remove", selected);
      }

      //show selectedBlockGroups
      this.mapboxMap.setFilter("BG-selected", [
        "in",
        "GEOID",
        ...this.state.selectedBlockGroups,
      ]);

      // this.mapboxMap.setFilter("BG-highlight", [
      //   "in",
      //   "GEOID",
      //   ...this.state.selectedBlockGroups,
      // ]);

      // console.log("selectedBGs----", selectedBGs);
      // return [[GEOID]];
      // return [[NAMELSAD10], ["geoid_hover", GEOID10]];

      // this.mapboxMap.setPaintProperty("BG-highlight", "fill-color", [
      //   "get",
      //   ["to-string", ["get", "GEOID"]],
      //   ["literal", this.state.colors],
      // ]);
    },
  };

  fetchData(falcor) {
    // console.log("fetch Layer----", this);

    return (
      fetch(`${HOST}/project/${this.projectId}/geometryIds`)
        //   fetch(`${HOST}/project/${layer.projectId}/geometryIds`)

        .then((r) => r.json())
        .then((d) => {
          // d =
          //     pumas: ['124124','3601242'],
          //     bgs: ['24141241254125',...]
          // }
          // this.geometryIds = d

          const projectBgs = [];
          const projectPUMAs = [];
          const projectGeometry = {
            bgs: projectBgs,
            pumas: projectPUMAs,
          };

          d.crosswalk.map((d) => {
            projectBgs.push(d.BLKGRP);
            projectPUMAs.push(d.PUMA);
          });

          // console.log(
          //   "geometryIds Fetch---",
          //   d,
          //   d.crosswalk,
          //   projectGeometry,
          //   [...new Set(projectGeometry.pumas)],
          //   [...new Set(projectGeometry.bgs)]
          // );

          this.updateState({
            bgsGeometryIds: [...new Set(projectGeometry.bgs)],
            pumasGeometryIds: [...new Set(projectGeometry.pumas)].map(
              (d) => "360" + d
            ),
          });
        })
    );
  }

  //   init(map) {
  //     const features = map.queryRenderedFeatures({ layers: ["PUMA-show"] });
  //     console.log("features init", features);
  //   }

  render(map) {
    console.log("state--", this.state);

    // set filter on layer to only show geometry ids
    if (this.state.pumasGeometryIds) {
      // if (this.state.selectedBlockGroups) {
      map.setFilter("PUMA-show", [
        "in",
        "GEOID10",
        ...this.state.pumasGeometryIds,
      ]);

      map.setFilter("BG", ["in", "GEOID", ...this.state.bgsGeometryIds]);

      map.setFilter("BG-highlight", [
        "in",
        "GEOID",
        ...this.state.selectedBlockGroups,
      ]);

      map.setPaintProperty("BG-highlight", "fill-color", [
        "get",
        ["to-string", ["get", "GEOID"]],
        ["literal", this.state.colors],
      ]);

      // map.setPaintProperty("BG-highlight", "fill-color", [
      //   "get",
      //   ["to-string", ["get", "GEOID"]],
      //   ["literal", this.state.colors],
      // ]);

      // map.setPaintProperty("BG-highlight", "fill-color", this.state.colors);

      //getting the geometry
      map.on("render", () => {
        if (!this.state.zoomed) {
          const features = map.queryRenderedFeatures({
            layers: ["PUMA-show"],
          });

          if (features.length > 0) {
            var coordinates = features[0].geometry.coordinates[0];

            const bounds = new mapboxgl.LngLatBounds(
              coordinates[0],
              coordinates[0]
            );

            for (const coord of coordinates) {
              bounds.extend(coord);
            }

            map.fitBounds(bounds, {
              padding: 20,
            });
            console.log("update state?");
            this.updateState({
              zoomed: true,
            });
            map.on("render", () => {});
          }
        }
      });
    }
  }
}

const PopSynthLayerFactory = (options = {}) => new PopSynthLayer(options);

export default PopSynthLayerFactory;
