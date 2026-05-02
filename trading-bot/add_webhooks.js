const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('gen_workflow.json', 'utf8'));

const newNodes = [
  {
    "id": "wh-1",
    "name": "Webhook: Get Inquiries",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 1,
    "position": [200, 1000],
    "parameters": {
      "path": "get-inquiries",
      "httpMethod": "GET",
      "responseMode": "onReceived",
      "options": {}
    }
  },
  {
    "id": "wh-1-sheets",
    "name": "Read Inquiries Sheet",
    "type": "n8n-nodes-base.googleSheets",
    "typeVersion": 2,
    "position": [400, 1000],
    "parameters": {
      "operation": "read",
      "documentId": { "value": "={{$env.GOOGLE_SHEET_ID}}" },
      "sheetName": { "value": "Inquiries" }
    }
  },
  {
    "id": "wh-2",
    "name": "Webhook: Send RFQ",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 1,
    "position": [200, 1200],
    "parameters": {
      "path": "send-rfq",
      "httpMethod": "POST",
      "responseMode": "onReceived",
      "options": {}
    }
  },
  {
    "id": "wh-3",
    "name": "Webhook: Send Quote",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 1,
    "position": [200, 1400],
    "parameters": {
      "path": "send-quote",
      "httpMethod": "POST",
      "responseMode": "onReceived",
      "options": {}
    }
  },
  {
    "id": "wh-4",
    "name": "Webhook: Update Status",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 1,
    "position": [200, 1600],
    "parameters": {
      "path": "update-status",
      "httpMethod": "POST",
      "responseMode": "onReceived",
      "options": {}
    }
  },
  {
    "id": "wh-4-sheets",
    "name": "Update Status in Sheets",
    "type": "n8n-nodes-base.googleSheets",
    "typeVersion": 2,
    "position": [400, 1600],
    "parameters": {
      "operation": "update",
      "documentId": { "value": "={{$env.GOOGLE_SHEET_ID}}" },
      "sheetName": { "value": "Inquiries" }
    }
  },
  {
    "id": "wh-5",
    "name": "Webhook: Get Profit Data",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 1,
    "position": [200, 1800],
    "parameters": {
      "path": "get-profit-data",
      "httpMethod": "GET",
      "responseMode": "onReceived",
      "options": {}
    }
  },
  {
    "id": "wh-5-sheets",
    "name": "Read ClosedDeals Sheet",
    "type": "n8n-nodes-base.googleSheets",
    "typeVersion": 2,
    "position": [400, 1800],
    "parameters": {
      "operation": "read",
      "documentId": { "value": "={{$env.GOOGLE_SHEET_ID}}" },
      "sheetName": { "value": "ClosedDeals" }
    }
  }
];

wf.nodes.push(...newNodes);

wf.connections["Webhook: Get Inquiries"] = {
  "main": [
    [ { "node": "Read Inquiries Sheet", "type": "main", "index": 0 } ]
  ]
};

wf.connections["Webhook: Send RFQ"] = {
  "main": [
    [ { "node": "AI: Write RFQ Email to Seller", "type": "main", "index": 0 } ]
  ]
};

wf.connections["Webhook: Send Quote"] = {
  "main": [
    [ { "node": "AI: Extract Seller Quote Prices", "type": "main", "index": 0 } ]
  ]
};

wf.connections["Webhook: Update Status"] = {
  "main": [
    [ { "node": "Update Status in Sheets", "type": "main", "index": 0 } ]
  ]
};

wf.connections["Webhook: Get Profit Data"] = {
  "main": [
    [ { "node": "Read ClosedDeals Sheet", "type": "main", "index": 0 } ]
  ]
};

fs.writeFileSync('workflows/trading_bot_workflow.json', JSON.stringify(wf, null, 2));
console.log('Added 8 nodes (webhooks + sheet readers) to workflow JSON');
