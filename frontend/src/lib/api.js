import axios from 'axios';

const BASE = process.env.REACT_APP_BACKEND_URL;

export const API = `${BASE}/api`;

export const api = axios.create({
  baseURL: API,
});

// --------------------------------------------------
// Overview
// --------------------------------------------------

export async function fetchOverview() {
  const { data } = await api.get('/stats/overview');
  return data;
}

// --------------------------------------------------
// Top Performers
// --------------------------------------------------

export async function fetchTop(
  format = 'ODI',
  metric = 'runs',
  limit = 10
) {
  const { data } = await api.get(
    '/stats/top-performers',
    {
      params: {
        format,
        metric,
        limit,
      },
    }
  );

  return data;
}

// --------------------------------------------------
// Players
// --------------------------------------------------

export async function fetchPlayers({
  format = 'ODI',
  q = '',
  sort_by = 'runs',
  order = 'desc',
  limit = 500,
  min_mat = 0,
  role = '',
} = {}) {
  const { data } = await api.get(
    '/players',
    {
      params: {
        format,
        q,
        sort_by,
        order,
        limit,
        min_mat,
        role: role || undefined,
      },
    }
  );

  return data;
}

// --------------------------------------------------
// Player Lookup
// --------------------------------------------------

export async function lookupPlayer(name) {
  const { data } = await api.get(
    '/players/lookup',
    {
      params: {
        name,
      },
    }
  );

  return data;
}

// --------------------------------------------------
// Player Details
// --------------------------------------------------

export async function fetchPlayer(format, id) {
  const { data } = await api.get(
    `/players/${format.toLowerCase()}/${id}`
  );

  return data;
}

// --------------------------------------------------
// Captains
// --------------------------------------------------

export async function fetchCaptains(
  format = 'ODI'
) {
  const { data } = await api.get(
    '/captains',
    {
      params: {
        format,
      },
    }
  );

  return data;
}

// --------------------------------------------------
// Player Names
// Used by Smart Search / DSA algorithms
// --------------------------------------------------

export async function fetchNames(
  format = 'ODI'
) {
  const { data } = await api.get(
    '/names',
    {
      params: {
        format,
      },
    }
  );

  return data;
}