import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TemplateLibrary } from '@/components/legal';

export default function TemplatesPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Bibliothèque de Templates Juridiques</h1>
          <p className="text-gray-600">
            Accédez à 10 modèles de documents juridiques prêts à l'emploi
          </p>
        </div>
        <TemplateLibrary />
      </div>
    </MainLayout>
  );
}
