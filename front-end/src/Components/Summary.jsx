import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import React, { use, useEffect, useState } from "react";
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import LinearProgress from '@mui/material/LinearProgress';

export const SummaryBox = ({data, setData}) => {

    // const [data, setData] = useState();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const eventSource = new EventSource("http://localhost:9000/smartmeet/subscribe-summary");
    
        eventSource.onmessage = (event) => {
            // const jsonData = JSON.parse(event.data)
            // jsonData['actionItems'] = JSON.parse(jsonData['actionItems'])
            // console.log(event)
            // console.log("received " + jsonData['fileId'], jsonData['actionItems'])
            // // setEvents((prevEvents) => [...prevEvents, jsonData]);

            // setDataRows((prevData) => {
            //     const currentData = extractRows([jsonData])

            //     console.log("prevData", prevData, "currentData", currentData)

            //     return [
            //         ...prevData,
            //         ...currentData
            //     ]
            // })
            console.log("summary ", event.data)
            setData(event.data)
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
        if(data != undefined || data != null) {
            setLoading(false);
        }
    }, [data])


    return (
        <Box
            component="form"
            // sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
            noValidate
            autoComplete="off"
        >
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        {"Summary"}
                    </Typography>
                </Toolbar>
            </AppBar>
            <div>
                {loading == true && <LinearProgress />}
                <TextField
                    id="outlined-multiline-static"
                    // label="Multiline"
                    multiline
                    fullWidth
                    rows={5}
                    placeholder='Summary Text'
                    value={data}
                    onChange={e => {
                        console.log("value ", e.target.value)
                        setData(e.target.value)}}
                />
            </div>
        </Box>
    )

}