import "antd/dist/antd.css";
import React from "react";
import { QueryClient, QueryClientProvider } from 'react-query';
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Provider as LightGodwokenProvider } from "./contexts/LightGodwokenContext";
import RequestWithdrawal from "./views/RequestWithdrawal";
import Withdrawal from "./views/Withdrawal";
import Deposit from "./views/Deposit";
function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <LightGodwokenProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/v1/deposit" />} />
            <Route path=":version/" element={<Withdrawal />}></Route>
            <Route path=":version/request-withdrawal" element={<RequestWithdrawal />}></Route>
            <Route path=":version/deposit" element={<Deposit />}></Route>
          </Routes>
        </LightGodwokenProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
