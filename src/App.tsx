import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Page from "./components/Layout/Page";
import PageFooter from "./components/Layout/PageFooter";
import PageHeader from "./components/Layout/PageHeader";
import { Provider as LightGodwokenProvider } from "./contexts/LightGodwokenContext";
import LightGodwokenApp from "./views/LightGodwokenApp";

function App() {
  const queryClient = new QueryClient();
  const [activeView, setActiveView] = useState<string>("deposit");
  const handleViewChange = (view: string) => {
    setActiveView(view);
  };
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <LightGodwokenProvider>
          <Routes>
            <Route path="/" element={<Navigate to="v1" />} />
            <Route path=":version/*" element={<GodwokenBridge />}>
              <Route index element={<Navigate to="deposit" />} />
              <Route path="deposit">
                <Route index element={<Navigate to="pending" />} />
                <Route path=":status" element={<Deposit />} />
              </Route>
              <Route path="withdrawal">
                <Route index element={<Navigate to="pending" />} />
                <Route path=":status" element={<Withdrawal />} />
              </Route>
            </Route>
          </Routes>
        </LightGodwokenProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
