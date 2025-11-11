import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Scale,
  Calendar,
  BookOpen,
  TrendingUp,
  ExternalLink,
  Filter,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface CourtDecision {
  id: string;
  title: string;
  court: string;
  date: string;
  reference: string;
  summary: string;
  articles: string[];
  domain: string[];
  relevance: number;
  fullText?: string;
}

const MOCK_JURISPRUDENCE: CourtDecision[] = [
  {
    id: '1',
    title: 'Affaire Samba Diop c/ État du Sénégal - Responsabilité administrative',
    court: 'Cour Suprême du Sénégal',
    date: '15 juin 2024',
    reference: 'Arrêt n°45/2024',
    summary:
      'La Cour confirme la responsabilité de l\'État pour faute lourde dans la gestion des services publics. Dommages et intérêts accordés pour préjudice moral et matériel suite à une détention arbitraire de 18 mois.',
    articles: ['Art. 9 Constitution', 'Art. 1382 Code Civil', 'Art. 125 CPP'],
    domain: ['Droit Administratif', 'Libertés Publiques'],
    relevance: 95,
  },
  {
    id: '2',
    title: 'Succession Famille Fall - Partage successoral',
    court: 'Cour d\'Appel de Dakar',
    date: '3 mars 2024',
    reference: 'Arrêt n°128/2024 - 2ème Chambre Civile',
    summary:
      'Application du droit musulman dans le partage successoral. La Cour précise les modalités de calcul des parts héréditaires en présence d\'héritiers réservataires et de legs testamentaires.',
    articles: ['Code de la Famille - Livre IV', 'Art. 571 à 639'],
    domain: ['Droit de la Famille', 'Successions'],
    relevance: 88,
  },
  {
    id: '3',
    title: 'Procureur c/ Moussa Ba - Vol qualifié avec violence',
    court: 'Chambre Criminelle de Dakar',
    date: '12 janvier 2024',
    reference: 'Arrêt n°08/2024',
    summary:
      'Condamnation à 7 ans de réclusion criminelle pour vol qualifié avec violence en réunion. La Cour retient les circonstances aggravantes prévues à l\'article 380 du Code Pénal.',
    articles: ['Art. 379 Code Pénal', 'Art. 380 Code Pénal', 'Art. 51 CPP'],
    domain: ['Droit Pénal', 'Violences'],
    relevance: 92,
  },
  {
    id: '4',
    title: 'Employé SONATEL c/ SONATEL SA - Licenciement abusif',
    court: 'Tribunal du Travail de Dakar',
    date: '28 novembre 2023',
    reference: 'Jugement n°342/2023',
    summary:
      'Le licenciement est déclaré abusif en l\'absence de faute grave prouvée. Condamnation de l\'employeur au paiement de 18 mois de salaire à titre de dommages et intérêts.',
    articles: ['Code du Travail - Art. L.67', 'Convention Collective Nationale'],
    domain: ['Droit du Travail', 'Contrat de Travail'],
    relevance: 85,
  },
  {
    id: '5',
    title: 'CBAO c/ Société Import-Export Ndao - Recouvrement créances',
    court: 'Tribunal Régional de Commerce de Dakar',
    date: '5 septembre 2023',
    reference: 'Jugement n°215/2023 OHADA',
    summary:
      'Application de l\'Acte Uniforme OHADA sur les procédures collectives. Ordonnance de placement en liquidation judiciaire pour cessation de paiements caractérisée.',
    articles: ['AUPC OHADA - Art. 25', 'Art. 2 à 10 AUPC'],
    domain: ['Droit Commercial', 'OHADA', 'Faillites'],
    relevance: 78,
  },
  {
    id: '6',
    title: 'Affaire Ndèye Fatou Seck - Garde d\'enfants',
    court: 'Tribunal de Grande Instance de Thiès',
    date: '14 février 2024',
    reference: 'Jugement n°89/2024',
    summary:
      'La garde des enfants mineurs est confiée à la mère conformément à l\'intérêt supérieur de l\'enfant. Le père conserve un droit de visite et d\'hébergement un week-end sur deux.',
    articles: ['Code de la Famille - Art. 277', 'Art. 4 Convention Droits de l\'Enfant'],
    domain: ['Droit de la Famille', 'Autorité Parentale'],
    relevance: 82,
  },
  {
    id: '7',
    title: 'Procureur c/ Cheikh Ndiaye - Escroquerie en bande organisée',
    court: 'Tribunal de Grande Instance de Dakar',
    date: '19 octobre 2023',
    reference: 'Jugement n°412/2023',
    summary:
      'Condamnation à 5 ans d\'emprisonnement ferme et 10 millions FCFA d\'amende pour escroquerie en bande organisée via fausses promesses d\'investissement. Confiscation des avoirs.',
    articles: ['Art. 398 Code Pénal', 'Art. 399 Code Pénal', 'Loi Anti-Blanchiment 2018'],
    domain: ['Droit Pénal', 'Infractions Économiques'],
    relevance: 90,
  },
  {
    id: '8',
    title: 'Commune de Rufisque c/ Promoteur Immobilier - Permis de construire',
    court: 'Tribunal Administratif de Dakar',
    date: '7 juillet 2023',
    reference: 'Jugement n°156/2023',
    summary:
      'Annulation du permis de construire délivré en violation du Plan d\'Urbanisme. La Cour rappelle les obligations d\'alignement et de respect des normes environnementales.',
    articles: ['Code de l\'Urbanisme - Art. 15', 'Loi Environnement 2001'],
    domain: ['Droit Administratif', 'Urbanisme'],
    relevance: 75,
  },
];

