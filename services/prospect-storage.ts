import { Prospect } from '@/types/prospect';

const PROSPECTS_STORAGE_KEY = 'nivra_prospects_v1';

export const INITIAL_SAMPLE_PROSPECTS: Prospect[] = [
  {
    id: 'pr_001',
    name: 'Bistrô Icaraí Gourmet',
    category: 'Restaurante',
    status: 'CONTATO A FAZER',
    city: 'Niterói',
    neighborhood: 'Icaraí',
    address: 'Rua Moreira César, 240',
    website: 'https://bistro-icarai.exemplo.com',
    contactName: 'Carlos Eduardo (Gerente)',
    phone: '+55 21 98844-1234',
    email: 'contato@bistro-icarai.exemplo.com',
    notes: 'Restaurante de alta gastronomia com interesse em renovar cardápio digital e gestão de reservas.',
    nextAction: 'Ligar para agendar apresentação de proposta',
    nextActionDate: '2026-10-08',
    interactions: [
      {
        id: 'int_1',
        date: '2026-10-04',
        type: 'note',
        notes: 'Identificado no mapa de Icaraí. Alto movimento no almoço e jantar.',
      },
    ],
    createdAt: '2026-10-04T14:30:00.000Z',
    updatedAt: '2026-10-04T14:30:00.000Z',
    lat: -22.9068,
    lng: -43.1118,
  },
  {
    id: 'pr_002',
    name: 'Café Grão Real',
    category: 'Café',
    status: 'CONTATO FEITO',
    city: 'Niterói',
    neighborhood: 'Ingá',
    address: 'Av. Presidente Pedreira, 92',
    website: 'https://graoreal.exemplo.com',
    contactName: 'Mariana Lima',
    phone: '+55 21 99123-4567',
    email: 'mariana@graoreal.exemplo.com',
    notes: 'Cafeteria artesanal e torrefação própria. Apresentada proposta de integração.',
    nextAction: 'Follow-up sobre fechamento do pacote trimestral',
    nextActionDate: '2026-10-09',
    interactions: [
      {
        id: 'int_2',
        date: '2026-10-05',
        type: 'whatsapp',
        notes: 'Enviada apresentação institucional via WhatsApp. Mariana demonstrou interesse.',
      },
    ],
    createdAt: '2026-10-03T10:15:00.000Z',
    updatedAt: '2026-10-05T09:20:00.000Z',
    lat: -22.9022,
    lng: -43.1256,
  },
  {
    id: 'pr_003',
    name: 'Clínica OdontoPrime',
    category: 'Odontologia',
    status: 'AGUARDANDO RESPOSTA',
    city: 'São Gonçalo',
    neighborhood: 'Centro',
    address: 'Rua Feliciano Sodré, 180',
    website: '',
    contactName: 'Dra. Vanessa Martins',
    phone: '+55 21 97234-8899',
    email: 'recepcao@odontoprime.exemplo.com',
    notes: 'Clínica de ortodontia e implantes com 4 consultórios.',
    nextAction: 'Aguardando retorno da diretoria clínica',
    nextActionDate: '2026-10-10',
    interactions: [
      {
        id: 'int_3',
        date: '2026-10-02',
        type: 'email',
        notes: 'E-mail com comparativo financeiro enviado para a recepção.',
      },
    ],
    createdAt: '2026-10-02T16:00:00.000Z',
    updatedAt: '2026-10-02T16:00:00.000Z',
    lat: -22.8272,
    lng: -43.0538,
  },
  {
    id: 'pr_004',
    name: 'AutoMotors Premium',
    category: 'Concessionária',
    status: 'NEGOCIAÇÃO',
    city: 'Niterói',
    neighborhood: 'Charitas',
    address: 'Av. Prefeito Silvio Picanço, 410',
    website: 'https://automotors.exemplo.com',
    contactName: 'Rodrigo Fontes (Diretor Comercial)',
    phone: '+55 21 99988-7711',
    email: 'rodrigo@automotors.exemplo.com',
    notes: 'Loja de veículos seminovos selecionados e blindados. Em fase final de negociação contratual.',
    nextAction: 'Reunião presencial para assinatura de contrato',
    nextActionDate: '2026-10-11',
    interactions: [
      {
        id: 'int_4',
        date: '2026-10-04',
        type: 'meeting',
        notes: 'Reunião de alinhamento com Rodrigo. Escopo de serviços aprovado.',
      },
    ],
    createdAt: '2026-09-28T11:00:00.000Z',
    updatedAt: '2026-10-04T17:45:00.000Z',
    lat: -22.9288,
    lng: -43.0991,
  },
  {
    id: 'pr_005',
    name: 'Hotel Baía Atlântica',
    category: 'Hotel',
    status: 'CONVERTIDO EM CLIENTE',
    city: 'Rio de Janeiro',
    neighborhood: 'Copacabana',
    address: 'Av. Atlântica, 1850',
    website: 'https://baiaatlantica.exemplo.com',
    contactName: 'Helena Duarte',
    phone: '+55 21 98112-9900',
    email: 'diretoria@baiaatlantica.exemplo.com',
    notes: 'Hotel boutique 4 estrelas. Cliente ativo convertido com faturamento registrado no NIVRA Revenue.',
    nextAction: 'Revisão mensal de resultados',
    nextActionDate: '2026-11-01',
    interactions: [
      {
        id: 'int_5',
        date: '2026-10-01',
        type: 'note',
        notes: 'Contrato assinado! Primeiro faturamento registrado com sucesso.',
      },
    ],
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-10-01T15:00:00.000Z',
    lat: -22.9698,
    lng: -43.1812,
  },
];

export function getStoredProspects(): Prospect[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_PROSPECTS;
  try {
    const raw = localStorage.getItem(PROSPECTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROSPECTS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_PROSPECTS));
      return INITIAL_SAMPLE_PROSPECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_SAMPLE_PROSPECTS;
  } catch (err) {
    console.warn('Erro ao carregar prospects do localStorage:', err);
    return INITIAL_SAMPLE_PROSPECTS;
  }
}

export function saveStoredProspects(prospects: Prospect[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROSPECTS_STORAGE_KEY, JSON.stringify(prospects));
  } catch (err) {
    console.warn('Erro ao salvar prospects no localStorage:', err);
  }
}

export function deleteStoredProspect(id: string): Prospect[] {
  const current = getStoredProspects();
  const next = current.filter((p) => p.id !== id);
  saveStoredProspects(next);
  return next;
}

