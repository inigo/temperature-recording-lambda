const https = require('https');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient();


const refreshAccessToken = async (refreshToken, clientId, clientSecret) => {
    const options = {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    const postData = `refresh_token=${refreshToken}&grant_type=refresh_token&client_id=${clientId}&client_secret=${clientSecret}`;

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    const responseData = JSON.parse(data);
                    resolve(responseData.access_token);
                } else {
                    reject(new Error('Failed to refresh access token'));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
};

const retrieveThermostatInfo = async (accessToken, devicePath) => {
    const options = {
        hostname: 'smartdevicemanagement.googleapis.com',
        path: devicePath,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    };

    return await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject({
                statusCode: 500,
                body: JSON.stringify({ error: error.message })
            });
        });

        req.end();
    });
}

const retrieveThermostatWithRetry = async (accessToken, refreshToken, clientId, clientSecret, devicePath) => {
    const initialResponse = await retrieveThermostatInfo(accessToken, devicePath);
    console.log(`Status code is ${initialResponse.statusCode} with body ${initialResponse.body}`);
    if (initialResponse.statusCode === 401) {
        console.log("Access token expired, try to refresh it");
        const newAccessToken = await refreshAccessToken(refreshToken, clientId, clientSecret);
        return await retrieveThermostatInfo(newAccessToken, devicePath);
    } else {
        console.log(`First attempt was authorized - status code ${initialResponse.statusCode}`);
        return initialResponse;
    }
}

const storeDataInDynamoDB = async (thermostatData) => {
    const currentDate = new Date();
    const lastMinute = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes());
    const lastMinuteIsoString = lastMinute.toISOString().replace(/\.\d+Z$/, 'Z');

    const itemToStore = {
        site: { S: "HOME"},
        datetime: { S: lastMinuteIsoString },
        ambientTemperature: { N: String(thermostatData.ambientTemperature) },
        setPoint: { N: String(thermostatData.setPoint) },
        humidity: { N: String(thermostatData.humidity) },
        isHeating: { BOOL: thermostatData.isHeating },
    };

    console.log(`Storing data: ${JSON.stringify(itemToStore)}`);
    const params = {
        TableName: 'ThermostatData',
        Item: itemToStore
    };

    try {
        const command = new PutItemCommand(params);
        await dynamodb.send(command);
    } catch (error) {
        throw new Error(`Error storing data in DynamoDB: ${error.message}`);
    }
};

exports.handler = async (event) => {

    const accessToken = process.env.ACCESS_TOKEN;
    const refreshToken = process.env.REFRESH_TOKEN;
    const devicePath = process.env.DEVICE_PATH;
    const clientSecret = process.env.CLIENT_SECRET;
    const clientId = process.env.CLIENT_ID;

    try {
        const response = await retrieveThermostatWithRetry(accessToken, refreshToken, clientId, clientSecret, devicePath);

        if (response.statusCode === 200) {
            const responseData = JSON.parse(response.body);
            const traits = responseData.traits;

            const extractedData = {
                ambientTemperature: traits['sdm.devices.traits.Temperature'].ambientTemperatureCelsius,
                setPoint: traits['sdm.devices.traits.ThermostatTemperatureSetpoint'].heatCelsius,
                humidity: traits['sdm.devices.traits.Humidity'].ambientHumidityPercent,
                isHeating: traits['sdm.devices.traits.ThermostatHvac'].status === 'HEATING'
            };

            return await storeDataInDynamoDB(extractedData)
        } else {
            throw new Error(`Error retrieving data from server: ${response.statusCode} with body ${response.body}`);
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
