import React from "react"
import { range as d3range } from "d3-array"
import { Table } from "../../../modules/avl-components/src";
import { useNavigate } from "react-router-dom"

import get from "lodash/get";

import { DamaContext } from "../../../pages/DataManager/store";

export const ETL_CONTEXT_ATTRS = [
  "etl_status",
  "etl_context_id",
  "created_at",
  "terminated_at",
  "source_id",
  "parent_context_id",
  "type",
  //"duration",
  "payload"
];

function timeAgo(input) {
  const date = (input instanceof Date) ? input : new Date(input);
  const formatter = new Intl.RelativeTimeFormat('en');
  const ranges = {
    years: 3600 * 24 * 365,
    months: 3600 * 24 * 30,
    weeks: 3600 * 24 * 7,
    days: 3600 * 24,
    hours: 3600,
    minutes: 60,
    seconds: 1
  };
  const secondsElapsed = (date.getTime() - Date.now()) / 1000;
  for (let key in ranges) {
    if (ranges[key] < Math.abs(secondsElapsed)) {
      const delta = secondsElapsed / ranges[key];
      return formatter.format(Math.round(delta), key);
    }
  }
}

const StartedAtCell = (d) => {
  const { value } = d;
  return (
    <div>{ timeAgo(value) }</div>
  )
}

const DurationCell = (d) => {
  const { value } = d;
  let formattedDuration = '';
  //under two seconds, show in MS
  if(parseInt(value) < 2000 ){
    // const duration = moment(value).as('milliseconds');
    // r.duration = `${Math.round(duration)} ms`
    formattedDuration = `${value} ms`
  }
  //under 10 minutes, show in seconds
  else if(parseInt(value) < 600000) {
    // const duration = moment(value).as('seconds');
    // r.duration = `${Math.round(duration)} seconds`
    formattedDuration = `${Math.floor(value/1000)} seconds`
  }
  //under 1 hour, show in minutes
  else if(parseInt(value) < 3600000){
    formattedDuration = `${Math.floor(value/1000/60)} minutes`
  }
  //show in hours
  else {
    // const duration = moment(value).as('minutes');
    // r.duration = `${Math.round(duration)} minutes`
    formattedDuration = `${Math.floor(value/1000/60/60)} hours`
  }

  if(isNaN(formattedDuration)){
    formattedDuration = "";
  }
  return (
    <div>{ formattedDuration }</div>
  )
}

const COLUMNS = [
  {
    accessor: "etl_context_id",
    Header: "ETL Context ID",
  },
  {
    accessor: "type",
    Header: "Type",
    Cell: ({value}) => {
      //Split off the ":initial"
      //replace hyphens with spaces
      //capitalize
      const formattedType = value.split(":")[0].replace("-"," ");
      return <div className="capitalize">{formattedType}</div>;
    }
  },
  {
    accessor: "source_name",
    Header: "Source Name",
    Cell: ({value}) => {
      return typeof value === 'string' ? value : "";
    }
  },
  { accessor: "created_at", Header: "Started", Cell: StartedAtCell },
  { accessor: "duration", Header: "Duration", Cell: DurationCell},
  { accessor: "etl_status", Header: "ETL Status" },
];

const INITIAL_PAGE_SIZE = 10;

const TaskList = (props) => {
  const { sourceId } = props;
  const { pgEnv, falcor, falcorCache, baseUrl } = React.useContext(DamaContext);

  const [pageIndex, setPageIndex] = React.useState(0);

  const indices = React.useMemo(() => {
    return d3range(pageIndex * INITIAL_PAGE_SIZE, pageIndex * INITIAL_PAGE_SIZE + INITIAL_PAGE_SIZE);
  }, [pageIndex, INITIAL_PAGE_SIZE]);


  const dataLengthPath = sourceId
    ? ["dama", pgEnv, "latest", "events", "for", "source", sourceId, "length"]
    : ["dama", pgEnv, "latest", "events", "length"];
    
  const dataFetchPath = sourceId
    ? [
        "dama",
        pgEnv,
        "latest",
        "events",
        "for",
        "source",
        sourceId,
        indices,
        ETL_CONTEXT_ATTRS,
      ]
    : ["dama", pgEnv, "latest", "events", indices, ETL_CONTEXT_ATTRS];

  //get length of data
  React.useEffect(() => {
    const getLength = async () => {
      await falcor.get(dataLengthPath);
    }
    getLength();
  }, [falcor, pgEnv]);

  const fetchLength = React.useMemo(() => {
    return get(falcorCache, dataLengthPath)
  },[falcor,falcorCache, pgEnv])

  //fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      await falcor
      .get(dataFetchPath)
      .then((data) => {
        //Removes indicies and attribute list
        const dataPath = dataFetchPath.slice(0, dataFetchPath.length-2);
        const sourceIds = Object.values(
          get(data, ["json", ...dataPath])
        )
          .map((etlContext) => etlContext.source_id)
          .filter((sourceId) => !!sourceId);

        return falcor.get([
          "dama",
          pgEnv,
          "sources",
          "byId",
          sourceIds,
          "attributes",
          "name",
        ]);
      });
    }

    fetchData();
  },  [falcor, pgEnv, indices])

  const parsedData = React.useMemo(() => {
    const dataPath = dataFetchPath.slice(0, dataFetchPath.length-2);
    return indices
      .map((i) => ({
        ...get(falcorCache, [...dataPath, i]),
      }))
      .map((r) => {
        if (r.source_id) {
          const sourceName = get(falcorCache, [
            "dama",
            pgEnv,
            "sources",
            "byId",
            r.source_id,
            "attributes",
            "name",
          ]);
          r.source_name = sourceName;
        }
        return r;
      })
      .filter((r) => Boolean(r.etl_context_id));
  }, [indices, falcorCache]);

  const navigate = useNavigate();
  const onRowClick = React.useCallback((e, row) => {
    if (e.ctrlKey) {
      window.open(`${baseUrl}/task/${ row.values.etl_context_id }`, "_blank");
    }
    else {
      navigate(`${baseUrl}/task/${ row.values.etl_context_id }`);
    }
  }, [navigate]);

  return (
      <Table
        data={parsedData}
        columns={COLUMNS}
        pageSize={INITIAL_PAGE_SIZE}
        manualPagination={true}
        numRecords={fetchLength}
        onPageChange={setPageIndex}
        manualCurrentPage={pageIndex}
        onRowClick={onRowClick}
        sortBy={"created_at"}
        sortOrder="desc"
        disableFilters
        disableSortBy
      />
  );
}
export default TaskList;
