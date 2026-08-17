const response = await fetch("http://localhost:3000/signup", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    account_id: "acct_1042",
    email: process.env.DEMO_EMAIL_TO ?? "technician@example.com",
    verification_url: "https://dispatch.example.com/verify?token=sample-token",
    work_order: {
      id: "WO-2048",
      photo_urls: ["https://dispatch.example.com/photos/WO-2048-before.jpg"],
      dispatch_status: "dispatched",
      technician_follow_up: {
        technician_id: "tech_17",
        due_at: "2026-08-17T02:00:00.000Z",
        note: "Confirm the replacement valve after arrival."
      }
    }
  })
});

console.log(response.status, await response.json());

export {};
