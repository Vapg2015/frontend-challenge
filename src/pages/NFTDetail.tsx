import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { formatETH } from '@/utils/format';
import { api } from '@/api/axios';
import { queryKeys, invalidationHelpers, queryClient } from '@/api/queryClient';
import { Heart, Mail, Minus, Plus, Search, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNFTRealTime } from '@/hooks/useSocket';
import type { NFT } from '@/api/contracts';

export function NFTDetailPage() {
  const { id } = useParams({ from: '/nft/$id' });
  const { addItem, isLoading: cartLoading } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [activeImage, setActiveImage] = useState(0);

  useNFTRealTime(id, () => {
    // Handling real-time events if needed
  });

  const { data: nftResponse, isLoading, error } = useQuery({
    queryKey: queryKeys.nft(id),
    queryFn: () => api.get<NFT>(`/nfts/${id}`),
    enabled: !!id,
  });

  const nft = nftResponse?.data;
  const favoriteStatus = nft ? isFavorite(nft.id) : false;
  const maxQuantity = nft?.edition.available || 1;

  const addToCartMutation = useMutation({
    mutationFn: () => addItem(id, quantity),
    onSuccess: () => invalidationHelpers.cart(queryClient),
  });

  const handleAddToCart = async () => {
    if (!nft || quantity > maxQuantity) return;
    await addToCartMutation.mutateAsync();
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16 text-center text-text-muted">Carregando NFT...</div>;
  }

  if (error || !nft) {
    return <div className="container mx-auto px-4 py-16 text-center">NFT não encontrado.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-16 mb-24">
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="text-sm font-bold text-text-primary mb-4">
            <Link to="/" className="hover:text-amber transition-colors">Início</Link> / <span className="text-text-muted">Mercado</span>
          </div>
          
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="flex flex-col gap-4">
              {[nft.imageUrl, nft.imageUrl, nft.imageUrl, nft.imageUrl].map((img, i) => (
                <button 
                  key={i} 
                  className={`w-14 h-14 rounded-md overflow-hidden border ${activeImage === i ? 'border-amber' : 'border-transparent'} transition-colors bg-surface-card`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {/* Main Image */}
            <div className="flex-1 aspect-square bg-surface-card p-4 relative group">
              <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover rounded-2xl" />
              <button className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-center space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">{nft.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-amber font-bold text-lg">{formatETH(nft.price.amount)}</span>
              <div className="flex items-center text-amber">
                ★★★★★
              </div>
              <span className="text-text-muted">19 avaliações de colecionadores</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-text-primary">Sobre este NFT:</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm text-text-primary">Edição:</h3>
            <div className="flex gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-border-soft text-text-muted">1/1</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-border-soft text-text-muted">1/10</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-amber text-amber">1/50</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-border-soft text-text-muted">ABERTA</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            {/* Quantity Selector */}
            <div className="flex items-center bg-surface-raised rounded-lg p-1 border border-border-soft">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-md bg-amber text-ink flex items-center justify-center hover:bg-amber/90 disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold w-12 text-center text-text-primary">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                className="w-10 h-10 rounded-md bg-amber text-ink flex items-center justify-center hover:bg-amber/90 disabled:opacity-50"
                disabled={quantity >= maxQuantity}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <Button 
              className="bg-amber hover:bg-amber/90 text-ink font-bold h-10 px-8 rounded-sm text-xs"
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || cartLoading || maxQuantity === 0}
            >
              {addToCartMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'COMPRAR'}
            </Button>

            <Button 
              variant="outline" 
              className="h-10 px-5 rounded-sm font-medium text-xs border-border-soft text-text-primary hover:bg-amber/10 transition-colors flex gap-2"
              onClick={() => toggleFavorite(nft.id)}
            >
              <Heart className={`w-5 h-5 ${favoriteStatus ? 'fill-current' : ''}`} />
              Favoritar
            </Button>
          </div>

          <div className="space-y-1.5 text-sm text-text-muted">
            <p><span className="font-bold">ID do token:</span> #{nft.tokenId || '0042'}</p>
            <p><span className="font-bold">Coleção:</span> {nft.collection.name}</p>
            <p><span className="font-bold">Atributos:</span> {nft.properties?.map(p => p.value).join(', ') || 'Óculos, Esmeralda, Raro'}</p>
          </div>

          <div className="flex items-center gap-3 text-sm text-text-primary font-bold">
            Compartilhar este NFT:
            <div className="flex gap-2">
              <button className="text-text-muted hover:text-white transition-colors font-bold text-xs border border-border-soft rounded w-6 h-6 flex items-center justify-center">in</button>
              <button className="text-text-muted hover:text-white transition-colors font-bold text-xs border border-border-soft rounded w-6 h-6 flex items-center justify-center"><Mail className="w-3 h-3" /></button>
              <button className="text-text-muted hover:text-white transition-colors font-bold text-xs border border-border-soft rounded w-6 h-6 flex items-center justify-center">x</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div>
        <div className="flex gap-8 mb-8 border-b border-border-soft">
          <button 
            className={`pb-4 font-bold text-sm transition-colors ${activeTab === 'details' ? 'text-amber border-b-2 border-amber' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('details')}
          >
            Detalhes do NFT
          </button>
          <button 
            className={`pb-4 font-bold text-sm transition-colors ${activeTab === 'reviews' ? 'text-amber border-b-2 border-amber' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('reviews')}
          >
            Avaliações de colecionadores (19)
          </button>
        </div>

        <div className="text-sm text-text-muted space-y-6 max-w-4xl leading-relaxed">
          {activeTab === 'details' ? (
            <>
              <p>Emerald Ape #{nft.tokenId || '042'} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.</p>
              <p>A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.</p>
              
              <div>
                <h4 className="font-bold text-text-primary mb-1">Rede:</h4>
                <p>Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.</p>
              </div>

              <div>
                <h4 className="font-bold text-text-primary mb-1">Contrato:</h4>
                <p>Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</p>
              </div>

              <div>
                <h4 className="font-bold text-text-primary mb-1">Direitos autorais:</h4>
                <p>0x7A42...19E8 • Contrato inteligente ERC-721 verificado.</p>
              </div>
            </>
          ) : (
            <p>Nenhuma avaliação a mostrar por enquanto.</p>
          )}
        </div>
      </div>

      {/* Mais desta coleção (mockup) */}
      <div className="pt-16">
        <h3 className="text-amber font-bold text-sm mb-6 pb-2 border-b border-border-soft">Mais desta coleção</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { id: 118, name: "Cosmic Bloom", price: "1.29 ETH", img: "/src/assets/NFT Artwork 05.svg" },
            { id: 314, name: "Violet Nomad", price: "1.39 ETH", img: "/src/assets/NFT Artwork 04.svg" },
            { id: 808, name: "Ivory Baron", price: "1.79 ETH", img: "/src/assets/NFT Artwork 08.svg" },
            { id: 287, name: "Golden Beat", price: "0.99 ETH", img: "/src/assets/NFT Artwork 06.svg" },
            { id: 160, name: "Golden Signal", price: "0.39 ETH", img: "/src/assets/NFT Artwork 06.svg" }
          ].map((mock, i) => (
             <div key={i} className="bg-transparent space-y-3">
               <div className="aspect-square bg-surface-card p-3 overflow-hidden">
                 <img src={mock.img} alt={mock.name} className="w-full h-full object-cover rounded-lg" />
               </div>
               <div>
                 <p className="font-bold text-sm text-text-primary">{mock.name} #{mock.id}</p>
                 <p className="text-amber font-bold text-sm mt-1">{mock.price}</p>
               </div>
             </div>
          ))}
        </div>
        {/* Carousel indicators */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 rounded-full border border-amber"></div>
          <div className="w-2 h-2 rounded-full bg-amber"></div>
          <div className="w-2 h-2 rounded-full border border-amber"></div>
        </div>
      </div>
    </div>
  );
}
