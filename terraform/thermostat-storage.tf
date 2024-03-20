resource "aws_dynamodb_table" "thermostat_data" {
  name           = "ThermostatData"
  billing_mode   = "PAY_PER_REQUEST" # On-demand capacity mode
  hash_key       = "site"       # Partition key
  range_key      = "datetime"        # Sort key

  attribute {
    name = "site"
    type = "S"
  }

  attribute {
    name = "datetime"
    type = "S"
  }

  tags = {
    Role        = "climate"
    Environment = "production"
    Purpose     = "Store five-minutely thermostat data"
  }
}
