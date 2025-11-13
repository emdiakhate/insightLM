import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Scale, Swords, Loader2, AlertTriangle, Sparkles, FileText, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'avocat' | 'procureur' | 'system';
  content: string;
  timestamp: Date;
}

// Messages de démo pré-scriptés
const DEMO_EXCHANGES = [
  {
    avocat: "Monsieur le Procureur, mon client nie formellement les faits qui lui sont reprochés. Il bénéficie de la présomption d'innocence.",
    procureur: "Maître, la présomption d'innocence n'efface pas les charges qui pèsent sur votre client. Les témoignages concordants et les éléments matériels recueillis établissent sa présence sur les lieux au moment des faits.",
  },
  {
    avocat: "Les témoignages sont contradictoires sur l'identification formelle de mon client. De plus, aucune preuve matérielle directe ne l'implique.",
    procureur: "Maître, trois témoins indépendants ont formellement reconnu votre client lors de la parade d'identification. Quant aux preuves matérielles, les traces ADN retrouvées sur la scène correspondent à son profil génétique.",
  },
];

export function ProsecutorSimulation({ notebookId }: { notebookId?: string }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [demoStep, setDemoStep] = useState(0);
  const [caseContext, setCaseContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);

  const startSimulation = () => {
    setSimulationActive(true);
    const systemMsg = caseContext
      ? `⚖️ Simulation initiée avec le contexte du dossier. Le Procureur connaît les faits et contestera vos arguments en conséquence.`
      : `⚖️ Simulation de contre-interrogatoire initiée. Le Procureur de la République est prêt à répondre à vos arguments.`;

    setMessages([
      {
        role: 'system',
        content: systemMsg,
        timestamp: new Date(),
      },
    ]);
    toast({
      title: 'Simulation démarrée',
      description: 'Présentez vos arguments de défense.',
    });
  };

  const handleDemoExchange = () => {
    if (demoStep >= DEMO_EXCHANGES.length) {
      setDemoMode(false);
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: '🎓 Phase de démo terminée. Continuez maintenant avec vos propres arguments - l\'IA réelle prendra le relais.',
          timestamp: new Date(),
        },
      ]);
      toast({
        title: 'Mode IA activé',
        description: 'L\'IA va maintenant générer des réponses réelles basées sur le dossier.',
      });
      return;
    }

    const exchange = DEMO_EXCHANGES[demoStep];

    // Ajouter message avocat
    setMessages(prev => [
      ...prev,
      {
        role: 'avocat',
        content: exchange.avocat,
        timestamp: new Date(),
      },
    ]);

    // Simuler délai procureur
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: 'procureur',
          content: exchange.procureur,
          timestamp: new Date(),
        },
      ]);
      setDemoStep(prev => prev + 1);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;

    const userMessage: Message = {
      role: 'avocat',
      content: currentInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsLoading(true);

    try {
      if (demoMode) {
        // Mode démo : utiliser échanges pré-scriptés
        handleDemoExchange();
      } else {
        // Mode IA réel
        if (!notebookId) {
          // Réponse générique si pas de notebook
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                role: 'procureur',
                content: `Maître, votre argument est recevable mais insuffisant. En l'absence de contexte précis du dossier, je relève que vous devrez étayer vos affirmations par des éléments probants. Les charges retenues reposent sur des bases solides que vous devrez contredire par des preuves concrètes, conformément à l'article 427 du Code de Procédure Pénale.`,
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
          }, 2000);
          return;
        }

        // Appel IA réel avec contexte du dossier
        const contextPrompt = caseContext
          ? `\n\nContexte du dossier :\n${caseContext}\n\nBasant toi sur ce contexte, conteste l'argument en utilisant les faits du dossier.`
          : '';

        const { data, error } = await supabase.functions.invoke('send-legal-chat-message', {
          body: {
            session_id: notebookId,
            message: `Tu es le Procureur de la République du Sénégal dans une simulation de contre-interrogatoire. Un avocat de la défense vient de présenter l'argument suivant :

"${currentInput}"${contextPrompt}

Réponds en tant que procureur en :
1. Contestant cet argument de manière professionnelle mais ferme
2. Citant des éléments factuels ou juridiques qui le contredisent
3. Utilisant le droit sénégalais (Code Pénal, Code Procédure Pénale)
4. Restant dans un ton respectueux mais adversarial

Maximum 4-5 phrases. Sois direct et percutant.`,
            user_id: 'simulation',
          },
        });

        if (error) throw error;

        const aiResponse = data?.data?.content?.segments?.[0]?.text || 'Argument noté, Maître.';

        setMessages(prev => [
          ...prev,
          {
            role: 'procureur',
            content: aiResponse,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Erreur simulation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer la réponse du procureur.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSimulation = () => {
    setSimulationActive(false);
    setMessages([]);
    setCurrentInput('');
    setDemoMode(true);
    setDemoStep(0);
  };

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/30 to-blue-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-purple-700" />
              <CardTitle className="text-purple-900">Mode Procureur - Simulation Adversariale</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-900">
              <Sparkles className="h-3 w-3 mr-1" />
              WOW Feature
            </Badge>
          </div>
          <CardDescription>
            Entraînez-vous au contre-interrogatoire : l'IA joue le rôle du procureur et attaque vos arguments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!simulationActive ? (
            <div className="py-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Scale className="h-8 w-8 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Préparez votre plaidoirie</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Testez vos arguments face à un procureur IA qui les remettra en question
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Les 2 premiers échanges sont une démo. Ensuite, l'IA réelle prend le relais.</span>
                  </div>
                </div>
              </div>

              {/* Section Contexte du dossier */}
              <div className="border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowContextInput(!showContextInput)}
                  className="w-full mb-4"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {showContextInput ? 'Masquer' : 'Ajouter'} le contexte du dossier (recommandé)
                </Button>

                {showContextInput && (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 text-xs text-slate-700 bg-white border border-slate-200 rounded p-2">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-500" />
                      <div>
                        <p className="font-medium mb-1">Pourquoi ajouter le contexte ?</p>
                        <p>
                          En fournissant un résumé des faits, le procureur IA pourra faire un contre-interrogatoire plus réaliste
                          basé sur les éléments spécifiques de votre dossier (témoignages, preuves, circonstances).
                        </p>
                      </div>
                    </div>

                    <Textarea
                      placeholder={`Exemple :
- Accusation : Vol avec violence en réunion
- Faits : Le 15 janvier 2025 vers 22h, boutique Sène cambriolée
- Éléments à charge : 2 témoins identifient le client, traces ADN
- Éléments à décharge : Client affirme être chez lui, pas d'antécédent
- Circonstances : Éclairage faible, témoins à 50m de distance`}
                      value={caseContext}
                      onChange={(e) => setCaseContext(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />

                    {caseContext && (
                      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
                        <Sparkles className="h-3 w-3" />
                        <span>Contexte chargé - Le procureur IA utilisera ces informations</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-center pt-4">
                <Button onClick={startSimulation} size="lg" className="bg-slate-700 hover:bg-slate-800">
                  <Swords className="mr-2 h-4 w-4" />
                  Démarrer la simulation
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Historique des échanges */}
              <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-white rounded-lg border">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'avocat' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'avocat'
                          ? 'bg-blue-100 text-blue-900'
                          : msg.role === 'procureur'
                          ? 'bg-red-100 text-red-900'
                          : 'bg-gray-100 text-gray-700 text-center w-full'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">
                          {msg.role === 'avocat'
                            ? '🛡️ Avocat (Vous)'
                            : msg.role === 'procureur'
                            ? '⚔️ Procureur'
                            : '🔔'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-red-100 text-red-900 rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input zone */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Présentez votre argument de défense..."
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !currentInput.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Le procureur répond...
                      </>
                    ) : (
                      'Présenter l\'argument'
                    )}
                  </Button>
                  <Button onClick={resetSimulation} variant="outline">
                    Terminer
                  </Button>
                </div>
              </div>

              {demoMode && demoStep < DEMO_EXCHANGES.length && (
                <div className="text-center text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded p-2">
                  Mode démo : {demoStep + 1} / {DEMO_EXCHANGES.length} échanges pré-scriptés
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
