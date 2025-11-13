import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LegalDashboard } from '@/components/legal';

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Analytics Juridique</h1>
          <p className="text-gray-600">
            Visualisez vos statistiques : dossiers actifs, taux de réussite, échéances urgentes
          </p>
        </div>
        <LegalDashboard />
      </div>
    </MainLayout>
  );
}
