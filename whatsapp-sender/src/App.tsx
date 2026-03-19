import { Routes, Route, Navigate } from 'react-router-dom';
import TemplatesPage from '@/pages/TemplatesPage';
import IndividualSendingPage from '@/pages/IndividualSendingPage';
import BulkSendingPage from '@/pages/BulkSendingPage';
import HistoryPage from '@/pages/HistoryPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/templates" replace />} />
      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="/individual" element={<IndividualSendingPage />} />
      <Route path="/bulk" element={<BulkSendingPage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  );
}

export default App;
