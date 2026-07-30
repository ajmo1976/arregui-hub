const fs = require('fs');
const axios = require('axios');

async function test() {
    try {
        // Since we can't easily login, let's just write the JSON from the backend script
        const rawJson = '{"title":"Planificación Metropolitano","responsible":"Admin","cost_center":"Metropolitano","company":"Planificación","status":"Abierto","status_date":"2026-07-29T18:43:04.342000","invoice_number":null,"request_date":"2026-07-29T18:43:04.342000","iva_percentage":16.0,"total_amount":5.8,"id":146,"created_at":"2026-07-29T18:43:04.537380","gestor":null,"details":[{"service_date":"2026-07-29T16:00:00","service_time":"Planificación","location":"Planta Los Cortijos & Otras","attendees":72,"additional_requirements":"","observations":"","estimated_amount":5.0,"selected_items":[{"id":42,"sku":"SERV-001","name":"Servicio ","price":5.0,"quantity":1,"unit":"Unidad","is_sold_by_case":false,"units_per_case":1}],"service_category_id":4,"structured_data":{"sc":8,"sm":12,"plc":10,"conc":8,"cenas":9,"cnExt":7,"csExt":8,"cnPlanta":10},"id":362,"event_id":146}]}';
        
        const ev = JSON.parse(rawJson);
        const planningEvents = [ev];
        
        const detailsMap = new Map();
        planningEvents.forEach((ev) => {
            if (!ev.details) return;
            ev.details.forEach((d) => {
                const date = d.service_date.split('T')[0];
                if (!detailsMap.has(date)) {
                    detailsMap.set(date, { date, plc:0, sm:0, cnPlanta:0, cenas:0, sc:0, conc:0, cnExt:0, csExt:0, sistemasCep:0, seguridadPlc:0, seguridadRuices:0, seguridadCentralCep:0, choferesCenas:0, quintasCenas:0, pilotosAlmuerzos:0, choferesDesayunos:0, quintasDesayunos:0, pepsicoDesayunos:0 });
                }
                const p = detailsMap.get(date);
                const obs = d.observations || '';
                
                const isMetropolitano = ev.cost_center === 'Metropolitano';
                const isCep = ev.cost_center === 'CEP';
                const isEspecial = ev.cost_center === 'Servicios Especiales' || ev.cost_center === 'Quintas' || (ev.title && (ev.title.includes('Quintas') || ev.title.includes('Especiales')));

                let sd = d.structured_data;
                if (typeof sd === 'string') {
                    try { sd = JSON.parse(sd); } catch(e) { sd = {}; }
                }

                if (sd && Object.keys(sd).length > 0) {
                    if (isEspecial || d.service_category_id === 2) {
                        // ...
                    } else if (isCep || d.service_category_id === 3) {
                        // ...
                    } else if (isMetropolitano || d.service_category_id === 4 || d.service_category_id === 1) {
                        p.plc += parseInt(sd.plc) || 0;
                        p.sm += parseInt(sd.sm) || 0;
                        p.cnPlanta += parseInt(sd.cnPlanta) || 0;
                        p.cenas += parseInt(sd.cenas) || 0;
                        p.sc += parseInt(sd.sc) || 0;
                        p.conc += parseInt(sd.conc) || 0;
                        p.cnExt += parseInt(sd.cnExt) || 0;
                        p.csExt += parseInt(sd.csExt) || 0;
                    }
                }
            });
        });

        console.log(Array.from(detailsMap.values()));
    } catch(e) { console.error(e); }
}
test();
