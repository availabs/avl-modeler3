export const addCalculatedColumn = ({sourceId, pgEnv, falcor, metadata, setMetadata, col}) => {
    const md = [...metadata, col];

    setMetadata(md);
    falcor.set({
        paths: [['dama', pgEnv, 'sources', 'byId', sourceId, 'attributes', "metadata"]], jsonGraph: {
            dama: {
                [pgEnv]: {
                    sources: {
                        byId: {
                            [sourceId]: {
                                attributes: {metadata: JSON.stringify(md)}
                            }
                        }
                    }
                }
            }
        }
    }).then(res => console.log("RES:", res))
}