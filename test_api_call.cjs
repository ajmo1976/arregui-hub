const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('http://localhost:8000/api/v1/services/events');
        const ev = res.data.find(e => e.id === 146);
        console.log("Event 146 structured_data type:", typeof ev.details[0].structured_data);
        console.log("Event 146 structured_data value:", ev.details[0].structured_data);
    } catch (e) {
        console.log("Failed to hit API:", e.message);
    }
}
test();
