import React from "react"
import {Typography, Paper} from "@mui/material"

const HomePage: React.FC = () => {
  return (
    <Paper elevation={3} sx={{p: 4, maxWidth: "md", mx: "auto", bgcolor: "background.paper"}}>
      <Typography variant="h4" component="h2" sx={{fontWeight: "bold", color: "text.primary", mb: 3}}>
        Welcome to Approvio!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{mb: 2}}>
        This is the main application area. Your journey to streamlined approvals starts here.
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Navigate using the header or sidebar (once implemented) to explore features.
      </Typography>
    </Paper>
  )
}

export default HomePage
