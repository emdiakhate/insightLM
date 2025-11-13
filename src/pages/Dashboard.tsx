import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import NotebookGrid from '@/components/dashboard/NotebookGrid';
import EmptyDashboard from '@/components/dashboard/EmptyDashboard';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Dashboard = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const { notebooks, isLoading, error, isError } = useNotebooks();
  const { t } = useLanguage();
  const hasNotebooks = notebooks && notebooks.length > 0;

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('initializing')}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show auth error if present
  if (authError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600">{t('authenticationError')}: {authError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show notebooks loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loadingNotebooks')}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show notebooks error if present
  if (isError && error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600">{t('error')}: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Mes Dossiers Juridiques
          </h1>
          <p className="text-gray-600">
            Gérez vos dossiers, ajoutez des pièces et interrogez vos documents avec l'IA
          </p>
        </div>

        {hasNotebooks ? <NotebookGrid /> : <EmptyDashboard />}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
