import { Floor, Cell, Product, Operation, Worker, AppUser } from "./types";

let authToken = localStorage.getItem("auth_token") || "";

export const setAuthToken = (token: string) => {
  authToken = token;
  if (token) localStorage.setItem("auth_token", token);
  else localStorage.removeItem("auth_token");
};

export const clearAuth = () => setAuthToken("");

const apiCall = async (url: string, method = "GET", body?: any) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
     clearAuth();
     localStorage.removeItem("user_role");
     window.location.reload();
     return new Promise(() => {});
  }
  if (!res.ok) {
     const text = await res.text();
     let errMessage = res.statusText;
     try { errMessage = JSON.parse(text).error || errMessage; } catch (e) {}
     throw new Error(`API Error: ${errMessage}`);
  }
  return res.json();
};

export const api = {
  getFloors: (): Promise<Floor[]> => apiCall("/api/floors"),
  createFloor: (data: Partial<Floor>): Promise<Floor> => apiCall("/api/floors", "POST", data),
  updateFloor: (id: string, data: Partial<Floor>): Promise<Floor> => apiCall(`/api/floors/${id}`, "PUT", data),
  deleteFloor: (id: string): Promise<void> => apiCall(`/api/floors/${id}`, "DELETE"),

  getCells: (): Promise<Cell[]> => apiCall("/api/cells"),
  createCell: (data: Partial<Cell>): Promise<Cell> => apiCall("/api/cells", "POST", data),
  updateCell: (id: string, data: Partial<Cell>): Promise<Cell> => apiCall(`/api/cells/${id}`, "PUT", data),
  deleteCell: (id: string): Promise<void> => apiCall(`/api/cells/${id}`, "DELETE"),

  getProducts: (): Promise<Product[]> => apiCall("/api/products"),
  createProduct: (data: Partial<Product>): Promise<Product> => apiCall("/api/products", "POST", data),
  updateProduct: (id: string, data: Partial<Product>): Promise<Product> => apiCall(`/api/products/${id}`, "PUT", data),
  deleteProduct: (id: string): Promise<void> => apiCall(`/api/products/${id}`, "DELETE"),

  getOperations: (): Promise<Operation[]> => apiCall("/api/operations"),
  createOperation: (data: Partial<Operation>): Promise<Operation> => apiCall("/api/operations", "POST", data),
  updateOperation: (id: string, data: Partial<Operation>): Promise<Operation> => apiCall(`/api/operations/${id}`, "PUT", data),
  deleteOperation: (id: string): Promise<void> => apiCall(`/api/operations/${id}`, "DELETE"),

  getWorkers: (): Promise<Worker[]> => apiCall("/api/workers"),
  createWorker: (data: Partial<Worker>): Promise<Worker> => apiCall("/api/workers", "POST", data),
  updateWorker: (id: string, data: Partial<Worker>): Promise<Worker> => apiCall(`/api/workers/${id}`, "PUT", data),
  deleteWorker: (id: string): Promise<void> => apiCall(`/api/workers/${id}`, "DELETE"),
  
  bulkUpdateWorkers: (workerIds: string[], overrides: Partial<Worker>): Promise<void> => 
    apiCall("/api/workers-bulk", "PUT", { workerIds, overrides }),

  exportData: (): Promise<any> => apiCall("/api/export"),

  login: (username: string, password: string): Promise<{ token: string, role: string, username: string }> => 
     apiCall("/api/login", "POST", { username, password }),
  logout: (): Promise<void> => apiCall("/api/logout", "POST"),

  getUsers: (): Promise<AppUser[]> => apiCall("/api/users"),
  createUser: (data: Partial<AppUser> & { password?: string }): Promise<AppUser> => apiCall("/api/users", "POST", data),
  updateUser: (id: string, data: Partial<AppUser> & { password?: string }): Promise<AppUser> => apiCall(`/api/users/${id}`, "PUT", data),
  deleteUser: (id: string): Promise<void> => apiCall(`/api/users/${id}`, "DELETE"),

  getDefectCauses: (): Promise<any[]> => apiCall("/api/defect-causes"),
  createDefectCause: (data: any): Promise<any> => apiCall("/api/defect-causes", "POST", data),
  updateDefectCause: (id: string, data: any): Promise<any> => apiCall(`/api/defect-causes/${id}`, "PUT", data),
  deleteDefectCause: (id: string): Promise<void> => apiCall(`/api/defect-causes/${id}`, "DELETE"),

  getDefectRecords: (): Promise<any[]> => apiCall("/api/defect-records"),
  createDefectRecord: (data: any): Promise<any> => apiCall("/api/defect-records", "POST", data),
};
