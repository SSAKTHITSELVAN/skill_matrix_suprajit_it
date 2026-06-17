const BASE_URL = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

export const api = {
    post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
    get: (url) => request(url, { method: 'GET' }),
    put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (url) => request(url, { method: 'DELETE' }),
};
