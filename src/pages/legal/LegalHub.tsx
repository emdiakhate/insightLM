import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  Calendar,
  FileText,
  Swords,
  BarChart3,
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  Brain,
  Zap,
  Target,
} from 'lucide-react';

const FEATURES = [
  {
    id: 'calculator',
    title: 'Calculateur de Délais',
    description: 'Calculez automatiquement les délais procéduraux avec le calendrier sénégalais (jours fériés, jours ouvrables)',
    icon: Calendar,
    path: '/legal/calculator',
    color: 'from-blue-500 to-cyan-500',
    badge: 'Fonctionnel',
    badgeColor: 'bg-green-600',
    features: ['10 types de délais', 'Calendrier 2025', 'Références légales'],
  },
  {
    id: 'generator',
    title: 'Générateur de Documents',
    description: 'Créez des requêtes en liberté provisoire avec arguments juridiques générés par IA',
    icon: FileText,
    path: '/legal/generator',
    color: 'from-purple-500 to-pink-500',
    badge: 'IA',
    badgeColor: 'bg-purple-600',
    features: ['Arguments IA', 'Export TXT', 'Template professionnel'],
  },
  {
    id: 'simulation',
    title: 'Simulation Procureur',
    description: 'Entraînez-vous face à un procureur virtuel qui conteste vos arguments de manière adversariale',
    icon: Swords,
    path: '/legal/simulation',
    color: 'from-red-500 to-orange-500',
    badge: 'WOW',
    badgeColor: 'bg-red-600',
    features: ['IA adversariale', 'Démo réaliste', 'Préparation plaidoirie'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard Analytics',
    description: 'Visualisez vos statistiques : dossiers actifs, taux de réussite, échéances urgentes',
    icon: BarChart3,
    path: '/legal/dashboard',
    color: 'from-green-500 to-emerald-500',
    badge: 'Mockée',
    badgeColor: 'bg-amber-600',
    features: ['KPIs visuels', 'Graphiques', 'Timeline activité'],
  },
  {
    id: 'templates',
    title: 'Bibliothèque Templates',
    description: '10 modèles de documents juridiques (conclusions, assignations, contrats, etc.)',
    icon: BookOpen,
    path: '/legal/templates',
    color: 'from-teal-500 to-green-500',
    badge: '1 fonctionnel',
    badgeColor: 'bg-teal-600',
    features: ['10 templates', 'Pénal, Civil, Commercial', 'Export multiple'],
  },
  {
    id: 'jurisprudence',
    title: 'Recherche Jurisprudence',
    description: 'Recherchez dans la base de décisions des juridictions sénégalaises',
    icon: Search,
    path: '/legal/jurisprudence',
    color: 'from-indigo-500 to-purple-500',
    badge: 'Mockée',
    badgeColor: 'bg-indigo-600',
    features: ['8 décisions mockées', 'Scores pertinence', 'Références articles'],
  },
];

const STATS = [
  {
    label: 'Outils disponibles',
    value: '6',
    icon: Target,
    color: 'text-blue-600',
  },
  {
    label: 'Fonctionnalités IA',
    value: '3',
    icon: Brain,
    color: 'text-purple-600',
  },
  {
    label: 'Templates juridiques',
    value: '10',
    icon: FileText,
    color: 'text-green-600',
  },
  {
    label: 'Délais procéduraux',
    value: '10',
    icon: Calendar,
    color: 'text-orange-600',
  },
];

export default function LegalHub() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 md:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-10 w-10" />
            <Sparkles className="h-6 w-6 text-yellow-300" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bienvenue sur LexAI Sénégal
          </h1>
          <p className="text-xl text-indigo-100 mb-6 max-w-2xl">
            Votre assistant juridique intelligent, spécialisé dans le droit sénégalais.
            Accédez à une suite d'outils IA pour optimiser votre pratique juridique.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
              <Brain className="h-3 w-3 mr-1" />
              Powered by Claude 3.5 Sonnet
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
              <Zap className="h-3 w-3 mr-1" />
              Base juridique sénégalaise intégrée
            </Badge>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Outils Juridiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.id}
                className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-200 overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} transform group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge className={`${feature.badgeColor} text-white`}>
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to={feature.path}>
                    <Button className="w-full group-hover:bg-indigo-600 transition-colors">
                      Accéder
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info Section */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Assistant Juridique Intelligent
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                LexAI Sénégal combine l'intelligence artificielle avec une base de connaissances juridiques
                sénégalaises (Code Pénal, Code Civil, Code de Procédure Pénale, Code de la Famille, OHADA).
                L'IA analyse vos dossiers et fournit des recommandations basées sur la jurisprudence et la doctrine.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">
                  Code Pénal
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Procédure Pénale
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Code Civil
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Code de la Famille
                </Badge>
                <Badge variant="outline" className="bg-white">
                  OHADA
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Code du Travail
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
