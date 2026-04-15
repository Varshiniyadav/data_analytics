const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface KPIs {
  total_revenue: number;
  total_profit: number;
  profit_margin: number;
  total_orders: number;
  avg_order_value: number;
  unique_customers: number;
  yoy_growth: number;
}

export interface TrendData {
  'Year-Month': string;
  Sales: number;
  Profit: number;
  Orders: number;
  'Profit Margin': number;
  'Revenue Growth %': number | null;
}

export interface ProductData {
  Product: string;
  Sales: number;
  Profit: number;
  Orders: number;
  'Profit Margin': number;
  'Avg Order Value': number;
}

export interface RegionData {
  Region: string;
  Sales: number;
  Profit: number;
  Orders: number;
  Customers: number;
  'Profit Margin': number;
  'Revenue Per Customer': number;
}

export interface ForecastData {
  date: string;
  forecast: number;
  lower_bound: number;
  upper_bound: number;
}

export interface Recommendation {
  type: 'critical' | 'warning' | 'opportunity';
  category: string;
  title: string;
  message: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SimulationResult {
  base: { revenue: number; profit: number; margin: number };
  simulated: { revenue: number; profit: number; margin: number };
  delta: { revenue: number; profit: number; margin: number; profit_change_pct: number };
  impact_level: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export const api = {
  async getSummary() {
    const r = await fetch(`${API_BASE_URL}/api/summary`);
    if (!r.ok) throw new Error('Failed to fetch summary');
    return r.json();
  },
  async getTrends() {
    const r = await fetch(`${API_BASE_URL}/api/trends`);
    if (!r.ok) throw new Error('Failed to fetch trends');
    return r.json();
  },
  async getProducts() {
    const r = await fetch(`${API_BASE_URL}/api/products`);
    if (!r.ok) throw new Error('Failed to fetch products');
    return r.json();
  },
  async getRegions() {
    const r = await fetch(`${API_BASE_URL}/api/regions`);
    if (!r.ok) throw new Error('Failed to fetch regions');
    return r.json();
  },
  async getForecast(periods = 6) {
    const r = await fetch(`${API_BASE_URL}/api/forecast?periods=${periods}`);
    if (!r.ok) throw new Error('Failed to fetch forecast');
    return r.json();
  },
  async getAdvisor(): Promise<{ recommendations: Recommendation[] }> {
    const r = await fetch(`${API_BASE_URL}/api/advisor`);
    if (!r.ok) throw new Error('Failed to fetch advisor');
    return r.json();
  },
  async simulate(price_change: number, discount: number, volume_change: number): Promise<SimulationResult> {
    const params = new URLSearchParams({
      price_change: String(price_change),
      discount: String(discount),
      volume_change: String(volume_change),
    });
    const r = await fetch(`${API_BASE_URL}/api/simulate?${params}`, { method: 'POST' });
    if (!r.ok) throw new Error('Failed to simulate');
    return r.json();
  },
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US').format(value);
