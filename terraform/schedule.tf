# EventBridge Rule to trigger Lambda every hour
resource "aws_cloudwatch_event_rule" "hourly_lambda_trigger" {
  name                = "hourly-lambda-trigger"
  description         = "Trigger temperature storage lambda function every hour"
  schedule_expression = "cron(15 * ? * * *)" # Runs every hour at 15 minutes past

  // @todo Temporarily disable this until the code is correct
  state = "DISABLED"
}

# EventBridge Target to invoke Lambda function
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.hourly_lambda_trigger.name
  target_id = "lambda"
  arn       = aws_lambda_function.write_to_dynamo.arn
}

# Allows EventBridge to invoke the Lambda function
resource "aws_lambda_permission" "allow_cloudwatch_to_call_lambda" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.write_to_dynamo.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.hourly_lambda_trigger.arn
}
