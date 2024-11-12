import { LayerContainer } from "../../../../modules/avl-maplibre/src";
import * as turf from "@turf/turf";
import flatten from "lodash.flatten";
// import DataGenerator from "./dataGenerator_single";
import DataGenerator from "./dataGenerator";
import CreateNewProject from "./createProject";



// import Test from "./test";

class PopSynthLayer extends LayerContainer {
  filters = {};

  state = {
    selectedPumas: [],
    selectedBlockGroups: [],
    selectedPumasBgs: {},
    selectedOSM: [],
    selectedOsmIds: [],
    visibility:"none"

  };

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
      id: "testGeoJSON",
      source: {
        type: "geojson",
        data: this.state.selectedOSM,
      },
    },

    {
      "id": "kari_nys_osm_roads_lines_1721749245753",
      "source": {
         "type": "vector",
         "tiles": [
            "https://graph.availabs.org/dama-admin/kari/tiles/247/{z}/{x}/{y}/t.pbf?cols=osm_id"
         ],
         "format": "pbf"
      }
   }
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
        "fill-color": "red",
        "fill-opacity": 0.3,
        "fill-outline-color": "red",
      },
      filter: ["in", "GEOID", ""],
    },

    {
      id: "PUMA",
      "source-layer": "tl_2019_36_puma10",
      source: "pumas",
      type: "fill",
      paint: {
        "fill-color": "white",
        "fill-opacity": 0.0,
      },
    },
    {
      id: "PUMA-show",
      "source-layer": "tl_2019_36_puma10",
      source: "pumas",
      type: "line",
      paint: {
        "line-color": "white",
        "line-width": 1,
      },
    },
    {
      id: "PUMA-highlight",
      "source-layer": "tl_2019_36_puma10",
      source: "pumas",
      type: "line",
      paint: {
        "line-color": "yellow",
        "line-width": 4,
      },
      filter: ["in", "GEOID10", ""],
    },
    
    {
      id: "testGeoJSONLayer",
      source: "testGeoJSON",
      type: "fill", 
      paint: {
        "fill-color": "black", 
        "fill-opacity": 0.5, 
      },
    },

    {
      "id": "osm_roads",
      "type": "line",
      "paint": {
         "line-color": "black",
         "line-width": 1
      },
    
      'layout': {
                // Make the layer visible by default.
                'visibility': 'none'
      },
     
      "source": "kari_nys_osm_roads_lines_1721749245753",
      "source-layer": "view_247",
      // "filter": ["in", "osm_id", ""],
   }

  ];

  infoBoxes = [
    {
      Component: ({ layer }) => {
        console.log("Layer User:", layer);
        return (
          <div>
            <DataGenerator layer={layer} />
          </div>
        );
      },
      show: true,
    },
    {
      Component: CreateNewProject,
      show:false,
    },
  ];


  onClick = {
    layers: ["PUMA"],
    callback: async (layerId, features, lngLat, layer, map) => {
      let { GEOID10, NAMELSAD10 } = features[0].properties;

      let selected = this.state.selectedPumas;
     

      if (!selected.includes(GEOID10)) {
        this.updateState({
          selectedPumas: [...selected, GEOID10],
        });
        console.log("add", selected);
      } else {
        let removed = selected.filter((item) => item !== GEOID10);
        this.updateState({
          selectedPumas: [...removed],
        });
        console.log("remove", selected);
      }

      //show selected PUMAs on map

      this.mapboxMap.setFilter("PUMA-highlight", [
        "in",
        "GEOID10",
        ...this.state.selectedPumas,
      ]);

      // this.mapboxMap.setFilter("testGeoJSONLayer", ["in", "GEOID10", ...this.state.selectedPumas]);

      //1. this.mapboxMap.queryRenderedFeatures /////////////////////////////////////////////
      var selectedFeaturesPuma = this.mapboxMap
        .queryRenderedFeatures({
          layers: ["PUMA"],
        })
        .filter((d) => this.state.selectedPumas.includes(d.properties.GEOID10));
      console.log(
        "selectedFeaturesPuma",
        selectedFeaturesPuma,
        this.state.selectedPumas
      );

      // 2.create turf puma geometries /////////////////////////////////////////////////////

      var featuresBgs = this.mapboxMap.queryRenderedFeatures({
        layers: ["BG"],
      });

      console.log("featuresBgs", featuresBgs);

      let featuresGeometryBgs = featuresBgs.reduce((acc, feature) => {
        acc[feature.properties.GEOID] = feature;
        return acc;
      }, {});

      console.log("featuresGeometryBgs", featuresGeometryBgs);

      //rewrite PUMAandBgs/turf with st_contains in sqlite

      let selectedPumas = this.state.selectedPumas;

      const host = "http://localhost:5000/";

      const PUMAandBgs = selectedPumas.map((pumaId) => {
        let url = `${host}projects/geometry/${pumaId}`;

        console.log("url", url, pumaId);

        return fetch(url)
          .then((r) => r.json())
          .then((d) => {
            const PUMAandBgs = {};

            PUMAandBgs[pumaId] = d;

            console.log("PUMAandBgs_d", d, PUMAandBgs);

            return PUMAandBgs;
          });
      });

      const PUMAandBGs1 = await Promise.all(PUMAandBgs).then((res) =>
        res.reduce((acc, curr) => {
          console.log("in reduce ", acc, curr);
          return { ...acc, ...curr };
        }, {})
      );

      console.log("PUMAandBgs1------>>", PUMAandBGs1);

      // ---------------------------

      // let newContainsBgs = Object.values(PUMAandBgs).map((p) => p);
      let newContainsBgs = Object.values(PUMAandBGs1).map((p) => p);

      // let newContainsBgs1 = Object.values(PUMAandBgs1).map((p) => p);

      console.log("containsBgs", flatten(newContainsBgs));

      this.updateState({
        selectedBlockGroups: flatten(newContainsBgs),
      });

      this.updateState({
        selectedPumasBgs: PUMAandBGs1,
      });

      console.log("this.state.selectedPumasBgs", this.state.selectedPumasBgs);

      var uniqbg = new Set(this.state.selectedBlockGroups);

      console.log("uniqbg---------",uniqbg, this.state.selectedBlockGroups)

      this.mapboxMap.setFilter("BG-highlight", [
        "in",
        "GEOID",
        //...containsBgs,
        ...uniqbg,
      ]);

      function checkIfArrayIsUnique(myArray) {
        return myArray.length === new Set(myArray).size;
      }

      console.log(
        "is unique?",
        checkIfArrayIsUnique(this.state.selectedBlockGroups)
      );

    // },


/////add osm_roads from tile server

      let selectedFeaturesPumaString = this.state.selectedPumas.slice(-1).join(',');
      console.log("selectedFeaturesPumaString-----", selectedFeaturesPumaString, this.state.selectedPumas, this.state.selectedPumas.slice(-1))


        fetch(`http://localhost:5000/projects/pumageometry/getosmid/${selectedFeaturesPumaString}`)

        .then((r) => r.json())
        .then((data) => {

          console.log("osm_ids------------", data)

          // stringData = data.map(String)

          // this.updateState({
          //   visibility: 'visible',
          // });
          this.mapboxMap.setLayoutProperty(
            "osm_roads","visibility", "visible");

      
          let osmIds = this.state.selectedOsmIds;

          this.updateState({
            selectedOsmIds: [...osmIds, ...data],
          });


         
          console.log("osmIds_add", this.state.selectedOsmIds);

        this.mapboxMap.setFilter('osm_roads', ['in', ['get', 'osm_id'], ['literal', this.state.selectedOsmIds]]);
  

          });

      var uniqOsmIdsString = this.state.selectedOsmIds.map(String)

      var newUniqOsmIdsString = new Set(uniqOsmIdsString);
    

      console.log("uniqOsmIds---------",uniqOsmIdsString, this.state.selectedOsmIds, newUniqOsmIdsString)
      console.log("visible---", this.state.visibility)
    
    },

  }

  render(map) {


  }
}

const PopSynthLayerFactory = (options = {}) => new PopSynthLayer(options);

export default PopSynthLayerFactory;
