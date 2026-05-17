import axios, { type AxiosInstance, type AxiosError, isAxiosError } from "axios";
import { MeinBueroApiError } from "./errors.js";

// ── Domain types ──────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  customerNumber?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface CreateCustomerDto {
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  customerId?: string;
  status?: "draft" | "sent" | "paid" | "cancelled";
  totalNet?: number;
  totalGross?: number;
  date?: string;
  dueDate?: string;
}

export interface CreateInvoiceDto {
  customerId: string;
  date: string;
  dueDate: string;
  positions: InvoicePosition[];
}

export interface InvoicePosition {
  articleId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

export interface Article {
  id: string;
  articleNumber?: string;
  name?: string;
  description?: string;
  unitPrice?: number;
  vatRate?: number;
  unit?: string;
}

export interface CreateArticleDto {
  name: string;
  description?: string;
  unitPrice: number;
  vatRate: number;
  unit?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerId?: string;
  status?: string;
  date?: string;
}

export interface CreateOrderDto {
  customerId?: string;
  orderNumber?: string;
  date?: string;
  status?: string;
}

export interface Expense {
  id: string;
  amount?: number;
  category?: string;
  date?: string;
  description?: string;
}

export interface CreateExpenseDto {
  amount: number;
  category?: string;
  date: string;
  description?: string;
}

export interface Todo {
  id: string;
  title?: string;
  status?: string;
  dueDate?: string;
}

export interface CreateTodoDto {
  title: string;
  status?: string;
  dueDate?: string;
}

export interface Offer {
  id: string;
  offerNumber?: string;
  customerId?: string;
  status?: string;
  date?: string;
}

export interface PagedResponse<T> {
  data: T[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

// ── Client ────────────────────────────────────────────────────────────────────

export class MeinBueroClient {
  private readonly http: AxiosInstance;
  private readonly ownershipId: string;
  private readonly baseURL: string;
  private bearerToken: string | null = null;
  // promise-lock prevents parallel auth storms on concurrent requests
  private authPromise: Promise<void> | null = null;

  constructor() {
    const ownershipId = process.env["MEINBUERO_OWNERSHIP_ID"];
    if (!ownershipId) throw new Error("MEINBUERO_OWNERSHIP_ID environment variable is required");

    this.ownershipId = ownershipId;
    this.baseURL = process.env["MEINBUERO_API_BASE_URL"] ?? "https://api.meinbuero.de/openapi";

    this.http = axios.create({
      baseURL: this.baseURL,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      timeout: 30_000,
    });

    this.http.interceptors.request.use(async (config) => {
      await this.ensureAuthenticated();
      config.headers["Authorization"] = `Bearer ${this.bearerToken}`;
      return config;
    });

    this.http.interceptors.response.use(
      (r) => r,
      async (err: AxiosError) => {
        const config = (err.config ?? {}) as Record<string, unknown>;
        if (err.response?.status === 401 && !config["_retry"]) {
          config["_retry"] = true;
          this.bearerToken = null;
          this.authPromise = null;
          await this.ensureAuthenticated();
          return this.http.request(err.config!);
        }
        return Promise.reject(
          new MeinBueroApiError(
            err.message,
            err.response?.status ?? 0,
            err.response?.data,
          ),
        );
      },
    );
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.bearerToken) return;
    this.authPromise ??= this.fetchToken().finally(() => {
      this.authPromise = null;
    });
    return this.authPromise;
  }

  private async fetchToken(): Promise<void> {
    try {
      const resp = await axios.post<{ token: string }>(
        `${this.baseURL}/auth/token`,
        { ownershipId: this.ownershipId },
        { headers: { "Content-Type": "application/json" }, timeout: 10_000 },
      );
      this.bearerToken = resp.data.token;
    } catch (err) {
      if (isAxiosError(err)) {
        throw new MeinBueroApiError(`Authentication failed: ${err.message}`, err.response?.status ?? 0);
      }
      throw new MeinBueroApiError(`Authentication failed: ${String(err)}`, 0);
    }
  }

  // Customers
  async listCustomers(p?: ListParams) {
    return (await this.http.get<PagedResponse<Customer>>("/customer", { params: p })).data;
  }
  async getCustomer(id: string) {
    return (await this.http.get<Customer>(`/customer/${encodeURIComponent(id)}`)).data;
  }
  async createCustomer(dto: CreateCustomerDto) {
    return (await this.http.post<Customer>("/customer/", dto)).data;
  }
  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    return (await this.http.put<Customer>(`/customer/${encodeURIComponent(id)}`, dto)).data;
  }

