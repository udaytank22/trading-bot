export const mockTodoData = {
  events: [
    { id: 1, title: "Client Meeting - Global Traders", time: "10:00 AM", location: "Conference Room A", priority: "High", date: "2026-05-13" },
    { id: 2, title: "Project Sync", time: "02:30 PM", location: "Zoom", priority: "Medium", date: "2026-05-13" },
    { id: 3, title: "Operations Review", time: "04:00 PM", location: "Office", priority: "Low", date: "2026-05-13" },
    { id: 4, title: "Product Demo", time: "11:00 AM", location: "Showroom", priority: "High", date: "2026-05-14" },
    { id: 5, title: "HR One-on-One", time: "03:00 PM", location: "Meeting Room 2", priority: "Low", date: "2026-05-15" }
  ],
  celebrations: [
    { id: 1, type: "Birthday", name: "Priya Patel", department: "Sales", avatar: "PP", date: "2026-05-13" },
    { id: 2, type: "Work Anniversary", name: "Rahul Verma", years: "3 Years", avatar: "RV", date: "2026-05-13" }
  ],
  festivals: [
    { id: 1, name: "Ganesh Chaturthi", date: "2026-05-13", description: "Traditional celebration in the office lobby." }
  ],
  leaves: [
    { id: 1, name: "Arjun Sharma", type: "Sick Leave", duration: "13 May - 14 May" },
    { id: 2, name: "Sneha Reddy", type: "Vacation", duration: "10 May - 15 May" },
    { id: 3, name: "Vikram Singh", type: "Personal Leave", duration: "13 May" }
  ],
  pastEvents: [
    { 
      id: 101, 
      title: "Annual Team Celebration 2025", 
      date: "Dec 15, 2025", 
      description: "A wonderful evening celebrating our yearly achievements with the whole team. This event marked our record-breaking sales quarter and featured an awards ceremony, live music, and a gala dinner.",
      image: "/memories/memory1.png",
      gallery: [
        "/memories/memory1.png",
        "/memories/memory1_alt1.png",
        "/memories/memory1_alt2.png"
      ],
      attendees: 45,
      highlights: ["Quarterly Sales Awards", "Team Dinner", "Live Jazz Band", "CEO's Vision 2026 Speech"],
      location: "Grand Ballroom, Marriott"
    },
    { 
      id: 102, 
      title: "Summer Team Building", 
      date: "July 20, 2025", 
      description: "Outdoor activities and team bonding exercises at the local park. We participated in tug-of-war, relay races, and a barbecue lunch to strengthen our cross-departmental relationships.",
      image: "/memories/memory2.png",
      gallery: [
        "/memories/memory2.png",
        "/memories/memory1_alt1.png" // Reusing for variety in mock
      ],
      attendees: 38,
      highlights: ["Tug-of-War Championship", "Barbecue Lunch", "Relay Races", "Medal Ceremony"],
      location: "Central City Park"
    }
  ]
};
