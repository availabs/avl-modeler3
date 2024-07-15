import { LayerContainer } from "modules/avl-maplibre/src";
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

    // {
    //   id: "testGeoJSON",
    //   source: {
    //     type: "geojson",
    //     data: "/data/puma_json.json",
    //   },
    // },
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
    
    // {
    //   id: "testGeoJSONLayer",
    //   source: "testGeoJSON",
    //   type: "fill", 
    //   paint: {
    //     "fill-color": "black", 
    //     "fill-opacity": 0.5, 
    //   },
    // },
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

  // onHover = {
  //   layers: ["BG"],
  //   callback: (layerId, features, lngLat) => {
  //     console.log("hover", layerId, features, lngLat);
  //     let { GEOID } = features[0].properties;
  //     return [[GEOID]];
  //   },
  // };
  // onHover = {
  //   layers: ["PUMA"],
  //   callback: (layerId, features, lngLat) => {
  //     console.log("hover", layerId, features, lngLat);
  //     let { PUMACE10 } = features[0].properties;
  //     return [[PUMACE10]];
  //   },
  // };
  
  
  onClick = {
    layers: ["PUMA"],
    callback: async (layerId, features, lngLat) => {
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





      /* Code goes here */
      // 1. this.mapboxMap.queryRenderedFeatures
      // 2.create turf puma geometries
      // 3.create turf bg geometries
      // 4.boolean contains of bg in puma
      // 5.map list of contained bgs into array of bg geoids
      // 6.setFilter on bgHighlight

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
      // let selectedFeaturesGeoidsPuma = selectedFeaturesPuma.map(
      //   (d) => d.properties.GEOID10
      // );

      // let selectedFeaturesGeometryPuma = selectedFeaturesPuma.reduce(
      //   (acc, feature) => {
      //     acc[feature.properties.GEOID10] = feature;
      //     return acc;
      //   },
      //   {}
      // );

      // let selectedFeaturesGeometryPumaOnly = Object.values(
      //   selectedFeaturesGeometryPuma
      // );

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


    //   const openStreetLayer = async () => {
        
    //     const response = await fetch(`http://localhost:5000/projects/pumageometry/${selectedPumas}`)
    //     const value = await response.json();
    //         console.log("bbox--", value[0].boundingBox);

    //     const bbox = value[0].boundingBox


    //     var coordinates = bbox.match(/\(([^)]+)\)/)[1].split(',');

    //     var coordinateValues = coordinates.map(function(coord) {
    //       var values = coord.trim().split(' ');
    //       var longitude = parseFloat(values[0]);
    //       var latitude = parseFloat(values[1]);
    //       // Check if coordinates are valid numbers
    //       if (!isNaN(longitude) && !isNaN(latitude)) {
    //           return { longitude: longitude, latitude: latitude };
    //       } else {
    //           return null; // Return null for invalid coordinates
    //       }
    //   });
      
    //     // Filter out null values (invalid coordinates)
    //     coordinateValues = coordinateValues.filter(function(coord) {
    //         return coord !== null;
    //     });
        
    //     // Finding min and max values
    //     var minY = Infinity;
    //     var maxY = -Infinity;
    //     var minX = Infinity;
    //     var maxX = -Infinity;
        
    //     coordinateValues.forEach(function(coord) {
    //         minY = Math.min(minY, coord.latitude);
    //         maxY = Math.max(maxY, coord.latitude);
    //         minX = Math.min(minX, coord.longitude);
    //         maxX = Math.max(maxX, coord.longitude);
    //     });
        
    //     // Reformatting into the desired order
    //     var result = [minX,minY,maxX,maxY];

    //     console.log('result--------------', result, url);



      
    //   // Overpass-api xml output test 
    //   var serverAPI =  "https://overpass-api.de/api/map?bbox=";
    //   var url =`${serverAPI}${result}`

    //   // const xml = await fetch("url")

    //   // // const osm = await xml.osm.text();

    //   // console.log("osm--", xml);


    // // const bbox = value[0].boundingBox
    // //     .then(response => response.text())
    // //     .then(data => {
    // //       const parser = new DOMParser();
    // //       const xml = parser.parseFromString(data, "application/xml");
    // //       console.log("osm-----", xml);
    // //     })
    // //     .catch(console.error);




    //       }

  
    //   openStreetLayer();
    


    //         // const bBox= await Promise(boundingBox).then((d) => {
    //         //   // const bbox = {};
  
    //         //   // box[pumaId] = d;
  
    //         //   // this.updateState({
    //         //   //   selectedPumasBgs3: PUMAandBgs3,
    //         //   // });
    //         //   console.log("bbox------------", d);
  
    //         //   return d;
    //         // });
  
  
  


    //   // console.log( "boundingBox----------", boundingBox, bBox)


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
    },
  };



  /////////////////////
  // onAdd(map) {
  //   console.log('fetch overpass api geojson');

  //   let selected = this.state.selectedPumas;
  //   let selectedFeaturesPumaString = JSON.stringify(selected).replace(/"/g, '');
  //   console.log("selectedFeaturesPumaString-----", selectedFeaturesPumaString)

  //   if(this.state.selectedPumas) {


  //     console.log('fetch geojson');

  //     fetch(`http://localhost:5000/projects/pumageometry/getosm/'${selectedFeaturesPumaString}`)
   
  //     .then((r) => r.json())
  //     .then((data) => {
  //       console.log('fetch data--', data);

  //       this.geometryData = data.features.map((d) => d.geometry);

  //       console.log('this.geometryData-----', this.geometryData);

  //       this.geojsonFull = data;

  //       this.forceUpdate();

 

  //       // map.addSource('service-calls-src', {
  //       //   type: 'vector',
  //       //   url: 'mapbox://am3081.8x1wbrc6',
  //       // });

  //       // map.addLayer({
  //       //   id: 'service-calls',
  //       //   type: 'circle',
  //       //   source: 'service-calls-src',
  //       //   'source-layer': 'tucson_api_merge_all_new_1',
  //       //   // maxzoom: 15,
  //       //   layout: {
  //       //     // make layer visible by default
  //       //     visibility: 'visible',
  //       //   },
  //       //   paint: {
  //       //     'circle-radius': 2,
  //       //     'circle-color': '#B42222',
  //       //   },
  //       // });

  //       // map.addLayer({
  //       //   id: 'service-calls-heatmap',
  //       //   source: 'service-calls-src',
  //       //   'source-layer': 'tucson_api_merge_all_new_1',
  //       //   type: 'heatmap',
  //       //   //maxzoom: 20,
  //       //   paint: {
  //       //     // Adjust the heatmap radius by zoom level
  //       //     'heatmap-radius': [
  //       //       'interpolate',
  //       //       ['linear'],
  //       //       ['zoom'],
  //       //       0,
  //       //       2,
  //       //       12,
  //       //       20,
  //       //     ],
  //       //     // Transition from heatmap to circle layer by zoom level
  //       //     'heatmap-opacity': [
  //       //       'interpolate',
  //       //       ['linear'],
  //       //       ['zoom'],
  //       //       8, // opacity start zoom
  //       //       1, //start opacity level
  //       //       16, // opacity end zoom
  //       //       0, //end opacity level
  //       //     ],
  //       //   },
  //       // });
  //     });

  //   }

    
  // }



  /////////////////////////









  render(map) {}
}

const PopSynthLayerFactory = (options = {}) => new PopSynthLayer(options);

export default PopSynthLayerFactory;
