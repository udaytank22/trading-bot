// Auto-generated table schemas

export const ClientRFQsPageSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "description", label: "Product" },
  { key: "quantity", label: "Quantity" },
  { key: "unitPrice", label: "Quoted Price" },
  { key: "totalPrice", label: "Total Price", className: "text-right" },
];

export const ClientRFQsPageSchema2 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "inquiry_id", label: "Inquiry Ref" },
  { key: "buyer", label: "Client" },
  { key: "itemsCount", label: "Items" },
  { key: "date", label: "Received Date" },
  { key: "status", label: "Status" },
  { key: "action", label: "", className: "text-right" }
];

export const ClientRFQsPageSchema3 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "shipment_number", label: "Order Ref" },
  { key: "buyer", label: "Customer" },
  { key: "cargo", label: "Cargo Details" },
  { key: "date", label: "Ordered Date" },
  { key: "status", label: "Status" },
  { key: "action", label: "", className: "text-right" }
];

export const ClientRFQsPageSchema4 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "invoice_id", label: "Invoice ID" },
  { key: "order", label: "Order Ref" },
  { key: "cargo", label: "Cargo Details" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "text-right" },
];

export const DashboardPageSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "id", label: "Inquiry ID" },
  { key: "buyer", label: "Buyer" },
  { key: "products", label: "Products", className: "w-1/3" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
  { key: "actions", label: "", className: "text-right w-16" }
];

export const DealDrawerSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product" },
  { key: "qty", label: "Qty" },
  { key: "unit", label: "Unit" },
  { key: "specs", label: "Specs" },
];

export const DealDrawerSchema2 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product" },
  { key: "unitPrice", label: "Unit Price" },
  { key: "moq", label: "MOQ" },
  { key: "lead", label: "Lead" },
];

export const DealDrawerSchema3 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product" },
  { key: "myPrice", label: "My Price" },
  { key: "margin", label: "Margin" },
  { key: "total", label: "Total", className: "text-right" },
];

export const InquiryDetailsPageSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product Name" },
  { key: "category", label: "Category" },
  { key: "qty", label: "Qty" },
  { key: "unit", label: "Unit" },
];

export const InquiryDetailsPageSchema2 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product Name" },
  { key: "unitPrice", label: "Supplier Unit Price" },
  { key: "moq", label: "MOQ" },
  { key: "lead", label: "Lead Time" },
];

export const InquiryDetailsPageSchema3 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product Name" },
  { key: "myPrice", label: "Selling Unit Price" },
  { key: "margin", label: "Applied Margin" },
  { key: "total", label: "Total Price", className: "text-right" },
];

export const AdminApprovalModalSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product" },
  { key: "supplier", label: "Sourced From" },
  { key: "costPrice", label: "Cost Price" },
  { key: "sellingPrice", label: "Selling Price", className: "text-right" },
  { key: "totalValue", label: "Total Value", className: "text-right" },
];

export const RFQModalSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "party", label: "Party / Supplier" },
  { key: "items", label: "Items for RFQ" },
  { key: "action", label: "Action", className: "text-right" },
];

export const VerificationModalSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product" },
  { key: "basePrice", label: "Base Price" },
  { key: "marginDisc", label: "Margin/Disc" },
  { key: "finalUnitPrice", label: "Final Unit Price", className: "text-right" },
];

export const InventoryPageSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "id", label: "Item ID" },
  { key: "name", label: "Item Name" },
  { key: "category", label: "Category" },
  { key: "location", label: "Location" },
  { key: "quantity", label: "Quantity" },
  { key: "price", label: "Price" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "text-right" },
];

export const InvoicesPageSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "inq_no", label: "Inq No" },
  { key: "client", label: "Client" },
  { key: "vessel", label: "Vessel" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Action", className: "text-right" },
];

export const ProfitPageSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "id", label: "Deal ID" },
  { key: "buyer", label: "Buyer" },
  { key: "revenue", label: "Revenue" },
  { key: "cost", label: "Cost" },
  { key: "profit", label: "Profit" },
  { key: "margin", label: "Margin" },
];

export const PODetailsPageSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "description", label: "Product" },
  { key: "unitPrice", label: "Unit Price" },
  { key: "quantity", label: "Quantity" },
  { key: "totalPrice", label: "Total Price", className: "text-right" },
];

export const ClientsTabSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "id", label: "Client ID" },
  { key: "name", label: "Client Name" },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "text-right" },
];

export const DocumentsTabSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "id", label: "Document ID" },
  { key: "name", label: "Document Name" },
  { key: "category", label: "Category" },
  { key: "type", label: "Entity Type" },
  { key: "entityName", label: "Linked Entity" },
  { key: "uploadedDate", label: "Uploaded Date" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "text-right" },
];

export const ProductsTabSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "id", label: "Product ID" },
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "sku", label: "SKU" },
  { key: "sellingPrice", label: "Selling Price" },
  { key: "purchasePrice", label: "Purchase Price" },
  { key: "actions", label: "Actions", className: "text-right" },
];

export const ReportingTabSchema1 = (entityLabel) => [
  { key: 'srno', label: 'Sr. No.' },
  { key: "entity", label: entityLabel },
  { key: "completed", label: "Completed Deals" },
  { key: "failed", label: "Failed Deals" },
  { key: "total", label: "Total Inquiries" },
  { key: "details", label: "Details" },
];

export const ReportingTabSchema2 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "client", label: "Client" },
  { key: "employee", label: "Employee" },
  { key: "received", label: "Inquiry Received" },
  { key: "rfqSent", label: "RFQ Sent" },
  { key: "supplierResponse", label: "Supplier Resp." },
  { key: "quotationSent", label: "Quotation Sent" },
  { key: "clientResponse", label: "Client Resp." },
  { key: "status", label: "Status" },
];

export const VehiclesTabSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "vehicle_no", label: "Vehicle Number" },
  { key: "type", label: "Type" },
  { key: "capacity", label: "Capacity" },
  { key: "driver_name", label: "Driver Name" },
  { key: "document", label: "Document" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "text-right" },
];

export const VendorsTabSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "id", label: "Vendor ID" },
  { key: "name", label: "Company Name" },
  { key: "company", label: "Contact / Company" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "text-right" },
];

export const SupplyViewModalSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product" },
  { key: "qty", label: "Qty" },
  { key: "unit", label: "Unit" },
  { key: "specs", label: "Category" },
];

export const SupplyDetailsPageSchema1 = [
  { key: 'srno', label: 'Sr. No.' },
  { key: "product", label: "Product" },
  { key: "qty", label: "Qty" },
  { key: "unit", label: "Unit" },
  { key: "specs", label: "Category" },
];

