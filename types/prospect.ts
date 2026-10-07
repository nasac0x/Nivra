export type ProspectStatus =
  | 'NA LISTA'
  | 'CONTATO A FAZER'
  | 'CONTATO FEITO'
  | 'AGUARDANDO RESPOSTA'
  | 'FOLLOW-UP PENDENTE'
  | 'NEGOCIAÇÃO'
  | 'CONVERTIDO EM CLIENTE'
  | 'NÃO INTERESSADO';

export const PROSPECT_STATUSES: ProspectStatus[] = [
  'NA LISTA',
  'CONTATO A FAZER',
  'CONTATO FEITO',
  'AGUARDANDO RESPOSTA',
  'FOLLOW-UP PENDENTE',
  'NEGOCIAÇÃO',
  'CONVERTIDO EM CLIENTE',
  'NÃO INTERESSADO',
];

export const PROSPECT_CATEGORIES = [
  'Restaurante',
  'Café',
  'Odontologia',
  'Concessionária',
  'Hotel',
  'Construção',
  'Loja',
  'Outros',
] as const;

export type ProspectCategory = (typeof PROSPECT_CATEGORIES)[number] | string;

export interface ProspectInteraction {
  id: string;
  date: string; // ISO or YYYY-MM-DD
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'note' | 'proposal';
  notes: string;
}

export interface Prospect {
  id: string;
  name: string;
  category: string;
  status: ProspectStatus;
  city?: string;
  neighborhood?: string;
  address?: string;
  website?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
  interactions: ProspectInteraction[];
  createdAt: string;
  updatedAt: string;
  lat?: number;
  lng?: number;
}

export interface MapPlaceResult {
  id: string;
  name: string;
  category?: string;
  address?: string;
  rating?: number;
  userRatingCount?: number;
  phone?: string;
  website?: string;
  googleMapsUri?: string;
  isOpen?: boolean;
  lat: number;
  lng: number;
}
