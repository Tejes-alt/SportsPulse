import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchPlayer, fetchOverview } from '../lib/api';
import {
  fmtInt,
  fmtDec,
  fmtStr,
  span,
  safeDiv,
  initials,
  TIP_STYLE,
} from '../lib/format';
import {
  Stagger,
  Rise,
  Card,
  Eyebrow,
  CountUp,
  Decoded,
  Btn,
  Empty,
  SkeletonCard,
  Tip,
} from '../components/kit';
import {
  ArrowLeft,
  Crown,
  GitCompare,
  ArrowRight,
  Trophy,
  Target,
  Hand,
  Info,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';

function Field({
  label,
  value,
  decoded,
  field,
  sub,
  testid,
}) {
  return (
    <Card className="p-4" testid={testid}>
      <Eyebrow>{label}</Eyebrow>

      <div className="text-2xl font-extrabold font-mono mt-1.5 tabular truncate">
        <Decoded keys={decoded} field={field}>
          {typeof value === 'number' ? (
            <CountUp
              value={value}
              decimals={Number.isInteger(value) ? 0 : 2}
            />
          ) : (
            fmtStr(value)
          )}
        </Decoded>
      </div>

      {sub && (
        <div className="text-[11px] text-zinc-500 mt-1">
          {sub}
        </div>
      )}
    </Card>
  );
}

function Derived({ label, value, note }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1A221E] last:border-0 text-sm">
      <span className="text-zinc-400 flex items-center gap-1.5">
        {label}

        {note && (
          <Tip label={note}>
            <Info className="h-3 w-3 text-zinc-600" />
          </Tip>
        )}
      </span>

      <span className="font-mono font-semibold tabular">
        {value ?? '—'}
      </span>
    </div>
  );
}

