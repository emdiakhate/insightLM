import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DeadlineCalculator } from '@/components/legal';

export default function CalculatorPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Calculateur de Délais Procéduraux</h1>
          <p className="text-gray-600">
            Calculez automatiquement les délais avec le calendrier sénégalais (jours fériés et jours ouvrables)
          </p>
        </div>
        <DeadlineCalculator />
      </div>
    </MainLayout>
  );
}