  // Invoices
  async listInvoices(p?: ListParams & { status?: Invoice["status"] }) {
    return (await this.http.get<PagedResponse<Invoice>>("/invoice", { params: p })).data;
  }
  async getInvoice(id: string) {
    return (await this.http.get<Invoice>(`/invoice/${encodeURIComponent(id)}`)).data;
  }
  async createInvoice(dto: CreateInvoiceDto) {
    return (await this.http.post<Invoice>("/invoice/", dto)).data;
  }
  async getInvoiceDocument(id: string) {
    return Buffer.from(
      (
        await this.http.get<ArrayBuffer>(`/invoice/document/${encodeURIComponent(id)}`, {
          responseType: "arraybuffer",
        })
      ).data,
    );
  }
  async sendInvoice(
    id: string,
    dto: { email: string; subject?: string; message?: string },
  ) {
    return (await this.http.post(`/invoice/${encodeURIComponent(id)}/send`, dto)).data;
  }
  async lockInvoice(id: string) {
    return (await this.http.put(`/invoice/${encodeURIComponent(id)}/lock`, {})).data;
  }
  async addPayment(id: string, dto: { amount: number; date: string; method?: string }) {
    return (await this.http.post(`/invoice/${encodeURIComponent(id)}/payment`, dto)).data;
  }

  // Articles
  async listArticles(p?: ListParams) {
    return (await this.http.get<PagedResponse<Article>>("/article/", { params: p })).data;
  }
  async getArticle(id: string) {
    return (await this.http.get<Article>(`/article/${encodeURIComponent(id)}`)).data;
  }
  async createArticle(dto: CreateArticleDto) {
    return (await this.http.post<Article>("/article/", dto)).data;
  }
  async updateArticle(id: string, dto: Partial<CreateArticleDto>) {
    return (await this.http.put<Article>(`/article/${encodeURIComponent(id)}`, dto)).data;
  }

  // Orders
  async listOrders(p?: ListParams) {
    return (await this.http.get<PagedResponse<Order>>("/order", { params: p })).data;
  }
  async getOrder(id: string) {
    return (await this.http.get<Order>(`/order/${encodeURIComponent(id)}`)).data;
  }
  async createOrder(dto: CreateOrderDto) {
    return (await this.http.post<Order>("/order/", dto)).data;
  }
  async createInvoiceFromOrder(orderId: string) {
    return (await this.http.post(`/order/${encodeURIComponent(orderId)}/invoice`, {})).data;
  }
  async createDeliveryNoteFromOrder(orderId: string) {
    return (await this.http.post(`/order/${encodeURIComponent(orderId)}/deliveryNote`, {})).data;
  }

  // Expenses
  async listExpenses(p?: ListParams) {
    return (await this.http.get<PagedResponse<Expense>>("/expense", { params: p })).data;
  }
  async getExpense(id: string) {
    return (await this.http.get<Expense>(`/expense/${encodeURIComponent(id)}`)).data;
  }
  async createExpense(dto: CreateExpenseDto) {
    return (await this.http.post<Expense>("/expense/", dto)).data;
  }
  async updateExpense(id: string, dto: Partial<CreateExpenseDto>) {
    return (await this.http.put<Expense>(`/expense/${encodeURIComponent(id)}`, dto)).data;
  }
  async deleteExpense(id: string) {
    return (await this.http.delete(`/expense/${encodeURIComponent(id)}`)).data;
  }

  // Todos
  async listTodos(p?: ListParams) {
    return (await this.http.get<PagedResponse<Todo>>("/todo", { params: p })).data;
  }
  async createTodo(dto: CreateTodoDto) {
    return (await this.http.post<Todo>("/todo/", dto)).data;
  }
  async setTodoStatus(id: string, status: string) {
    return (await this.http.put(`/todo/${encodeURIComponent(id)}/status`, { status })).data;
  }
  async createTodoMessage(id: string, message: string) {
    return (await this.http.post(`/todo/${encodeURIComponent(id)}/message`, { message })).data;
  }

  // Offers (read-only)
  async listOffers(p?: ListParams) {
    return (await this.http.get<PagedResponse<Offer>>("/offer", { params: p })).data;
  }
  async getOffer(id: string) {
    return (await this.http.get<Offer>(`/offer/${encodeURIComponent(id)}`)).data;
  }

  // Settings
  async getAccountSettings() {
    return (await this.http.get("/setting/account")).data;
  }
  async getPayConditions() {
    return (await this.http.get("/setting/payCondition")).data;
  }
  async getDeliveryConditions() {
    return (await this.http.get("/setting/deliveryCondition")).data;
  }
}

let _client: MeinBueroClient | null = null;

export function getClient(): MeinBueroClient {
  _client ??= new MeinBueroClient();
  return _client;
}