export default function PlayerProfile() {
  const { format, id } = useParams();

  const [p, setP] = useState(undefined);
  const [ov, setOv] = useState(null);

  const isOdi = format.toLowerCase() === 'odi';
  const fmt = isOdi ? 'ODI' : 'Test';

  useEffect(() => {
    fetchOverview()
      .then(setOv)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setP(undefined);

    fetchPlayer(format, id)
      .then(setP)
      .catch(() => setP(null));
  }, [format, id]);

  const radar = useMemo(() => {
    if (!p) return [];

    const L = ov?.[isOdi ? 'odi' : 'test']?.leaders;

    const mx = (k, fallback) => {
      const value = L?.[k]?.value;

      if (value) {
        return (
          Number(
            String(value).replace('*', '')
          ) || fallback
        );
      }

      return fallback;
    };

    const pct = (v, m) =>
      Math.min(
        100,
        Math.round(
          ((v || 0) / m) * 100
        )
      );

    return [
      {
        m: 'Runs',
        v: pct(
          p.runs,
          mx('runs', 1)
        ),
        raw: fmtInt(p.runs),
      },
      {
        m: 'Average',
        v: pct(
          p.avg,
          mx('average', 1)
        ),
        raw: fmtDec(p.avg),
      },
      {
        m: 'Wickets',
        v: pct(
          p.wkt,
          mx('wickets', 1)
        ),
        raw: p.wkt,
      },
      {
        m: 'Matches',
        v: pct(
          p.mat,
          mx('matches', 1)
        ),
        raw: p.mat,
      },
      {
        m: 'Catches',
        v: pct(
          p.ca,
          mx('catches', 1)
        ),
        raw: p.ca,
      },
      {
        m: 'High score',
        v: pct(
          p.hs_value,
          mx('highest_score', 1)
        ),
        raw: fmtStr(p.hs),
      },
    ];
  }, [p, isOdi, ov]);

  if (p === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-4">
        <SkeletonCard h={140} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard
              key={i}
              h={90}
            />
          ))}
        </div>
      </div>
    );
  }

  if (p === null) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Empty
          title="Player not found"
          desc={`No ${fmt} player with cap #${id}.`}
          action={
            <Link
              to="/players"
              className="text-emerald-400 text-sm"
            >
              ← Back to players
            </Link>
          }
        />
      </div>
    );
  }

  const cap = p.captaincy;

  const battingShare =
    p.runs + p.wkt * 20 > 0
      ? Math.round(
          (p.runs /
            (p.runs + p.wkt * 20)) *
            100
        )
      : 50;

  const splitData = [
    {
      name: 'Runs',
      v: p.runs,
    },
    {
      name: 'Wickets',
      v: p.wkt,
    },
    {
      name: 'Catches',
      v: p.ca,
    },
    {
      name: 'Stumpings',
      v: p.st,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">

      {/* Back */}
      <Link
        to={`/players?format=${fmt}`}
        data-testid="back-to-players"
        className="text-xs text-zinc-500 hover:text-emerald-400 inline-flex items-center gap-1 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to players
      </Link>

      {/* =====================================================
          HERO
      ====================================================== */}
      <Stagger
        className="relative overflow-hidden rounded-lg border border-[#23312A] bg-[#0F1513] p-6 lg:p-8 mb-6"
        data-testid="player-hero"
      >
        <div className="absolute inset-0 dot-bg opacity-60" />

        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(500px circle at 10% 0%, rgba(16,185,129,0.14), transparent 60%)',
          }}
        />

        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">

          <div className="flex items-start gap-5">

            <Rise
              className="h-20 w-20 shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-2xl font-black text-emerald-300"
              style={{ fontFamily: 'Outfit' }}
            >
              {initials(p.name)}
            </Rise>

            <div>

              <Rise className="text-[10px] uppercase tracking-[0.22em] text-emerald-400 font-medium">
                {fmt} Cap #{p.id} · Rank #{p.rank_runs} of {p.pool} by runs · #{p.rank_wkt} by wickets
              </Rise>

              <Rise>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mt-1.5 leading-none">
                  {p.name}
                </h1>
              </Rise>

              <Rise className="flex flex-wrap gap-2 mt-4">

                <span className="font-mono text-xs px-2 py-1 rounded border border-[#23312A] bg-[#0B110E] text-zinc-300">
                  Career {span(p)}
                </span>

                <span className="font-mono text-xs px-2 py-1 rounded border border-[#23312A] bg-[#0B110E] text-zinc-300">
                  {p.mat} matches
                </span>

                {cap && (
                  <span className="font-mono text-xs px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 inline-flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Captain · {cap.played} matches
                  </span>
                )}

                {p.st > 0 && (
                  <span className="font-mono text-xs px-2 py-1 rounded border border-[#23312A] bg-[#0B110E] text-zinc-300">
                    Wicket-keeper
                  </span>
                )}

                {p.other_format && (
                  <Link
                    to={`/players/${p.other_format.format}/${p.other_format.id}`}
                    data-testid="other-format-link"
                    className="font-mono text-xs px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 inline-flex items-center gap-1"
                  >
                    Also played {p.other_format.format} ·{' '}
                    {p.other_format.mat} mat
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}

              </Rise>
            </div>
          </div>

          {/* Actions */}
          <Rise className="flex gap-2 shrink-0">
            <Link
              to={`/compare?format=${fmt}&a=${p.id}`}
              data-testid="compare-from-profile"
            >
              <Btn variant="ghost">
                <GitCompare className="h-4 w-4" />
                Compare
              </Btn>
            </Link>
          </Rise>

        </div>
      </Stagger>

      {/* =====================================================
          METRICS
      ====================================================== */}
      <Stagger
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        data-testid="metric-grid"
      >
        <Field
          testid="f-mat"
          label="Matches"
          value={p.mat}
        />

        <Field
          testid="f-runs"
          label="Runs"
          value={p.runs}
          sub={`${fmtDec(
            safeDiv(p.runs, p.mat),
            1
          )} per match`}
        />

        <Field
          testid="f-hs"
          label="Highest Score"
          value={p.hs}
          sub={
            p.hs?.includes?.('*')
              ? '* not out'
              : undefined
          }
        />

        <Field
          testid="f-avg"
          label="Batting Average"
          value={p.avg}
          sub={
            p.avg == null
              ? 'Not available in source'
              : undefined
          }
        />

        {isOdi && (
          <Field
            label="Innings"
            value={p.inn}
          />
        )}

        {isOdi && (
          <Field
            label="Not Outs"
            value={p.no}
            sub={
              p.inn
                ? `${Math.round(
                    (p.no / p.inn) * 100
                  )}% of innings`
                : undefined
            }
          />
        )}

        {!isOdi && (
          <Field
            label="100s / 50s"
            value={p.hundreds_fifties}
            decoded={p.decoded}
            field="hundreds_fifties"
          />
        )}

        <Field
          testid="f-wkt"
          label="Wickets"
          value={p.wkt}
        />

        <Field
          label="Bowling Average"
          value={p.bowl_avg}
          sub={
            p.bowl_avg == null
              ? 'No bowling record'
              : 'runs per wicket'
          }
        />

        {isOdi ? (
          <Field
            label="Best Bowling"
            value={p.bbm}
            decoded={p.decoded}
            field="bbm"
            sub="wickets / runs"
          />
        ) : (
          <Field
            label="Best Innings Bowling"
            value={p.bbi}
            decoded={p.decoded}
            field="bbi"
            sub="wickets / runs"
          />
        )}

        {isOdi ? (
          <Field
            label="Balls Bowled"
            value={p.balls}
            sub={`${p.mdn} maidens`}
          />
        ) : (
          <Field
            label="5w / 10w hauls"
            value={p.five_ten}
            decoded={p.decoded}
            field="five_ten"
          />
        )}

        <Field
          label="Catches"
          value={p.ca}
        />

        <Field
          label="Stumpings"
          value={p.st}
        />
      </Stagger>

      {/* =====================================================
          LOWER ANALYTICS
      ====================================================== */}
      <Stagger className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Derived Metrics */}
        <Card
          className="p-6 lg:col-span-1"
          testid="derived-card"
        >
          <Eyebrow>
            Career overview
          </Eyebrow>

          <h3 className="text-lg font-bold mt-1 mb-3">
            Derived metrics
          </h3>

          <div className="mb-4">

            <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
              <span>Batting weight</span>
              <span>Bowling weight</span>
            </div>

            <div className="h-2 rounded-full bg-[#23312A] overflow-hidden flex">

              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${battingShare}%`,
                }}
                transition={{
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="bg-emerald-500"
              />

              <div className="flex-1 bg-amber-500/70" />
            </div>

            <div className="text-[10px] text-zinc-600 mt-1">
              runs vs wickets×20 — visual
              proportion only
            </div>
          </div>

          <Derived
            label="Runs per match"
            value={fmtDec(
              safeDiv(p.runs, p.mat),
              2
            )}
          />

          <Derived
            label="Wickets per match"
            value={fmtDec(
              safeDiv(p.wkt, p.mat),
              2
            )}
          />

          <Derived
            label="Catches per match"
            value={fmtDec(
              safeDiv(p.ca, p.mat),
              2
            )}
          />

          {isOdi && (
            <Derived
              label="Runs per innings"
              value={fmtDec(
                safeDiv(p.runs, p.inn),
                2
              )}
            />
          )}

          {isOdi && (
            <Derived
              label="Bowling economy"
              value={
                p.balls
                  ? fmtDec(
                      p.bowl_runs /
                        (p.balls / 6),
                      2
                    )
                  : null
              }
              note="bowling runs ÷ overs (balls/6)"
            />
          )}

          {isOdi && (
            <Derived
              label="Strike rate (bowling)"
              value={
                p.wkt
                  ? fmtDec(
                      p.balls / p.wkt,
                      1
                    )
                  : null
              }
              note="balls per wicket"
            />
          )}

          <Derived
            label="Dismissals (ct + st)"
            value={fmtInt(
              p.ca + p.st
            )}
          />

          <Derived
            label="Career span"
            value={
              p.first && p.last
                ? `${Math.max(
                    0,
                    Number(p.last) -
                      Number(p.first)
                  )} yrs`
                : null
            }
          />
        </Card>

        {/* Radar */}
        <Card
          className="p-6"
          testid="radar-card"
        >
          <Eyebrow>
            Performance radar
          </Eyebrow>

          <h3 className="text-lg font-bold mt-1">
            Skill profile
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <RadarChart data={radar}>
              <PolarGrid
                stroke="#23312A"
              />

              <PolarAngleAxis
                dataKey="m"
                tick={{
                  fill: '#9CA3AF',
                  fontSize: 11,
                }}
              />

              <PolarRadiusAxis
                stroke="#23312A"
                tick={false}
                axisLine={false}
                domain={[0, 100]}
              />

              <Radar
                dataKey="v"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.35}
                animationDuration={1000}
              />

              <Tooltip
                contentStyle={TIP_STYLE}
                formatter={(
                  v,
                  n,
                  item
                ) => [
                  item.payload.raw,
                  'Actual',
                ]}
              />
            </RadarChart>
          </ResponsiveContainer>

          <div className="text-[11px] text-zinc-600">
            Scaled 0–100 against the {fmt}{' '}
            dataset maximum; hover for actual
            values.
          </div>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Contribution Split */}
          <Card
            className="p-6"
            testid="split-card"
          >
            <Eyebrow>
              Contribution split
            </Eyebrow>

            <h3 className="text-lg font-bold mt-1 mb-2">
              Raw output
            </h3>

            <ResponsiveContainer
              width="100%"
              height={150}
            >
              <BarChart
                data={splitData}
                layout="vertical"
                margin={{
                  left: -10,
                  right: 20,
                }}
              >
                <XAxis
                  type="number"
                  hide
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />

                <Tooltip
                  contentStyle={TIP_STYLE}
                  cursor={{
                    fill: 'rgba(16,185,129,0.05)',
                  }}
                />

                <Bar
                  dataKey="v"
                  radius={[
                    0,
                    4,
                    4,
                    0,
                  ]}
                  animationDuration={900}
                >
                  {splitData.map(
                    (d, i) => (
                      <Cell
                        key={i}
                        fill={
                          [
                            '#10B981',
                            '#F59E0B',
                            '#34D399',
                            '#A3E635',
                          ][i]
                        }
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Captaincy */}
          <Card
            className="p-6"
            testid="captaincy-card"
          >
            <div className="flex items-center justify-between">

              <div>
                <Eyebrow>
                  Leadership
                </Eyebrow>

                <h3 className="text-lg font-bold mt-1">
                  {fmt} captaincy
                </h3>
              </div>

              <Crown
                className={`h-4 w-4 ${
                  cap
                    ? 'text-amber-400'
                    : 'text-zinc-600'
                }`}
              />
            </div>

            {cap ? (
              <div className="mt-3">

                <div className="grid grid-cols-3 gap-2 font-mono">

                  {[
                    [
                      'Led',
                      cap.played,
                      Trophy,
                    ],
                    [
                      'Won',
                      cap.won,
                      Target,
                    ],
                    [
                      'Lost',
                      cap.lost,
                      Hand,
                    ],
                  ].map(
                    ([label, value, Icon]) => (
                      <div
                        key={label}
                        className="rounded-md border border-[#23312A] bg-[#0B110E] p-2.5"
                      >
                        <div className="text-[9px] uppercase tracking-widest text-zinc-500">
                          {label}
                        </div>

                        <div className="text-lg font-bold tabular">
                          {value}
                        </div>
                      </div>
                    )
                  )}

                </div>

                <div className="mt-3 text-xs text-zinc-400 flex justify-between">
                  <span>
                    {cap.year}
                  </span>

                  <span>
                    {isOdi
                      ? `${cap.tied} tied · ${cap.no_result} NR`
                      : `${cap.tied} drawn`}
                  </span>
                </div>

                <div className="mt-2 h-2 rounded-full bg-[#23312A] overflow-hidden">

                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        100,
                        cap.win_pct
                      )}%`,
                    }}
                    transition={{
                      duration: 0.9,
                    }}
                    className="h-full bg-amber-400"
                  />

                </div>

                <div className="mt-1.5 flex justify-between text-xs">
                  <span className="text-zinc-500">
                    Win rate
                  </span>

                  <span className="font-mono font-bold text-amber-300">
                    {cap.win_pct}%
                  </span>
                </div>

                <Link
                  to="/captains"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  All captains
                  <ArrowRight className="h-3 w-3" />
                </Link>

              </div>
            ) : (
              <div className="text-sm text-zinc-500 mt-3">
                No {fmt} captaincy record in the
                dataset.
              </div>
            )}
          </Card>

        </div>
      </Stagger>
    </div>
  );
}