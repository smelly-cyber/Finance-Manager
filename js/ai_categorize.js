// Auto-tagging: local keywords + optional API hook
const LOCAL_CATEGORY_KEYWORDS = {
  Travel: ["uber","lyft","airbnb","qantas","jetstar","taxi","ride"],
  Groceries: ["woolworths","coles","aldi","grocery","supermarket"],
  Food: ["mcdonald","kfc","subway","restaurant","cafe","deliveroo","ubereats"],
  Rent: ["rent","landlord","property"],
  Utilities: ["electric","water","gas","internet","telstra","optus"],
  Entertainment: ["netflix","spotify","steam","cinema"]
};

async function aiCategorize(title, amount, fallback = "uncategorized") {
  const useApi = document.getElementById("useAiToggle")?.checked;
  const endpoint = document.getElementById("aiEndpoint")?.value?.trim();

  if (useApi && endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount })
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.category) return json.category;
      }
    } catch (e) {
      // fall back
    }
  }
  // local
  const t = (title || "").toLowerCase();
  for (const [cat, words] of Object.entries(LOCAL_CATEGORY_KEYWORDS)) {
    if (words.some(w => t.includes(w))) return cat;
  }
  return fallback;
}
