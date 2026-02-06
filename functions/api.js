export async function onRequest(context) {
  const API_KEY = "78d1f679390a4be78c3c206fe46dc9a2";
  const url = "https://api.delijn.be/gtfs/v3/realtime?json=true&delay=true&position=true";

  try {
    const response = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": API_KEY,
        "Accept": "application/json"
      }
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Fout bij ophalen data" }), { status: 500 });
  }
}