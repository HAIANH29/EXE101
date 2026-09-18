type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    status?: string;
    roles?: string[];
  };
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
};

const API_BASE_URL = 'http://localhost:8080';
const AUTH_STORAGE_KEY = 'stylelock.auth.session';

let authSession: StoredAuthSession | null = readStoredSession();

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function readStoredSession(): StoredAuthSession | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthSession) : null;
  } catch {
    return null;
  }
}

function persistSession(session: StoredAuthSession | null) {
  const storage = getStorage();
  if (!storage) return;

  if (!session) {
    storage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const authSessionStore = {
  get() {
    return authSession;
  },
  set(session: StoredAuthSession) {
    authSession = session;
    persistSession(session);
  },
  clear() {
    authSession = null;
    persistSession(null);
  },
  isAuthenticated() {
    return Boolean(authSession?.accessToken);
  }
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined)
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth !== false && authSession?.accessToken) {
    headers.Authorization = `${authSession.tokenType || 'Bearer'} ${authSession.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiEnvelope<T> | T) : undefined;

  if (!response.ok) {
    const errorPayload = payload as ApiEnvelope<T> | undefined;
    throw new ApiError(
      errorPayload?.message || `API request failed with status ${response.status}`,
      response.status,
      errorPayload?.errorCode
    );
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}
