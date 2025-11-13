import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, FileCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  avocatNom: string;
  avocatBarreau: string;
  clientNom: string;
  clientAge: string;
  lieuDetention: string;
  dateDetention: string;
  infraction: string;
  contexte: string;
}

const TEMPLATE_BASE = `RÉPUBLIQUE DU SÉNÉGAL
Un Peuple - Un But - Une Foi
───────────────────────────

TRIBUNAL DE GRANDE INSTANCE DE DAKAR
Cabinet du Juge d'Instruction

REQUÊTE EN LIBERTÉ PROVISOIRE

Je soussigné(e), Maître {avocatNom},
Avocat au Barreau de {avocatBarreau},
Cabinet sis à Dakar,

Agissant pour le compte de Monsieur/Madame {clientNom}, {clientAge} ans,
Actuellement en détention provisoire à {lieuDetention} depuis le {dateDetention},
Dans le cadre de la procédure n° [À COMPLÉTER] / [ANNÉE],
Chef de poursuite : {infraction}

AI L'HONNEUR DE SOLLICITER de Monsieur le Juge d'Instruction :

LA MISE EN LIBERTÉ PROVISOIRE de mon client, conformément aux dispositions de l'article 125 du Code de Procédure Pénale sénégalais.

═══════════════════════════════════════════════════════════════

EN FAIT :

{contexte}

═══════════════════════════════════════════════════════════════

EN DROIT :

{arguments_juridiques}

═══════════════════════════════════════════════════════════════

PAR CES MOTIFS :

Vu les articles 125 et suivants du Code de Procédure Pénale sénégalais,
Vu les pièces du dossier,

Plaît à Monsieur le Juge d'Instruction d'ordonner :

- LA MISE EN LIBERTÉ PROVISOIRE de Monsieur/Madame {clientNom},
- ASSORTIE, le cas échéant, du contrôle judiciaire prévu par la loi,
- SOUS CAUTION si vous l'estimez nécessaire.

Et faire JUSTICE.

Fait à Dakar, le {date_today}

Pour Monsieur/Madame {clientNom}
Maître {avocatNom}
Avocat au Barreau de {avocatBarreau}`;

