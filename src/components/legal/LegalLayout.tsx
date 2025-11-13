import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Scale,
  Calendar,
  FileText,
  Swords,
  BarChart3,
  BookOpen,
  Search,
  Home,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalLayoutProps {
  children: React.ReactNode;
}

const NAVIGATION_ITEMS = [
  {
    id: 'hub',
    label: 'Accueil Juridique',
    icon: Home,
    path: '/legal',
    description: 'Vue d\'ensemble des outils',
  },
  {
    id: 'calculator',
    label: 'Calculateur de Délais',
    icon: Calendar,
    path: '/legal/calculator',
    description: 'Délais procéduraux',
  },
  {
    id: 'generator',
    label: 'Générateur de Documents',
    icon: FileText,
    path: '/legal/generator',
    description: 'Liberté provisoire',
  },
  {
    id: 'simulation',
    label: 'Simulation Procureur',
    icon: Swords,
    path: '/legal/simulation',
    description: 'Entraînement adversarial',
  },
  {
    id: 'dashboard',
    label: 'Dashboard Analytics',
    icon: BarChart3,
    path: '/legal/dashboard',
    description: 'Statistiques et KPIs',
  },
  {
    id: 'templates',
    label: 'Bibliothèque Templates',
    icon: BookOpen,
    path: '/legal/templates',
    description: '10 modèles juridiques',
  },
  {
    id: 'jurisprudence',
    label: 'Jurisprudence',
    icon: Search,
    path: '/legal/jurisprudence',
    description: 'Décisions juridiques',
  },
];

export function LegalLayout({ children }: LegalLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Retour aux dossiers
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-900">LexAI Sénégal</h1>
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Outils Juridiques IA
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <ScrollArea className="h-[calc(100vh-73px)]">
            <div className="p-4 space-y-2">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link key={item.id} to={item.path}>
                    <div
                      className={cn(
                        'flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 mt-0.5 flex-shrink-0',
                          isActive ? 'text-indigo-600' : 'text-gray-500'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-medium', isActive && 'font-semibold')}>
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Separator className="my-4" />

            {/* Info box */}
            <div className="p-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-indigo-900">
                      Assistant Juridique IA
                    </p>
                    <p className="text-xs text-indigo-700 mt-1">
                      Spécialisé pour le droit sénégalais
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
