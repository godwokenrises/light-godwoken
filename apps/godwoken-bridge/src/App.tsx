import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Provider as LightGodwokenProvider } from "./contexts/LightGodwokenContext";
// import GodwokenBridge from "./views/GodwokenBridge";
// import Deposit from "./views/Deposit";
// import Withdrawal from "./views/withdrawal/Withdrawal";
// import L1Transfer from "./views/L1Transfer";
// import { ShowOnPhaseOut } from "./components/PhaseOut/ShowOnPhaseOut";
import { PageSuspended } from "./components/Layout/PageSuspended";

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <LightGodwokenProvider>
          <Routes>
            <Route  path="/" element={<PageSuspended />} />
            <Route path="*" element={<Navigate to="/" />} />
            {/*<Route path="/" element={<Navigate to="v1" />} />
            <Route path=":version/*" element={<GodwokenBridge />}>
              <Route
                index
                element={<ShowOnPhaseOut is={<Navigate to="withdrawal" />} not={<Navigate to="deposit" />} />}
              />
              <Route path="deposit">
                <Route index element={<Navigate to="pending" />} />
                <Route path=":status" element={<ShowOnPhaseOut is={<Navigate to="/" />} not={<Deposit />} />} />
              </Route>
              <Route path="withdrawal">
                <Route index element={<Navigate to="pending" />} />
                <Route path=":status" element={<Withdrawal />} />
              </Route>
              <Route path="transfer">
                <Route index element={<Navigate to="pending" />} />
                <Route path=":status" element={<L1Transfer />} />
              </Route>
            </Route>*/}
          </Routes>
        </LightGodwokenProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
