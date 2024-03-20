data "archive_file" "thermostat_lambda_code" {
  type        = "zip"
  source_file = "thermostat-files/index.js"
  output_path = "thermostat-files/thermostat-lambda.zip"
}

resource "aws_lambda_function" "record_thermostat" {
  filename         = data.archive_file.thermostat_lambda_code.output_path
  function_name    = "record-thermostat"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout = 10
  publish = true
  environment {
    variables = {
      ACCESS_TOKEN = var.access_token
      REFRESH_TOKEN = var.refresh_token
      DEVICE_PATH   = var.device_path
      CLIENT_SECRET = var.client_secret
      CLIENT_ID     = var.client_id
    }
  }
  source_code_hash = data.archive_file.thermostat_lambda_code.output_base64sha256
}
