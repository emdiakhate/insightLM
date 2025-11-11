import React from 'react';
import { LiberteProvisoireGenerator } from '@/components/legal';

export default function GeneratorPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Générateur de Requête en Liberté Provisoire</h1>
        <p className="text-gray-600">
          Créez des requêtes professionnelles avec arguments juridiques générés par IA
        </p>
      </div>
      <LiberteProvisoireGenerator />
    </div>
  );
}
