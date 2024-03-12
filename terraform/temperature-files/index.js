const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Parse the input data from the event
    // const data = JSON.parse(event.body);

    const apiKey = process.env.API_KEY;
    const endpoint = "http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/xml/3840?res=3hourly&key="+apiKey

    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);

    const data = {
        type_site: "temp_benson",
        datetime: "2024-03-12T13:00:00",
        temperature: 20.8
    }

    // Define the DynamoDB item
    const item = {
        type_site: data.type_site,
        datetime: data.datetime,
        temperature: data.temperature
    };

    // Write the item to DynamoDB
    const params = {
        TableName: 'TemperatureData',
        Item: item
    };

    try {
        await dynamodb.put(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify('Data written to DynamoDB successfully!')
        };
    } catch (err) {
        console.error('Error writing to DynamoDB:', err);
        return {
            statusCode: 500,
            body: JSON.stringify('Error writing to DynamoDB')
        };
    }
};
