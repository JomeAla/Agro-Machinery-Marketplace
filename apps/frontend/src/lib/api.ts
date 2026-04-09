'use client';

// API Configuration for AgroMarket Marketplace

const API_BASE_URL = 'http://localhost:4000';

export interface Product {
  id: string;
  name: string;
  title?: string;
  description: string;
  price: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  stock: number;
  stockQuantity?: number;
  category: string | { id: string; name: string; slug: string };
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
  total?: number;
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
    const keyMap: Record<string, string> = { minHp: 'minHorsepower', maxHp: 'maxHorsepower' };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(keyMap[key] || key, String(value));
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
  productId?: string;
  items?: { productId: string; quantity: number }[];
  quantity?: number;
  shippingAddress: string;
  shippingState: string;
  notes?: string;
  discountCode?: string;
}): Promise<Order> {
  // If productId/quantity provided, normalize to items array if backend needs it
  const requestData = {
    ...data,
    items: data.items || [{ productId: data.productId!, quantity: data.quantity! }],
  };
  
  const response = await fetchWithAuth('/orders', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create order');
  }
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

export async function getProfile(): Promise<any> {
  const response = await fetchWithAuth('/users/me');
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
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

 export async function createUser(data: {
   email: string;
   password: string;
   firstName: string;
   lastName: string;
   phone?: string;
   role: 'BUYER' | 'SELLER' | 'ADMIN';
 }): Promise<AdminUser> {
   const response = await fetchWithAuth('/admin/users', {
     method: 'POST',
     body: JSON.stringify(data),
   });
   if (!response.ok) throw new Error('Failed to create user');
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
  createdAt: string;
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

// ==================== FAQ API ====================

export interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: Date;
}

export interface FaqArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  categoryId: string;
  category: FaqCategory;
  helpfulCount: number;
  notHelpfulCount: number;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: Date;
}

export async function getFaqCategories(): Promise<FaqCategory[]> {
  const response = await fetchWithAuth('/faq/admin/categories');
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function createFaqCategory(data: { name: string; slug: string; description?: string }): Promise<FaqCategory> {
  const response = await fetchWithAuth('/faq/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create category');
  return response.json();
}

export async function updateFaqCategory(id: string, data: { name?: string; slug?: string; description?: string; order?: number }): Promise<FaqCategory> {
  const response = await fetchWithAuth(`/faq/admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update category');
  return response.json();
}

export async function deleteFaqCategory(id: string): Promise<void> {
  const response = await fetchWithAuth(`/faq/admin/categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete category');
}

export async function getFaqArticles(params?: { categoryId?: string; published?: boolean }): Promise<FaqArticle[]> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set('categoryId', params.categoryId);
  if (params?.published !== undefined) query.set('published', String(params.published));
  
  const response = await fetchWithAuth(`/faq/admin/articles?${query}`);
  if (!response.ok) throw new Error('Failed to fetch articles');
  return response.json();
}

export async function createFaqArticle(data: {
  title: string;
  slug: string;
  content: string;
  categoryId: string;
  published?: boolean;
}): Promise<FaqArticle> {
  const response = await fetchWithAuth('/faq/admin/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create article');
  return response.json();
}

export async function updateFaqArticle(id: string, data: {
  title?: string;
  slug?: string;
  content?: string;
  categoryId?: string;
  order?: number;
  published?: boolean;
}): Promise<FaqArticle> {
  const response = await fetchWithAuth(`/faq/admin/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update article');
  return response.json();
}

export async function deleteFaqArticle(id: string): Promise<void> {
  const response = await fetchWithAuth(`/faq/admin/articles/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete article');
}

export async function getFaqArticlesPublic(): Promise<FaqArticle[]> {
  const response = await fetch('http://localhost:4000/faq/articles');
  if (!response.ok) throw new Error('Failed to fetch articles');
  return response.json();
}

export async function getFaqCategoriesPublic(): Promise<FaqCategory[]> {
  const response = await fetch('http://localhost:4000/faq/categories');
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

// Support Ticket Types
export interface SupportTicket {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  category: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  replies: SupportReply[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportReply {
  id: string;
  ticketId: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface SupportTicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export async function getSupportTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}): Promise<{ tickets: SupportTicket[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);

  const response = await fetchWithAuth(`/support/admin/tickets?${query}`);
  if (!response.ok) throw new Error('Failed to fetch tickets');
  return response.json();
}

export async function getSupportTicketById(id: string): Promise<SupportTicket> {
  const response = await fetchWithAuth(`/support/admin/tickets/${id}`);
  if (!response.ok) throw new Error('Failed to fetch ticket');
  return response.json();
}

export async function updateSupportTicketStatus(id: string, status: string): Promise<SupportTicket> {
  const response = await fetchWithAuth(`/support/admin/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update ticket status');
  return response.json();
}

export async function assignSupportTicket(id: string, assignedTo: string): Promise<SupportTicket> {
  const response = await fetchWithAuth(`/support/admin/tickets/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedTo }),
  });
  if (!response.ok) throw new Error('Failed to assign ticket');
  return response.json();
}

export async function replyToSupportTicket(id: string, message: string): Promise<SupportReply> {
  const response = await fetchWithAuth(`/support/admin/tickets/${id}/replies`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error('Failed to reply to ticket');
  return response.json();
}

export async function getSupportTicketStats(): Promise<SupportTicketStats> {
  const response = await fetchWithAuth('/support/admin/stats');
  if (!response.ok) throw new Error('Failed to fetch ticket stats');
  return response.json();
}

export async function searchFaqArticles(query: string): Promise<FaqArticle[]> {
  const response = await fetch(`http://localhost:4000/faq/articles/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search articles');
  return response.json();
}

export async function voteFaqArticle(articleId: string, helpful: boolean): Promise<void> {
  const response = await fetchWithAuth(`/faq/articles/${articleId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ helpful }),
  });
  if (!response.ok) throw new Error('Failed to vote');
}

// ==================== Promotions API ====================

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: Date;
}

