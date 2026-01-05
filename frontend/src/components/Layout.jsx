import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

function Layout({ children }) {
  return (
    <>
      <TopBar />
      <div className="app-root">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  );
}

export default Layout;
