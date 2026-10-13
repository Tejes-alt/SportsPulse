import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from team_engine import TeamRequest, build_team, reservoir, profile, optimal_assignment


def make_player(i, runs=1000, wickets=70, st=0):
    return {'id': i, 'name': f'Player {i}', 'mat': 80, 'runs': runs,
            'avg': 37, 'wkt': wickets, 'bowl_avg': 29,
            'ca': 24, 'st': st}


def test_valid_team_and_unique_players():
    players = [make_player(i, st=2 if i < 3 else 0) for i in range(25)]
    result = build_team(players, TeamRequest())
    assert result['feasible']
    assert len(result['team']) == 11
    assert len({p['id'] for p in result['team']}) == 11
    for role, need in result['quotas'].items():
        assert sum(p['assigned_role'] == role for p in result['team']) == need


def test_infeasible_keepers():
    result = build_team([make_player(i) for i in range(25)], TeamRequest())
    assert not result['feasible']
    assert result['filled'] < 11


def test_validation_and_filtering():
    players = [make_player(i, st=1) for i in range(30)]
    try:
        build_team(players, TeamRequest(quotas={'batting': 11, 'bowling': 1, 'allround':0, 'keeper':0}))
        assert False, 'Expected constraint validation'
    except ValueError: pass
    result = build_team(players, TeamRequest(candidate_ids=list(range(10))))
    assert not result['feasible']


def test_reservoir_sample_is_unique_and_filtered():
    sample = reservoir([make_player(i, st=1 if i%2 else 0) for i in range(50)], 6, role='keeper', seed=42)
    assert sample['eligible'] == 25
    assert len(sample['items']) == 6
    assert len({p['id'] for p in sample['items']}) == 6


def test_optimal_not_worse_than_greedy_when_both_feasible():
    players = [make_player(i, runs=150*i, wickets=130-i, st=1 if i<12 else 0) for i in range(32)]
    fast = build_team(players, TeamRequest(method='quick'))
    exact = build_team(players, TeamRequest(method='optimal'))
    assert exact['feasible'] and fast['feasible']
    assert exact['score'] + 0.02 >= fast['score']
