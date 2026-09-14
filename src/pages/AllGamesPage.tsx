import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { GAMES, GAME_CATEGORIES } from '../data/games';
import GameCard from '../components/UI/GameCard';
import NoticeBanner from '../components/UI/NoticeBanner';

export default function AllGamesPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    return GAMES.filter(game => {
      const matchesSearch = search === '' ||
        game.name.toLowerCase().includes(search.toLowerCase()) ||
        game.skill.toLowerCase().includes(search.toLowerCase()) ||
        game.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || game.categoryTag === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="bg-page" style={{ paddingBottom: '3rem' }}>
      {/* Page header */}
      <div style={{ borderBottom: '4px solid var(--border)', padding: 'clamp(1.5rem, 4vw, 3rem) 0', background: 'var(--bg)' }}>
        <div className="container-page">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>All Cognitive Games</h1>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Explore every game, understand the skill being tested and start practicing.
          </p>
        </div>
      </div>

      <div className="container-page" style={{ paddingTop: '1.5rem' }}>
        {/* Notice */}
        <div style={{ marginBottom: '2rem' }}>
          <NoticeBanner compact />
        </div>

        {/* Search + Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-primary)' }} />
            <input
              id="games-search"
              className="input-field"
              type="search"
              placeholder="SEARCH GAMES..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '3rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
            />
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {GAME_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-chip${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontFamily: 'var(--font-mono)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontSize: '0.75rem',
                  padding: '0.5rem 1rem',
                  border: '2px solid var(--border)',
                  background: activeCategory === cat ? 'var(--text-primary)' : 'var(--bg)',
                  color: activeCategory === cat ? 'var(--bg)' : 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Showing {filtered.length} of {GAMES.length} games
            {activeCategory !== 'All' && ` in "${activeCategory}"`}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {/* Game grid */}
        {filtered.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
            gap: 'clamp(1rem, 2vw, 1.5rem)',
          }}>
            {filtered.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '2px solid var(--border)', background: 'var(--bg)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>No games found</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Try a different search or filter</p>
            <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => { setSearch(''); setActiveCategory('All'); }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
