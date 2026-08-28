import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Storefront from './pages/Storefront';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}

export default App;