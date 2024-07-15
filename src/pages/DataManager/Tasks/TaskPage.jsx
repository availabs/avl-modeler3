import React from "react"

import { useParams } from "react-router-dom"

import get from "lodash/get";
import { range as d3range } from "d3-array"
import { DamaContext } from "../store";

import { Table } from "../../../modules/avl-components/src";
import { TasksLayout } from "./components/TasksLayout";
function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

const DateCell = ({ value, ...props }) => {
  const myDate = new Date(value);

  return (
    <div>{ myDate.toLocaleString() }</div>
  )
}

const COLUMNS = [
  { accessor: "etl_context_id", Header: "ETL Context ID" },
  {
    accessor: "event_id",
    Header: "Event ID",
  },
  {
    accessor: "user_id",
    Header: "User ID",
  },
  { accessor: "created_at", Header: "Created At", Cell: DateCell },
  { accessor: "type", Header: "Type" },
  {
    accessor: "payload",
    Header: "Data",
    Cell: ({ value }) => {
      const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
      const displayValue = parsedValue?.data || parsedValue?.message;
      return <>{JSON.stringify(displayValue)}</>;
    },
  },
];
const INITIAL_PAGE_SIZE = 10;
const TaskPageComponent = props => {
  const { etl_context_id } = useParams();

  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);

  const [pageIndex, setPageIndex] = React.useState(0);

  const indices = React.useMemo(() => {
    return d3range(pageIndex * INITIAL_PAGE_SIZE, pageIndex * INITIAL_PAGE_SIZE + INITIAL_PAGE_SIZE);
  }, [pageIndex, INITIAL_PAGE_SIZE]);


  const EVENT_LENGTH_PATH = [
    "dama",
    pgEnv,
    "etlContexts",
    etl_context_id,
    "allEvents",
    "length",
  ];

  const generateAllEventsPath = (paramIndices) => ([
    "dama",
    pgEnv,
    "etlContexts",
    etl_context_id,
    "allEvents",
    paramIndices,
    ["event_id","etl_context_id", "created_at", "type", "payload"]
  ])

  //get length of data
  React.useEffect(() => {
    const getLength = async () => {
      await falcor.get(EVENT_LENGTH_PATH)
    }
    getLength();
  }, [falcor, pgEnv]);

  const fetchLength = React.useMemo(() => {
    return get(falcorCache, EVENT_LENGTH_PATH)
  },[falcor,falcorCache, pgEnv]);

  //fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      await falcor
        .get(generateAllEventsPath(indices)).then(resp => {
          const dataPath = generateAllEventsPath(indices);
          dataPath.pop(); //Removes `attr` from path
          dataPath.pop(); //Removes `indicies` from path
          const all_context_ids = Object.values(get(resp, ["json", ...dataPath])).map(event => event.etl_context_id).filter(id => !!id).filter(onlyUnique);
          const etlContextEventsPath = ["dama", pgEnv,'etlContexts','byEtlContextId'];
          
          all_context_ids.forEach(context_id => {
            falcor.get([...etlContextEventsPath, context_id])
          })
        })
    }

    fetchData();
  },  [falcor, pgEnv, indices])

  const parsedData = React.useMemo(() => {
    return indices.map(i => {
      const dataPath = generateAllEventsPath(i);

      dataPath.pop(); //Removes `attr` from path
      return {
        ...get(falcorCache, dataPath),
      };
    }).filter(r => Boolean(r.etl_context_id));

  }, [falcorCache, pgEnv, etl_context_id, indices])

  return (
    <TasksLayout>
      <Table
        data={parsedData}
        columns={COLUMNS}
        pageSize={INITIAL_PAGE_SIZE}
        manualPagination={true}
        numRecords={fetchLength}
        onPageChange={setPageIndex}
        sortBy={"created_at"}
        sortOrder="desc"
        disableFilters
        disableSortBy
      />
    </TasksLayout>
  );
}
export default TaskPageComponent;
