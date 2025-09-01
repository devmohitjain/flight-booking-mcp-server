const express = require('express');
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

const PORT = 3000;

// --- Mock Database ---
// In a real application, this would be a proper database (e.g., PostgreSQL, MongoDB).
const employeeLeaves = {
    'EMP101': { name: 'Alice', leaves: [{ type: 'Annual', days: 5, status: 'Approved' }] },
    'EMP102': { name: 'Bob', leaves: [{ type: 'Sick', days: 2, status: 'Approved' }] },
};

// --- Tool Implementations (The actual functions) ---

/**
 * Gets the leave records for a specific employee.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.employee_id - The ID of the employee.
 * @returns {Promise<object>} A promise that resolves to the employee's leave data.
 */
const getLeavesForEmployee = async ({ employee_id }) => {
    console.log(`Executing getLeavesForEmployee for: ${employee_id}`);
    const employeeData = employeeLeaves[employee_id];

    if (employeeData) {
        return {
            status: 'success',
            data: {
                employee_id: employee_id,
                name: employeeData.name,
                leaves: employeeData.leaves
            }
        };
    } else {
        return {
            status: 'error',
            message: `Employee with ID '${employee_id}' not found.`
        };
    }
};

const show_flights_between_source_and_destination = async({source, destination,sort_by,stops_preference,cabin_class, ...rest}) => {
    console.log("Here API call will be done with parameters and will return the result");
    return [{
        "flightNo": "123",
        "flightName": "Indigo",
        "Source": "Kolkata",
        "Destination": "Chennai",
        "Departure": "7:15 AM",
        "Arrival": "4:00 PM"
    },
    {
        "flightNo": "456",
        "flightName": "Air India",
        "Source": "Kolkata",
        "Destination": "Chennai",
        "Departure": "10:15 AM",
        "Arrival": "6:00 PM"
    }]
    // return {
    //     source,
    //     destination,
    //     sort_by,
    //     stops_preference,
    //     cabin_class
    // }
}

/**
 * Applies for a new leave on behalf of an employee.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.employee_id - The ID of the employee applying for leave.
 * @param {string} args.leave_type - The type of leave (e.g., 'Annual', 'Sick', 'Unpaid').
 * @param {number} args.days - The number of days for the leave.
 * @returns {Promise<object>} A promise that resolves to the result of the leave application.
 */
const applyLeaveForEmployee = async ({ employee_id, leave_type, days }) => {
    console.log(`Executing applyLeaveForEmployee for: ${employee_id}`);
    const employeeData = employeeLeaves[employee_id];

    if (!employeeData) {
        return {
            status: 'error',
            message: `Employee with ID '${employee_id}' not found.`
        };
    }

    const newLeave = {
        type: leave_type,
        days: days,
        status: 'Pending' // New leaves are pending by default
    };

    employeeData.leaves.push(newLeave);

    return {
        status: 'success',
        message: `Leave request for ${days} day(s) of ${leave_type} leave has been submitted for ${employeeData.name}. Status: Pending.`,
        data: newLeave
    };
};
// --- Tool Definitions & Dispatcher ---

// A map to link tool names to their implementation functions.
const toolHandlers = {
    'get_leaves_for_employee': getLeavesForEmployee,
    'apply_leave_for_employee': applyLeaveForEmployee,
    'show_flights_between_source_and_destination': show_flights_between_source_and_destination
};

// This is the "MCP" part: Model-Controller-Parser.
// A central endpoint that parses the request, finds the right tool (controller), and executes it.
app.post('/mcp-api/v1/tool_dispatch', async (req, res) => {
    const { tool_name, parameters } = req.body;

    if (!tool_name) {
        return res.status(400).json({ error: '`tool_name` is required.' });
    }

    const handler = toolHandlers[tool_name];

    if (!handler) {
        return res.status(404).json({ error: `Tool with name '${tool_name}' not found.` });
    }

    try {
        // Execute the tool function with the provided parameters
        const result = await handler(parameters || {});
        // Respond with the output from the tool
        res.status(200).json({ tool_name, result });
    } catch (error) {
        console.error(`Error executing tool '${tool_name}':`, error);
        res.status(500).json({ error: 'An internal error occurred while executing the tool.' });
    }
});


app.listen(PORT, () => {
    console.log(`✅ Simple MCP server running on http://localhost:${PORT}`);
    console.log(`🚀 Endpoint available at POST /mcp-api/v1/tool_dispatch`);
})
