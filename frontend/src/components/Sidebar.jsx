import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 240;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItem = (label, path) => (
    <ListItemButton
      selected={location.pathname === path}
      onClick={() => navigate(path)}
    >
      <ListItemText primary={label} />
    </ListItemButton>
  );

  const externalItem = (label, href) => (
    <ListItemButton
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <ListItemText primary={label} />
    </ListItemButton>
  );

  return (
    <Drawer
      variant="permanent"
      className="app-sidebar"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          top: "64px",
          height: "calc(100% - 64px)",
          backgroundColor: "var(--steel-blue)",
          color: "#ffffff"
        }
      }}
    >
      <List disablePadding>
        {navItem("Overview", "/")}

        <Divider sx={{ backgroundColor: "rgba(255,255,255,0.25)" }} />

        {navItem("Summary", "/summary")}
        {navItem("Payer Analysis", "/payer-analysis")}
        {navItem("CPT Analysis", "/cpt-analysis")}
        {navItem("Claim Search", "/claim-search")}

        <Divider sx={{ backgroundColor: "rgba(255,255,255,0.25)" }} />

        {externalItem(
          "Sample Report (PDF)",
          "http://localhost:3002/api/reports/summary-pdf"
        )}
      </List>
    </Drawer>
  );
}

export default Sidebar;