export interface FeaturedSlot {
  id: string;
  name: string;
  duration: number;
  price: number;
  isActive: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  linkText: string | null;
  position: string;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: Date;
}

export interface CategoryPromotion {
  id: string;
  categoryId: string;
  category: { id: string; name: string };
  discountType: string;
  discountValue: number;
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export async function getDiscountCodes(): Promise<DiscountCode[]> {
  const response = await fetchWithAuth('/promotions/admin/discount-codes');
  if (!response.ok) throw new Error('Failed to fetch discount codes');
  return response.json();
}

export async function createDiscountCode(data: {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  startsAt?: string;
  expiresAt?: string;
}): Promise<DiscountCode> {
  const response = await fetchWithAuth('/promotions/admin/discount-codes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create discount code');
  return response.json();
}

export async function updateDiscountCode(id: string, data: any): Promise<DiscountCode> {
  const response = await fetchWithAuth(`/promotions/admin/discount-codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update discount code');
  return response.json();
}

export async function deleteDiscountCode(id: string): Promise<void> {
  const response = await fetchWithAuth(`/promotions/admin/discount-codes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete discount code');
}

export async function getFeaturedSlots(): Promise<FeaturedSlot[]> {
  const response = await fetchWithAuth('/promotions/admin/featured-slots');
  if (!response.ok) throw new Error('Failed to fetch featured slots');
  return response.json();
}

export async function createFeaturedSlot(data: { name: string; duration: number; price: number }): Promise<FeaturedSlot> {
  const response = await fetchWithAuth('/promotions/admin/featured-slots', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create featured slot');
  return response.json();
}

export async function updateFeaturedSlot(id: string, data: any): Promise<FeaturedSlot> {
  const response = await fetchWithAuth(`/promotions/admin/featured-slots/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update featured slot');
  return response.json();
}

export async function deleteFeaturedSlot(id: string): Promise<void> {
  const response = await fetchWithAuth(`/promotions/admin/featured-slots/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete featured slot');
}

export async function getBanners(): Promise<Banner[]> {
  const response = await fetchWithAuth('/promotions/admin/banners');
  if (!response.ok) throw new Error('Failed to fetch banners');
  return response.json();
}

export async function createBanner(data: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  linkText?: string;
  position?: string;
  startsAt?: string;
  expiresAt?: string;
  order?: number;
}): Promise<Banner> {
  const response = await fetchWithAuth('/promotions/admin/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create banner');
  return response.json();
}

export async function updateBanner(id: string, data: any): Promise<Banner> {
  const response = await fetchWithAuth(`/promotions/admin/banners/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update banner');
  return response.json();
}

export async function deleteBanner(id: string): Promise<void> {
  const response = await fetchWithAuth(`/promotions/admin/banners/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete banner');
}

export async function getCategoryPromotions(): Promise<CategoryPromotion[]> {
  const response = await fetchWithAuth('/promotions/admin/category-promotions');
  if (!response.ok) throw new Error('Failed to fetch category promotions');
  return response.json();
}

export async function createCategoryPromotion(data: {
  categoryId: string;
  discountType: string;
  discountValue: number;
  startsAt: string;
  expiresAt: string;
}): Promise<CategoryPromotion> {
  const response = await fetchWithAuth('/promotions/admin/category-promotions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create category promotion');
  return response.json();
}

export async function updateCategoryPromotion(id: string, data: any): Promise<CategoryPromotion> {
  const response = await fetchWithAuth(`/promotions/admin/category-promotions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update category promotion');
  return response.json();
}

export async function deleteCategoryPromotion(id: string): Promise<void> {
  const response = await fetchWithAuth(`/promotions/admin/category-promotions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete category promotion');
}

export async function validateDiscountCode(code: string, amount: number): Promise<{
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
}> {
  const response = await fetch(`${API_BASE_URL}/promotions/validate-code?code=${code}&amount=${amount}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Invalid discount code');
  }
  return response.json();
}

export async function getPublicFeaturedProducts(): Promise<Product[]> {
  console.log('[API] Fetching featured products from:', `${API_BASE_URL}/promotions/featured`);
  const response = await fetch(`${API_BASE_URL}/promotions/featured?_t=${Date.now()}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  console.log('[API] Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] Featured products API error:', response.status, errorText);
    throw new Error(`Failed to fetch featured products: ${response.status}`);
  }
  const data = await response.json();
  console.log('[API] Featured products raw data length:', data.length);
  if (data.length > 0) {
    console.log('[API] First item keys:', Object.keys(data[0]));
    console.log('[API] Has product nested?', 'product' in data[0]);
  }
  return data.map((item: any) => {
    const product = item.product || item;
    console.log('[API] Mapping product:', product.title || product.name);
    return {
      ...product,
      name: product.title || product.name,
      stock: product.stockQuantity || product.stock,
    };
  });
}

export async function purchaseFeaturedSlot(productId: string, slotId: string): Promise<any> {
  const response = await fetchWithAuth('/promotions/admin/featured', {
    method: 'POST',
    body: JSON.stringify({ productId, slotId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to purchase featured slot');
  }
  return response.json();
}

export async function getPublicBanners(): Promise<Banner[]> {
  const response = await fetch(`${API_BASE_URL}/promotions/banners`);
  if (!response.ok) throw new Error('Failed to fetch banners');
  return response.json();
}

export async function getPublicCategoryPromotions(): Promise<CategoryPromotion[]> {
  const response = await fetch(`${API_BASE_URL}/promotions/category-promotions`);
  if (!response.ok) throw new Error('Failed to fetch category promotions');
  return response.json();
}

// ========== ALIEXPRESS DROPSHIPPING ==========

export async function getAliExpressAuthStatus(): Promise<{ connected: boolean }> {
  const response = await fetchWithAuth('/aliexpress/auth/status');
  if (!response.ok) throw new Error('Failed to check AliExpress status');
  return response.json();
}

export async function getAliExpressAuthUrl(): Promise<{ connected: boolean; authUrl?: string; message?: string }> {
  const response = await fetchWithAuth('/aliexpress/auth/url');
  if (!response.ok) throw new Error('Failed to get auth URL');
  return response.json();
}

export async function searchAliExpress(params: {
  keyword: string;
  page?: number;
  pageSize?: number;
  currency?: string;
  shipTo?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<{ products: any[]; totalResults: number; page: number; pageSize: number }> {
  const response = await fetchWithAuth('/aliexpress/search', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Search failed');
  }
  return response.json();
}

export async function getAliExpressProduct(id: string): Promise<any> {
  const response = await fetchWithAuth(`/aliexpress/products/${id}`);
  if (!response.ok) throw new Error('Failed to fetch product');
  return response.json();
}

export async function importAliExpressProducts(productIds: string[], categoryId?: string): Promise<{
  imported: any[];
  failed: { productId: string; reason: string }[];
}> {
  const response = await fetchWithAuth('/aliexpress/import', {
    method: 'POST',
    body: JSON.stringify({ productIds, categoryId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Import failed');
  }
  return response.json();
}

export async function getDropshipDrafts(page?: number, limit?: number): Promise<{
  data: any[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const params = new URLSearchParams();
  if (page) params.set('page', page.toString());
  if (limit) params.set('limit', limit.toString());

  const response = await fetchWithAuth(`/aliexpress/drafts?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch drafts');
  return response.json();
}

export async function updateDropshipDraft(id: string, data: {
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  categoryId?: string;
  inStock?: boolean;
}): Promise<any> {
  const response = await fetchWithAuth(`/aliexpress/drafts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update draft');
  }
  return response.json();
}

export async function publishDropshipDraft(id: string): Promise<any> {
  const response = await fetchWithAuth(`/aliexpress/drafts/${id}/publish`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to publish');
  }
  return response.json();
}

export async function deleteDropshipDraft(id: string): Promise<void> {
  const response = await fetchWithAuth(`/aliexpress/drafts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete draft');
  }
}

// ==================== DROPSHIP ORDER FULFILLMENT ====================

export async function createDropshipOrder(data: {
  orderId: string;
  platformProductId: string;
  aliexpressProductId: string;
  quantity: number;
  aliexpressPrice: number;
  sellingPrice: number;
  shippingAddress: string;
  shippingState?: string;
}): Promise<any> {
  const response = await fetchWithAuth('/aliexpress/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create dropship order');
  }
  return response.json();
}

export async function placeAliExpressOrder(dropshipOrderId: string): Promise<{ success: boolean; aliexpressOrderId: string }> {
  const response = await fetchWithAuth(`/aliexpress/orders/${dropshipOrderId}/place`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to place order');
  }
  return response.json();
}

export async function getDropshipOrderStatus(dropshipOrderId: string): Promise<{
  status: string;
  aliexpressOrderId: string | null;
  trackingNumber: string | null;
}> {
  const response = await fetchWithAuth(`/aliexpress/orders/${dropshipOrderId}/status`);
  if (!response.ok) throw new Error('Failed to get order status');
  return response.json();
}

export async function getDropshipOrders(page?: number, limit?: number, status?: string): Promise<{
  data: any[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const params = new URLSearchParams();
  if (page) params.set('page', page.toString());
  if (limit) params.set('limit', limit.toString());
  if (status) params.set('status', status);

  const response = await fetchWithAuth(`/aliexpress/orders?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch dropship orders');
  return response.json();
}

// ==================== DROPSHIP PRICE & INVENTORY SYNC ====================

export async function syncDropshipProductPrice(aliexpressProductId: string): Promise<{
  originalPrice: number;
  markupPrice: number;
  sellingPrice: number;
}> {
  const response = await fetchWithAuth(`/aliexpress/products/${aliexpressProductId}/sync`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to sync price');
  }
  return response.json();
}

export async function syncAllDropshipProducts(): Promise<{
  id: string;
  aliexpressId: string;
  success: boolean;
  originalPrice?: number;
  markupPrice?: number;
  sellingPrice?: number;
  error?: string;
}[]> {
  const response = await fetchWithAuth('/aliexpress/products/sync-all', {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to sync products');
  }
  return response.json();
}

export async function getDropshipProfitReport(): Promise<{
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
  };
  byStatus: {
    status: string;
    count: number;
    revenue: number;
    profit: number;
  }[];
}> {
  const response = await fetchWithAuth('/aliexpress/reports/profit');
  if (!response.ok) throw new Error('Failed to get profit report');
  return response.json();
}

// ==================== FREIGHT & CHECKOUT ====================

export async function getFreightStates(): Promise<{ name: string; code: string; capital: string; region: string }[]> {
  const response = await fetch(`${API_BASE_URL}/freight/states`);
  if (!response.ok) throw new Error('Failed to fetch states');
  return response.json();
}

export async function calculateFreightEstimate(data: {
  originState: string;
  destinationState: string;
  vehicleType: string;
  units?: number;
  weight?: number;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/freight/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to calculate freight');
  return response.json();
}

export async function initializePayment(data: {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
}): Promise<{ paymentId: string; paymentUrl: string; providerRef: string; provider: string }> {
  const response = await fetchWithAuth('/payments/initialize', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Payment initialization failed');
  }
  return response.json();
}

export async function verifyPayment(reference: string): Promise<{ success: boolean; paymentId: string }> {
  const response = await fetchWithAuth(`/payments/verify/${reference}`);
  if (!response.ok) throw new Error('Payment verification failed');
  return response.json();
}

// ==================== FINANCING ====================

export async function calculateFinancing(data: {
  amount: number;
  tenureMonths: number;
  interestRate?: number;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/financing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to calculate installment');
  return response.json();
}

export async function createFinancingRequest(data: {
  productId: string;
  financingType: string;
  amount: number;
  tenureMonths: number;
  purpose: string;
  state?: string;
  city?: string;
}): Promise<any> {
  const response = await fetchWithAuth('/financing', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to submit financing request');
  }
  return response.json();
}

export async function getMyFinancingRequests(): Promise<any> {
  const response = await fetchWithAuth('/financing/my-requests');
  if (!response.ok) throw new Error('Failed to fetch financing requests');
  return response.json();
}

// ==================== COMPANY & VERIFICATION ====================

export async function updateCompany(data: any): Promise<any> {
  const response = await fetchWithAuth('/users/me/company', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update company details');
  return response.json();
}

export async function getPendingVerifications(page = 1, limit = 20): Promise<any> {
  const response = await fetchWithAuth(`/admin/verifications/pending?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch verifications');
  return response.json();
}

export async function approveCompany(id: string): Promise<any> {
  const response = await fetchWithAuth(`/admin/verifications/${id}/approve`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to approve company');
  return response.json();
}

export async function rejectCompany(id: string): Promise<any> {
  const response = await fetchWithAuth(`/admin/verifications/${id}/reject`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reject company');
  return response.json();
}

// ==================== MESSAGING ====================

export async function getMyConversations(): Promise<any> {
  const response = await fetchWithAuth('/conversations');
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
}

export async function getMessages(conversationId: string): Promise<any> {
  const response = await fetchWithAuth(`/conversations/${conversationId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

// ==================== ANALYTICS ====================

export async function getSellerAnalytics(): Promise<any> {
  const response = await fetchWithAuth('/analytics/seller');
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

export async function getProductLineAnalytics(filters?: {
  categoryId?: string;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<any> {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.productId) params.set('productId', filters.productId);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  
  const response = await fetchWithAuth(`/analytics/product-lines?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch product analytics');
  return response.json();
}

export async function getSalesTrends(filters?: {
  period?: 'day' | 'week' | 'month';
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<any> {
  const params = new URLSearchParams();
  if (filters?.period) params.set('period', filters.period);
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  
  const response = await fetchWithAuth(`/analytics/sales-trends?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch sales trends');
  return response.json();
}

export async function exportAnalyticsReport(data: {
  format: 'csv' | 'json';
  type: 'orders' | 'products' | 'revenue';
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<any> {
  const response = await fetchWithAuth('/analytics/export', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to export report');
  return response.json();
}

// ==================== REVIEWS ====================

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title: string;
  comment: string;
  sellerResponse?: string;
  sellerResponseAt?: string;
  helpfulCount: number;
  notHelpfulCount: number;
  status: 'PENDING' | 'APPROVED' | 'FLAGGED' | 'DELETED';
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profile?: { avatar: string };
  };
  product?: {
    id: string;
    title: string;
    images: string[];
  };
}

export interface ProductReviews {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getProductReviews(productId: string, page = 1, limit = 10): Promise<ProductReviews> {
  const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch reviews');
  return response.json();
}

export async function createReview(data: {
  productId: string;
  orderId?: string;
  rating: number;
  title: string;
  comment: string;
}): Promise<Review> {
  const response = await fetchWithAuth('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create review');
  }
  return response.json();
}

export async function getMyReviews(page = 1, limit = 10): Promise<{ reviews: Review[]; pagination: any }> {
  const response = await fetchWithAuth(`/reviews/my-reviews?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch my reviews');
  return response.json();
}

export async function voteReview(reviewId: string, helpful: boolean): Promise<{ message: string }> {
  const response = await fetchWithAuth(`/reviews/${reviewId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ helpful }),
  });
  if (!response.ok) throw new Error('Failed to vote on review');
  return response.json();
}

export interface WarrantyClaim {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  productName?: string;
  orderNumber?: string;
  issueDescription: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyStatus {
  isActive: boolean;
  warrantyEndDate: string;
  daysRemaining: number;
  warrantyMonths: number;
  productName: string;
  orderNumber: string;
  purchaseDate: string;
}

export interface MaintenanceSchedule {
  id: string;
  productId: string;
  title: string;
  description?: string;
  maintenanceType: 'ROUTINE' | 'SERVICE' | 'INSPECTION' | 'REPAIR';
  intervalHours: number;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  productId: string;
  userId: string;
  userName?: string;
  title: string;
  description?: string;
  maintenanceType: 'ROUTINE' | 'SERVICE' | 'INSPECTION' | 'REPAIR';
  cost?: number;
  performedAt: string;
  createdAt: string;
}

export interface ProductManual {
  id: string;
  productId: string;
  title: string;
  fileUrl: string;
  fileType?: string;
  createdAt: string;
}

export async function createWarrantyClaim(data: {
  productId: string;
  orderId: string;
  issueDescription: string;
}): Promise<WarrantyClaim> {
  const response = await fetchWithAuth('/maintenance/warranty', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create warranty claim');
  }
  return response.json();
}

export async function getMyWarrantyClaims(): Promise<{ claims: WarrantyClaim[]; pagination: any }> {
  const response = await fetchWithAuth('/maintenance/warranty/my-claims');
  if (!response.ok) throw new Error('Failed to fetch warranty claims');
  return response.json();
}

export async function getWarrantyStatus(productId: string, orderId: string): Promise<WarrantyStatus> {
  const response = await fetch(`${API_BASE_URL}/maintenance/warranty/status/${productId}?orderId=${orderId}`);
  if (!response.ok) throw new Error('Failed to fetch warranty status');
  return response.json();
}

export async function getMaintenanceSchedules(productId: string): Promise<MaintenanceSchedule[]> {
  const response = await fetch(`${API_BASE_URL}/maintenance/schedules/${productId}`);
  if (!response.ok) throw new Error('Failed to fetch maintenance schedules');
  return response.json();
}

export async function createMaintenanceSchedule(data: {
  productId: string;
  title: string;
  description?: string;
  maintenanceType: 'ROUTINE' | 'SERVICE' | 'INSPECTION' | 'REPAIR';
  intervalHours: number;
  notes?: string;
}): Promise<MaintenanceSchedule> {
  const response = await fetchWithAuth('/maintenance/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create maintenance schedule');
  }
  return response.json();
}

export async function getMaintenanceRecords(productId: string): Promise<MaintenanceRecord[]> {
  const response = await fetch(`${API_BASE_URL}/maintenance/records/${productId}`);
  if (!response.ok) throw new Error('Failed to fetch maintenance records');
  return response.json();
}

export async function createMaintenanceRecord(data: {
  productId: string;
  title: string;
  description?: string;
  maintenanceType: 'ROUTINE' | 'SERVICE' | 'INSPECTION' | 'REPAIR';
  cost?: number;
  performedAt?: string;
}): Promise<MaintenanceRecord> {
  const response = await fetchWithAuth('/maintenance/records', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create maintenance record');
  }
  return response.json();
}

export async function getProductManuals(productId: string): Promise<ProductManual[]> {
  const response = await fetch(`${API_BASE_URL}/maintenance/manuals/${productId}`);
  if (!response.ok) throw new Error('Failed to fetch product manuals');
  return response.json();
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export async function getMyNotifications(options?: { unreadOnly?: boolean; limit?: number; offset?: number }): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (options?.unreadOnly) params.set('unread', 'true');
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  
  const response = await fetchWithAuth(`/notifications?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  const response = await fetchWithAuth('/notifications/unread-count');
  if (!response.ok) throw new Error('Failed to fetch unread count');
  return response.json();
}

export async function markNotificationAsRead(id: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' });
  if (!response.ok) throw new Error('Failed to mark notification as read');
  return response.json();
}

export async function markAllNotificationsAsRead(): Promise<{ message: string }> {
  const response = await fetchWithAuth('/notifications/read-all', { method: 'PATCH' });
  if (!response.ok) throw new Error('Failed to mark all as read');
  return response.json();
}

export async function deleteNotification(id: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`/notifications/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete notification');
  return response.json();
}

export interface ComparisonProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  condition: string;
  images: string[];
  category: { name: string };
  seller: { company: { name: string } };
  reviews: Array<{ rating: number }>;
}

export interface ComparisonList {
  id: string;
  userId: string;
  products: ComparisonProduct[];
}

export async function addToComparison(productId: string): Promise<ComparisonList> {
  const response = await fetchWithAuth('/comparison/add', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to add to comparison');
  }
  return response.json();
}

export async function removeFromComparison(productId: string): Promise<ComparisonList> {
  const response = await fetchWithAuth('/comparison/remove', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
  if (!response.ok) throw new Error('Failed to remove from comparison');
  return response.json();
}

export async function getMyComparison(): Promise<ComparisonList> {
  const response = await fetchWithAuth('/comparison');
  if (!response.ok) throw new Error('Failed to fetch comparison');
  return response.json();
}

export async function clearComparison(): Promise<ComparisonList> {
  const response = await fetchWithAuth('/comparison/clear', { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to clear comparison');
  return response.json();
}

export interface DisputeOrder {
  id: string;
  orderNumber: string;
  status: string;
  disputeStatus: string;
  disputeReason?: string;
  items: Array<{ product: { name: string; images: string[] } }>;
  company: { name: string };
  total: number;
  createdAt: string;
}

export async function openDispute(orderId: string, reason: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`/orders/${orderId}/dispute`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to open dispute');
  }
  return response.json();
}

export async function getMyDisputes(): Promise<DisputeOrder[]> {
  const response = await fetchWithAuth('/orders/my-disputes');
  if (!response.ok) throw new Error('Failed to fetch disputes');
  return response.json();
}

export async function getDisputeDetails(orderId: string): Promise<DisputeOrder> {
  const response = await fetchWithAuth(`/orders/${orderId}/dispute`);
  if (!response.ok) throw new Error('Failed to fetch dispute details');
  return response.json();
}

export interface SupportReply {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export async function getMySupportTickets(): Promise<{ tickets: SupportTicket[] }> {
  const response = await fetchWithAuth('/support/tickets');
  if (!response.ok) throw new Error('Failed to fetch tickets');
  return response.json();
}

export async function createSupportTicket(data: {
  category: string;
  subject: string;
  description: string;
  priority?: string;
}): Promise<SupportTicket> {
  const response = await fetchWithAuth('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create ticket');
  }
  return response.json();
}

export async function addSupportReply(ticketId: string, message: string): Promise<SupportReply> {
  const response = await fetchWithAuth(`/support/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error('Failed to add reply');
  return response.json();
}
