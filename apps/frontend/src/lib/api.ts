'use client';

const API_BASE_URL = 'http://localhost:4000';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  stock: number;
  category: string;
  images: string[];
  sellerId: string;
  createdAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  totalPrice: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFQ {
  id: string;
  title: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  productName: string;
  description: string;
  quantity: number;
  targetPrice?: number;
  deliveryLocation: string;
  deadline: string;
  status: 'OPEN' | 'CLOSED';
  quotes: RFQQuote[];
  createdAt: string;
}

export interface RFQQuote {
  id: string;
  rfqId: string;
  sellerId: string;
  sellerName: string;
  price: number;
  notes: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  certifications: string[];
  establishedYear: number;
  verified: boolean;
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  return response;
}

export async function getMyProducts(): Promise<Product[]> {
  const response = await fetchWithAuth('/products/my-products');
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const response = await fetchWithAuth('/products/my-products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create product');
  return response.json();
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  const response = await fetchWithAuth(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update product');
  return response.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetchWithAuth(`/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete product');
}

export async function getSellerOrders(): Promise<Order[]> {
  const response = await fetchWithAuth('/orders/seller-orders');
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  const response = await fetchWithAuth(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update order status');
  return response.json();
}

export async function getOpenRFQs(): Promise<RFQ[]> {
  const response = await fetchWithAuth('/rfqs/open');
  if (!response.ok) throw new Error('Failed to fetch RFQs');
  return response.json();
}

export async function submitQuote(rfqId: string, price: number, notes: string): Promise<RFQQuote> {
  const response = await fetchWithAuth('/rfqs/quotes', {
    method: 'POST',
    body: JSON.stringify({ rfqId, price, notes }),
  });
  if (!response.ok) throw new Error('Failed to submit quote');
  return response.json();
}

export async function getMyCompany(): Promise<Company> {
  const response = await fetchWithAuth('/companies/me');
  if (!response.ok) throw new Error('Failed to fetch company');
  return response.json();
}

export async function updateMyCompany(data: Partial<Company>): Promise<Company> {
  const response = await fetchWithAuth('/companies/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update company');
  return response.json();
}

export async function getProducts(filters?: {
  search?: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  minHp?: number;
  maxHp?: number;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
  }
  const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function getProductById(id: string): Promise<Product & { seller: Company; specs: Record<string, string> }> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  if (!response.ok) throw new Error('Failed to fetch product');
  return response.json();
}

export async function getCategories(): Promise<{ id: string; name: string; slug: string; productCount: number }[]> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function createOrder(data: {
  productId: string;
  quantity: number;
  shippingAddress: string;
}): Promise<Order> {
  const response = await fetchWithAuth('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create order');
  return response.json();
}

export async function getMyOrders(): Promise<Order[]> {
  const response = await fetchWithAuth('/orders/my-orders');
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
}

export async function createRFQ(data: {
  title: string;
  description: string;
  quantity: number;
  targetPrice?: number;
  deliveryLocation: string;
  deadline?: string;
}): Promise<RFQ> {
  const response = await fetchWithAuth('/rfqs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create RFQ');
  return response.json();
}

export async function getMyRFQs(): Promise<RFQ[]> {
  const response = await fetchWithAuth('/rfqs/my-rfqs');
  if (!response.ok) throw new Error('Failed to fetch RFQs');
  return response.json();
}

export async function getRFQById(id: string): Promise<RFQ> {
  const response = await fetchWithAuth(`/rfqs/${id}`);
  if (!response.ok) throw new Error('Failed to fetch RFQ');
  return response.json();
}

export function checkAuth(): { isAuthenticated: boolean; user: any | null } {
  if (typeof window === 'undefined') return { isAuthenticated: false, user: null };
  
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  return { isAuthenticated: !!token, user };
}

// ==================== Admin API ====================

export interface AdminAnalytics {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalOrders: number;
  totalProducts: number;
  pendingProducts: number;
  activeProducts: number;
  totalRevenue: number;
  recentOrders: any[];
  recentUsers: any[];
  monthlyRevenue: { month: string; revenue: number }[];
  categoryDistribution: { category: string; count: number }[];
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  yesterdayOrders: number;
  pendingDisputes: number;
  newUsersToday: number;
  orderChange: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isVerified: boolean;
  isActive: boolean;
  company: any | null;
  createdAt: string;
}

export interface AdminProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  rejectionReason: string | null;
  category: any;
  seller: any;
  company: any;
  images: string[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const response = await fetchWithAuth('/admin/analytics');
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetchWithAuth('/admin/dashboard-stats');
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
}

export async function getAdminUsers(params: {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}): Promise<PaginatedResponse<AdminUser>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.role) query.set('role', params.role);
  if (params.isActive !== undefined) query.set('isActive', params.isActive.toString());
  if (params.search) query.set('search', params.search);
  
  const response = await fetchWithAuth(`/admin/users?${query}`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function updateUserStatus(userId: string, isActive: boolean): Promise<AdminUser> {
  const response = await fetchWithAuth(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  if (!response.ok) throw new Error('Failed to update user status');
  return response.json();
}

export async function deleteUser(userId: string): Promise<void> {
  const response = await fetchWithAuth(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete user');
}

export async function getAdminProducts(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  categoryId?: string;
}): Promise<PaginatedResponse<AdminProduct>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  
  const response = await fetchWithAuth(`/admin/products?${query}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function approveProduct(productId: string): Promise<void> {
  const response = await fetchWithAuth(`/admin/products/${productId}/approve`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to approve product');
}

export async function rejectProduct(productId: string, reason: string): Promise<void> {
  const response = await fetchWithAuth(`/admin/products/${productId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error('Failed to reject product');
}

export async function flagProduct(productId: string, reason: string): Promise<void> {
  const response = await fetchWithAuth(`/admin/products/${productId}/flag`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error('Failed to flag product');
}

export async function getAdminOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  disputeStatus?: string;
}): Promise<PaginatedResponse<any>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.disputeStatus) query.set('disputeStatus', params.disputeStatus);
  
  const response = await fetchWithAuth(`/admin/orders?${query}`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
}

export async function resolveDispute(orderId: string, resolution: string): Promise<void> {
  const response = await fetchWithAuth(`/admin/orders/${orderId}/resolve-dispute`, {
    method: 'POST',
    body: JSON.stringify({ resolution }),
  });
  if (!response.ok) throw new Error('Failed to resolve dispute');
}

// ==================== Transaction Management ====================

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  providerRef: string | null;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  order: {
    orderNumber: string;
    buyer: { id: string; firstName: string; lastName: string; email: string };
    company: { name: string };
  };
}

export async function getTransactions(params: {
  page?: number;
  limit?: number;
  status?: string;
  provider?: string;
  search?: string;
}): Promise<PaginatedResponse<Transaction>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status) query.set('status', params.status);
  if (params.provider) query.set('provider', params.provider);
  if (params.search) query.set('search', params.search);
  
  const response = await fetchWithAuth(`/admin/transactions?${query}`);
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
}

export async function getTransactionById(id: string): Promise<Transaction> {
  const response = await fetchWithAuth(`/admin/transactions/${id}`);
  if (!response.ok) throw new Error('Failed to fetch transaction');
  return response.json();
}

export async function processRefund(transactionId: string, reason: string): Promise<void> {
  const response = await fetchWithAuth(`/admin/transactions/${transactionId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error('Failed to process refund');
}

export async function getRefunds(params: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Transaction>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  
  const response = await fetchWithAuth(`/admin/refunds?${query}`);
  if (!response.ok) throw new Error('Failed to fetch refunds');
  return response.json();
}

export function exportTransactions() {
  const token = localStorage.getItem('authToken');
  window.open(`http://localhost:4000/admin/transactions/export`, '_blank');
}
