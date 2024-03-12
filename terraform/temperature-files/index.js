const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const http = require('http');

exports.handler = async (event) => {
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

    // Function to make the HTTP GET request
    const fetchData = (url) => {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        console.log("Response from ${endpoint} received - "+data);
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    };

    // Function to store data in DynamoDB
    const storeDataInDynamoDB = (data) => {
        const values = data.SiteRep.DV.Location.Period.Rep;

        const itemToStore = {
            type_site: "w_"+site, // These are the keys of the DynamoDB table
            datetime: lastHourIsoString,
            ...values
        };

        console.log("Storing data : "+JSON.stringify(itemToStore));

        const params = {
            TableName: 'TemperatureData',
            Item: itemToStore
        };

        return dynamodb.put(params).promise();
    };

    try {
        // Fetch data from the API
        const data = await fetchData(endpoint);
        // Store the fetched data in DynamoDB
        await storeDataInDynamoDB(data);
        return { statusCode: 200, body: JSON.stringify({ message: 'Data stored successfully' }) };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to store data' }) };
    }
};
