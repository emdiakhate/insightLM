import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle, Clock, Scale } from 'lucide-react';
import { format, addDays, addMonths, isWeekend, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Jours fériés sénégalais 2025 (à mettre à jour annuellement)
const SENEGAL_HOLIDAYS_2025 = [
  new Date(2025, 0, 1),   // Jour de l'An
  new Date(2025, 3, 4),   // Fête Nationale (4 avril)
  new Date(2025, 4, 1),   // Fête du Travail (1er mai)
  new Date(2025, 4, 31),  // Eid al-Fitr (estimation, à ajuster)
  new Date(2025, 7, 7),   // Eid al-Adha (estimation, à ajuster)
  new Date(2025, 7, 15),  // Assomption (15 août)
  new Date(2025, 10, 1),  // Toussaint (1er novembre)
  new Date(2025, 11, 25), // Noël (25 décembre)
];

interface DelayType {
  id: string;
  name: string;
  delayDays: number;
  delayMonths?: number;
  description: string;
  legalReference: string;
  category: 'penal' | 'civil' | 'procedure';
}

const DELAY_TYPES: DelayType[] = [
  {
    id: 'appel_penal',
    name: 'Appel pénal',
    delayDays: 10,
    description: 'Délai pour former un appel en matière pénale (parties présentes)',
    legalReference: 'Art. 189 Code Procédure Pénale',
    category: 'penal',
  },
  {
    id: 'appel_penal_defaillant',
    name: 'Appel pénal (défaillant)',
    delayMonths: 1,
    delayDays: 0,
    description: 'Délai d\'appel pour parties défaillantes (après signification)',
    legalReference: 'Art. 189 Code Procédure Pénale',
    category: 'penal',
  },
  {
    id: 'appel_civil',
    name: 'Appel civil',
    delayMonths: 1,
    delayDays: 0,
    description: 'Délai pour former un appel en matière civile',
    legalReference: 'Art. 143 Code Procédure Civile',
    category: 'civil',
  },
  {
    id: 'appel_civil_etranger',
    name: 'Appel civil (à l\'étranger)',
    delayMonths: 2,
    delayDays: 0,
    description: 'Délai d\'appel si le défendeur réside hors du Sénégal',
    legalReference: 'Art. 143 Code Procédure Civile',
    category: 'civil',
  },
  {
    id: 'pourvoi_cassation',
    name: 'Pourvoi en cassation',
    delayMonths: 2,
    delayDays: 0,
    description: 'Délai pour former un pourvoi en cassation',
    legalReference: 'Art. 490 Code Procédure Pénale',
    category: 'penal',
  },
  {
    id: 'garde_a_vue',
    name: 'Garde à vue (initiale)',
    delayDays: 2,
    description: 'Durée maximale initiale de la garde à vue (48 heures)',
    legalReference: 'Art. 51 Code Procédure Pénale',
    category: 'procedure',
  },
  {
    id: 'garde_a_vue_prolongation',
    name: 'Garde à vue (prolongation)',
    delayDays: 2,
    description: 'Prolongation possible de la garde à vue (48h supplémentaires)',
    legalReference: 'Art. 51 Code Procédure Pénale',
    category: 'procedure',
  },
  {
    id: 'detention_provisoire_correctionnel',
    name: 'Détention provisoire (correctionnel)',
    delayMonths: 6,
    delayDays: 0,
    description: 'Durée maximale de détention provisoire en matière correctionnelle',
    legalReference: 'Art. 137 Code Procédure Pénale',
    category: 'procedure',
  },
  {
    id: 'detention_provisoire_criminel',
    name: 'Détention provisoire (criminel)',
    delayMonths: 12,
    delayDays: 0,
    description: 'Durée maximale de détention provisoire en matière criminelle',
    legalReference: 'Art. 137 Code Procédure Pénale',
    category: 'procedure',
  },
  {
    id: 'conclusions',
    name: 'Dépôt de conclusions',
    delayMonths: 1,
    delayDays: 0,
    description: 'Délai pour déposer conclusions après clôture d\'instruction',
    legalReference: 'Art. 68 Code Procédure Civile',
    category: 'civil',
  },
];

const isHoliday = (date: Date): boolean => {
  return SENEGAL_HOLIDAYS_2025.some(
    holiday =>
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear()
  );
};

const isWorkingDay = (date: Date): boolean => {
  return !isWeekend(date) && !isHoliday(date);
};

const calculateDeadline = (
  startDate: Date,
  delayDays: number,
  delayMonths: number = 0
): { deadline: Date; workingDaysCount: number; weekendDays: number; holidayDays: number } => {
  let current = new Date(startDate);
  let workingDaysCount = 0;
  let weekendDays = 0;
  let holidayDays = 0;

  // Ajouter les mois d'abord si applicable
  if (delayMonths > 0) {
    current = addMonths(current, delayMonths);
  }

  // Ajouter les jours ouvrables
  while (workingDaysCount < delayDays) {
    current = addDays(current, 1);

    if (isHoliday(current)) {
      holidayDays++;
    } else if (isWeekend(current)) {
      weekendDays++;
    } else {
      workingDaysCount++;
    }
  }

  return { deadline: current, workingDaysCount, weekendDays, holidayDays };
};

export function DeadlineCalculator() {
  const [selectedDelayType, setSelectedDelayType] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [result, setResult] = useState<{
    deadline: Date;
    workingDaysCount: number;
    weekendDays: number;
    holidayDays: number;
    delayInfo: DelayType;
  } | null>(null);

  const selectedDelay = DELAY_TYPES.find(d => d.id === selectedDelayType);

  const handleCalculate = () => {
    if (!startDate || !selectedDelay) return;

    const { deadline, workingDaysCount, weekendDays, holidayDays } = calculateDeadline(
      startDate,
      selectedDelay.delayDays,
      selectedDelay.delayMonths
    );

    setResult({
      deadline,
      workingDaysCount,
      weekendDays,
      holidayDays,
      delayInfo: selectedDelay,
    });
  };

  const handleReset = () => {
    setSelectedDelayType('');
    setStartDate(undefined);
    setResult(null);
  };

  const getUrgencyColor = () => {
    if (!result || !startDate) return 'text-gray-600';

    const today = startOfDay(new Date());
    const daysRemaining = Math.ceil((result.deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining <= 3) return 'text-orange-600';
    if (daysRemaining <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-700" />
            <CardTitle className="text-blue-900">Calculateur de Délais Procéduraux</CardTitle>
          </div>
          <CardDescription>
            Calculez les délais d'appel, de détention et autres échéances juridiques conformément au droit sénégalais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection du type de délai */}
          <div className="space-y-2">
            <Label htmlFor="delay-type">Type de délai</Label>
            <Select value={selectedDelayType} onValueChange={setSelectedDelayType}>
              <SelectTrigger id="delay-type">
                <SelectValue placeholder="Sélectionnez un type de délai..." />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Procédure Pénale</div>
                {DELAY_TYPES.filter(d => d.category === 'penal').map(delay => (
                  <SelectItem key={delay.id} value={delay.id}>
                    {delay.name} ({delay.delayMonths ? `${delay.delayMonths} mois` : `${delay.delayDays} jours`})
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Procédure Civile</div>
                {DELAY_TYPES.filter(d => d.category === 'civil').map(delay => (
                  <SelectItem key={delay.id} value={delay.id}>
                    {delay.name} ({delay.delayMonths ? `${delay.delayMonths} mois` : `${delay.delayDays} jours`})
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Autres Procédures</div>
                {DELAY_TYPES.filter(d => d.category === 'procedure').map(delay => (
                  <SelectItem key={delay.id} value={delay.id}>
                    {delay.name} ({delay.delayDays} jours)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDelay && (
              <div className="text-sm text-gray-600 mt-2 p-3 bg-white rounded-md border">
                <p className="font-medium">{selectedDelay.description}</p>
                <p className="text-xs text-blue-700 mt-1">{selectedDelay.legalReference}</p>
              </div>
            )}
          </div>

          {/* Sélection de la date de début */}
          <div className="space-y-2">
            <Label htmlFor="start-date">Date de début (prononcé du jugement / signification)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <Button
              onClick={handleCalculate}
              disabled={!selectedDelayType || !startDate}
              className="flex-1"
            >
              <Clock className="mr-2 h-4 w-4" />
              Calculer le délai
            </Button>
            <Button onClick={handleReset} variant="outline">
              Réinitialiser
            </Button>
          </div>

          {/* Résultat */}
          {result && (
            <div className={cn('rounded-lg border-2 p-4 space-y-3', getUrgencyColor().includes('red') ? 'border-red-300 bg-red-50' : getUrgencyColor().includes('orange') ? 'border-orange-300 bg-orange-50' : getUrgencyColor().includes('yellow') ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50')}>
              <div className="flex items-start gap-3">
                <AlertCircle className={cn('h-5 w-5 mt-0.5', getUrgencyColor())} />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Échéance : {format(result.deadline, 'PPP', { locale: fr })}</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    Le délai expire le <strong>{format(result.deadline, 'EEEE d MMMM yyyy', { locale: fr })}</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-300">
                <div>
                  <p className="text-xs text-gray-600">Jours ouvrables</p>
                  <p className="text-2xl font-bold">{result.workingDaysCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Week-ends exclus</p>
                  <p className="text-2xl font-bold">{result.weekendDays}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Jours fériés exclus</p>
                  <p className="text-2xl font-bold">{result.holidayDays}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Durée totale</p>
                  <p className="text-2xl font-bold">
                    {Math.ceil((result.deadline.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24))} j
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-600 mt-4 p-2 bg-white/50 rounded">
                <strong>Base légale :</strong> {result.delayInfo.legalReference}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Légende jours fériés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Jours fériés sénégalais 2025 pris en compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
            {SENEGAL_HOLIDAYS_2025.map((holiday, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {format(holiday, 'd MMM', { locale: fr })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
