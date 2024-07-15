import React from 'react';
import get from 'lodash/get';
import { DamaContext } from "../../../../../pages/DataManager/store";
//import {dmsDataTypes} from "../../../../../modules/dms/src"
import { Table } from "../../../../../modules/avl-components/src";


const getRank = col =>
    (col.display_name ? 1 : 0) + (col.description ? 1 : 0) ;
const sortFn = (a, b) => {
  return getRank(b) - getRank(a);
}
const MetadataTable = ({ source, ...props }) => {

  const { pgEnv, falcor, user } = React.useContext(DamaContext);
  const { authLevel } = user;
  const gridCols = "grid-cols-2" ;

  const sourceId = source.source_id;
  const [metadata, setMetadata] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(15);
  const Lexical = () => <div/>//dmsDataTypes.lexical.ViewComp;

  React.useEffect(() => {
    const md = JSON.parse(JSON.stringify(get(source, "metadata", [])));

    if (Array.isArray(md)) {
      setMetadata(md.sort(sortFn).map(d => ({
          display: "",
          ...d
        }))
      );
    }
    else if (md && "columns" in md) {
      const columns = get(md, "columns", []);
      if (Array.isArray(columns)) {
        setMetadata(columns.sort(sortFn).map(d => ({
            display: "",
            ...d
          }))
        );
      }
      else {
        setMetadata([]);
      }
    }
    else {
      setMetadata([]);
    };
  }, [source]);

  if (!metadata ||!metadata.map || metadata.length === 0) return <div> Metadata Not Available </div>

  const columns = ['column', 'description'].map(col => ({
    Header: col,
    accessor: col,
    align: 'left'
  }));

  const numCols = metadata?.length;

  const data = metadata
      .filter((col, i) => i < pageSize)
      .map(col => ({
    column: (
        <div className='pr-8 font-bold'>
          {get(col, 'display_name', get(col, 'name')) || 'No Name'}
          <span className={'italic pl-1 pt-3 pr-8 font-light'}>({get(col, 'type')})</span>
        </div>),
    description: get(col, ['desc', 'root']) ? <Lexical value={get(col, 'desc')} /> : <div className={'pl-6'}>{get(col, 'desc') || 'No Description'}</div>
  }));

  return (
      <>
          <Table
              columns={columns}
              data={data}
              pageSize={pageSize}
              striped={true}
          />
          {
            numCols > 15 ?
                <div className={'float-right text-blue-600 underline text-sm cursor-pointer'}
                     onClick={() => setPageSize(pageSize === 15 ? numCols : 15)}
                >{pageSize > 15 ? 'see less' : 'see more'}</div> : null
          }
          </>
  )
}

const Metadata = ({source, pageSize, ...props}) => {
  return (
    <div  className="w-full flex-1 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
      <div className='col-span-3'>
        <MetadataTable source={source} pageSize={pageSize}/>
      </div>

    </div>
  )
}

export default Metadata