export function JurisprudenceSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState(MOCK_JURISPRUDENCE);
  const [selectedDecision, setSelectedDecision] = useState<CourtDecision | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredResults(MOCK_JURISPRUDENCE);
      return;
    }

    // Simulation de recherche (en réalité, filtrage basique)
    const filtered = MOCK_JURISPRUDENCE.filter(
      (decision) =>
        decision.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        decision.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        decision.domain.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    setFilteredResults(filtered);
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 80) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (score >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Recherche de Jurisprudence</h2>
            <p className="text-indigo-100">
              Base de décisions des juridictions sénégalaises
            </p>
          </div>
          <Scale className="h-12 w-12 text-indigo-200" />
        </div>
        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
          <Sparkles className="h-3 w-3 mr-1" />
          {MOCK_JURISPRUDENCE.length} décisions mockées
        </Badge>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par mots-clés, juridiction, articles de loi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <AlertCircle className="h-3 w-3" />
            <span>
              Recherche mockée - En production, connexion à la base JADE (Jurisprudence Africaine et
              Décisions Essentielles)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Résultats trouvés</p>
                <p className="text-2xl font-bold">{filteredResults.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cour Suprême</p>
                <p className="text-2xl font-bold">
                  {filteredResults.filter((d) => d.court.includes('Cour Suprême')).length}
                </p>
              </div>
              <Scale className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Décisions 2024</p>
                <p className="text-2xl font-bold">
                  {filteredResults.filter((d) => d.date.includes('2024')).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pertinence moy.</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    filteredResults.reduce((acc, d) => acc + d.relevance, 0) /
                      filteredResults.length
                  )}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des résultats */}
      <div className="space-y-4">
        {filteredResults.map((decision) => (
          <Card
            key={decision.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedDecision(decision)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getRelevanceColor(decision.relevance)}>
                      {decision.relevance}% pertinent
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {decision.court}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mb-2">{decision.title}</CardTitle>
                  <CardDescription className="text-sm">{decision.summary}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {decision.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {decision.reference}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {decision.domain.map((domain, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-purple-50 border-purple-200">
                      {domain}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {decision.articles.map((article, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                      📖 {article}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button variant="ghost" size="sm">
                    Voir le détail
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredResults.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
              <p className="text-sm text-gray-600">
                Essayez avec d'autres mots-clés ou consultez toutes les décisions disponibles.
              </p>
              <Button onClick={() => setFilteredResults(MOCK_JURISPRUDENCE)} className="mt-4">
                Réinitialiser la recherche
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message informatif */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-indigo-700 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-indigo-900">Base de jurisprudence évolutive</p>
              <p className="text-xs text-indigo-700 mt-1">
                Ces décisions sont mockées pour la démo. En production, LexAI Sénégal sera connecté aux
                bases officielles (JADE, archives nationales) et actualisé en temps réel avec les
                nouvelles décisions des juridictions sénégalaises.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
