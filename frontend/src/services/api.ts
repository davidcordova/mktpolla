// frontend/src/services/api.ts

const getBasePath = () => {
    const pathname = window.location.pathname;
    return pathname.substring(0, pathname.lastIndexOf('/') + 1);
};

const API_BASE_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:8000/api' 
    : `${window.location.origin}${getBasePath()}api`;

function getHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };
    const token = localStorage.getItem('polla_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const method = options.method || 'GET';
    let url = `${API_BASE_URL}${path}`;
    
    // Add cache-busting timestamp to GET requests
    if (method.toUpperCase() === 'GET') {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}_t=${Date.now()}`;
    }

    const config = {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {}),
        },
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal. Inténtalo de nuevo.');
    }

    return data as T;
}

export const api = {
    // Auth
    login: (credentials: any) => request<any>('/auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),
    register: (userData: any) => request<any>('/auth.php?action=register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
    
    // Profile
    getProfile: () => request<any>('/profile.php', { method: 'GET' }),
    updateProfile: (profileData: any) => request<any>('/profile.php', {
        method: 'POST', // using POST with _method=PUT fallback or PUT
        body: JSON.stringify(profileData),
    }),

    // Matches
    getMatches: (stage?: string) => request<any>(`/matches.php${stage ? `?stage=${stage}` : ''}`, { method: 'GET' }),
    updateMatch: (matchData: any) => request<any>('/matches.php?action=update', {
        method: 'POST',
        body: JSON.stringify(matchData),
    }),
    simulateStage: (stage: string) => request<any>('/matches.php?action=seed_test_data', {
        method: 'POST',
        body: JSON.stringify({ stage }),
    }),
    resetTournament: () => request<any>('/matches.php?action=reset', { method: 'POST' }),
    syncResults: () => request<any>('/matches.php?action=sync', { method: 'POST' }),

    // Predictions
    getPredictions: (stage: 'GROUPS' | 'ELIMINATORY') => request<any>(`/predictions.php?stage=${stage}`, { method: 'GET' }),
    savePredictions: (stage: 'GROUPS' | 'ELIMINATORY', predictions: any[]) => request<any>(`/predictions.php?stage=${stage}`, {
        method: 'POST',
        body: JSON.stringify({ predictions }),
    }),
    saveChampion: (championCode: string) => request<any>('/predictions.php?action=champion', {
        method: 'POST',
        body: JSON.stringify({ champion_code: championCode }),
    }),

    // Rankings & Leagues
    getRankings: () => request<any>('/rankings.php?action=global', { method: 'GET' }),
    getRankingHistory: (userId?: number) => request<any>(`/rankings.php?action=history${userId ? `&user_id=${userId}` : ''}`, { method: 'GET' }),
    getExportUrl: () => `${API_BASE_URL}/rankings.php?action=export`,
    
    createLeague: (name: string) => request<any>('/leagues.php?action=create', {
        method: 'POST',
        body: JSON.stringify({ name }),
    }),
    joinLeague: (code: string) => request<any>('/leagues.php?action=join', {
        method: 'POST',
        body: JSON.stringify({ code }),
    }),
    getLeagues: () => request<any>('/leagues.php?action=list', { method: 'GET' }),
    getLeagueDetails: (id: number) => request<any>(`/leagues.php?id=${id}`, { method: 'GET' }),

    // Stats
    getStats: () => request<any>('/stats.php', { method: 'GET' }),
    
    // Rules
    getRules: () => request<any>('/rules.php', { method: 'GET' }),
};

export const getFlagUrl = (code: string) => {
    if (!code) return '';
    const upperCode = code.toUpperCase();
    let flagCode = upperCode.substring(0, 2).toLowerCase();
    
    // Custom mapping exceptions
    if (upperCode === 'USA') flagCode = 'us';
    if (upperCode === 'MEX') flagCode = 'mx';
    if (upperCode === 'JAM') flagCode = 'jm';
    if (upperCode === 'SEN') flagCode = 'sn';
    if (upperCode === 'KOR') flagCode = 'kr';
    if (upperCode === 'IRQ') flagCode = 'iq';
    if (upperCode === 'TUN') flagCode = 'tn';
    if (upperCode === 'UKR') flagCode = 'ua';
    if (upperCode === 'NED') flagCode = 'nl';
    if (upperCode === 'ENG') flagCode = 'gb-eng';
    if (upperCode === 'GER') flagCode = 'de';
    if (upperCode === 'POR') flagCode = 'pt';
    if (upperCode === 'DEN') flagCode = 'dk';
    if (upperCode === 'CRO') flagCode = 'hr';
    if (upperCode === 'SUI') flagCode = 'ch';
    if (upperCode === 'SWE') flagCode = 'se';
    if (upperCode === 'RSA') flagCode = 'za';
    if (upperCode === 'NGA') flagCode = 'ng';
    if (upperCode === 'KSA') flagCode = 'sa';
    if (upperCode === 'CHI') flagCode = 'cl';
    if (upperCode === 'URU') flagCode = 'uy';
    if (upperCode === 'PAR') flagCode = 'py';
    if (upperCode === 'BIH') flagCode = 'ba';
    if (upperCode === 'SCO') flagCode = 'gb-sct';
    if (upperCode === 'HAI') flagCode = 'ht';
    if (upperCode === 'TUR') flagCode = 'tr';
    if (upperCode === 'CUW') flagCode = 'cw';
    if (upperCode === 'CPV') flagCode = 'cv';
    if (upperCode === 'AUT') flagCode = 'at';
    if (upperCode === 'COD') flagCode = 'cd';
    
    return `https://flagcdn.com/w80/${flagCode}.png`;
};
