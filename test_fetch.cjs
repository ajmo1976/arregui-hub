const axios = require('axios');
async function test() {
    const summaryRes = await axios.get('http://127.0.0.1:8000/api/v1/dashboard/summary?range=last_month');
    const logsRes = await axios.get('http://127.0.0.1:8000/api/v1/operational');
    const eventsRes = await axios.get('http://127.0.0.1:8000/api/v1/services/events');
    const pricesRes = await axios.get('http://127.0.0.1:8000/api/v1/inventory/meal-prices');
    
    console.log("Summary lunches:", summaryRes.data.lunches);
    const logs = logsRes.data;
    const events = eventsRes.data.filter(ev => ev.company === 'Planificación');
    console.log("Logs count:", logs.length);
    console.log("Events count:", events.length);
    if(events.length > 0) {
        console.log("First event date:", events[0].request_date);
    }
}
test();
