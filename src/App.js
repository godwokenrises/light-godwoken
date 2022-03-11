import "antd/dist/antd.css";
import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { Provider as LightGodwokenProvider } from "./contexts/LightGodwokenContext";
import RequestWithdrawal from "./views/RequestWithdrawal";
import Withdrawal from "./views/Withdrawal";
import Deposit from "./views/Deposit";
import V1 from "./v1";

function App() {
  return (
    <LightGodwokenProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Withdrawal />}></Route>
          <Route path="/request-withdrawal" element={<RequestWithdrawal />}></Route>
          <Route path="/deposit" element={<Deposit />}></Route>
          <Route path="/v1" element={<V1 />}></Route>
        </Routes>
      </Router>
    </LightGodwokenProvider>
  );
}

export default App;
