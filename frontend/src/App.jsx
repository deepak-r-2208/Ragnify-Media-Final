import DashboardPage from './pages/DashboardPage';
import './styles/tokens.css';
import './styles/global.css';

// No login/signup: this app has no auth layer. The backend treats every
// request as a single local user (see backend/app/security.py), so the
// dashboard renders immediately.
export default function App() {
  return <DashboardPage />;
}
