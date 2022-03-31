import "antd/dist/antd.css";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Provider as LightGodwokenProvider } from "./contexts/LightGodwokenContext";
import LightGodwokenApp from "./views/LightGodwokenApp";
function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <LightGodwokenProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/v1" />}></Route>
            <Route path=":version/" element={<LightGodwokenApp />}></Route>
          </Routes>
        </LightGodwokenProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
