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
    selectedOSM: []
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
      show: false,
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

      // find BGs contained using turf and format {PUMA:[BGs], ... }

      // let PUMAandBgs = Object.values(selectedFeaturesPuma).reduce(
      //   (acc, feature) => {
      //     console.log("feature2", feature);

      //     let selectedBgIds = Object.keys(featuresGeometryBgs).reduce(
      //       (acc, geoid) => {
      //         // console.log('check bg', geoid, featuresGeometryBgs[geoid])
      //         // //let polygon = turf.polygon(featuresGeometryBgs[geoid])
      //         let results = turf.booleanPointInPolygon(
      //           turf.centroid(featuresGeometryBgs[geoid]),
      //           feature
      //         );

      //         if (results) {
      //           feature.properties.GEOID10 = acc.push(geoid);

      //           // let selectedBgsIds =[]
      //           // selectedBgsIds.push(geoid)
      //           // acc[feature.properties.GEOID10] = selectedBgsIds.push(geoid)
      //         }
      //         return acc;
      //       },
      //       []
      //     );

      //     console.log("selectedBgIds---------", selectedBgIds);

      //     acc[`${feature.properties.STATEFP10}${feature.properties.PUMACE10}`] =
      //       selectedBgIds;
      //     return acc;
      //   },
      //   {}
      // );

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

            // this.updateState({
            //   selectedPumasBgs3: PUMAandBgs3,
            // });
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

    // test adding osmlayer
        // let selectedFeaturesPumaString = JSON.stringify(this.state.selectedPumas).replace(/"/g, '');
        let selectedFeaturesPumaString = this.state.selectedPumas.slice(-1).join(',');
        console.log("selectedFeaturesPumaString-----", selectedFeaturesPumaString, this.state.selectedPumas, this.state.selectedPumas.slice(-1))

        console.log('fetch geojson');

        console.log('fetch layerId-------------',  layerId, layer, layer.projectId)

      // const openStreetLayer = async () => {
      // const response = await  fetch(`http://localhost:5000/projects/pumageometry/getosm/${selectedFeaturesPumaString}`)

      if (!selected.includes(GEOID10)) {
        this.updateState({
          selectedPumas: [...selected, GEOID10],
        });
        console.log("add", selected);
      }
      
      fetch(`http://localhost:5000/projects/pumageometry/getosm/${selectedFeaturesPumaString}`)

        .then((r) => r.json())
        .then((data) => {

          console.log("data------------", data.features)
      
          let selected = this.state.selectedOSM;

          this.updateState({
            selectedOSM: [...selected, ...data.features],
          });
          console.log("add", selected);

          console.log('geometryData-----', this.state.selectedOSM);
       

       let  feature_collection = {
            "type": "FeatureCollection",
            "features": this.state.selectedOSM
        }
    

       if (!this.mapboxMap.getSource("osm-src")) {
          
          this.mapboxMap.addSource('osm-src', {
            type: 'geojson',
            data: feature_collection,
          });

          this.mapboxMap.addLayer({
            'id': 'osm-calls',
            'type': 'line',
            'source': 'osm-src',
            'layout': {},
            'paint': {
                'line-color': '#000',
                'line-width': 3
            }
          });

        } else {

          this.mapboxMap.getSource('osm-src').setData(feature_collection)

          this.mapboxMap.addLayer({
            'id': 'osm-calls',
            'type': 'line',
            'source': 'osm-src',
            'layout': {},
            'paint': {
                'line-color': '#000',
                'line-width': 3
            }
    
          });

        }


      });


    },


  }


  render(map) {


  }
}

const PopSynthLayerFactory = (options = {}) => new PopSynthLayer(options);

export default PopSynthLayerFactory;
