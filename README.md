# ZQuery JSON Input Node for n8n

This is a custom n8n node that allows you to process JSON data using zquery syntax. It leverages the powerful zq command-line tool to provide advanced querying capabilities for JSON data.

## Features

- Process JSON data with full zquery syntax support
- Leverages the zq command-line tool for powerful querying
- Simple and intuitive interface
- Supports both single JSON objects and JSON arrays
- Comprehensive error handling and validation

## Installation

### Prerequisites
0. Download zeq [https://www.brimdata.io/download/](https://www.brimdata.io/download/)
1. Install the zq command-line tool from [https://zed.brimdata.io/docs/install/](https://zed.brimdata.io/docs/install/)

   **macOS (Homebrew):**
   ```bash
   brew install brimdata/tap/zq
   ```

   **Linux (deb):**
   Download .deb package from [GitHub Releases](https://github.com/brimdata/zq/releases)

   **Linux (rpm):**
   Download .rpm package from [GitHub Releases](https://github.com/brimdata/zq/releases)

   **Windows:**
   Download .zip package from [GitHub Releases](https://github.com/brimdata/zq/releases)

2. Verify zq installation:
   ```bash
   zq --version
   ```

### Node Installation

1. Clone or download this repository
2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```
3. Copy this directory to your n8n custom nodes directory
4. Restart n8n

## Usage

1. Add the "ZQuery JSON Input" node to your workflow
2. Enter your JSON data in the "JSON Data" field
3. Enter your zquery statement in the "ZQuery" field
4. The node will process your data using the zq tool and return the results

## Examples

### Example 1: Simple Field Selection

**JSON Data:**
```json
[
  {"id": 1, "name": "John", "age": 30},
  {"id": 2, "name": "Jane", "age": 25},
  {"id": 3, "name": "Bob", "age": 35}
]
```

**ZQuery:**
```
cut id,name
```

**Output:**
```json
[
  {"id": 1, "name": "John"},
  {"id": 2, "name": "Jane"},
  {"id": 3, "name": "Bob"}
]
```

### Example 2: Filtering and Sorting

**JSON Data:**
```json
[
  {"id": 1, "name": "John", "age": 30},
  {"id": 2, "name": "Jane", "age": 25},
  {"id": 3, "name": "Bob", "age": 35}
]
```

**ZQuery:**
```
filter age > 25 | sort age
```

**Output:**
```json
[
  {"id": 1, "name": "John", "age": 30},
  {"id": 3, "name": "Bob", "age": 35}
]
```

### Example 3: Complex Transformation

**JSON Data:**
```json
[
  {"name": "John Doe", "salary": 50000},
  {"name": "Jane Smith", "salary": 60000},
  {"name": "Bob Johnson", "salary": 55000}
]
```

**ZQuery:**
```
put firstName:=split(name, " ")[0], lastName:=split(name, " ")[1], salaryGrade:=case salary < 55000 => "Junior", salary >= 55000 => "Senior" end | cut firstName, lastName, salary, salaryGrade
```

**Output:**
```json
[
  {"firstName": "John", "lastName": "Doe", "salary": 50000, "salaryGrade": "Junior"},
  {"firstName": "Jane", "lastName": "Smith", "salary": 60000, "salaryGrade": "Senior"},
  {"firstName": "Bob", "lastName": "Johnson", "salary": 55000, "salaryGrade": "Senior"}
]
```

## Requirements

- The zq command-line tool must be installed and available in your system PATH
- Valid JSON data in the input field

## Troubleshooting

### "zq command not found" error

Make sure zq is installed and available in your system PATH. You can verify this by running:
```bash
zq --version
```

If zq is installed but not found, you may need to add it to your PATH or restart your terminal.

### JSON parsing errors

Ensure your input data is valid JSON. You can validate your JSON at [https://jsonlint.com/](https://jsonlint.com/)

### "this.executeZQuery is not a function" error

This error occurs when there's a context binding issue in the node execution. The issue has been fixed in the latest version by converting the executeZQuery method to a standalone function. Make sure you're using the latest version of the node.

### Node not appearing in n8n

1. Ensure the node is correctly copied to your n8n custom nodes directory
2. Verify that the node directory contains all required files (package.json, dist/, etc.)
3. Restart n8n completely after installing the node
4. Check n8n logs for any error messages during startup

## License

MIT

## Support

For issues with this node, please file an issue on the GitHub repository.