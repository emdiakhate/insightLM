import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, FileText, Clock, Award, AlertCircle, Calendar } from 'lucide-react';

// Données mockées mais réalistes
const MOCK_STATS = {
  totalCases: 47,
  activeCases: 12,
  closedCases: 35,
  successRate: 78,
  avgDuration: 45, // jours
  pendingDeadlines: 3,
};

const MOCK_CASES_BY_TYPE = [
  { type: 'Pénal', count: 18, color: 'bg-red-500' },
  { type: 'Civil', count: 15, color: 'bg-blue-500' },
  { type: 'Commercial', count: 8, color: 'bg-green-500' },
  { type: 'Travail', count: 6, color: 'bg-yellow-500' },
];

const MOCK_UPCOMING_DEADLINES = [
  { case: 'Affaire Ndao - Vol simple', type: 'Appel pénal', daysLeft: 3, urgent: true },
  { case: 'Affaire Diallo vs SONATEL', type: 'Conclusions', daysLeft: 7, urgent: false },
  { case: 'Succession Famille Fall', type: 'Dépôt mémoire', daysLeft: 14, urgent: false },
];

const MOCK_RECENT_ACTIVITY = [
  { action: 'Requête liberté provisoire générée', case: 'Affaire Sarr', time: 'Il y a 2h' },
  { action: 'Simulation procureur complétée', case: 'Affaire Ndiaye', time: 'Il y a 5h' },
  { action: 'Nouveau dossier créé', case: 'Affaire Ba - Escroquerie', time: 'Hier' },
];

export function LegalDashboard() {
  const maxCases = Math.max(...MOCK_CASES_BY_TYPE.map(c => c.count));

  return (
    <div className="space-y-6">
      {/* En-tête avec message */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Tableau de Bord Juridique</h2>
        <p className="text-blue-100">
          Vue d'ensemble de votre activité professionnelle
        </p>
        <Badge variant="secondary" className="mt-3 bg-white/20 text-white border-white/30">
          Données mockées - Démo
        </Badge>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Dossiers Total</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{MOCK_STATS.totalCases}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Dossiers Actifs</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{MOCK_STATS.activeCases}</div>
            <p className="text-xs text-gray-500 mt-1">{MOCK_STATS.closedCases} clôturés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Taux de Réussite</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{MOCK_STATS.successRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Décisions favorables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Durée Moyenne</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{MOCK_STATS.avgDuration}j</div>
            <p className="text-xs text-gray-500 mt-1">Par dossier</p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par type */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des Dossiers par Type</CardTitle>
          <CardDescription>Distribution de votre activité juridique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {MOCK_CASES_BY_TYPE.map((item) => {
            const percentage = (item.count / maxCases) * 100;
            return (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{item.type}</span>
                  <span className="text-sm text-gray-600">{item.count} dossiers</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Échéances urgentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle>Échéances Urgentes</CardTitle>
            </div>
            <CardDescription>{MOCK_STATS.pendingDeadlines} délais à respecter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_UPCOMING_DEADLINES.map((deadline, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  deadline.urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{deadline.case}</p>
                    <p className="text-xs text-gray-600 mt-1">{deadline.type}</p>
                  </div>
                  <Badge
                    variant={deadline.urgent ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {deadline.daysLeft}j
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>Dernières actions dans l'application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_RECENT_ACTIVITY.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.case}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Message informatif */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-700 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Données de démonstration</p>
              <p className="text-xs text-blue-700 mt-1">
                Ces statistiques sont mockées pour la démo. En production, elles seront calculées en temps réel à partir de vos vrais dossiers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
