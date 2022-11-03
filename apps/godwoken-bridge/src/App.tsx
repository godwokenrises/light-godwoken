import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Provider as LightGodwokenProvider } from "./contexts/LightGodwokenContext";
import GodwokenBridge from "./views/GodwokenBridge";
import Deposit from "./views/Deposit";
import Withdrawal from "./views/withdrawal/Withdrawal";
import L1Transfer from "./views/L1Transfer";

function App() {
  const queryClient = new QueryClient();

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
              <Route path="transfer">
                <Route index element={<Navigate to="pending" />} />
                <Route path=":status" element={<L1Transfer />} />
              </Route>
            </Route>
          </Routes>
        </LightGodwokenProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
