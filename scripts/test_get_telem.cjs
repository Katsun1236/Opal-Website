const test = async () => {
  const loginRes = await fetch("https://opalheaven-dashboard.netlify.app/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "Suricate001" })
  });
  console.log("Login status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("Login token:", loginData.token ? "OK" : loginData);

  const res = await fetch("https://opalheaven-dashboard.netlify.app/api/telemetry", {
    headers: {
      "Authorization": `Bearer ${loginData.token}`
    }
  });
  console.log("Telemetry status:", res.status);
  const text = await res.text();
  console.log("Response text:", text);
};
test();
