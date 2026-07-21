export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  joiningDate: string;
  phone: string;
  avatar: string;
}

export const mockEmployees: Employee[] = [
  {
    id: "EMP-001",
    name: "Arjun Sharma",
    email: "arjun@trademind.com",
    role: "Admin",
    department: "Management",
    status: "Active",
    joiningDate: "2023-01-15",
    phone: "+91 98765 43210",
    avatar: "AS"
  },
  {
    id: "EMP-002",
    name: "Priya Patel",
    email: "priya@trademind.com",
    role: "Sales Executive",
    department: "Sales",
    status: "Active",
    joiningDate: "2023-03-22",
    phone: "+91 87654 32109",
    avatar: "PP"
  },
  {
    id: "EMP-003",
    name: "Rahul Verma",
    email: "rahul@trademind.com",
    role: "Sourcing Manager",
    department: "Operations",
    status: "Active",
    joiningDate: "2023-05-10",
    phone: "+91 76543 21098",
    avatar: "RV"
  },
  {
    id: "EMP-004",
    name: "Sneha Reddy",
    email: "sneha@trademind.com",
    role: "Accountant",
    department: "Finance",
    status: "Active",
    joiningDate: "2023-06-05",
    phone: "+91 65432 10987",
    avatar: "SR"
  },
  {
    id: "EMP-005",
    name: "Vikram Singh",
    email: "vikram@trademind.com",
    role: "Logistics Coordinator",
    department: "Operations",
    status: "Inactive",
    joiningDate: "2023-08-14",
    phone: "+91 54321 09876",
    avatar: "VS"
  }
];

export const mockUser = {
  name: "Admin User",
  role: "Admin",
  email: "admin@trademind.com",
  phone: "+91 99999 88888",
  avatar: "AU",
  businessName: "TradeMind Global Ltd",
  defaultMargin: 15
};
