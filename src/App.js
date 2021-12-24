import "antd/dist/antd.css";
import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { Provider as LightGodwokenProvider } from "./contexts/LightGodwokenContext";
import RequestWithdrawal from "./views/RequestWithdrawal";
import Withdrawal from "./views/Withdrawal";

function App() {
  return (
    <LightGodwokenProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Withdrawal />}></Route>
          <Route path="/request-withdrawal" element={<RequestWithdrawal />}></Route>
        </Routes>
      </Router>
    </LightGodwokenProvider>
  );
}

export default App;
