
variable "datapoint_api_key" {
  description = "API key to be used in the Lambda function"
  type        = string
}


variable "access_token" {
  description = "Access token for authentication"
  type        = string
}

variable "refresh_token" {
  description = "Refresh token for authentication"
  type        = string
}

variable "device_path" {
  description = "Path to the device"
  type        = string
}

variable "client_secret" {
  description = "Client secret for authentication"
  type        = string
}

variable "client_id" {
  description = "Client ID for authentication"
  type        = string
}
