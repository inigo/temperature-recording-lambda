const lambdaFunction = require('./index'); // Adjust the path to your Lambda function file

async function run() {
    try {
        const result = await lambdaFunction.handler({});
        console.log('Function executed successfully:', result);
    } catch (error) {
        console.error('Function execution failed:', error);
    }
}

run();
