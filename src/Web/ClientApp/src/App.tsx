import { useRoutes } from 'react-router-dom';
import appRoutes from './AppRoutes';
import { Layout } from './components/Layout';
import { AuthProvider } from './components/api-authorization/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';

export default function App() {
  const routes = useRoutes(appRoutes);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>{routes}</Layout>
      </AuthProvider>
    </ThemeProvider>
  );
}
