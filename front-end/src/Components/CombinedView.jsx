import React, { useEffect, useState } from "react";
import { ActionItemList } from "./ActionItemList";
import { SummaryBox } from "./Summary";
import { Button } from "@mui/material";
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';

export const CombinedView = () => {
    // const [dataRows, setDataRows] = useState([]);
    const [resetRows, setResetRows] = useState([]);
    const [summaryData, setSummaryData] = useState();

    const apiRef = useGridApiRef()

    // const handleRowDataChange = (rowData) => {
    //     setDataRows(rowData);
    // }

    const refactorData = (data) => {
        const updatedResult = []
        const fileId = data['fileId']

        data['actionItems'].forEach(p => {
            let chunkId = p['chunkId']
            let count = 0
            p['chunkItems'].forEach(i => {
                let temp = {
                    fileId: fileId,
                    id: chunkId,
                    rowId: fileId + "-" + chunkId + "-" + count,
                    ...i
                }
                count += 1;
                updatedResult.push(temp);
            })
        })

        return updatedResult;
    }

    const handleSummaryDataChange = (newData) => {
        setSummaryData(newData)
    }

    const handleSubmit = () => {
        let fileId = ''
        const chunksRequest = {}

        apiRef.current.getSortedRows().forEach(d => {
            fileId = d.fileId;
            if(chunksRequest[d.id] == undefined) {
                chunksRequest[d.id] = [{
                    issueType: d.issueType,
                    priority: d.priority,
                    summary: d.summary,
                    description: d.description,
                    assignee: d.assignee
                }]
            } else {
                chunksRequest[d.id].push({
                    issueType: d.issueType,
                    priority: d.priority,
                    summary: d.summary,
                    description: d.description,
                    assignee: d.assignee
                })
            }
        })

        const requestBody = {
            fileId: fileId,
            summary: summaryData,
            chunkTOs: []
        }

        for(var k in chunksRequest) {
            requestBody.chunkTOs.push({chunkId:k, chunkItems: chunksRequest[k]})
        }

        console.log("the request body is", requestBody);

        fetch('http://localhost:9000/smartmeet/submit/' + fileId, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                "Content-Type": "application/json", // Set content type to JSON
            }
        }).then(r => r.json()).then(r => {
            console.log("json response", r)

            const newData = refactorData(r)
            console.log("new data is", newData);
            setResetRows(newData)
        })
    }

    return (
        <div>
            <ActionItemList apiRef={apiRef} resetRows={resetRows} />

            <SummaryBox data={summaryData} setData={handleSummaryDataChange} />

            <div style={{float: "right", marginTop: "1em"}}>
            <Button onClick={handleSubmit}>
                Submit
            </Button>
            </div>
        </div>
    )

}