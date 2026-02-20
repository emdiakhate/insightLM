import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTranslatedAudio = (notebookId?: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listen for notebook updates (reuses the same realtime pattern)
  useEffect(() => {
    if (!notebookId || !isGenerating) return;

    const channel = supabase
      .channel('translated-audio-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notebooks',
          filter: `id=eq.${notebookId}`
        },
        (payload) => {
          const newData = payload.new as any;

          if (newData.audio_overview_generation_status === 'completed' && newData.audio_overview_url) {
            setIsGenerating(false);
            toast({
              title: "Traduction audio prête !",
              description: "La narration audio traduite est prête à être écoutée.",
            });
            queryClient.invalidateQueries({ queryKey: ['notebooks'] });
            queryClient.invalidateQueries({ queryKey: ['notes'] });
          } else if (newData.audio_overview_generation_status === 'failed') {
            setIsGenerating(false);
            toast({
              title: "Échec de la génération",
              description: "La traduction audio a échoué. Veuillez réessayer.",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notebookId, isGenerating, toast, queryClient]);

  const generateTranslatedAudio = useMutation({
    mutationFn: async ({
      sourceId,
      targetLanguage = 'fr',
      voice = 'nova',
    }: {
      sourceId?: string;
      targetLanguage?: string;
      voice?: string;
    }) => {
      if (!notebookId) throw new Error('Notebook ID is required');

      setIsGenerating(true);

      const { data, error } = await supabase.functions.invoke('generate-translated-audio', {
        body: { notebookId, sourceId, targetLanguage, voice }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onError: (error: Error) => {
      console.error('Translated audio generation failed:', error);
      setIsGenerating(false);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de démarrer la génération.",
        variant: "destructive",
      });
    },
  });

  return {
    generateTranslatedAudio: generateTranslatedAudio.mutate,
    isGenerating: isGenerating || generateTranslatedAudio.isPending,
  };
};
