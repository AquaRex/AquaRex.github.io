const API_CONFIG = {
    BASE_URL: (window.location.hostname === 'localhost' && window.LOCAL_API_SERVER) 
        ? 'http://localhost:3000'
        : 'https://startrackerapi-g5ccasc9dravhbe7.westeurope-01.azurewebsites.net',

    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            VALIDATE: '/api/auth/validate',
            UPDATE_SETTINGS: '/api/auth/update-settings',
            VERIFY_EMAIL: '/api/auth/verify-email',
            RESEND_VERIFICATION: '/api/auth/resend-verification',
            FORGOT_PASSWORD: '/api/auth/forgot-password',
            RESET_PASSWORD: '/api/auth/reset-password',
            CHANGE_PASSWORD: '/api/auth/change-password',
            UPDATE_PROFILE: '/api/auth/update-profile'
        },
        KILLS: '/api/kills',
        PROFILES: '/api/profiles',
        LEADERBOARD: '/api/profiles/leaderboard'
    },
    
    TIMEOUT: 30000,
    DEBUG: window.location.hostname === 'localhost'
};

function getApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}

async function makeSecureApiRequest(endpoint, options = {}) {
    const token = sessionStorage.getItem('authToken');
    
    if (API_CONFIG.DEBUG) {
        console.log('Making API request:', {
            endpoint,
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
        });
    }
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const requestConfig = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        },
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
    };
    
    try {
        const response = await fetch(getApiUrl(endpoint), requestConfig);
        
        if (API_CONFIG.DEBUG) {
            console.log(`API Request: ${endpoint}`, {
                method: options.method || 'GET',
                status: response.status,
                statusText: response.statusText
            });
        }
        if (response.status === 401) {
            console.warn('Authentication failed for endpoint:', endpoint);
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('inGameName');
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('leaderboard.html') &&
                !window.location.pathname.includes('register.html')) {
                window.location.href = 'login.html';
            }
            throw new Error('Authentication required');
        }
        
        return response;
    } catch (error) {
        if (error.name === 'TimeoutError') {
            throw new Error('Request timeout - please try again');
        }
        throw error;
    }
}

window.API_CONFIG = API_CONFIG;
window.getApiUrl = getApiUrl;
window.makeSecureApiRequest = makeSecureApiRequest;