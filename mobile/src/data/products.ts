export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: string;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  products: string[];
  rating: number;
  location: string;
}

export const mockProducts: Product[] = [
  {
    id: "INV-1001",
    name: "Industrial Motor",
    category: "Machinery",
    quantity: 45,
    price: "$1,200.00",
    location: "Warehouse A",
    status: "In Stock"
  },
  {
    id: "INV-1002",
    name: "Steel Bearings",
    category: "Parts",
    quantity: 12,
    price: "$45.00",
    location: "Warehouse B",
    status: "Low Stock"
  },
  {
    id: "INV-1003",
    name: "Circuit Boards",
    category: "Electronics",
    quantity: 0,
    price: "$150.00",
    location: "Warehouse A",
    status: "Out of Stock"
  },
  {
    id: "INV-1004",
    name: "Hydraulic Fluid",
    category: "Consumables",
    quantity: 200,
    price: "$85.00",
    location: "Warehouse C",
    status: "In Stock"
  }
];

export const mockSuppliers: Supplier[] = [
  {
    id: "SUPP-001",
    name: "Tata Steel Distributors",
    email: "sales@tatasteel-dist.in",
    products: ["Mild Steel Sheets 2mm", "Galvanized Iron Pipes", "SS 304 Fasteners Hex Bolt", "Cylinder Liner for Yanmar 6EY18AL", "Gasket Set for Cylinder Head"],
    rating: 4.8,
    location: "Mumbai, India"
  },
  {
    id: "SUPP-002",
    name: "Polycab Dealers Ltd.",
    email: "orders@polycab-dealers.co.in",
    products: ["Copper Wires 1.5 sqmm", "Industrial Safety Helmets", "Main Engine Fuel Injection Valve"],
    rating: 4.5,
    location: "Delhi, India"
  },
  {
    id: "SUPP-003",
    name: "Karam Safety Solutions",
    email: "wholesale@karam.in",
    products: ["Industrial Safety Helmets", "Safety Shoes", "Nitrile Inspection Gloves", "Cargo Hose 4 inch 15m"],
    rating: 4.7,
    location: "Lucknow, India"
  },
  {
    id: "SUPP-004",
    name: "Precision Tools Co.",
    email: "info@precisiontools.com",
    products: ["CNC Router Tool Bits", "Ball Valves 1 inch", "Anchor Chain Link 28mm", "Centrifugal Pump Impeller"],
    rating: 4.6,
    location: "Bangalore, India"
  }
];
