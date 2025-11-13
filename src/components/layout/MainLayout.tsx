import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FolderOpen,
  Calendar,
  FileText,
  Swords,
  BarChart3,
  BookOpen,
  Search,
  User,
  LogOut,
  Globe,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@/services/authService';
import { useLanguage } from '@/contexts/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Logo from '@/components/ui/Logo';

interface MainLayoutProps {
  children: React.ReactNode;
}

const NAVIGATION_ITEMS = [
  {
    id: 'dossiers',
    label: 'Mes Dossiers',
    icon: FolderOpen,
    path: '/',
    description: 'Gestion des dossiers',
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
    description: 'Entraînement',
  },
  {
    id: 'dashboard',
    label: 'Analytics',
    icon: BarChart3,
    path: '/legal/dashboard',
    description: 'Statistiques',
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: BookOpen,
    path: '/legal/templates',
    description: 'Modèles',
  },
  {
    id: 'jurisprudence',
    label: 'Jurisprudence',
    icon: Search,
    path: '/legal/jurisprudence',
    description: 'Recherche',
  },
];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useLogout();
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 h-16">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">LexAI Sénégal</h1>
              <p className="text-xs text-gray-500">Cabinet juridique</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {location.pathname === '/' && (
              <Button
                onClick={() => navigate('/notebook')}
                className="bg-slate-700 hover:bg-slate-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau dossier
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0">
                  <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} className="cursor-pointer">
                  <Globe className="h-4 w-4 mr-2" />
                  {language === 'fr' ? 'English' : 'Français'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Navigation
                </p>
                <div className="space-y-1">
                  {NAVIGATION_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link key={item.id} to={item.path}>
                        <div
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer text-sm',
                            isActive
                              ? 'bg-slate-100 text-slate-900 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5 flex-shrink-0',
                              isActive ? 'text-slate-700' : 'text-gray-400'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{item.label}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Info box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-900 mb-1">
                  Assistant Juridique IA
                </p>
                <p className="text-xs text-slate-600">
                  Spécialisé en droit sénégalais avec base juridique intégrée
                </p>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
