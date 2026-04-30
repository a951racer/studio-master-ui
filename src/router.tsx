import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import LookupListPage from './pages/Admin/LookupListPage';
import ClientListPage from './pages/Clients/ClientListPage';
import ClientDetailPage from './pages/Clients/ClientDetailPage';
import ClientFormPage from './pages/Clients/ClientFormPage';
import PersonFormPage from './pages/Persons/PersonFormPage';
import PersonListPage from './pages/Persons/PersonListPage';
import ProjectListPage from './pages/Projects/ProjectListPage';
import ProjectDetailPage from './pages/Projects/ProjectDetailPage';
import ProjectFormPage from './pages/Projects/ProjectFormPage';
import SongListPage from './pages/Songs/SongListPage';
import SongFormPage from './pages/Songs/SongFormPage';
import SongDetailPage from './pages/Songs/SongDetailPage';
import DashboardPage from './pages/Dashboard/DashboardPage';

// ---------------------------------------------------------------------------
// Router definition
// ---------------------------------------------------------------------------

const router = createBrowserRouter([
  // Public route — no auth required
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // Protected routes — wrapped in ProtectedRoute + Layout
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          // Dashboard
          { index: true, element: <DashboardPage /> },

          // Clients
          { path: 'clients', element: <ClientListPage /> },
          { path: 'clients/new', element: <ClientFormPage /> },
          { path: 'clients/:id', element: <ClientDetailPage /> },
          { path: 'clients/:id/edit', element: <ClientFormPage /> },

          // Persons
          { path: 'persons', element: <PersonListPage /> },
          { path: 'persons/new', element: <PersonFormPage /> },
          { path: 'persons/:id/edit', element: <PersonFormPage /> },

          // Projects
          { path: 'projects', element: <ProjectListPage /> },
          { path: 'projects/new', element: <ProjectFormPage /> },
          { path: 'projects/:id', element: <ProjectDetailPage /> },
          { path: 'projects/:id/edit', element: <ProjectFormPage /> },

          // Songs (nested under projects for list/create, top-level for detail/edit)
          { path: 'projects/:id/songs', element: <SongListPage /> },
          { path: 'projects/:id/songs/new', element: <SongFormPage /> },
          { path: 'songs/:id', element: <SongDetailPage /> },
          { path: 'songs/:id/edit', element: <SongFormPage /> },

          // Admin
          { path: 'admin', element: <LookupListPage /> },
        ],
      },
    ],
  },
]);

export default router;
