
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, Card, Seg } from '../components/kit';

export default function Discover() {
  const [format, setFormat] = useState('ODI');
  const [role, setRole] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Automatically reload when format, role, or refreshKey changes.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function fetchPlayers() {
      setLoading(true);
      setError('');
      setData(null);

      try {
        const response = await api.get('/teams/discover', {
          params: {
            format,
            role: role === 'all' ? undefined : role,
            count: 8,
            min_matches: 10,
          },
          signal: controller.signal,
        });

        if (active) {
          setData(response.data);
        }
      } catch (err) {
        if (!active) return;

        if (
          err.code === 'ERR_CANCELED' ||
          err.name === 'CanceledError'
        ) {
          return;
        }

        setError(
          err.response?.data?.detail ||
          'Unable to load player discovery.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchPlayers();

    return () => {
      active = false;
      controller.abort();
    };
  }, [format, role, refreshKey]);

  // Trigger a fresh randomized sample.
  const load = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Player intelligence"
        icon={Compass}
        title="Discover Players"
        desc="Explore a fair random sample of eligible historical cricketers. Each refresh uses reservoir sampling over the filtered records."
      />

      <Card className="p-5 mb-5" hover={false}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Seg
            testid="discover-format"
            options={['ODI', 'Test']}
            value={format}
            onChange={setFormat}
          />

          <select
            className="bg-[#0B110E] rounded-md border border-[#23312A] text-sm text-zinc-200 px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filter players by role"
          >
            <option value="all">All roles</option>
            <option value="batting">Batting</option>
            <option value="bowling">Bowling</option>
            <option value="allround">All-round</option>
            <option value="keeper">Keeper</option>
          </select>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-md text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            Discover another set
          </button>
        </div>
      </Card>

      {error && (
        <div role="alert" className="text-red-300 mb-4">
          {error}
        </div>
      )}

      {loading && (
        <Card className="p-8 text-center" hover={false}>
          <RefreshCw
            size={24}
            className="animate-spin text-emerald-400 mx-auto mb-3"
          />
          <p className="text-zinc-400 text-sm">
            Discovering players...
          </p>
        </Card>
      )}

      {!loading && data && (
        <p className="text-xs text-zinc-500 font-mono mb-4">
          {data.eligible} eligible players · up to 8 uniformly
          sampled without replacement
        </p>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(data?.items || []).map((player) => (
            <Link
              to={`/players/${format}/${player.id}`}
              key={player.id}
            >
              <Card className="p-5 h-full">
                <div className="text-[10px] tracking-widest text-emerald-400 uppercase mb-3">
                  {format} · #{player.id}
                </div>

                <h2 className="text-lg font-bold mb-2">
                  {player.name}
                </h2>

                <p className="text-xs text-zinc-500 mb-4">
                  {player.roles?.length
                    ? player.roles.join(' / ')
                    : 'Career record'}
                </p>

                <div className="grid grid-cols-3 gap-2 text-center border-t border-[#23312A] pt-3">
                  {[
                    ['MATCHES', player.mat],
                    ['RUNS', player.runs],
                    ['WICKETS', player.wkt],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-emerald-400 font-mono font-bold">
                        {value ?? '—'}
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && data && !data.items?.length && (
        <Card className="p-8 text-center text-zinc-400">
          No eligible players. Try another filter.
        </Card>
      )}

      <p className="text-xs text-zinc-500 mt-7">
        Discovery is randomized, not a quality ranking.
        Role labels are inferred from career statistics.
      </p>
    </div>
  );
}
