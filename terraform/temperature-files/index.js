const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const http = require('http');

const dynamodb = new DynamoDBClient();

exports.handler = async () => {
    const apiKey = process.env.API_KEY;
    // Benson: 3658
    // Brize Norton: 3649
    const site = 3658;

    // Generate the URL with the current time (last hour)
    const currentDate = new Date();
    const lastHour = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours());
    const lastHourIsoString = lastHour.toISOString().replace(/\.\d+Z$/, 'Z');
    const endpoint = `http://datapoint.metoffice.gov.uk/public/data/val/wxobs/all/json/${site}?res=hourly&key=${apiKey}&time=${lastHourIsoString}`;
    console.info(`Making request to ${endpoint}`);

    const fetchData = (url) => {
        return new Promise((resolve, reject) => {
            http.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        console.log(`Response from ${endpoint} received - ${JSON.stringify(parsedData)}`);
                        resolve(parsedData);
                    } catch (error) {
                        reject(new Error(`Error parsing response: ${error.message}`));
                    }
                });
            }).on('error', (error) => {
                reject(new Error(`Error making request: ${error.message}`));
            });
        });
    };

    const storeDataInDynamoDB = async (data) => {
        const rep = data.SiteRep.DV.Location.Period.Rep;

        const itemToStore = {
            type_site: { S: `w_${site}` }, // These are the keys of the DynamoDB table
            datetime: { S: lastHourIsoString },
        };

        if (typeof rep === 'object' && rep !== null) {
            for (const [key, value] of Object.entries(rep)) {
                if (key === 'D' || key === 'Pt') {
                    itemToStore[key] = { S: value };
                } else if (key === '$') {
                    itemToStore[key] = { N: value };
                } else {
                    itemToStore[key] = { N: value };
                }
            }
        } else {
            throw new Error(`Unexpected data format:: ${rep}`);
        }

        console.log(`Storing data: ${JSON.stringify(itemToStore)}`);

        const params = {
            TableName: 'TemperatureData',
            Item: itemToStore
        };

        try {
            const command = new PutItemCommand(params);
            await dynamodb.send(command);
        } catch (error) {
            throw new Error(`Error storing data in DynamoDB: ${error.message}`);
        }
    };

    try {
        // Fetch data from the API
        const data = await fetchData(endpoint);
        // Store the fetched data in DynamoDB
        await storeDataInDynamoDB(data);
        return { statusCode: 200, body: JSON.stringify({ message: 'Data stored successfully' }) };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
