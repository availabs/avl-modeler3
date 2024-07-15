import React from 'react';
import {MetadataTable} from "./components/MetadataTable.jsx";

const Advanced = ({source, views, ...props}) => {
    return (
        <div className="w-full flex-1 sm:px-6 divide-y-4 grid gap-y-6 ">
            <MetadataTable source={source} colOrigin={undefined}/>
            <MetadataTable source={source} colOrigin={'calculated-column'}/>
        </div>
    )
}

export default Advanced
