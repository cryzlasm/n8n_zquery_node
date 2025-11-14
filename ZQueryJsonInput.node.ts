import { INodeType, INodeTypeDescription, INodeExecutionData } from 'n8n-workflow';
import { spawn } from 'child_process';

// Standalone function for executing zq command
async function executeZQuery(jsonData: string, query: string): Promise<string> {
  console.log('DEBUG: executeZQuery called with query:', query);
  console.log('DEBUG: JSON data length:', jsonData.length);

  return new Promise((resolve, reject) => {
    // Spawn zq process with proper stdin handling
    const zq = spawn('zq', ['-j', '-i', 'json', query, '-']);

    let stdout = '';
    let stderr = '';

    // Send JSON data to zq stdin
    zq.stdin.write(jsonData);
    zq.stdin.end();

    // Collect stdout
    zq.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    zq.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process close
    zq.on('close', (code) => {
      console.log('DEBUG: zq process closed with code:', code);
      console.log('DEBUG: zq stdout length:', stdout.length);
      console.log('DEBUG: zq stderr length:', stderr.length);

      if (code === 0) {
        // Clean the output by trimming whitespace and removing any trailing characters
        let cleanOutput = stdout.trim();

        // If there's stderr output, log it as a warning but don't fail
        if (stderr.trim()) {
          console.warn('zq stderr output:', stderr.trim());
        }

        console.log('DEBUG: Returning clean output length:', cleanOutput.length);
        resolve(cleanOutput);
      } else {
        console.error('ERROR: zq command failed with exit code:', code);
        console.error('ERROR: zq stderr:', stderr);
        reject(new Error(`zq command failed with exit code ${code}: ${stderr}`));
      }
    });

    // Handle process error
    zq.on('error', (error: any) => {
      console.error('ERROR: Failed to spawn zq process:', error.message);
      reject(new Error(`Failed to spawn zq process: ${error.message}. Please ensure zq is installed and available in your PATH.`));
    });
  });
}

