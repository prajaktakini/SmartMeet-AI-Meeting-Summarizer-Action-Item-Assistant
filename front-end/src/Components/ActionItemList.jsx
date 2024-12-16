import React, { useEffect, useState } from "react";
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import { Button } from "@mui/material";
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';

const columns = [
    { field: 'summary', headerName: 'Summary', width: 150, editable: true },
  { field: 'description', headerName: 'Description', width: 150, editable: true },
  { field: 'assignee', headerName: 'Assignee', width: 150, editable: true },
  { field: 'priority', headerName: 'Priority', width: 150, editable: true, type: 'singleSelect',  valueOptions: [ 'Highest', 'High', 'Medium', 'Low', 'Lowest'] },
  {field: 'jiraIssueUrl', headerName: "JIRA URL", width: 150},
  { field: 'issueType', headerName: 'Issue Type', width: 150, editable: true, type: 'singleSelect',  valueOptions: [ 'Epic', 'Task', 'Subtask', 'Bug', 'Story'] },
  { field: 'id', headerName: 'id', width: 150},
  {field: 'fileId', headerName: 'file id', width: 150},
];

const columnVisibilityModel={
    id: false,
    fileId: false,
}

const mockEvent = [{
    id: 'id1',
    fileId: 'fileId',
    actionItems: [{"issueType": "Bug", "assignee": "John Doe", "priority": "High", "description":"Description", "summary": "Summary"}]
},
{
    id: 'id2',
    fileId: 'fileId2',
    actionItems: [
        {"issueType": "Task", "assignee": "John Doe", "priority": "High", "description":"Description", "summary": "Summary"},
        {"issueType": "Subtask", "assignee": "John Doe", "priority": "High", "description":"Description", "summary": "Summary"}
    ]
}]

const extractRows = (eventData) => {
    const extractedRows = []

    eventData.forEach(e => {
        let count = 0
        e.actionItems.forEach(f => {
            extractedRows.push({
                fileId: e.fileId,
                id: e.id,
                rowId: e.fileId + "-" + e.id + "-" + count,
                ...f
            })
            count += 1;
        })
    })

    return extractedRows
}

export const ActionItemList = ({apiRef, resetRows}) => {
    // const [events, setEvents] = useState();
    const [dataRows, setDataRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const eventSource = new EventSource("http://localhost:9000/smartmeet/subscribe");
    
        eventSource.onmessage = (event) => {
            const jsonData = JSON.parse(event.data)
            jsonData['actionItems'] = JSON.parse(jsonData['actionItems'])
            console.log(event)
            console.log("received " + jsonData['fileId'], jsonData['actionItems'])
            // setEvents((prevEvents) => [...prevEvents, jsonData]);

            setDataRows((prevData) => {
                const currentData = extractRows([jsonData])

                console.log("prevData", prevData, "currentData", currentData)

                return [
                    ...prevData,
                    ...currentData
                ]
            })
            
            // const currentData = extractRows([jsonData])

            // setDataRows([...dataRows, ...currentData])
        };
    
        eventSource.onerror = (error) => {
          console.error("EventSource failed:", error);
        //   eventSource.close();
        };
    
        return () => {
          eventSource.close(); // Clean up on unmount
        };
        }, 
    []);

    useEffect(() => {
        setDataRows(resetRows);
    }, [resetRows])

    useEffect(() => {
        if(dataRows.length > 0) {
            setLoading(false)
        }
    }, [dataRows])



    // useEffect(() => {
    //     const timeout = setTimeout(() => {
    //         setDataRows(extractRows(mockEvent));
    //     }, 3000); // Change state after 3 seconds
    
    //     // Cleanup to avoid memory leaks if the component unmounts
    //     return () => clearTimeout(timeout);
    //   }, 
    // []);

    return (
        <div style={{width: "60vw", height: '450px'}}>
            <Box component="section" sx={{width: '100%'}}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        {"Action Items"}
                    </Typography>
                </Toolbar>
            </AppBar>
            <DataGrid 
                sx={{height: '100%'}}
                apiRef={apiRef} 
                onProcessRowUpdateError={e => console.log("error", e)} 
                processRowUpdate={(updatedRow, _) => { return updatedRow }} 
                getRowId={r => r.rowId} 
                disableColumnSelector 
                columnVisibilityModel={columnVisibilityModel} 
                rows={dataRows} 
                columns={columns}
                loading={loading}
                
                slotProps={{
                    loadingOverlay: {
                      variant: 'linear-progress',
                      noRowsVariant: 'linear-progress',
                    },
                }}
            />
            </Box>
        </div>
    )
    
}