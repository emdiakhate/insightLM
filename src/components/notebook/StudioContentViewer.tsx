import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Save, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FeatureType } from '@/hooks/useStudioFeatures';

interface StudioContentViewerProps {
  featureType: FeatureType;
  content: string;
  onClose: () => void;
  onSaveAsNote: (title: string, content: string) => void;
}

const featureConfig: Record<FeatureType, { iconClass: string; Icon: typeof BookOpen }> = {
  faq: { iconClass: 'text-green-600', Icon: HelpCircle },
  briefingDoc: { iconClass: 'text-purple-600', Icon: FileText },
  studyGuide: { iconClass: 'text-blue-600', Icon: BookOpen },
};

const StudioContentViewer = ({
  featureType,
  content,
  onClose,
  onSaveAsNote,
}: StudioContentViewerProps) => {
  const { t } = useLanguage();

  const titleMap: Record<FeatureType, string> = {
    faq: t('faq'),
    briefingDoc: t('briefingDoc'),
    studyGuide: t('studyGuide'),
  };

  const config = featureConfig[featureType];
  const title = titleMap[featureType];

  const handleSave = () => {
    onSaveAsNote(title, content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <config.Icon className={`h-5 w-5 ${config.iconClass}`} />
            <h3 className="font-medium text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {t('saveToNote')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 h-full">
        <div className="p-4 prose prose-sm max-w-none prose-headings:text-gray-900 prose-h2:text-lg prose-h2:mt-4 prose-h2:mb-2 prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1 prose-h4:text-sm prose-h4:mt-2 prose-p:text-gray-700 prose-p:mb-2 prose-li:text-gray-700 prose-strong:text-gray-900">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </ScrollArea>
    </div>
  );
};

export default StudioContentViewer;
