// tools.js

const tools = [
    {
      type: "function",
      function: {
        name: "show_flights_between_source_and_destination",
        description: "Show the list of flights between source and destination with filtering options for price, stops, and other preferences",
        parameters: {
          type: "object",
          properties: {
            source: {
              type: "string",
              description: "The source location of the flight, e.g., 'Jaipur'."
            },
            destination: {
              type: "string",
              description: "The destination location of the flight, e.g., 'Bangalore'."
            },
            date: {
              type: "string",
              description: "The date of travel in YYYY-MM-DD format, e.g., '2024-12-25'."
            },
            passengers: {
              type: "number",
              description: "Number of passengers traveling, default is 1."
            },
            cabin_class: {
              type: "string",
              enum: ["Economy", "Premium Economy", "Business", "First"],
              description: "Preferred cabin class for the flight."
            },
            max_price: {
              type: "number",
              description: "Maximum price limit for the flight in the local currency."
            },
            stops_preference: {
              type: "string",
              enum: ["Non-stop", "1-stop", "2-stops", "Any"],
              description: "Preferred number of stops, 'Non-stop' for direct flights only."
            },
            sort_by: {
              type: "string",
              enum: ["Price", "Duration", "Departure Time", "Arrival Time"],
              description: "Sort flights by this criteria, 'Price' for cheapest options first."
            },
            airline_preference: {
              type: "string",
              description: "Preferred airline or leave empty for any airline."
            },
            flexible_dates: {
              type: "boolean",
              description: "Whether to show flights with flexible dates (±3 days) around the specified date."
            }
          },
          required: ["source", "destination"],
        },
      },
    }
  ];
  
  module.exports = tools;