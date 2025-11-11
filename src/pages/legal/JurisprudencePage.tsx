import React from 'react';
import { JurisprudenceSearch } from '@/components/legal';

export default function JurisprudencePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recherche de Jurisprudence Sénégalaise</h1>
        <p className="text-gray-600">
          Recherchez dans la base de décisions des juridictions sénégalaises
        </p>
      </div>
      <JurisprudenceSearch />
    </div>
  );
}
