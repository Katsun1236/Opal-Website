const test = async () => {
  const res = await fetch("https://opalheaven-dashboard.netlify.app/api/plugin/telemetry", {
    method: "POST",
    headers: {
      "Authorization": "Bearer K9v#mP2$xL8wQ4zR7bY1fH3jN6sT5vW",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      server: "Axolotl-PM 5.51.0",
      online: true,
      tps: 20.0,
      memoryMb: 215.4,
      players: { online: 1, max: 100, list: ["Katsun1246"] },
      logs: []
    })
  });
  console.log("Status:", res.status);
  const json = await res.json();
  console.log("Response:", json);
};
test();
