import React from 'react';
import { ProsecutorSimulation } from '@/components/legal';

export default function SimulationPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulation Mode Procureur</h1>
        <p className="text-gray-600">
          Entraînez-vous face à un procureur virtuel qui conteste vos arguments de manière adversariale
        </p>
      </div>
      <ProsecutorSimulation />
    </div>
  );
}
