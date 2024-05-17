import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Quote_page from './page/Quote_page';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Quote_page />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
