import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { StringeeSDK } from "./components/components";
import "./App.css";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<StringeeSDK />} />
            </Routes>
        </Router>
    );
}

export default App;
