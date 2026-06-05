const id = 'fdcc290378d4f0e04ae0078514da8fe1';
const title = "We Updated Our Privacy Policy. Here's What Changed and Why.";
const url = "https://www.thewrap.com/we-updated-our-privacy-policy-heres-what-changed-and-why/";

async function run() {
  try {
    const res = await fetch('http://localhost:3001/api/admin/events', {
      method: 'DELETE',
      headers: {
        'x-user-id': '4541d5d8-dd23-4d31-8139-ec98a9647cc2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, permanent: true, title, url })
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

run();
