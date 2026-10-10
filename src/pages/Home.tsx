import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch, Outlet } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { api } from '@/api/axios';
import { queryKeys } from '@/api/queryClient';
import type { NFTListParams, PaginatedResponse, NFT, Collection } from '@/api/contracts';
import { formatETH } from '@/utils/format';

export function HomePage() {
  const search = useSearch({ strict: false }) as any;
  const navigate = useNavigate({ strict: false }) as any;

  const queryParams: NFTListParams = {
    search: search.search,
    collectionId: search.collection,
    status: search.status,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sortBy: search.sortBy ?? 'createdAt',
    sortOrder: search.sortOrder ?? 'desc',
    page: search.page ?? 1,
    pageSize: search.pageSize ?? 6, // Updated to 6 to match design
  };

  const {
    data: nftsResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.nfts({ ...queryParams }),
    queryFn: ({ signal }) => api.get<PaginatedResponse<NFT>>('/nfts', { params: queryParams, signal }),
    placeholderData: (previous) => previous,
  });

  useQuery({
    queryKey: queryKeys.collections(),
    queryFn: ({ signal }) => api.get<Collection[]>('/collections', { signal }),
    staleTime: 5 * 60_000,
  });

  const nfts = nftsResponse?.data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8 mb-24">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center gap-12 py-12 mb-16">
        <div className="lg:w-1/2 space-y-6">
          <p className="text-sm font-bold tracking-widest text-text-muted">Bem-vindo à Kurio</p>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary leading-[1.1] tracking-wide uppercase drop-shadow-sm">
            SEJA DONO DO FUTURO<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber to-coral">DA ARTE DIGITAL</span>
          </h1>
          <p className="text-text-muted max-w-lg leading-relaxed text-sm font-medium">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <Button className="bg-amber hover:bg-amber/90 text-ink font-bold h-12 px-10 rounded-sm uppercase text-xs tracking-[0.2em] shadow-[0_0_20px_rgba(227,164,78,0.3)] transition-all hover:shadow-[0_0_30px_rgba(227,164,78,0.5)] hover:-translate-y-0.5">
            Explorar Coleção
          </Button>
          <div className="flex gap-3 pt-6">
            <div className="w-8 h-1 rounded-full bg-amber shadow-[0_0_8px_rgba(227,164,78,0.6)]"></div>
            <div className="w-8 h-1 rounded-full bg-border-soft hover:bg-amber/50 transition-colors cursor-pointer"></div>
            <div className="w-8 h-1 rounded-full bg-border-soft hover:bg-amber/50 transition-colors cursor-pointer"></div>
          </div>
        </div>
        <div className="lg:w-1/2 relative">
          <div className="absolute inset-0 bg-amber/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface-dark border border-border/50 shadow-2xl relative z-10">
            <img src="/src/assets/hero.png" alt="Hero" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/src/assets/NFT Artwork 07.svg" }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 space-y-10">
          <div>
            <h3 className="font-bold text-text-primary mb-6 tracking-wide">Coleções</h3>
            <ul className="space-y-4">
              {[
                { name: 'Arte digital', count: 83 },
                { name: 'Fotografia', count: 12 },
                { name: 'Música', count: 65 },
                { name: 'Arte 3D', count: 39 },
                { name: 'Colecionáveis', count: 23 },
                { name: 'Generativa', count: 17 },
                { name: 'Jogos', count: 98 },
                { name: 'Assinaturas', count: 11 },
                { name: 'Utilidade', count: 10 },
              ].map(c => (
                <li key={c.name} className="flex justify-between items-center text-sm">
                  <span className="text-text-muted hover:text-amber cursor-pointer transition-colors">{c.name}</span>
                  <span className="text-text-muted text-xs font-mono">({c.count})</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-text-primary mb-6 tracking-wide">Faixa de preço</h3>
            <div className="space-y-4">
              <div className="h-1 bg-border-soft rounded-full relative">
                <div className="absolute left-0 w-3/4 h-full bg-amber rounded-full"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber rounded-full"></div>
                <div className="absolute left-3/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber rounded-full"></div>
              </div>
              <div className="text-xs text-text-muted font-mono pt-2">
                Preço: 0.01 - 12.50 ETH
              </div>
              <Button variant="outline" className="h-8 border-amber text-amber hover:bg-amber/10 w-24 text-xs font-bold">
                Aplicar
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-text-primary mb-6 tracking-wide">Rede</h3>
            <ul className="space-y-4 text-sm text-text-muted">
              <li className="flex justify-between items-center"><span>Ethereum</span><span className="text-xs font-mono">(113)</span></li>
              <li className="flex justify-between items-center"><span>Polygon</span><span className="text-xs font-mono">(78)</span></li>
              <li className="flex justify-between items-center"><span>Solana</span><span className="text-xs font-mono">(56)</span></li>
            </ul>
          </div>

          <div className="bg-surface-card border border-border-soft rounded-xl p-6 text-center">
            <h3 className="text-amber font-bold tracking-widest text-sm mb-1 uppercase">NFT Em Destaque</h3>
            <p className="text-text-primary font-bold mb-6 text-sm">OFERTA LIMITADA</p>
            <div className="aspect-square rounded-lg overflow-hidden bg-background">
              <img src="/src/assets/NFT Artwork 07.svg" alt="Destaque" className="w-full h-full object-cover" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Tabs and Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-end border-b border-border-soft pb-2">
            <div className="flex gap-6 text-sm font-bold">
              <button className="text-amber border-b-2 border-amber pb-2">Todos os NFTs</button>
              <button className="text-text-muted hover:text-text-primary pb-2">Novos Lançamentos</button>
              <button className="text-text-muted hover:text-text-primary pb-2">Em alta</button>
            </div>
            <div className="text-xs text-text-muted pb-2">
              Ordenar por: Listados recentemente
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-text-muted">Carregando NFTs...</div>
            ) : isError ? (
              <div className="col-span-full py-12 text-center text-error">Falha ao carregar NFTs.</div>
            ) : nfts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-text-muted">Nenhum NFT encontrado.</div>
            ) : (
              nfts.map((nft, idx) => (
                <div key={nft.id} className="group cursor-pointer flex flex-col" onClick={() => navigate({ to: '/nft/$id', params: { id: nft.id } })}>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-dark border border-border-soft mb-4 shadow-lg group-hover:border-amber/50 transition-colors">
                    {/* Badge RARO */}
                    {(idx === 0 || idx === 3) && (
                      <div className="absolute top-3 left-3 z-10 bg-amber text-ink text-[10px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-md">
                        Raro
                      </div>
                    )}
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { e.currentTarget.src = "/src/assets/NFT Artwork 03.svg" }}
                    />
                    {/* Hover overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="px-1">
                    <h3 className="font-bold text-sm text-text-primary truncate mb-1 group-hover:text-amber transition-colors">{nft.name} #{nft.tokenId || '0000'}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-amber font-bold text-sm tracking-tight">{formatETH(nft.price.amount)}</span>
                        {nft.price.usdEquivalent && (
                          <span className="text-text-muted text-xs font-medium">{nft.price.usdEquivalent.toString()} ETH</span>
                        )}
                      </div>
                      <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Comprar →
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-end gap-2 pt-4">
            <button className="w-8 h-8 flex items-center justify-center rounded bg-amber text-ink font-bold text-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-soft text-text-muted hover:text-white text-sm">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-soft text-text-muted hover:text-white text-sm">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-soft text-text-muted hover:text-white text-sm">4</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-soft text-text-muted hover:text-white text-sm">&gt;</button>
          </div>

          {/* Banners */}
          <div className="grid md:grid-cols-2 gap-6 pt-16">
            <div className="bg-surface-card rounded-xl overflow-hidden border border-border-soft flex">
              <div className="w-1/3 bg-background">
                <img src="/src/assets/NFT Collection Artwork 01.svg" className="w-full h-full object-cover" />
              </div>
              <div className="w-2/3 p-6 flex flex-col justify-center">
                <h3 className="font-bold text-text-primary mb-2">Lançamentos gênesis de edição limitada</h3>
                <p className="text-xs text-text-muted mb-4">Colecione edições escassas diretamente dos criadores antes da revelação pública.</p>
                <Button className="bg-amber text-ink font-bold h-8 text-xs w-fit px-4">Explorar →</Button>
              </div>
            </div>
            <div className="bg-surface-card rounded-xl overflow-hidden border border-border-soft flex">
              <div className="w-1/3 bg-background">
                <img src="/src/assets/NFT Collection Artwork 06.svg" className="w-full h-full object-cover" />
              </div>
              <div className="w-2/3 p-6 flex flex-col justify-center">
                <h3 className="font-bold text-text-primary mb-2">Arte digital selecionada e muito mais</h3>
                <p className="text-xs text-text-muted mb-4">Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.</p>
                <Button className="bg-amber text-ink font-bold h-8 text-xs w-fit px-4">Explorar →</Button>
              </div>
            </div>
          </div>

          {/* Diário da Cunhagem */}
          <div className="pt-16 text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Diário da Cunhagem</h2>
            <p className="text-xs text-text-muted mb-10">Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
              {[
                { title: 'Como funciona a propriedade de NFTs', date: '12 de setembro', read: 'Leitura de 4 min', img: '/src/assets/NFT Artwork 08.svg' },
                { title: '10 artistas digitais para acompanhar', date: '12 de outubro', read: 'Leitura de 2 min', img: '/src/assets/hero.png' },
                { title: 'Raridade, atributos e procedência', date: '15 de outubro', read: 'Leitura de 3 min', img: '/src/assets/NFT Artwork 04.svg' },
                { title: 'Como proteger sua carteira', date: '16 de outubro', read: 'Leitura de 5 min', img: '/src/assets/NFT Artwork 06.svg' }
              ].map((article, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border border-border-soft mb-4">
                    <img src={article.img} className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={(e) => { e.currentTarget.src = "/src/assets/Image.svg" }} />
                  </div>
                  <div className="text-[10px] text-text-muted mb-2 font-mono uppercase">{article.date} | {article.read}</div>
                  <h3 className="font-bold text-sm text-text-primary leading-tight mb-2 group-hover:text-amber transition-colors">{article.title}</h3>
                  <p className="text-xs text-text-muted mb-2 line-clamp-2">Aprenda a selecionar, negociar e verificar ativos digitais.</p>
                  <span className="text-amber text-[10px] font-bold uppercase tracking-wider">Ler mais →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}