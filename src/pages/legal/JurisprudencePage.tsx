import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { JurisprudenceSearch } from '@/components/legal';

export default function JurisprudencePage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Recherche de Jurisprudence Sénégalaise</h1>
          <p className="text-gray-600">
            Recherchez dans la base de décisions des juridictions sénégalaises
          </p>
        </div>
        <JurisprudenceSearch />
      </div>
    </MainLayout>
  );
}
