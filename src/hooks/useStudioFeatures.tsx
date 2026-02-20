import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNotes } from '@/hooks/useNotes';

export type FeatureType = 'faq' | 'briefingDoc' | 'studyGuide';

interface GeneratedContent {
  featureType: FeatureType;
  content: string;
}

export const useStudioFeatures = (notebookId?: string) => {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatingFeature, setGeneratingFeature] = useState<FeatureType | null>(null);
  const { toast } = useToast();
  const { createNote } = useNotes(notebookId);

  const generateMutation = useMutation({
    mutationFn: async (featureType: FeatureType) => {
      if (!notebookId) throw new Error('Notebook ID is required');

      const { data, error } = await supabase.functions.invoke('generate-studio-content', {
        body: { notebookId, featureType }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return { featureType, content: data.content };
    },
    onMutate: (featureType) => {
      setGeneratingFeature(featureType);
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      setGeneratingFeature(null);
    },
    onError: (error: Error) => {
      console.error('Studio feature generation failed:', error);
      setGeneratingFeature(null);
      toast({
        title: "Erreur",
        description: error.message || "La génération a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const generateFeature = (featureType: FeatureType) => {
    generateMutation.mutate(featureType);
  };

  const saveAsNote = (title: string, content: string) => {
    if (!notebookId) return;
    createNote({
      title,
      content,
      source_type: 'ai_response',
      extracted_text: content.substring(0, 200),
    });
    toast({
      title: "Note sauvegardée",
      description: "Le contenu a été enregistré dans vos notes.",
    });
  };

  const clearGeneratedContent = () => {
    setGeneratedContent(null);
  };

  return {
    generateFeature,
    generatedContent,
    generatingFeature,
    isGenerating: generateMutation.isPending,
    saveAsNote,
    clearGeneratedContent,
  };
};
