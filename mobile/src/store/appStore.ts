import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Inquiry, SupplyItem, TodoItem, mockInquiries, mockSupply, mockTodoEvents 
} from '../data/activities';
import { 
  Employee, mockEmployees, mockUser 
} from '../data/users';
import { 
  Product, Supplier, mockProducts, mockSuppliers 
} from '../data/products';
import { 
  ClosedDeal, WeeklyTrend, mockClosedDeals, mockWeeklyTrend, mockDashboardMetrics, mockAccountsData 
} from '../data/dashboard';
import { 
  PurchaseOrder, Invoice, mockPurchaseOrders, mockInvoices 
} from '../data/orders';
import { 
  NotificationItem, mockNotifications, mockDocumentsData 
} from '../data/notifications';

interface ActiveCall {
  caller: any;
  type: 'voice' | 'video';
  status: 'incoming' | 'ongoing' | 'ended';
  startTime: number;
  duration: number;
}

interface AppSettings {
  default_margin_percent: number;
  seller_email: string;
  business_name: string;
}

interface AppState {
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  currentUser: any | null;
  settings: AppSettings;
  
  inquiriesData: Inquiry[];
  supplyData: SupplyItem[];
  purchaseOrdersData: PurchaseOrder[];
  invoicesData: Invoice[];
  employeesData: Employee[];
  todoData: TodoItem[];
  notificationsData: NotificationItem[];
  documentsData: any[];
  accountsData: any[];
  productsData: Product[];
  suppliersData: Supplier[];
  
  closedDealsData: ClosedDeal[];
  weeklyTrendData: WeeklyTrend[];
  dashboardMetrics: any[];
  
  activeCall: ActiveCall | null;

  // Actions
  initStore: () => Promise<void>;
  toggleTheme: () => void;
  login: (user: any) => void;
  logout: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Inquiry Operations
  addInquiry: (inquiry: Inquiry) => void;
  updateInquiry: (inquiry: Inquiry) => void;
  updateInquiryStatus: (id: string, status: string) => void;
  
  // Supply Operations
  updateSupplyItem: (id: string, updates: Partial<SupplyItem>) => void;
  
