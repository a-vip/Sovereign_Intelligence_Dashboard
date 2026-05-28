async function test() {
  console.log("=== Admin Live Edit Integration Test ===");
  try {
    // 1. Fetch live events
    console.log("Fetching live events from /api/events...");
    const getRes = await fetch("http://localhost:3000/api/events");
    if (!getRes.ok) {
      throw new Error(`Failed to fetch events: ${getRes.status} ${getRes.statusText}`);
    }
    const data = await getRes.json();
    const events = data.events || [];
    console.log(`Successfully fetched ${events.length} events.`);

    if (events.length === 0) {
      console.log("No events found in the database.");
      return;
    }

    const targetEvent = events[0];
    console.log("Target event for live editing:");
    console.log(`- ID: ${targetEvent.id}`);
    console.log(`- Title: ${targetEvent.title}`);
    console.log(`- Original Category: ${targetEvent.category}`);
    console.log(`- Original Severity: ${targetEvent.severity}`);
    console.log(`- Original Summary: ${targetEvent.details?.summary || targetEvent.summary}`);

    // 2. Perform live edit PATCH request (simulating Admin action)
    console.log("\nSimulating Admin PATCH request to /api/admin/events...");
    const adminUserId = "9f7de0af-d4fe-4801-b595-b81b8d9bf48e"; // Real database Admin Avi's ID
    
    const patchPayload = {
      id: targetEvent.id,
      category: targetEvent.category === "Conflict" ? "Surveillance" : "Conflict",
      severity: targetEvent.severity === 5 ? 4 : 5,
      summary: "VERIFIED TEST: Admin successfully edited this summary directly from the live map."
    };

    const patchRes = await fetch("http://localhost:3000/api/admin/events", {
      method: "PATCH",
      headers: {
        "x-user-id": adminUserId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patchPayload)
    });

    if (!patchRes.ok) {
      const errorText = await patchRes.text();
      throw new Error(`PATCH request failed: ${patchRes.status} - ${errorText}`);
    }

    const patchData = await patchRes.json();
    console.log("Admin edit PATCH response:", patchData);

    if (patchData.success) {
      console.log("✓ Live edit successfully applied and persisted in database!");
      console.log("Updated Event Details:");
      console.log(`- Category: ${patchData.event.category}`);
      console.log(`- Severity: ${patchData.event.severity}`);
      console.log(`- Summary: ${patchData.event.details?.summary || patchData.event.summary}`);

      // 3. Restore original event state to clean up database
      console.log("\nRestoring original event state to keep database clean...");
      const restorePayload = {
        id: targetEvent.id,
        category: targetEvent.category,
        severity: targetEvent.severity,
        summary: targetEvent.details?.summary || targetEvent.summary || ""
      };

      const restoreRes = await fetch("http://localhost:3000/api/admin/events", {
        method: "PATCH",
        headers: {
          "x-user-id": adminUserId,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(restorePayload)
      });

      if (restoreRes.ok) {
        console.log("✓ Original event details successfully restored.");
      } else {
        console.warn("⚠ Failed to restore original details:", await restoreRes.text());
      }
    } else {
      throw new Error("API returned success: false");
    }

  } catch (error) {
    console.error("❌ Integration test failed:", error);
  }
}

test();