export class ZQueryJsonInput implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'ZQuery JSON Input',
    name: 'zqueryJsonInput',
    group: ['input', 'transform'],
    version: 1,
    description: 'Process JSON data with zquery syntax',
    defaults: {
      name: 'ZQuery JSON Input',
      color: '#1F8EB2',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'JSON Data',
        name: 'jsonData',
        type: 'json',
        default: '',
        placeholder: '[{ "id": 1, "name": "John" }, { "id": 2, "name": "Jane" }]',
        description: 'Enter your JSON data here',
        typeOptions: {
          rows: 6,
        },
      },
      {
        displayName: 'ZQuery',
        name: 'zquery',
        type: 'string',
        default: '',
        placeholder: 'cut id,name | sort id',
        description: 'Enter your zquery statement here',
        typeOptions: {
          rows: 20,
          editor: 'htmlEditor',
          editorIsReadOnly: false,
        },
      },
    ],
    icon: 'file:zquery_icon.svg'
  };

  async execute(this: any) {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get parameters from node
    const jsonData = this.getNodeParameter('jsonData', 0) as string;
    const zquery = this.getNodeParameter('zquery', 0) as string;

    try {
      // Validate inputs
      if (zquery.trim() === '') {
        throw new Error('ZQuery statement cannot be empty');
      }

      // Validate and parse JSON data
      let parsedJsonData: any;
      if (typeof jsonData === 'string') {
        if (jsonData.trim() === '') {
          throw new Error('JSON data cannot be empty');
        }
        try {
          parsedJsonData = JSON.parse(jsonData);
        } catch (parseError: any) {
          throw new Error('Invalid JSON data provided: ' + parseError.message);
        }
      } else if (typeof jsonData === 'object' && jsonData !== null) {
        parsedJsonData = jsonData;
      } else {
        throw new Error('Invalid JSON data provided');
      }

      // Convert JSON data back to string for zq processing
      const jsonString = JSON.stringify(parsedJsonData);

      // Execute zq command using standalone function
      const result = await executeZQuery(jsonString, zquery);

      // Parse result
      let parsedResult: any;
      const trimmedResult = result.trim();
      console.log('DEBUG: zq raw output length:', result.length);
      console.log('DEBUG: zq trimmed output length:', trimmedResult.length);
      console.log('DEBUG: zq output preview:', trimmedResult.substring(0, Math.min(300, trimmedResult.length)));

      if (trimmedResult === '') {
        parsedResult = [];
      } else {
        try {
          // Handle different output formats from zq
          // Case 1: Multiple JSON objects (one per line) - this is what we're seeing
          // Case 2: Single JSON array
          // Case 3: Single JSON object

          // Check if output contains multiple JSON objects (newline separated)
          const lines = trimmedResult.split('\n').filter(line => line.trim() !== '');

          if (lines.length > 1) {
            // Multiple lines - try to parse each as a JSON object
            console.log('DEBUG: Processing multiple JSON objects');
            const jsonArray: any[] = [];
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line.startsWith('{') && line.endsWith('}')) {
                try {
                  const obj = JSON.parse(line);
                  jsonArray.push(obj);
                } catch (lineError) {
                  console.warn(`WARNING: Failed to parse line ${i} as JSON:`, line);
                }
              }
            }
            parsedResult = jsonArray;
            console.log(`DEBUG: Parsed ${jsonArray.length} JSON objects`);
          } else {
            // Single line - try different approaches
            let jsonToParse = trimmedResult;

            // Try to find valid JSON in the output
            const arrayMatch = jsonToParse.match(/^(\[[\s\S]*\])/);
            const objectMatch = jsonToParse.match(/^(\{[\s\S]*\})/);

            if (arrayMatch) {
              jsonToParse = arrayMatch[1];
              console.log('DEBUG: Extracted array from output');
            } else if (objectMatch) {
              jsonToParse = objectMatch[1];
              console.log('DEBUG: Extracted object from output');
            } else {
              console.log('DEBUG: No JSON pattern found, using full output');
            }

            console.log('DEBUG: Attempting to parse JSON:', jsonToParse.substring(0, Math.min(200, jsonToParse.length)));
            parsedResult = JSON.parse(jsonToParse);
            console.log('DEBUG: Successfully parsed JSON');
          }
        } catch (parseError: any) {
          // Log the actual output for debugging
          console.error('ERROR: zq output that failed to parse:', JSON.stringify(trimmedResult));
          console.error('ERROR: Output length:', trimmedResult.length);
          if (trimmedResult.length > 210) {
            console.error('ERROR: Output around position 208:', JSON.stringify(trimmedResult.substring(200, 220)));
          }
          // Show hex representation of characters around position 208
          if (trimmedResult.length > 208) {
            let chars = '';
            for (let i = 200; i < Math.min(220, trimmedResult.length); i++) {
              chars += `${i}:${trimmedResult.charCodeAt(i)}(${trimmedResult.charAt(i)}) `;
            }
            console.error('ERROR: Character codes around position 208:', chars);
          }
          throw new Error('Failed to parse zq output as JSON: ' + parseError.message);
        }
      }

      // Handle both single objects and arrays
      const resultArray = Array.isArray(parsedResult) ? parsedResult : [parsedResult];
      console.log('DEBUG: Result array length:', resultArray.length);

      // No limit on results - return all data
      const limitedResultArray = resultArray;

      // If there are input items, merge the result with them
      if (items.length > 0) {
        // Create a new item for each result
        for (const item of limitedResultArray) {
          returnData.push({ json: item });
        }
      } else {
        // If no input items, create new items with the result
        for (const item of limitedResultArray) {
          returnData.push({ json: item });
        }
      }

      console.log('DEBUG: Return data length:', returnData.length);
    } catch (error: any) {
      throw new Error(`ZQuery processing failed: ${error.message}`);
    }

    return this.prepareOutputData(returnData);
  }
}