'use client';

import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Search,
  MapPin,
  Phone,
  Globe,
  Star,
  Plus,
  Compass,
  AlertCircle,
  RefreshCw,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { Prospect, MapPlaceResult } from '@/types/prospect';

interface ProspectMapProps {
  apiKey?: string;
  mapSize?: 'compact' | 'normal' | 'expanded' | 'collapsed';
  onMapSizeChange?: (size: 'compact' | 'normal' | 'expanded' | 'collapsed') => void;
  onOpenManualAddModal: () => void;
  selectedCenter?: { lat: number; lng: number } | null;
  activeProspects: Prospect[];
  onSelectProspect?: (prospect: Prospect) => void;
}


// Inner Controller that has access to useMap()
const MapController: React.FC<{
  selectedCenter?: { lat: number; lng: number } | null;
  searchResults: MapPlaceResult[];
  onSelectPlaceResult: (place: MapPlaceResult) => void;
  selectedPlaceResult: MapPlaceResult | null;
  activeProspects: Prospect[];
  onSelectProspect?: (prospect: Prospect) => void;
}> = ({
  selectedCenter,
  searchResults,
  onSelectPlaceResult,
  selectedPlaceResult,
  activeProspects,
  onSelectProspect,
}) => {
  const map = useMap();

  // Smooth pan/zoom when selectedCenter changes (from selecting a prospect in the list)
  useEffect(() => {
    if (map && selectedCenter) {
      map.panTo(selectedCenter);
      map.setZoom(16);
    }
  }, [map, selectedCenter]);

  // Adjust bounds when new search results arrive
  useEffect(() => {
    if (map && searchResults.length > 0 && typeof google !== 'undefined') {
      const bounds = new google.maps.LatLngBounds();
      searchResults.forEach((p) => {
        bounds.extend({ lat: p.lat, lng: p.lng });
      });
      map.fitBounds(bounds, 50);
    }
  }, [map, searchResults]);

  return (
    <>
      {/* Markers for Places found via Map Search */}
      {searchResults.map((place) => {
        const isSelected = selectedPlaceResult?.id === place.id;
        return (
          <AdvancedMarker
            key={'search_' + place.id}
            position={{ lat: place.lat, lng: place.lng }}
            onClick={() => onSelectPlaceResult(place)}
            title={place.name}
          >
            <Pin
              background={isSelected ? '#9B4DFF' : '#7C3AED'}
              borderColor="#FFFFFF"
              glyphColor="#FFFFFF"
              scale={isSelected ? 1.25 : 1.0}
            />
          </AdvancedMarker>
        );
      })}

      {/* Markers for Registered Prospects already in CRM */}
      {activeProspects.map((prospect) => {
        if (!prospect.lat || !prospect.lng) return null;
        const isConverted = prospect.status === 'CONVERTIDO EM CLIENTE';
        return (
          <AdvancedMarker
            key={'crm_' + prospect.id}
            position={{ lat: prospect.lat, lng: prospect.lng }}
            onClick={() => onSelectProspect && onSelectProspect(prospect)}
            title={`${prospect.name} (${prospect.status})`}
          >
            <div className="relative group cursor-pointer">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg text-[10px] font-bold ${
                  isConverted ? 'bg-[#10B981] text-white' : 'bg-[#3B82F6] text-white'
                }`}
              >
                P
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[#07080C]/90 text-white text-[10px] font-mono px-2 py-0.5 rounded whitespace-nowrap border border-white/20 z-50">
                {prospect.name}
              </div>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};

export const ProspectMap: React.FC<ProspectMapProps> = ({
  apiKey,
  mapSize,
  onMapSizeChange,
  onOpenManualAddModal,
  selectedCenter,
  activeProspects,
  onSelectProspect,
}) => {
  const [localMapSize, setLocalMapSize] = useState<'compact' | 'normal' | 'expanded' | 'collapsed'>('normal');
  const activeMapSize = mapSize ?? localMapSize;
  const handleMapSizeChange = onMapSizeChange ?? setLocalMapSize;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<MapPlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceResult | null>(null);

  // Fallback demo key provisioned by Google Maps setup
  const DEMO_FALLBACK_KEY = 'AIzaSyBe23reHyD3giVGkdmgs_uHRiEBUqCDI9k';
  const effectiveKey =
    apiKey ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (typeof globalThis !== 'undefined' ? (globalThis as any).GOOGLE_MAPS_API_KEY : '') ||
    DEMO_FALLBACK_KEY;

  // Default coordinate center (Niterói / Rio de Janeiro area as referenced in prompts)
  const defaultCenter = { lat: -22.9068, lng: -43.1118 };

  ;

  // Dynamic height based on mapSize control
  const heightClass =
    activeMapSize === 'collapsed'
      ? 'h-[64px] min-h-[64px]'
      : activeMapSize === 'compact'
      ? 'h-[310px] min-h-[310px]'
      : activeMapSize === 'expanded'
      ? 'h-[620px] min-h-[620px]'
      : 'h-[600px] min-h-[600px]';


  // Search places using Places API (New) Place.searchByText
  const executeSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        throw new Error('A API do Google Maps ainda está carregando ou não foi inicializada.');
      }

      // Check if modern Place class with searchByText is available
      if (google.maps.places.Place && typeof (google.maps.places.Place as any).searchByText === 'function') {
        const response = await (google.maps.places.Place as any).searchByText({
          textQuery: trimmed,
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'websiteURI',
            'nationalPhoneNumber',
            'regularOpeningHours',
            'primaryTypeDisplayName',
            'googleMapsURI',
          ],
        });

        const rawPlaces = response.places || [];
        const mapped: MapPlaceResult[] = rawPlaces
          .filter((p: any) => p.location)
          .map((p: any) => {
            const loc = p.location;
            const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
            const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
            return {
              id: p.id || 'pl_' + Math.random().toString(36).substring(2, 8),
              name: p.displayName || trimmed,
              category: p.primaryTypeDisplayName || 'Comércio Local',
              address: p.formattedAddress || '',
              rating: p.rating,
              userRatingCount: p.userRatingCount,
              phone: p.nationalPhoneNumber,
              website: p.websiteURI,
              googleMapsUri: p.googleMapsURI,
              isOpen: p.regularOpeningHours?.isOpen,
              lat,
              lng,
            };
          });

        setSearchResults(mapped);
        if (mapped.length > 0) {
          setSelectedPlace(mapped[0]);
        } else {
          setSearchError('Nenhum estabelecimento encontrado para a pesquisa.');
        }
      } else {
        // Fallback geocoding if Place.searchByText is not available in current context
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: trimmed }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const r = results[0];
            const lat = r.geometry.location.lat();
            const lng = r.geometry.location.lng();
            const fallbackResult: MapPlaceResult = {
              id: r.place_id || 'gc_' + Date.now(),
              name: trimmed,
              category: 'Localização',
              address: r.formatted_address,
              lat,
              lng,
            };
            setSearchResults([fallbackResult]);
            setSelectedPlace(fallbackResult);
          } else {
            setSearchError('Não foi possível localizar o endereço pesquisado.');
          }
        });
      }
    } catch (err: any) {
      console.warn('Erro na busca do Google Maps:', err);
      if (err?.status === 429 || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setSearchError(err?.message || 'Falha ao buscar no Google Maps. Verifique conexão.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  return (
    <div
      className={`relative w-full ${heightClass} transition-all duration-300 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0A0B10] flex flex-col shadow-2xl`}
    >
      {/* Top Search & Size Controls Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
          {/* Search input container */}
          <form
            onSubmit={handleSearchSubmit}
            className="pointer-events-auto flex items-center gap-2 bg-[#07080C]/90 backdrop-blur-xl border border-white/15 px-3 py-1.5 sm:py-2 rounded-lg shadow-xl flex-1 min-w-[240px]"
          >
            <Search className="w-4 h-4 text-[#9B4DFF] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar estabelecimentos (ex: Cafés em Icaraí, Restaurantes em Niterói)..."
              className="w-full bg-transparent text-xs font-mono text-[#F0E9FF] placeholder:text-[#858593] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#858593] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#9B4DFF] hover:bg-[#8534f5] text-white text-xs font-mono font-medium rounded transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isSearching ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Compass className="w-3 h-3" />
              )}
              <span>Buscar</span>
            </button>
          </form>

          {/* Map Size Controls (Menor / Normal / Expandido / Recolher) */}
          <div className="pointer-events-auto flex items-center gap-1 bg-[#07080C]/90 backdrop-blur-xl border border-white/15 p-1 rounded-lg shrink-0 shadow-xl">
            <button
              type="button"
              onClick={() => handleMapSizeChange('compact')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded cursor-pointer transition-all flex items-center gap-1 ${
                activeMapSize === 'compact'
                  ? 'bg-[#9B4DFF]/30 text-white font-semibold border border-[#9B4DFF]/50 shadow-sm'
                  : 'text-[#858593] hover:text-white'
              }`}
              title="Tamanho menor do mapa (210px)"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Menor</span>
            </button>
            <button
              type="button"
              onClick={() => handleMapSizeChange('normal')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded cursor-pointer transition-all flex items-center gap-1 ${
                activeMapSize === 'normal'
                  ? 'bg-[#9B4DFF]/30 text-white font-semibold border border-[#9B4DFF]/50 shadow-sm'
                  : 'text-[#858593] hover:text-white'
              }`}
              title="Tamanho normal do mapa (420px)"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Normal</span>
            </button>
            <button
              type="button"
              onClick={() => handleMapSizeChange(activeMapSize === 'collapsed' ? 'normal' : 'collapsed')}
              className={`px-2 py-1 text-[11px] font-mono rounded cursor-pointer transition-all flex items-center gap-1 ${
                activeMapSize === 'collapsed'
                  ? 'bg-amber-500/25 text-amber-300 font-semibold border border-amber-500/40 shadow-sm'
                  : 'text-[#858593] hover:text-white'
              }`}
              title={activeMapSize === 'collapsed' ? 'Expandir mapa' : 'Recolher mapa'}
            >
              <span>{activeMapSize === 'collapsed' ? 'Expandir' : 'Recolher'}</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips (Hidden if compact or collapsed to save space) */}
        {activeMapSize !== 'compact' && activeMapSize !== 'collapsed' && (
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">

          </div>
        )}
      </div>

      {/* Map Rendering Container */}
      <div className="relative flex-1 w-full h-full min-h-0">
        {effectiveKey ? (
          <APIProvider
            apiKey={effectiveKey}
            libraries={['places', 'marker', 'geometry', 'core']}
          >
            <Map
  defaultCenter={defaultCenter}
  defaultZoom={13}
  mapId="DEMO_MAP_ID"
  gestureHandling="greedy"
  disableDefaultUI={false}
  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
  style={{ width: '100%', height: '100%' }}
onClick={(e: any) => {
    // Se o usuário clicou especificamente em cima de um ponto de interesse do mapa
    if (e.placeId) {
      // Deixa o fluxo de POI tratar se necessário, ou mantém limpo
      return;
    }
    // Caso contrário, se foi clique vazio na rua, podemos simplesmente fechar o card ou não fazer nada
    // para evitar que apareçam endereços genéricos de ruas:
    // setSelectedPlace(null);
  }}
>
  <MapController
    selectedCenter={selectedCenter}
    searchResults={searchResults}
    onSelectPlaceResult={(p) => setSelectedPlace(p)}
    selectedPlaceResult={selectedPlace}
    activeProspects={activeProspects}
    onSelectProspect={onSelectProspect}
  />
</Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0B0C12] text-[#858593]">
            <MapPin className="w-12 h-12 text-[#9B4DFF]/40 mb-3" />
            <h4 className="text-sm font-mono text-[#F0E9FF] font-semibold mb-1">
              Google Maps
            </h4>
            <p className="text-xs max-w-md font-mono text-[#858593] mb-4">
              Navegue e pesquise estabelecimentos diretamente no mapa.
            </p>
            <button
              onClick={onOpenManualAddModal}
              className="px-4 py-2 bg-[#9B4DFF] hover:bg-[#8534f5] text-white text-xs font-mono font-medium rounded transition-colors"
            >
              + Adicionar Prospect Manualmente
            </button>
          </div>
        )}

        {/* Search error toast if search returned 0 places */}
        {searchError && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-red-950/90 border border-red-500/30 text-red-200 text-xs font-mono px-4 py-2 rounded-lg shadow-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{searchError}</span>
            <button
              onClick={() => setSearchError(null)}
              className="ml-2 text-white/60 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Selected Place Details Card (CONSULTATION ONLY - Never auto-fills CRM) */}
        {selectedPlace && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-30 bg-[#07080C]/95 backdrop-blur-2xl border border-white/15 p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9B4DFF] bg-[#9B4DFF]/10 px-2 py-0.5 rounded border border-[#9B4DFF]/20">
                  {selectedPlace.category || 'Estabelecimento'}
                </span>
                <h3 className="text-sm font-semibold text-[#F0E9FF] mt-1 line-clamp-1">
                  {selectedPlace.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="text-[#858593] hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                title="Fechar consulta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Place Info */}
            <div className="space-y-1.5 text-xs text-[#A0A0B0] font-mono my-2">
              {selectedPlace.rating && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-bold text-white">{selectedPlace.rating.toFixed(1)}</span>
                  {selectedPlace.userRatingCount && (
                    <span className="text-[#858593]">({selectedPlace.userRatingCount} avaliações)</span>
                  )}
                  {selectedPlace.isOpen !== undefined && (
                    <span
                      className={`ml-2 text-[10px] px-1.5 py-0.2 rounded font-sans ${
                        selectedPlace.isOpen
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {selectedPlace.isOpen ? 'Aberto' : 'Fechado'}
                    </span>
                  )}
                </div>
              )}

              {selectedPlace.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#858593] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selectedPlace.address}</span>
                </div>
              )}

              {selectedPlace.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#858593] shrink-0" />
                  <span>{selectedPlace.phone}</span>
                </div>
              )}

              {selectedPlace.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#858593] shrink-0" />
                  <a
                    href={selectedPlace.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#9B4DFF] hover:underline line-clamp-1"
                  >
                    {selectedPlace.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            {/* Consultation Note & Manual Add Button */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#858593] font-mono leading-tight">
              Consulta visual. O cadastro no CRM é preenchido automaticamente.
            </span>

            <button
              onClick={() => {
                // Dispara o evento personalizado ou chama a função passando os dados do place selecionado
                window.dispatchEvent(
                  new CustomEvent('nivra-add-place-to-prospect', { detail: selectedPlace })
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#9B4DFF] hover:bg-[#8534f5] text-white text-xs font-mono font-medium rounded-lg shadow-lg shadow-[#9B4DFF]/20 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar à Prospecção</span>
            </button>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};
