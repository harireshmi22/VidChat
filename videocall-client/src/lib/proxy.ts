const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  // Build URL with query parameters if present
  let url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Set default headers
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Merge headers
  const mergedHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  const response = await fetch(url, {
    headers: mergedHeaders,
    ...restOptions,
  });

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Response was not JSON
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // If response is empty (e.g. 204 No Content), return empty object/null
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const proxy = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
