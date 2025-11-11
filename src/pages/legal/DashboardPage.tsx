import React from 'react';
import { LegalDashboard } from '@/components/legal';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Juridique Analytics</h1>
        <p className="text-gray-600">
          Visualisez vos statistiques : dossiers actifs, taux de réussite, échéances urgentes
        </p>
      </div>
      <LegalDashboard />
    </div>
  );
}
