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
    createdAt?: string;
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
  skipRefresh?: boolean;
};

const runtimeEnv =
  typeof globalThis !== 'undefined'
    ? ((globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env || {})
    : {};

export const API_BASE_URL = runtimeEnv.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
const AUTH_STORAGE_KEY = 'stylelock.auth.session';

let authSession: StoredAuthSession | null = readStoredSession();
let refreshPromise: Promise<StoredAuthSession> | null = null;

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

function readEnvelope<T>(payload: ApiEnvelope<T> | T | undefined): T {
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

function parsePayload<T>(text: string): ApiEnvelope<T> | T | undefined {
  if (!text) return undefined;

  try {
    return JSON.parse(text) as ApiEnvelope<T> | T;
  } catch {
    return undefined;
  }
}

async function refreshAuthSession(): Promise<StoredAuthSession> {
  if (!authSession?.refreshToken) {
    throw new ApiError('Phiên đăng nhập đã hết hạn.', 401, 'AUTH_EXPIRED');
  }

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: authSession?.refreshToken })
    });

    const text = await response.text();
    const payload = parsePayload<Partial<StoredAuthSession>>(text);

    if (!response.ok) {
      authSessionStore.clear();
      const errorPayload = payload as ApiEnvelope<Partial<StoredAuthSession>> | undefined;
      throw new ApiError(
        errorPayload?.message || 'Phiên đăng nhập đã hết hạn.',
        response.status,
        errorPayload?.errorCode
      );
    }

    const token = readEnvelope<Partial<StoredAuthSession>>(payload);
    if (!token?.accessToken || !token.refreshToken || !authSession) {
      authSessionStore.clear();
      throw new ApiError('Backend không trả token hợp lệ.', 401, 'AUTH_REFRESH_INVALID');
    }

    const nextSession: StoredAuthSession = {
      ...authSession,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      tokenType: token.tokenType || authSession.tokenType || 'Bearer',
      expiresIn: token.expiresIn || authSession.expiresIn
    };
    authSessionStore.set(nextSession);
    return nextSession;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth, skipRefresh, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined)
  };
  const isFormDataBody =
    typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

  if (fetchOptions.body && !headers['Content-Type'] && !isFormDataBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth !== false && authSession?.accessToken) {
    headers.Authorization = `${authSession.tokenType || 'Bearer'} ${authSession.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers
  });

  const text = await response.text();
  const payload = parsePayload<T>(text);

  if (response.status === 401 && auth !== false && !skipRefresh) {
    await refreshAuthSession();
    return apiRequest<T>(path, { ...options, skipRefresh: true });
  }

  if (!response.ok) {
    const errorPayload = payload as ApiEnvelope<T> | undefined;
    throw new ApiError(
      errorPayload?.message || `Backend trả lỗi HTTP ${response.status}`,
      response.status,
      errorPayload?.errorCode
    );
  }

  return readEnvelope<T>(payload);
}
