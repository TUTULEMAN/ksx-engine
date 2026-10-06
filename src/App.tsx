import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import CompanyPage from './pages/CompanyPage';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import DealPage from './pages/DealPage';
import Documents from './pages/Documents';
import Landing from './pages/Landing';
import Outreach from './pages/Outreach';
import Pipeline from './pages/Pipeline';
import Settings from './pages/Settings';
import Sourcing from './pages/Sourcing';
import Tasks from './pages/Tasks';
import Valuation from './pages/Valuation';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="sourcing" element={<Sourcing />} />
        <Route path="companies/:id" element={<CompanyPage />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="deals/:id" element={<DealPage />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="outreach" element={<Outreach />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="valuation" element={<Valuation />} />
        <Route path="documents" element={<Documents />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
