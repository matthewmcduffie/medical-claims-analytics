import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import Box from "@mui/material/Box";

function TopBar() {
  return (
    <AppBar
      position="fixed"
      className="app-header"
      elevation={1}
      sx={{ height: "64px" }}
    >
      <Toolbar sx={{ minHeight: "64px" }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Medical Claims Analytics
        </Typography>

        <Box>
          <IconButton
            color="inherit"
            href="https://github.com/matthewmcduffie/medical-claims-analytics"
            target="_blank"
          >
            <GitHubIcon />
          </IconButton>

          <IconButton
            color="inherit"
            href="https://www.linkedin.com/in/johnmcduffie/"
            target="_blank"
          >
            <LinkedInIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
