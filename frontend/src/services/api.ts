// frontend/src/services/api.ts

const API_BASE_URL = 'http://localhost:8000/api';

function getHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('polla_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
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
    let flagCode = code.toLowerCase().substring(0, 2);
    // Custom mapping exceptions
    if (code === 'USA') flagCode = 'us';
    if (code === 'MEX') flagCode = 'mx';
    if (code === 'JAM') flagCode = 'jm';
    if (code === 'SEN') flagCode = 'sn';
    if (code === 'KOR') flagCode = 'kr';
    if (code === 'IRQ') flagCode = 'iq';
    if (code === 'TUN') flagCode = 'tn';
    if (code === 'UKR') flagCode = 'ua';
    if (code === 'NED') flagCode = 'nl';
    if (code === 'ENG') flagCode = 'gb-eng';
    if (code === 'GER') flagCode = 'de';
    if (code === 'POR') flagCode = 'pt';
    if (code === 'DEN') flagCode = 'dk';
    if (code === 'CRO') flagCode = 'hr';
    if (code === 'SUI') flagCode = 'ch';
    if (code === 'SWE') flagCode = 'se';
    if (code === 'RSA') flagCode = 'za';
    if (code === 'NGA') flagCode = 'ng';
    if (code === 'KSA') flagCode = 'sa';
    if (code === 'CHI') flagCode = 'cl';
    if (code === 'URU') flagCode = 'uy';
    if (code === 'PAR') flagCode = 'py';
    return `https://flagcdn.com/w80/${flagCode}.png`;
};
