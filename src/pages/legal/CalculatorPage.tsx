import React from 'react';
import { DeadlineCalculator } from '@/components/legal';

export default function CalculatorPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calculateur de Délais Procéduraux</h1>
        <p className="text-gray-600">
          Calculez automatiquement les délais avec le calendrier sénégalais (jours fériés et jours ouvrables)
        </p>
      </div>
      <DeadlineCalculator />
    </div>
  );
}
