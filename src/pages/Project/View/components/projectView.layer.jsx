import { LayerContainer } from "../../../../modules/avl-maplibre/src";
import { TabPanel } from "../../../../modules/avl-components/src";

import React from "react";
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
    selectedOsmIds: [],
    dataFetched: false,
    selectedLogLat: {},
    selectedODIds: { source: null, target: null },
    odOsmIds: [],
   
  };
  id = "layer-id";

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
    {
      id: "kari_nys_osm_roads_lines_1721749245753",
      source: {
        type: "vector",
        tiles: [
          "https://graph.availabs.org/dama-admin/kari/tiles/247/{z}/{x}/{y}/t.pbf?cols=osm_id",
        ],
        format: "pbf",
      },
    },
    {
      id: "kari_nys_osm_roads_noded_1724325761362",
      source: {
         type: "vector",
         tiles: [
            "https://graph.availabs.org/dama-admin/kari/tiles/263/{z}/{x}/{y}/t.pbf?cols=osm_id"
         ],
         format: "pbf"
      }
   },
   
    {
      id: "kari_nys_osm_linestrings_noded_1724978216656",
      source: {
          type: "vector",
          tiles: [
             "https://graph.availabs.org/dama-admin/kari/tiles/267/{z}/{x}/{y}/t.pbf?cols=osm_id"
          ],
          format: "pbf"
       }
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
        "fill-outline-color": "yellow",
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
    },
  
    {
      id: "osm_roads",
      type: "line",
      paint: {
        "line-color": "black",
        "line-width": 1,
      },
      layout: {
        visibility: "none",
      },
      source: "kari_nys_osm_roads_lines_1721749245753",
      "source-layer": "view_247",
    },
    {
      id: "osm_roads-selected",
      type: "line",
      paint: {
        "line-color": "yellow",
        "line-width": 6,
      },
      layout: {
        visibility: "none",
      },
      source: "kari_nys_osm_roads_lines_1721749245753",
      "source-layer": "view_247",
     
    },


    {
      id: "osm_roads_neptune",
      type: "line",
      paint: {
        "line-color": "black",
        "line-width": 1
      },
      layout: {
            visibility: "none",
      },
      source: "kari_nys_osm_roads_noded_1724325761362",
      "source-layer": "view_263"
    },

    {
      id: "osm_roads-selected_neptune",
      type: "line",
      paint: {
        "line-color": "yellow",
        "line-width": 6
      },
      layout: {
        visibility: "none",
      },
      source: "kari_nys_osm_roads_noded_1724325761362",
      "source-layer": "view_263",
      // filter: ["in", "osm_id",  137354894],
    },


    {
      id: "osm_linestrings",
      type: "line",
      paint: {
         "line-color": "black",
         "line-width": 1
      },
      layout: {
        visibility: "none",
      },
      source: "kari_nys_osm_linestrings_noded_1724978216656",
      "source-layer": "view_267"
   },

   {
    id: "osm_linestrings-selected",
    type: "line",
    paint: {
      "line-color": "yellow",
      "line-width": 6
    },
    layout: {
      visibility: "none",
    },
    source: "kari_nys_osm_linestrings_noded_1724978216656",
    "source-layer": "view_267"
  },


  ];

  infoBoxes = [
    {
      Component: ({ layer }) => {
        return React.useMemo(
          () => (
            <div className="py-6 px-4 sm:px-6 mt-5" style={{ zIndex: 100 }}>
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
  ];

  // onHover = {
  //   layers: ["osm_roads-selected_neptune"],
  //   callback: (layer, features) => {
  //     const currvals = features.map(f => f.properties.ogc_fid);
  //     console.log('FEATURES?', layer, features, currvals, this.edgeArray, this.edgeArray.filter(ea => currvals.includes(ea) ))
  //   }
  // }



  onClick = {
    layers: ["BG"],
    callback: (layerId, features, lngLat) => {
      let { GEOID } = features[0].properties;
      let selected = this.state.selectedBlockGroups;

      if (!selected.includes(GEOID)) {
        this.updateState({
          selectedBlockGroups: [...selected, GEOID],
          selectedLogLat: lngLat,
        });
      } else {
        let removed = selected.filter((item) => item !== GEOID);
        this.updateState({
          selectedBlockGroups: [...removed],
        });
      }

      // let selectedLogLat = this.state.selectedLogLat;

      // console.log("selectedLogLat0-----", selectedLogLat, this.state)

      const lng = lngLat.lng;
      const lat = lngLat.lat;

      console.log("lngLat-------", lng, lat, lngLat);

      // if (true) {
      // this.updateState({
      //   selectedLogLat: lngLat

      // });

      fetch(`http://localhost:5000/network/nearest1/${lng}/${lat}`)
        .then((r) => r.json())
        .then((sourceid) => {
          console.log("sourceId---------------", sourceid[0].id);
          let sourceId = sourceid[0].id;
          if (sourceId) {
            if (
              this.state.selectedODIds.source === null &&
              this.state.selectedODIds.target === null
            ) {
              this.updateState({
                selectedODIds: {
                  source: sourceId,
                  target: this.state.selectedODIds.target,
                },
              });
            } else if (
              this.state.selectedODIds.source !== null &&
              this.state.selectedODIds.target === null
            ) {
              this.updateState(
                {
                  selectedODIds: {
                    source: this.state.selectedODIds.source,
                    target: sourceId,
                  },
                }
              );
              if (
                this.state.selectedODIds.source !== null &&
                this.state.selectedODIds.target !== null
              ) {
                // call the API
                fetch(
                  `http://localhost:5000/network/${this.state.selectedODIds.source}/${this.state.selectedODIds.target}`
                )
                  .then((res) => res.json())
                  .then((res) => {

                    // Assuming your array is called 'dataArray'
                    const edgeArray = res.map(item => item.edge);
                    const osmIdArray = res.map(item => item.osm_id);

                    // this.edgeArray = edgeArray;

                    console.log("Res---- ", res, edgeArray, osmIdArray, osmIdArray.map(String));
                    // this.updateState({
                    //   odOsmIds: [...osmIdArray.map(String)],
                    // });

                    var uniqueOsmIdArray = [...new Set(osmIdArray)];
                    var uniqueEdgeArray = [...new Set(edgeArray)];

                    this.mapboxMap.setLayoutProperty("osm_roads-selected", "visibility", "visible");


                    this.mapboxMap.setFilter("osm_roads-selected", 
                      ["in", "osm_id", ...uniqueOsmIdArray]
                    );

                  });


                // make both source and target null again
                this.updateState({
                  selectedODIds: { source: null, target: null },
                });
              }
            }

            console.log("source_odOsmIds-----", this.state.odOsmIds);
          }
        });

      // }

      this.mapboxMap.setFilter("BG-selected", [
        "in",
        "GEOID",
        ...this.state.selectedBlockGroups,
      ]);

    },
  };

  fetchData(falcor) {
    // return super.fetchData(falcor).then(() => {
    return fetch(`${HOST}/project/${this.projectId}/geometryIds`)
      .then((r) => r.json())
      .then((d) => {
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

        console.log("Updating state with fetched data");
        this.updateState(
          {
            bgsGeometryIds: [...new Set(projectGeometry.bgs)],
            pumasGeometryIds: [...new Set(projectGeometry.pumas)].map(
              (d) => "360" + d
            ),
            dataFetched: true,
          }
          // () => {
          //   console.log('State updated callback, calling fetchOsmIds');
          //   return this.fetchOsmIds(map);
          // }
        );
        console.log("State after update:", this.state);
        this.fetchOsmIds();
      });
    // });
  }

  // somefnm(){

  // }
  // componentDidUpdate(prevProps, prevState) {
  //   console.log('componentDidUpdate triggered------------');
  //   console.log('Previous state---------', prevState); // Log previous state
  //   console.log('Current state-----------', this.state); // Log current state
  //   if (this.state.dataFetched && !prevState.dataFetched) {
  //     console.log('Calling fetchOsmIds');
  //     this.fetchOsmIds(map); // Add this method call
  //   }
  // }

  init(map, falcor) {
    console.log("Init called");
    // this.mapboxMap = map;
    // this.falcor = falcor;
    // Call fetchData here to simulate the data fetch process
    // this.fetchData(falcor);
  }

  fetchOsmIds(map) {
    console.log("fetchOsmIds called"); // Add this line
    let selectedPumaString = this.state.pumasGeometryIds.slice(-1).join(",");
    fetch(
      `http://localhost:5000/projects/pumageometry/getosmid/${selectedPumaString}`
    )
      .then((r) => r.json())
      .then((data) => {
        console.log("OSM IDs fetched:", data); // Add this line
        // this.mapboxMap.setLayoutProperty("osm_roads_neptune", "visibility", "visible");
        // this.mapboxMap.setLayoutProperty("osm_roads", "visibility", "visible");
        this.mapboxMap.setLayoutProperty("osm_linestrings", "visibility", "visible");

        let osmIds = this.state.selectedOsmIds;

        if ((osmIds || []).length !== (data || []).length) {
          this.updateState({
            selectedOsmIds: [...data],
          });
        }

        // this.mapboxMap.setFilter("osm_roads", [
        //   "in",
        //   ["get", "osm_id"],
        //   ["literal", this.state.selectedOsmIds],
        // ]);

        console.log("osmIds--", osmIds, this.state.selectedOsmIds)

        // this.mapboxMap.setFilter("osm_roads_neptune", [
        //   "in",
        //   ["get", "osm_id"],
        //   ["literal", this.state.selectedOsmIds],
        // ]);

  
        this.mapboxMap.setFilter("osm_linestrings", [
          "in",
          ["get", "osm_id"],
          ["literal", this.state.selectedOsmIds],
        ]);




      });
  }

  render(map) {
    // this.fetchData(falcor);
    console.log("state---", this.state);
    if (this.state.pumasGeometryIds) {
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
            this.updateState({
              zoomed: true,
            });
          }
        }
      });
    }
  }
}

const PopSynthLayerFactory = (options = {}) => new PopSynthLayer(options);

export default PopSynthLayerFactory;
