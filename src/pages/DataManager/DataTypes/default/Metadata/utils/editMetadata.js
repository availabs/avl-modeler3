export const editMetadata = async ({sourceId, pgEnv, falcor, metadata, setMetadata, col, value}) => {
    // value = {meta-attr: meta-value}
    const md = metadata.map(d => {
        if (d.name === col) {
            return {
                ...d, ...value
            }
        } else {
            return d;
        }
    })

    await setMetadata(md);

    // await falcor.set({
    //     paths: [['dama', pgEnv, 'sources', 'byId', sourceId, 'attributes', "metadata"]], jsonGraph: {
    //         dama: {
    //             [pgEnv]: {
    //                 sources: {
    //                     byId: {
    //                         [sourceId]: {
    //                             attributes: { metadata: { columns:JSON.stringify(md) } }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // })
    await falcor.call(
      ["dama", "sources", "metadata", "update"],
      [pgEnv, sourceId, { columns: md }]
    )
}
