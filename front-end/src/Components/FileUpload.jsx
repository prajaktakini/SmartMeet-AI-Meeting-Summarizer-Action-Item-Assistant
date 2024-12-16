// import * as React from 'react';
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export const FileUpload = ({landingHandler}) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0])
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const formData = new FormData();

        formData.append("file", file)

        fetch('http://localhost:9000/smartmeet/generate-summary', {
            method: 'POST',
            body: formData
        })

        landingHandler(false);

    }

    return (
        <div>
            <Box sx={{ minWidth: 275 }}>
        <Card variant="outlined">
      
            
            <CardContent>
        <Typography variant="h5" component="div">
        Please upload the transcript file.
        </Typography>
        
        <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
            >
            Upload files
            <VisuallyHiddenInput
                type="file"
                onChange={handleFileChange}
            />
            </Button> 
            {file != null && <div>{file.name}</div>}
            
      </CardContent>
      <CardActions>
      <Button onClick={handleSubmit}>
                Submit
            </Button>
      </CardActions>
      </Card>

      </Box>
            
        </div>
    )
}