export function LiberteProvisoireGenerator({ notebookId }: { notebookId?: string }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    avocatNom: '',
    avocatBarreau: 'Dakar',
    clientNom: '',
    clientAge: '',
    lieuDetention: 'Maison d\'Arrêt et de Correction de Rebeuss',
    dateDetention: '',
    infraction: '',
    contexte: '',
  });
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateArguments = async (): Promise<string> => {
    if (!notebookId) {
      return `L'article 125 du Code de Procédure Pénale sénégalais prévoit expressément que toute personne mise en examen peut demander sa mise en liberté provisoire à tout moment de l'instruction.

En l'espèce, plusieurs éléments militent en faveur de cette demande :

1. PRÉSOMPTION D'INNOCENCE (Art. 7 de la Constitution)
Mon client bénéficie de la présomption d'innocence. Sa détention provisoire ne saurait anticiper une condamnation qui n'a pas encore été prononcée.

2. DURÉE DE LA DÉTENTION
Mon client est détenu depuis le ${formData.dateDetention}, soit une durée déjà significative au regard de la nature des faits reprochés. L'article 137 du Code de Procédure Pénale fixe des durées maximales qu'il convient de respecter.

3. GARANTIES DE REPRÉSENTATION
Mon client présente toutes les garanties de représentation :
   - Domicile fixe et connu au Sénégal
   - Attaches familiales solides
   - Activité professionnelle régulière
   - Absence d'antécédents judiciaires [SI APPLICABLE]

4. ABSENCE DE RISQUES
   - Aucun risque de fuite : mon client est domicilié au Sénégal
   - Aucun risque de pression sur les témoins
   - Aucun risque de renouvellement de l'infraction

5. PROPORTIONNALITÉ
La détention provisoire doit rester une mesure exceptionnelle et proportionnée. En l'espèce, elle pourrait être avantageusement remplacée par un contrôle judiciaire.

Le maintien en détention de mon client apparaît donc comme une mesure disproportionnée au regard des faits reprochés et des garanties offertes.`;
    }

    // Appeler l'IA pour générer des arguments basés sur le contexte du dossier
    try {
      const { data, error } = await supabase.functions.invoke('send-legal-chat-message', {
        body: {
          session_id: notebookId,
          message: `En tant qu'avocat sénégalais, génère des arguments juridiques solides pour une requête en liberté provisoire dans le contexte suivant :

Infraction : ${formData.infraction}
Contexte : ${formData.contexte}
Durée de détention : depuis le ${formData.dateDetention}

Fournis 5-7 arguments juridiques précis avec références aux articles du Code de Procédure Pénale sénégalais et à la jurisprudence si pertinent. Structure les arguments de manière claire et professionnelle.`,
          user_id: 'system',
        },
      });

      if (error) throw error;

      // Extraire le texte de la réponse
      const aiResponse = data?.data?.content?.segments?.[0]?.text || '';
      return aiResponse || generateArguments(); // Fallback sur arguments par défaut
    } catch (error) {
      console.error('Erreur génération arguments IA:', error);
      // Fallback sur arguments par défaut
      return generateArguments();
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.avocatNom || !formData.clientNom || !formData.dateDetention) {
      toast({
        title: 'Informations manquantes',
        description: 'Veuillez remplir au minimum : Nom avocat, Nom client, Date détention',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Générer les arguments juridiques
      const arguments = await generateArguments();

      // Remplir le template
      const today = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      let document = TEMPLATE_BASE
        .replace(/{avocatNom}/g, formData.avocatNom)
        .replace(/{avocatBarreau}/g, formData.avocatBarreau)
        .replace(/{clientNom}/g, formData.clientNom)
        .replace(/{clientAge}/g, formData.clientAge)
        .replace(/{lieuDetention}/g, formData.lieuDetention)
        .replace(/{dateDetention}/g, formData.dateDetention)
        .replace(/{infraction}/g, formData.infraction)
        .replace(/{contexte}/g, formData.contexte)
        .replace(/{arguments_juridiques}/g, arguments)
        .replace(/{date_today}/g, today);

      setGeneratedDocument(document);

      toast({
        title: 'Document généré !',
        description: 'Votre requête en liberté provisoire est prête.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le document. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Requete_Liberte_Provisoire_${formData.clientNom.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Téléchargement lancé',
      description: 'Le document a été téléchargé avec succès.',
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDocument);
    toast({
      title: 'Copié !',
      description: 'Le document a été copié dans le presse-papiers.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-700" />
            <CardTitle>Générateur de Requête en Liberté Provisoire</CardTitle>
          </div>
          <CardDescription>
            Générez automatiquement une requête conforme à la procédure pénale sénégalaise (Art. 125 CPP)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulaire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avocat-nom">Nom de l'avocat *</Label>
              <Input
                id="avocat-nom"
                placeholder="Ex: Fatou DIOP"
                value={formData.avocatNom}
                onChange={(e) => handleInputChange('avocatNom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avocat-barreau">Barreau</Label>
              <Input
                id="avocat-barreau"
                placeholder="Ex: Dakar"
                value={formData.avocatBarreau}
                onChange={(e) => handleInputChange('avocatBarreau', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-nom">Nom du client *</Label>
              <Input
                id="client-nom"
                placeholder="Ex: Mamadou FALL"
                value={formData.clientNom}
                onChange={(e) => handleInputChange('clientNom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-age">Âge du client</Label>
              <Input
                id="client-age"
                type="number"
                placeholder="Ex: 35"
                value={formData.clientAge}
                onChange={(e) => handleInputChange('clientAge', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lieu-detention">Lieu de détention</Label>
              <Input
                id="lieu-detention"
                placeholder="Ex: MAC de Rebeuss"
                value={formData.lieuDetention}
                onChange={(e) => handleInputChange('lieuDetention', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-detention">Date de mise en détention *</Label>
              <Input
                id="date-detention"
                type="date"
                value={formData.dateDetention}
                onChange={(e) => handleInputChange('dateDetention', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="infraction">Chef de poursuite / Infraction</Label>
            <Input
              id="infraction"
              placeholder="Ex: Vol simple (Art. 379 Code Pénal)"
              value={formData.infraction}
              onChange={(e) => handleInputChange('infraction', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contexte">Contexte factuel (résumé des faits)</Label>
            <Textarea
              id="contexte"
              placeholder="Résumez brièvement les circonstances de l'affaire, les faits reprochés, et tout élément pertinent pour la demande de liberté provisoire..."
              rows={4}
              value={formData.contexte}
              onChange={(e) => handleInputChange('contexte', e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours avec IA...
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Générer la requête
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Document généré */}
      {generatedDocument && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Document généré</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" size="sm">
                  Copier
                </Button>
                <Button onClick={handleDownload} size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                {generatedDocument}
              </pre>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              <strong>⚠️ Important :</strong> Ce document est généré automatiquement. Veuillez le relire attentivement et l'adapter selon les spécificités de votre dossier avant de le déposer au tribunal.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
