"""Data-backed XI construction. Roles are statistical proxies, not certified positions."""
from collections import Counter
from math import log1p
from random import Random, SystemRandom
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

ROLES = ('batting', 'bowling', 'allround', 'keeper')
DEFAULT_QUOTAS = {'batting': 4, 'bowling': 4, 'allround': 2, 'keeper': 1}
WEIGHTS = {
    'balanced': (0.48, 0.42, 0.10),
    'batting': (0.70, 0.22, 0.08),
    'bowling': (0.24, 0.69, 0.07),
}

class TeamRequest(BaseModel):
    format: str = 'ODI'
    strategy: str = 'balanced'
    quotas: Dict[str, int] = Field(default_factory=lambda: dict(DEFAULT_QUOTAS))
    min_matches: int = Field(default=10, ge=0, le=1000)
    candidate_ids: Optional[List[int]] = None
    method: str = 'optimal'
    exclude_ids: List[int] = Field(default_factory=list)


def validate_request(req: TeamRequest):
    if req.format.lower() not in ('odi', 'test'):
        raise ValueError('Format must be ODI or Test.')
    if req.strategy not in WEIGHTS:
        raise ValueError('Unknown selection strategy.')
    if req.method not in ('optimal', 'quick'):
        raise ValueError('Method must be optimal or quick.')
    if set(req.quotas) != set(ROLES) or any(type(v) is not int or v < 0 or v > 11 for v in req.quotas.values()):
        raise ValueError('Provide nonnegative role quotas for batting, bowling, allround and keeper.')
    if sum(req.quotas.values()) != 11:
        raise ValueError('Role quotas must total exactly 11.')
    if req.candidate_ids is not None and len(req.candidate_ids) > 2000:
        raise ValueError('Select at most 2000 candidate IDs.')


def profile(p):
    """Role eligibility inferred conservatively from aggregate records; explicit role labels are unavailable."""
    matches = max(0, p.get('mat') or 0)
    runs, wkts, stumpings = max(0, p.get('runs') or 0), max(0, p.get('wkt') or 0), max(0, p.get('st') or 0)
    # These describe observed statistical evidence, NOT formal player positions.
    bat = runs >= 100 or (matches >= 5 and runs / max(1, matches) >= 12)
    bowl = wkts >= 5 or (matches >= 5 and wkts / max(1, matches) >= 0.35)
    roles = []
    if bat: roles.append('batting')
    if bowl: roles.append('bowling')
    if bat and bowl: roles.append('allround')
    if stumpings > 0: roles.append('keeper')
    return roles


def scores(p, strategy='balanced'):
    # Bounded feature transformations reduce career-length bias without declaring future predictive power.
    matches = max(1, p.get('mat') or 0)
    runs = max(0, p.get('runs') or 0)
    wkts = max(0, p.get('wkt') or 0)
    average = max(0, p.get('avg') or 0)
    bowlavg = p.get('bowl_avg')
    batting = min(100, 32 * log1p(runs) / log1p(10000) + 48 * min(average, 60) / 60 + 20 * min(matches, 100) / 100)
    bowling = min(100, 54 * log1p(wkts) / log1p(500) + (26 * max(0, (65 - bowlavg) / 55) if bowlavg and wkts else 0) + 20 * min(matches, 100) / 100)
    fielding = min(100, 100 * (1 - 1 / (1 + (max(0, p.get('ca') or 0) + 1.8 * max(0, p.get('st') or 0)) / 45)))
    w = WEIGHTS[strategy]
    role_scores = {
        'batting': .82 * batting + .12 * fielding + .06 * bowling,
        'bowling': .82 * bowling + .12 * fielding + .06 * batting,
        'allround': .47 * batting + .47 * bowling + .06 * fielding,
        'keeper': .58 * batting + .42 * fielding,
    }
    # Strategy weights affect player contribution while role suitability remains dominant.
    bonus = w[0] * batting + w[1] * bowling + w[2] * fielding
    return {k: round(.74 * s + .26 * bonus, 3) for k, s in role_scores.items()}


class Edge:
    def __init__(self, to, rev, cap, cost):
        self.to, self.rev, self.cap, self.cost = to, rev, cap, cost


def add_edge(graph, u, v, cap, cost):
    graph[u].append(Edge(v, len(graph[v]), cap, cost))
    graph[v].append(Edge(u, len(graph[u]) - 1, 0, -cost))


