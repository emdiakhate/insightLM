import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreVertical, Plus, Edit, Bot, User, Loader2, AlertCircle, CheckCircle2, RefreshCw, BookOpen, FileText, HelpCircle, Clock, List, Layers } from 'lucide-react';
import { useNotes, Note } from '@/hooks/useNotes';
import { useAudioOverview } from '@/hooks/useAudioOverview';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useSources } from '@/hooks/useSources';
import { useQueryClient } from '@tanstack/react-query';
import NoteEditor from './NoteEditor';
import AudioPlayer from './AudioPlayer';
import { Citation } from '@/types/message';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface StudioSidebarProps {
  notebookId?: string;
  isExpanded?: boolean;
  onCitationClick?: (citation: Citation) => void;
}

const StudioSidebar = ({
  notebookId,
  isExpanded,
  onCitationClick
}: StudioSidebarProps) => {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    isCreating,
    isUpdating,
    isDeleting
  } = useNotes(notebookId);

  const {
    notebooks
  } = useNotebooks();

  const {
    sources
  } = useSources(notebookId);

  const {
    generateAudioOverview,
    refreshAudioUrl,
    autoRefreshIfExpired,
    isGenerating,
    isAutoRefreshing,
    generationStatus,
    checkAudioExpiry
  } = useAudioOverview(notebookId);

  const queryClient = useQueryClient();
  const notebook = notebooks?.find(n => n.id === notebookId);
  const hasValidAudio = notebook?.audio_overview_url && !checkAudioExpiry(notebook.audio_url_expires_at);
  const currentStatus = generationStatus || notebook?.audio_overview_generation_status;

  // Check if at least one source has been successfully processed
  const hasProcessedSource = sources?.some(source => source.processing_status === 'completed') || false;

  // Auto-refresh expired URLs
  useEffect(() => {
    if (!notebookId || !notebook?.audio_overview_url) return;

    const checkAndRefresh = async () => {
      if (checkAudioExpiry(notebook.audio_url_expires_at)) {
        console.log('Audio URL expired, auto-refreshing...');
        await autoRefreshIfExpired(notebookId, notebook.audio_url_expires_at);
      }
    };

    // Check immediately
    checkAndRefresh();

    // Set up periodic check every 5 minutes
    const interval = setInterval(checkAndRefresh, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [notebookId, notebook?.audio_overview_url, notebook?.audio_url_expires_at, autoRefreshIfExpired, checkAudioExpiry]);

  const handleCreateNote = () => {
    setIsCreatingNote(true);
    setEditingNote(null);
  };

  const handleEditNote = (note: Note) => {
    console.log('StudioSidebar: Opening note', {
      noteId: note.id,
      sourceType: note.source_type
    });
    setEditingNote(note);
    setIsCreatingNote(false);
  };

  const handleSaveNote = (title: string, content: string) => {
    if (editingNote) {
      // Only allow updating user notes, not AI responses
      if (editingNote.source_type === 'user') {
        updateNote({
          id: editingNote.id,
          title,
          content
        });
      }
    } else {
      createNote({
        title,
        content,
        source_type: 'user'
      });
    }
    setEditingNote(null);
    setIsCreatingNote(false);
  };

  const handleDeleteNote = () => {
    if (editingNote) {
      deleteNote(editingNote.id);
      setEditingNote(null);
    }
  };

  const handleCancel = () => {
    setEditingNote(null);
    setIsCreatingNote(false);
  };

  const handleGenerateAudio = () => {
    if (notebookId) {
      generateAudioOverview(notebookId);
      setAudioError(false);
    }
  };

  const handleAudioError = () => {
    setAudioError(true);
  };

  const handleAudioRetry = () => {
    handleGenerateAudio();
  };

  const handleAudioDeleted = () => {
    if (notebookId) {
      queryClient.invalidateQueries({
        queryKey: ['notebooks']
      });
    }
    setAudioError(false);
  };

  const handleUrlRefresh = (notebookId: string) => {
    refreshAudioUrl(notebookId);
  };

  const handleFeatureClick = (featureKey: string) => {
    toast({
      title: t('comingSoon'),
      description: t('featureComingSoonDescription'),
    });
  };

  const getStatusDisplay = () => {
    if (isAutoRefreshing) {
      return {
        icon: null,
        text: t('refreshingURL'),
        description: t('updatingAudioAccess')
      };
    }

    if (currentStatus === 'generating' || isGenerating) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin text-blue-600" />,
        text: t('generatingAudio'),
        description: t('thisMayTakeMinutes')
      };
    } else if (currentStatus === 'failed') {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        text: t('generationFailed'),
        description: t('pleaseTryAgain')
      };
    } else if (currentStatus === 'completed' && hasValidAudio) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        text: t('readyToPlay'),
        description: t('audioOverviewAvailable')
      };
    }
    return null;
  };

  const isEditingMode = editingNote || isCreatingNote;
  const getPreviewText = (note: Note) => {
    if (note.source_type === 'ai_response') {
      if (note.extracted_text) {
        return note.extracted_text;
      }
      try {
        const parsed = JSON.parse(note.content);
        if (parsed.segments && parsed.segments[0]) {
          return parsed.segments[0].text;
        }
      } catch (e) {
        // If parsing fails, use content as-is
      }
    }

    const contentToUse = note.content;
    return contentToUse.length > 100 ? contentToUse.substring(0, 100) + '...' : contentToUse;
  };

  // Feature cards configuration
  const featureCards = [
    {
      key: 'studyGuide',
      icon: BookOpen,
      label: t('studyGuide'),
      description: t('studyGuideDescription'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      key: 'briefingDoc',
      icon: FileText,
      label: t('briefingDoc'),
      description: t('briefingDocDescription'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      key: 'faq',
      icon: HelpCircle,
      label: t('faq'),
      description: t('faqDescription'),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      key: 'timeline',
      icon: Clock,
      label: t('timeline'),
      description: t('timelineDescription'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      key: 'tableOfContents',
      icon: List,
      label: t('tableOfContents'),
      description: t('tableOfContentsDescription'),
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
    },
    {
      key: 'flashcards',
      icon: Layers,
      label: t('flashcards'),
      description: t('flashcardsDescription'),
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
    },
  ];

  if (isEditingMode) {
    return <div className="w-full bg-gray-50 border-l border-gray-200 flex flex-col h-full overflow-hidden">
        <NoteEditor note={editingNote || undefined} onSave={handleSaveNote} onDelete={editingNote ? handleDeleteNote : undefined} onCancel={handleCancel} isLoading={isCreating || isUpdating || isDeleting} onCitationClick={onCitationClick} />
      </div>;
  }

  return <div className="w-full bg-gray-50 border-l border-gray-200 flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 h-full">
        <div className="p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('studio')}</h2>

          {/* Audio Overview Card */}
          <Card className="p-4 mb-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">{t('audioOverview')}</h3>
            </div>

            {hasValidAudio && !audioError && currentStatus !== 'generating' && !isAutoRefreshing ? <AudioPlayer
                audioUrl={notebook.audio_overview_url}
                title={t('deepDiveConversation')}
                notebookId={notebookId}
                expiresAt={notebook.audio_url_expires_at}
                onError={handleAudioError}
                onRetry={handleAudioRetry}
                onDeleted={handleAudioDeleted}
                onUrlRefresh={handleUrlRefresh}
              /> : <Card className="p-3 border border-gray-200">
                {/* Hide this div when generating or auto-refreshing */}
                {currentStatus !== 'generating' && !isGenerating && !isAutoRefreshing && <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#111827">
                        <path d="M280-120v-123q-104-14-172-93T40-520h80q0 83 58.5 141.5T320-320h10q5 0 10-1 13 20 28 37.5t32 32.5q-10 3-19.5 4.5T360-243v123h-80Zm20-282q-43-8-71.5-40.5T200-520v-240q0-50 35-85t85-35q50 0 85 35t35 85v160H280v80q0 31 5 60.5t15 57.5Zm340 2q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm-40 280v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T640-320q83 0 141.5-58.5T840-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T680-520v-240q0-17-11.5-28.5T640-800q-17 0-28.5 11.5T600-760v240q0 17 11.5 28.5T640-480Zm0-160Z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{t('deepDiveConversation')}</h4>
                      <p className="text-sm text-gray-600">{t('twoHosts')}</p>
                    </div>
                  </div>}

                {/* Status Display */}
                {getStatusDisplay() && <div className="flex items-center space-x-2 mb-3 p-2 rounded-md bg-transparent">
                    {getStatusDisplay()!.icon}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{getStatusDisplay()!.text}</p>
                      <p className="text-xs text-slate-900">{getStatusDisplay()!.description}</p>
                    </div>
                  </div>}

                {/* Audio error div */}
                {audioError && <div className="flex items-center space-x-2 mb-3 p-2 bg-red-50 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm text-red-600">{t('audioUnavailable')}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleAudioRetry} className="text-red-600 border-red-300 hover:bg-red-50">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      {t('retry')}
                    </Button>
                  </div>}

                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleGenerateAudio} disabled={isGenerating || currentStatus === 'generating' || !hasProcessedSource || isAutoRefreshing} className="flex-1 text-white bg-slate-900 hover:bg-slate-800">
                    {isGenerating || currentStatus === 'generating' ? <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('generating')}
                      </> : t('generate')}
                  </Button>
                </div>
              </Card>}
          </Card>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {featureCards.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card
                  key={feature.key}
                  className={`p-3 border ${feature.borderColor} ${feature.bgColor} hover:shadow-md transition-all cursor-pointer group`}
                  onClick={() => handleFeatureClick(feature.key)}
                >
                  <div className="flex flex-col items-start space-y-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${feature.bgColor}`}>
                      <IconComponent className={`h-4 w-4 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 leading-tight">{feature.label}</h4>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Notes Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">{t('notes')}</h3>
            </div>

            <Button variant="outline" size="sm" className="w-full mb-4" onClick={handleCreateNote}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addNote')}
            </Button>
          </div>

          {/* Saved Notes */}
          {isLoading ? <div className="text-center py-8">
              <p className="text-sm text-gray-600">{t('loadingNotes')}</p>
            </div> : notes && notes.length > 0 ? <div className="space-y-3">
              {notes.map(note => <Card key={note.id} className="p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => handleEditNote(note)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {note.source_type === 'ai_response' ? <Bot className="h-3 w-3 text-blue-600" /> : <User className="h-3 w-3 text-gray-600" />}
                        <span className="text-xs text-gray-500 uppercase">
                          {note.source_type === 'ai_response' ? t('aiResponse') : t('note')}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 truncate">{note.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {getPreviewText(note)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    {note.source_type === 'user' && <Button variant="ghost" size="sm" className="ml-2">
                        <Edit className="h-3 w-3" />
                      </Button>}
                  </div>
                </Card>)}
            </div> : <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-400 text-2xl">📄</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('savedNotesWillAppear')}</h3>
              <p className="text-sm text-gray-600">
                {t('saveAChatMessage')}
              </p>
            </div>}
        </div>
      </ScrollArea>
    </div>;
};

export default StudioSidebar;
