Retrieve the current weather from the Met Office DataPoint service and store it in DynamoDB.

Uses Terraform to create an appropriate DynamoDB instance, and a lambda to write to it.

To run, requires an API key from DataPoint (see https://www.metoffice.gov.uk/services/data/datapoint)
and AWS.

## License

Copyright (C) 2024 Inigo Surguy. Licensed under the GNU General Public License v3 - see LICENSE.txt for details.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as 
published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.
