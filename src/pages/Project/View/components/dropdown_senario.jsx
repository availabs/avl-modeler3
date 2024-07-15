import React, { useState, useEffect } from "react";
import { scaleThreshold } from "d3-scale";
import ckmeans from "../../../../utils/ckmeans";

//for senarioMap fill color domain functions
const colors = ["#FEEDDE", "#FDBE85", "#FD8D3C", "#E6550D", "#A63603"];

const getDomain = (data = [], range = []) => {
  if (!data?.length || !range?.length) return [];
  return data?.length && range?.length
    ? ckmeans(data, Math.min(data?.length, range?.length))
    : [];
};

const getColorScale = (data, colors) => {
  const domain = getDomain(data, colors);

  return scaleThreshold().domain(domain).range(colors);
};

const Dropdown = ({
  projectId,
  selectedBlockGroups,
  layer,
  selectedSenario,
  onGetColors,
}) => {
  const [senarioData, setSenarioData] = useState([]);
  const [senarioOverview, setSenarioOverview] = useState({});
  const [senarioDestination, setSenarioDestination] = useState([]);
  // const [senarioId, setSenarioId] = useState("");

  console.log("senario_dropdown_props", projectId, layer);

  console.log("senarioDestination---", senarioDestination);

  const handleChange = (e) => {
    if (e.target.value) {
      console.log("e.target.value-------", e.target.value);

      selectedSenario(e.target.value);

      fetch(`http://localhost:5000/senarios/${e.target.value}/overview`)
        .then((response) => response.json())
        .then((data) => {
          if (data !== null) {
            console.log("view senario overview--------------------", data);
            setSenarioOverview(data);
          }
        });

      // to get the counts for destination based on BGs (Taz)
      fetch(
        `http://localhost:5000/senarios/${e.target.value}/${projectId}/destination`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data !== null) {
            console.log(
              "senario view destination------------------------",
              data
            );
            setSenarioDestination(data);
          }
        });
    }
  };

  const selectedBlockGroupsNew = selectedBlockGroups.map((bg) =>
    parseInt(bg.slice(5, 12)).toString()
  );

  const BGmapping = selectedBlockGroups.reduce((acc, bg) => {
    acc[parseInt(bg.slice(5, 12)).toString()] = bg;
    return acc;
  }, {});
  console.log("selectedBlockGroupsNew--", selectedBlockGroupsNew, BGmapping);

  //make destination map function to get the counts for selectedBGs and make map
  //    destination data
  //     // [
  //     //   {
  //     //     "TAZ": "1",
  //     //     "bg": "702001",
  //     //     "count": 9504
  //     //   },
  //     //   {
  //     //     "TAZ": "2",
  //     //     "bg": "702002",
  //     //     "count": 70644
  //     //   }
  //     // ]

  const senarioMap = () => {
    const selectedSenarioDestination = senarioDestination.filter((obj) =>
      selectedBlockGroupsNew.includes(obj.bg)
    );

    console.log(
      "selectedSenarioDestination------------",
      selectedSenarioDestination
    );

    // const senarioDestinationbyBgs = senarioDestination
    //   .filter((obj) => selectedBlockGroupsNew.includes(obj.bg))

    const senarioDestinationbyBgs = selectedSenarioDestination.reduce(
      (obj, c) => {
        obj[c.bg] = c.count;
        return obj;
      },
      {}
    );
    const colorScale = getColorScale(
      Object.values(senarioDestinationbyBgs),
      colors
    );

    console.log(
      "values_senarioDestinationbyBgs",
      Object.values(senarioDestinationbyBgs).map((v) => colorScale(v))
    );

    //format color with GEOID(full)
    const geoColors = Object.keys(senarioDestinationbyBgs).reduce((acc, k) => {
      acc[BGmapping[k].toString()] = colorScale(senarioDestinationbyBgs[k]);
      return acc;
    }, {});

    onGetColors(geoColors);

    console.log(
      "senarioDestinationbyBgs---",
      senarioDestinationbyBgs,
      geoColors
    );
  };

  useEffect(() => {
    fetch(`http://localhost:5000/senarios/${projectId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data !== null) {
          console.log("view senario names--------------------", data);
          setSenarioData(data);
        }
      });
  }, [projectId]);

  return (
    <div>
      <div>
        <label className="mt-2 text-gray-900 text-sm font-medium">
          Or select a senario :
          <br />
        </label>

        <select onChange={handleChange}>
          <option key={0} value={""}>
            choose your senario(s)
          </option>
          {senarioData.map((e, i) => {
            return (
              <option key={i} value={e.id}>
                {e.name}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        Total Households: {senarioOverview.Households}, Total Persons:
        {senarioOverview.Persons}, Trips: {senarioOverview.Trips}
      </div>
      <div className="flex flex-shrink-0 justify-center px-4 py-4 mt-2">
        <button
          type="submit"
          disabled={
            selectedBlockGroupsNew.length === 0 ||
            senarioDestination.length === 0
          }
          className="ml-4 rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2  disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => {
            senarioMap();
          }}
        >
          Destination Map
        </button>
      </div>
    </div>
  );
};

export default Dropdown;
