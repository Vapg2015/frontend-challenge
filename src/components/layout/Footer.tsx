import { Button } from '@/components/ui/button';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20">
      <div className="container mx-auto px-4">
        {/* Top Section - Info Cards & Newsletter */}
        <div className="bg-surface-card flex flex-col lg:flex-row gap-8 lg:gap-0 px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 flex-1 md:divide-x md:divide-primary-dark/60">
            <div className="flex flex-col md:px-8 first:md:pl-0">
              <div className="bg-amber text-ink w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">W</div>
              <h3 className="font-bold text-lg mb-2">Segurança da carteira</h3>
              <p className="text-sm text-text-muted">Proteja sua carteira e colecione arte digital verificada com confiança.</p>
            </div>
            <div className="flex flex-col md:px-8">
              <div className="bg-amber text-ink w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">C</div>
              <h3 className="font-bold text-lg mb-2">Criadores em destaque</h3>
              <p className="text-sm text-text-muted">Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p>
            </div>
            <div className="flex flex-col md:px-8">
              <div className="bg-amber text-ink w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">D</div>
              <h3 className="font-bold text-lg mb-2">Alertas de lançamentos</h3>
              <p className="text-sm text-text-muted">Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.</p>
            </div>
          </div>

          <div className="lg:w-1/3 flex flex-col justify-start lg:pl-8 lg:border-l lg:border-primary-dark/60">
            <h3 className="font-bold text-lg mb-4">Antecipe-se ao próximo lançamento</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="digite seu e-mail..."
                className="flex-1 bg-surface-card border border-border rounded px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button className="bg-amber text-ink hover:bg-amber/90 font-bold px-6">Enviar</Button>
            </div>
            <p className="text-xs text-text-muted">Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="bg-surface-dark grid grid-cols-1 md:grid-cols-4 gap-4 items-center px-8 py-6">
          <div className="font-bold tracking-widest text-sm text-text-primary">KURIO</div>
          <div className="text-xs text-text-primary">Feito para colecionadores, criadores e cultura</div>
          <div className="text-xs text-text-primary">contato@email.com</div>
          <div className="text-xs text-text-primary">+55 11 4002 8922</div>
        </div>

        {/* Bottom Links Grid */}
        <div className="bg-surface-card grid grid-cols-2 md:grid-cols-4 gap-8 px-8 py-8">
          <div>
            <h4 className="font-bold mb-4">Meu perfil</h4>
            <ul className="space-y-3">
              <li><a href="/account/profile" className="text-sm text-text-muted hover:text-white transition-colors">Meu perfil</a></li>
              <li><a href="/account/collections" className="text-sm text-text-muted hover:text-white transition-colors">Minha coleção</a></li>
              <li><a href="/account/activity" className="text-sm text-text-muted hover:text-white transition-colors">Atividade</a></li>
              <li><a href="/creator-studio" className="text-sm text-text-muted hover:text-white transition-colors">Estúdio do criador</a></li>
              <li><a href="/favorites" className="text-sm text-text-muted hover:text-white transition-colors">Lista de interesse</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Central de ajuda</h4>
            <ul className="space-y-3">
              <li><a href="/help" className="text-sm text-text-muted hover:text-white transition-colors">Central de ajuda</a></li>
              <li><a href="/how-to-buy" className="text-sm text-text-muted hover:text-white transition-colors">Como comprar NFTs</a></li>
              <li><a href="/security" className="text-sm text-text-muted hover:text-white transition-colors">Carteira e segurança</a></li>
              <li><a href="/policy" className="text-sm text-text-muted hover:text-white transition-colors">Política do mercado</a></li>
              <li><a href="/report" className="text-sm text-text-muted hover:text-white transition-colors">Denunciar item</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Coleções</h4>
            <ul className="space-y-3">
              <li><a href="/collections/digital-art" className="text-sm text-text-muted hover:text-white transition-colors">Arte digital</a></li>
              <li><a href="/collections/photography" className="text-sm text-text-muted hover:text-white transition-colors">Fotografia</a></li>
              <li><a href="/collections/music" className="text-sm text-text-muted hover:text-white transition-colors">Música</a></li>
              <li><a href="/collections/3d-art" className="text-sm text-text-muted hover:text-white transition-colors">Arte 3D</a></li>
              <li><a href="/collections/utility" className="text-sm text-text-muted hover:text-white transition-colors">Utilidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Redes sociais</h4>
            <div className="flex gap-4 mb-8">
              <a href="#" className="w-10 h-10 rounded border border-border-soft flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-all font-bold text-sm">f</a>
              <a href="#" className="w-10 h-10 rounded border border-border-soft flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-all font-bold text-sm">ig</a>
              <a href="#" className="w-10 h-10 rounded border border-border-soft flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-all font-bold text-sm">x</a>
              <a href="#" className="w-10 h-10 rounded border border-border-soft flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-all font-bold text-sm">in</a>
              <a href="#" className="w-10 h-10 rounded border border-border-soft flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-all font-bold text-sm">yt</a>
            </div>

            <h4 className="font-bold mb-4">Carteiras compatíveis</h4>
            <div className="flex gap-4 items-center">
              <span className="text-[10px] tracking-wider font-bold text-text-muted border border-border-soft px-2 py-1 rounded">METAMASK</span>
              <span className="text-[10px] tracking-wider font-bold text-text-muted border border-border-soft px-2 py-1 rounded">WALLETCONNECT</span>
              <span className="text-[10px] tracking-wider font-bold text-text-muted border border-border-soft px-2 py-1 rounded">COINBASE</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 text-center text-xs text-text-primary">
          © {currentYear} Kurio. Propriedade digital para todos.
        </div>
      </div>
    </footer>
  );
}