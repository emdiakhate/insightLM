import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Scale,
  Building2,
  Briefcase,
  FileCheck,
  Gavel,
  AlertTriangle,
  UserCheck,
  FileSignature,
  ScrollText,
  Sparkles,
  Clock,
} from 'lucide-react';

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: 'penal' | 'civil' | 'commercial' | 'travail';
  icon: React.ElementType;
  functional: boolean;
  route?: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'liberte_provisoire',
    name: 'Requête en Liberté Provisoire',
    description: 'Document automatisé avec arguments juridiques générés par IA',
    category: 'penal',
    icon: Scale,
    functional: true,
    route: '/generate-liberte-provisoire',
  },
  {
    id: 'conclusions_defense',
    name: 'Conclusions en Défense',
    description: 'Conclusions en défense pour affaires civiles',
    category: 'civil',
    icon: FileText,
    functional: false,
  },
  {
    id: 'assignation_civil',
    name: 'Assignation au Civil',
    description: 'Acte d\'assignation devant le tribunal civil',
    category: 'civil',
    icon: Gavel,
    functional: false,
  },
  {
    id: 'bail_commercial',
    name: 'Contrat de Bail Commercial',
    description: 'Modèle de bail commercial conforme OHADA',
    category: 'commercial',
    icon: Building2,
    functional: false,
  },
  {
    id: 'refere',
    name: 'Requête en Référé',
    description: 'Demande de mesure provisoire urgente',
    category: 'civil',
    icon: AlertTriangle,
    functional: false,
  },
  {
    id: 'memoire_appel',
    name: 'Mémoire d\'Appel',
    description: 'Mémoire en appel pénal ou civil',
    category: 'penal',
    icon: ScrollText,
    functional: false,
  },
  {
    id: 'partie_civile',
    name: 'Constitution de Partie Civile',
    description: 'Constitution de partie civile dans une affaire pénale',
    category: 'penal',
    icon: UserCheck,
    functional: false,
  },
  {
    id: 'demande_delais',
    name: 'Demande de Délais',
    description: 'Requête en prorogation de délai',
    category: 'civil',
    icon: Clock,
    functional: false,
  },
  {
    id: 'plainte_constitution',
    name: 'Plainte avec Constitution',
    description: 'Plainte pénale avec constitution de partie civile',
    category: 'penal',
    icon: FileCheck,
    functional: false,
  },
  {
    id: 'consultation_juridique',
    name: 'Consultation Juridique',
    description: 'Modèle d\'avis juridique écrit',
    category: 'commercial',
    icon: FileSignature,
    functional: false,
  },
];

const CATEGORY_LABELS = {
  penal: { label: 'Pénal', color: 'bg-red-100 text-red-700 border-red-300' },
  civil: { label: 'Civil', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  commercial: { label: 'Commercial', color: 'bg-green-100 text-green-700 border-green-300' },
  travail: { label: 'Travail', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
};

export function TemplateLibrary() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);

  const handleTemplateClick = (template: TemplateItem) => {
    if (template.functional) {
      // Pour l'instant, on affiche un message - en production, navigation vers route
      alert(`Navigation vers ${template.route}\n(À intégrer dans le routing principal)`);
    } else {
      setSelectedTemplate(template);
      setShowComingSoonDialog(true);
    }
  };

  const functionalCount = TEMPLATES.filter(t => t.functional).length;
  const mockCount = TEMPLATES.length - functionalCount;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Bibliothèque de Templates</h2>
            <p className="text-green-100">
              Modèles de documents juridiques prêts à l'emploi
            </p>
          </div>
          <Sparkles className="h-12 w-12 text-green-200" />
        </div>
        <div className="flex gap-3 mt-4">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {functionalCount} fonctionnel{functionalCount > 1 ? 's' : ''}
          </Badge>
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            {mockCount} bientôt disponibles
          </Badge>
        </div>
      </div>

      {/* Grille de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          const categoryStyle = CATEGORY_LABELS[template.category];

          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                template.functional
                  ? 'border-green-300 bg-green-50/30 hover:bg-green-50/50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleTemplateClick(template)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${template.functional ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-5 w-5 ${template.functional ? 'text-green-700' : 'text-gray-600'}`} />
                  </div>
                  <Badge variant="outline" className={categoryStyle.color}>
                    {categoryStyle.label}
                  </Badge>
                </div>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {template.functional ? (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300">
                      <Clock className="h-3 w-3 mr-1" />
                      Bientôt
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    {template.functional ? 'Utiliser' : 'Voir détails'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Statistiques par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Catégorie</CardTitle>
          <CardDescription>Distribution des templates disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(CATEGORY_LABELS).map(([key, { label, color }]) => {
              const count = TEMPLATES.filter(t => t.category === key).length;
              return (
                <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <Badge variant="outline" className={`${color} mt-2`}>
                    {label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Message info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-blue-700 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Templates évolutifs</p>
              <p className="text-xs text-blue-700 mt-1">
                Cette bibliothèque s'enrichira progressivement avec vos retours et besoins spécifiques.
                Les templates fonctionnels utilisent l'IA pour générer automatiquement les arguments juridiques adaptés à votre dossier.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog "Bientôt disponible" */}
      <Dialog open={showComingSoonDialog} onOpenChange={setShowComingSoonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Ce template sera bientôt disponible
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Description :</strong> {selectedTemplate?.description}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Catégorie :</strong>{' '}
                <Badge variant="outline" className={CATEGORY_LABELS[selectedTemplate?.category || 'civil'].color}>
                  {CATEGORY_LABELS[selectedTemplate?.category || 'civil'].label}
                </Badge>
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-900 font-medium mb-2">
                🚀 En développement
              </p>
              <p className="text-xs text-blue-700">
                Ce template fera partie des prochaines versions de LexAI Sénégal.
                Comme la "Requête en Liberté Provisoire", il intégrera :
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Génération automatique par IA</li>
                <li>Arguments juridiques contextualisés</li>
                <li>Références légales sénégalaises</li>
                <li>Export en format éditable</li>
              </ul>
            </div>
            <Button onClick={() => setShowComingSoonDialog(false)} className="w-full">
              Compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
