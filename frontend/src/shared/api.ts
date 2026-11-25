const API_URL = "/api";

export interface User {
  id: string;
  username: string;
  joined_at: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Clip {
  created_at: string;
  creator: User;
  description?: string;
  id: string;
  processing: boolean;
  title: string;
  unlisted: boolean;
  views: number;
  category_id: number | null;
  category?: Category | null;
}

export type ProgressObject = Record<string, number>;

export interface Progress {
  clips: ProgressObject;
}

// Client only
export const getClips = async (): Promise<Clip[]> => {
  const response = await fetch(`${API_URL}/clips`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 204) {
    return [];
  }
  return response.json();
};

export const getClip = async (videoId: string): Promise<Clip | null> => {
  const response = await fetch(`${API_URL}/clips/${videoId}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
};

export const deleteCip = async (videoId: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/clips/${videoId}`, {
    credentials: "include",
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.ok;
};

export const getUsersClips = async (userId: string): Promise<Clip[]> => {
  const response = await fetch(`${API_URL}/users/${userId}/clips`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 204) {
    return [];
  }
  return response.json();
};

export const getUser = async (): Promise<User | undefined> => {
  const response = await fetch(`${API_URL}/users/me`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.ok) {
    return response.json();
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_URL}/categories`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 204) {
    return [];
  }
  if (!response.ok) {
    return [];
  }
  return response.json();
};

export const getUserCategories = async (userId: string): Promise<Category[]> => {
  const response = await fetch(`${API_URL}/users/${userId}/categories`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 204) {
    return [];
  }
  if (!response.ok) {
    return [];
  }
  return response.json();
};

export const createCategory = async (name: string): Promise<Category | null> => {
  const response = await fetch(`${API_URL}/categories`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
};

export const updateCategory = async (id: number, name: string): Promise<Category | null> => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return response.ok;
};

export const register = async (username: string, password: string): Promise<Response> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  return response;
};

export const registrationAllowed = async (): Promise<boolean> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "OPTIONS",
  });
  return response.ok;
};

export const setupStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/setup`, { cache: "no-store" });
    if (!response.ok) return false;
    const json = (await response.json()) as { needs_setup?: boolean };
    return Boolean(json.needs_setup);
  } catch {
    return false;
  }
};

export const createOwner = async (username: string, password: string): Promise<Response> =>
  fetch(`${API_URL}/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

export const login = async (username: string, password: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  return response.ok;
};

export const logout = async (): Promise<boolean> => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.ok;
};

export const searchClips = async (query: string): Promise<Clip[]> => {
  const response = await fetch(`${API_URL}/clips/search?query=${encodeURIComponent(query)}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 204) {
    return [];
  }
  return response.json();
};

export const updateClipDetails = async (
  videoId: string,
  {
    title,
    description,
    categoryId,
  }: {
    title: string;
    description: string;
    categoryId: number;
  }
): Promise<boolean> => {
  const response = await fetch(`${API_URL}/clips/${videoId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      description,
      category_id: categoryId,
    }),
  });
  return response.ok;
};
