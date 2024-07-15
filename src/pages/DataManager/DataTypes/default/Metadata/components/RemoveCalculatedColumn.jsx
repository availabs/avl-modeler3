import React from "react";
import {DamaContext} from "../../../../store/index.js";
import {Button} from "../../../../../../modules/avl-components/src";
import {removeCalculatedColumn} from "../utils/removeCalculatedColumn.js";


export const RemoveCalculatedColumn = ({
                                           col, // column name
                                           metadata, setMetadata,
                                           sourceId,
                              }) => {
    const {pgEnv, falcor} = React.useContext(DamaContext);

    return (
        <div className={'float-right'}>
            <Button themeOptions={{size: 'xs', color: 'cancel'}}
                    onClick={e =>
                        removeCalculatedColumn({
                            sourceId,
                            pgEnv,
                            falcor,
                            metadata,
                            setMetadata,
                            col
                        })}>
                <i className={'fad fa-trash p-2 pt-3 rounded'} />
            </Button>
        </div>
    )
}