  // PO / Invoice Operations
  addPurchaseOrder: (po: PurchaseOrder) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, status: string) => void;
  
  // Todo Operations
  addTodo: (todo: TodoItem) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  
  // Notification Operations
  addNotification: (notif: NotificationItem) => void;
  markNotificationsAsRead: () => void;
  
  // Employee Operations
  addEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  
  // Document Operations
  addDocument: (doc: any) => void;

  // Account Operations
  addAccount: (account: any) => void;

  // Call Operations
  startCall: (user: any, type?: 'voice' | 'video') => void;
  endCall: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'light',
  isAuthenticated: false,
  currentUser: null,
  settings: {
    default_margin_percent: 15,
    seller_email: 'admin@trademind.com',
    business_name: 'TradeMind Ltd'
  },
  
  inquiriesData: mockInquiries,
  supplyData: mockSupply,
  purchaseOrdersData: mockPurchaseOrders,
  invoicesData: mockInvoices,
  employeesData: mockEmployees,
  todoData: mockTodoEvents,
  notificationsData: mockNotifications,
  documentsData: mockDocumentsData,
  accountsData: mockAccountsData,
  productsData: mockProducts,
  suppliersData: mockSuppliers,
  
  closedDealsData: mockClosedDeals,
  weeklyTrendData: mockWeeklyTrend,
  dashboardMetrics: mockDashboardMetrics,
  
  activeCall: null,

  initStore: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedAuth = await AsyncStorage.getItem('is_auth');
      const savedUserProfile = await AsyncStorage.getItem('user_profile');
      const savedSettings = await AsyncStorage.getItem('settings');

      set({
        theme: (savedTheme as 'light' | 'dark') || 'light',
        isAuthenticated: savedAuth === 'true',
        currentUser: savedUserProfile ? JSON.parse(savedUserProfile) : null,
        settings: savedSettings ? JSON.parse(savedSettings) : {
          default_margin_percent: 15,
          seller_email: 'admin@trademind.com',
          business_name: 'TradeMind Ltd'
        }
      });
    } catch (e) {
      console.warn('Failed to load storage values', e);
    }
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: nextTheme });
    AsyncStorage.setItem('theme', nextTheme);
  },

  login: (user) => {
    const userProfile = user || mockUser;
    set({ isAuthenticated: true, currentUser: userProfile });
    AsyncStorage.setItem('is_auth', 'true');
    AsyncStorage.setItem('user_profile', JSON.stringify(userProfile));
  },

  logout: () => {
    set({ isAuthenticated: false, currentUser: null });
    AsyncStorage.removeItem('is_auth');
    AsyncStorage.removeItem('user_profile');
  },

  updateSettings: (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    AsyncStorage.setItem('settings', JSON.stringify(updated));
  },

  addInquiry: (inquiry) => {
    set({ inquiriesData: [inquiry, ...get().inquiriesData] });
    
    // Auto trigger notification
    get().addNotification({
      id: Date.now(),
      title: "New Inquiry Created",
      message: `Inquiry ${inquiry.inquiry_id} for ${inquiry.buyer_name} added successfully.`,
      time: "Just now",
      type: "inquiry",
      isRead: false
    });
  },

  updateInquiry: (updatedInquiry) => {
    set({
      inquiriesData: get().inquiriesData.map(item => 
        item.inquiry_id === updatedInquiry.inquiry_id ? updatedInquiry : item
      )
    });
  },

  updateInquiryStatus: (id, status) => {
    set({
      inquiriesData: get().inquiriesData.map(item => 
        item.inquiry_id === id ? { ...item, status } : item
      )
    });

    // If confirmed, automatically push to supply tracking list!
    if (status === 'CONFIRMED') {
      const inquiry = get().inquiriesData.find(item => item.inquiry_id === id);
      if (inquiry) {
        const supplyItemExists = get().supplyData.some(item => item.inquiry_id === id);
        if (!supplyItemExists) {
          const newSupply: SupplyItem = {
            inquiry_id: id,
            supplier: inquiry.seller_quote?.seller_name || "Unassigned",
            buyer_name: inquiry.buyer_name,
            buyer_email: inquiry.buyer_email,
            cargo: inquiry.products[0]?.product_name || "General Cargo",
            quantity: `${inquiry.products[0]?.quantity || 1} ${inquiry.products[0]?.unit || 'units'}`,
            destination: inquiry.vessel_name || "Unknown",
            status: "PENDING",
            date: new Date().toISOString().split('T')[0],
            products: inquiry.products.map(p => ({ product_name: p.product_name }))
          };
          set({ supplyData: [newSupply, ...get().supplyData] });
        }
      }
    }
  },

  updateSupplyItem: (id, updates) => {
    set({
      supplyData: get().supplyData.map(item => 
        item.inquiry_id === id ? { ...item, ...updates } : item
      )
    });
  },

  addPurchaseOrder: (po) => {
    set({ purchaseOrdersData: [po, ...get().purchaseOrdersData] });
  },

  addInvoice: (invoice) => {
    set({ invoicesData: [invoice, ...get().invoicesData] });
  },

  updateInvoiceStatus: (id, status) => {
    set({
      invoicesData: get().invoicesData.map(item => 
        item.inquiry_id === id ? { ...item, invoice_status: status } : item
      )
    });
  },

  addTodo: (todo) => {
    set({ todoData: [todo, ...get().todoData] });
  },

  toggleTodo: (id) => {
    set({
      todoData: get().todoData.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  },

  deleteTodo: (id) => {
    set({ todoData: get().todoData.filter(item => item.id !== id) });
  },

  addNotification: (notif) => {
    set({ notificationsData: [notif, ...get().notificationsData] });
  },

  markNotificationsAsRead: () => {
    set({
      notificationsData: get().notificationsData.map(n => ({ ...n, isRead: true }))
    });
  },

  addEmployee: (emp) => {
    set({ employeesData: [emp, ...get().employeesData] });
  },

  deleteEmployee: (id) => {
    set({ employeesData: get().employeesData.filter(e => e.id !== id) });
  },

  addDocument: (doc) => {
    set({ documentsData: [doc, ...get().documentsData] });
  },

  addAccount: (account) => {
    set({ accountsData: [account, ...get().accountsData] });
  },

  startCall: (user, type = 'voice') => {
    set({
      activeCall: {
        caller: user,
        type,
        status: 'incoming',
        startTime: Date.now(),
        duration: 0
      }
    });
  },

  endCall: () => {
    set({ activeCall: null });
  }
}));
