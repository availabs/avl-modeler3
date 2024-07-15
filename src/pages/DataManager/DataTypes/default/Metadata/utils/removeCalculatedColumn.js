export const removeCalculatedColumn = ({sourceId, pgEnv, falcor, metadata, setMetadata, col}) => {
    const md = metadata.filter(md => md.name !== col);

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