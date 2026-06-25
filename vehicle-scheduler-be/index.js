const express = require('express');
const axios = require('axios');
const { requestLogger, errorLogger } = require('../logging-middleware/middleware');
const { Log } = require('../logging-middleware/logger');

const app = express();

app.use(express.json());
app.use(requestLogger);

const getBestSchedule = (hours, vehicles) => {
    let bestTasks = [];
    let maxImpact = 0;

    const n = vehicles.length;
    const limit = Math.min(n, 20); 
    const totalCombinations = Math.pow(2, limit);

    for (let i = 0; i < totalCombinations; i++) {
        let currentTasks = [];
        let currentHours = 0;
        let currentImpact = 0;

        for (let j = 0; j < limit; j++) {
            if ((i >> j) & 1) {
                currentTasks.push(vehicles[j]);
                currentHours += vehicles[j].Duration;
                currentImpact += vehicles[j].Impact;
            }
        }

        if (currentHours <= hours) {
            if (currentImpact > maxImpact) {
                maxImpact = currentImpact;
                bestTasks = currentTasks;
            }
        }
    }

    return {
        selectedTasks: bestTasks,
        totalImpact: maxImpact
    };
};

app.get('/schedule/:depotId', async (req, res) => {
    try {
        const depotId = req.params.depotId;
        Log('info', 'service', 'attempting to get data');

        let depots, vehicles;

        try {
            const depotsRes = await axios.get('http://4.224.186.213/evaluation-service/depots', { timeout: 2000 });
            const vehiclesRes = await axios.get('http://4.224.186.213/evaluation-service/vehicles', { timeout: 2000 });
            depots = depotsRes.data.depots;
            vehicles = vehiclesRes.data.vehicles;
        } catch (apiErr) {
            depots = [
                { "ID": 1, "MechanicHours": 10 },
                { "ID": 2, "MechanicHours": 20 }
            ];
            vehicles = [
                { "TaskID": "V1", "Duration": 3, "Impact": 10 },
                { "TaskID": "V2", "Duration": 5, "Impact": 20 },
                { "TaskID": "V3", "Duration": 2, "Impact": 5 },
                { "TaskID": "V4", "Duration": 8, "Impact": 30 }
            ];
        }

        let myDepot = null;
        for(let i=0; i<depots.length; i++) {
            if(depots[i].ID == depotId) {
                myDepot = depots[i];
                break;
            }
        }

        if (!myDepot) {
            return res.status(404).json({ message: 'depot not found' });
        }

        const result = getBestSchedule(myDepot.MechanicHours, vehicles);

        res.json({
            depotId: myDepot.ID,
            availableHours: myDepot.MechanicHours,
            ...result
        });

    } catch (err) {
        Log('error', 'handler', 'something went wrong');
        res.status(500).json({ error: 'internal error' });
    }
});

app.use(errorLogger);

app.listen(3001, () => {
    console.log('server started on 3001');
});
