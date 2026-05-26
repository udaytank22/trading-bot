export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'inquiry' | 'purchase-order' | 'document' | 'supply' | 'system' | string;
  isRead: boolean;
}

export const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "New Inquiry Received",
    message: "A new inquiry for 'Premium Grade Copper' has been received from Global Traders.",
    time: "5 minutes ago",
    type: "inquiry",
    isRead: false,
  },
  {
    id: 2,
    title: "Purchase Order Confirmed",
    message: "Purchase Order #PO-2026-001 has been confirmed by the supplier.",
    time: "2 hours ago",
    type: "purchase-order",
    isRead: false,
  },
  {
    id: 3,
    title: "Document Verified",
    message: "The shipping documents for Deal #D-882 have been successfully verified.",
    time: "5 hours ago",
    type: "document",
    isRead: true,
  },
  {
    id: 4,
    title: "Supply Update",
    message: "The cargo for 'Steel Sheets' is now marked as 'In Transit'.",
    time: "Yesterday",
    type: "supply",
    isRead: true,
  },
  {
    id: 5,
    title: "System Maintenance",
    message: "Scheduled system maintenance will take place on Sunday at 2:00 AM UTC.",
    time: "2 days ago",
    type: "system",
    isRead: true,
  }
];

export const mockDocumentsData = [
  { id: "DOC-001", title: "Driving License", entityType: "Employee", entityName: "Arjun Sharma", category: "Identity", status: "Valid", expiryDate: "2028-05-10", uploadedAt: "2023-01-15" },
  { id: "DOC-002", title: "Passport", entityType: "Employee", entityName: "Priya Patel", category: "Identity", status: "Expiring Soon", expiryDate: "2024-08-20", uploadedAt: "2023-03-22" },
  { id: "DOC-003", title: "Vehicle Registration (RC)", entityType: "Vehicle", entityName: "MH-01-AB-1234", category: "Registration", status: "Valid", expiryDate: "2030-10-15", uploadedAt: "2023-05-10" },
  { id: "DOC-004", title: "Commercial Insurance", entityType: "Vehicle", entityName: "MH-02-CD-5678", category: "Insurance", status: "Expired", expiryDate: "2024-01-01", uploadedAt: "2023-01-01" },
  { id: "DOC-005", title: "Company Incorporation", entityType: "Company", entityName: "TradeMind Ltd", category: "Legal", status: "Valid", expiryDate: "2099-12-31", uploadedAt: "2020-01-01" }
];
