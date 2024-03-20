
# Lambda Function
data "archive_file" "lambda_code" {
  type        = "zip"
  source_file = "temperature-files/index.js"
  output_path = "temperature-files/temperature-lambda.zip"
}

resource "aws_lambda_function" "record_temperature" {
  filename         = data.archive_file.lambda_code.output_path
  function_name    = "record-temperature"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  publish = true
  environment {
    variables = {
      API_KEY = var.datapoint_api_key
    }
  }
  source_code_hash = data.archive_file.lambda_code.output_base64sha256
}