def optimal_assignment(pool, quotas, strategy):
    """Successive shortest augmenting paths; integer flow, integral assignment."""
    n = len(pool)
    source, first_player, first_role, sink = 0, 1, 1 + n, 1 + n + 4
    graph = [[] for _ in range(sink + 1)]
    for i, p in enumerate(pool):
        add_edge(graph, source, first_player + i, 1, 0)
        for j, role in enumerate(ROLES):
            if role in p['roles'] and quotas[role]:
                # Nonnegative forward costs; maximize score by minimizing 100-score.
                add_edge(graph, first_player + i, first_role + j, 1, round((100 - p['scores'][role]) * 1000))
    for j, role in enumerate(ROLES):
        add_edge(graph, first_role + j, sink, quotas[role], 0)
    flow = 0
    while flow < 11:
        dist = [float('inf')] * len(graph)
        prev = [None] * len(graph)
        dist[source] = 0
        # Residual graph has negative reverse arcs, so use Bellman-Ford.
        for _ in range(len(graph) - 1):
            changed = False
            for u in range(len(graph)):
                if dist[u] == float('inf'): continue
                for j, edge in enumerate(graph[u]):
                    if edge.cap and dist[u] + edge.cost < dist[edge.to]:
                        dist[edge.to] = dist[u] + edge.cost
                        prev[edge.to] = (u, j)
                        changed = True
            if not changed: break
        if prev[sink] is None: break
        v = sink
        while v != source:
            u, j = prev[v]
            edge = graph[u][j]
            edge.cap -= 1
            graph[v][edge.rev].cap += 1
            v = u
        flow += 1
    selected = []
    for i, p in enumerate(pool):
        for e in graph[first_player + i]:
            if first_role <= e.to < sink and e.cap == 0:
                role = ROLES[e.to - first_role]
                selected.append((p, role))
    return selected, flow


def quick_assignment(pool, quotas):
    # Feasibility-first greedy heuristic, not a proven constant-ratio approximation.
    remaining = dict(quotas)
    chosen = set()
    result = []
    for role in sorted(ROLES, key=lambda r: sum(r in p['roles'] for p in pool) / max(1, quotas[r]) if quotas[r] else 9999):
        eligible = sorted((p for p in pool if role in p['roles'] and p['id'] not in chosen), key=lambda p: p['scores'][role], reverse=True)
        for p in eligible[:remaining[role]]:
            chosen.add(p['id']); result.append((p, role))
        remaining[role] -= min(len(eligible), remaining[role])
    return result, len(result)


def build_team(players, req: TeamRequest):
    validate_request(req)
    ids = set(req.candidate_ids) if req.candidate_ids is not None else None
    excluded = set(req.exclude_ids)
    pool = []
    for p in players:
        if p['id'] in excluded or (ids is not None and p['id'] not in ids) or (p.get('mat') or 0) < req.min_matches:
            continue
        roles = profile(p)
        if not roles: continue
        pool.append({'id': p['id'], 'name': p['name'], 'mat': p['mat'], 'runs': p['runs'], 'wkt': p['wkt'], 'avg': p.get('avg'), 'ca': p.get('ca'), 'st': p.get('st'), 'roles': roles, 'scores': scores(p, req.strategy)})
    counts = Counter(role for p in pool for role in p['roles'])
    if req.method == 'quick':
        selected, flow = quick_assignment(pool, req.quotas)
    else:
        selected, flow = optimal_assignment(pool, req.quotas, req.strategy)
    result = [{**{k:v for k,v in p.items() if k != 'scores'}, 'assigned_role': role, 'score': round(p['scores'][role],2)} for p,role in selected]
    result.sort(key=lambda p: (ROLES.index(p['assigned_role']), -p['score']))
    full = flow == 11
    return {'feasible': full, 'filled': flow, 'required': 11, 'team': result, 'score': round(sum(x['score'] for x in result),2), 'role_counts': dict(counts), 'quotas': req.quotas, 'candidate_count': len(pool), 'strategy': req.strategy, 'method': req.method, 'message': ('Valid 11-player lineup.' if full else 'Cannot fill all 11 slots. Check candidate pool, minimum matches, and role eligibility.'), 'disclaimer': 'Roles are inferred from career aggregates; historical scores are not predictions. No official player-position dataset is included.'}


def reservoir(players, count=6, min_matches=10, role=None, seed=None):
    rng = Random(seed) if seed is not None else SystemRandom()
    result = []
    seen = 0
    for p in players:
        if (p.get('mat') or 0) < min_matches or (role and role not in profile(p)):
            continue
        seen += 1
        if len(result) < count:
            result.append(p)
        else:
            j = rng.randrange(seen)
            if j < count: result[j] = p
    return {'eligible': seen, 'items': [{**{k:p.get(k) for k in ('id','name','mat','runs','wkt','avg','ca','st','format')}, 'roles':profile(p)} for p in result]}
