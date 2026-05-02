/**
 * Sample snippets to showcase CodePad features
 * These are displayed in the "Samples" tab and are read-only
 */

export interface SampleSnippet {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  language: string;
}

export const SAMPLE_CATEGORIES = [
  'Getting Started',
  '.Dump() Extension',
  'Long-Running Tasks',
  'Output Formats',
] as const;

export const SAMPLES: SampleSnippet[] = [
  // Getting Started
  {
    id: 'sample-hello-world',
    name: 'Hello World',
    category: 'Getting Started',
    description: 'Your first C# snippet in CodePad',
    language: 'csharp',
    code: `// Welcome to CodePad!
// Press F5 to run this code

using System;

Console.WriteLine("Hello, World!");
Console.WriteLine("CodePad makes it easy to run C# code snippets.");
Console.WriteLine("No project setup required!");`,
  },
  {
    id: 'sample-variables',
    name: 'Variables and Types',
    category: 'Getting Started',
    description: 'Working with variables and data types',
    language: 'csharp',
    code: `using System;

// Numbers
int age = 30;
double pi = 3.14159;
decimal price = 19.99m;

Console.WriteLine($"Age: {age}");
Console.WriteLine($"Pi: {pi}");
Console.WriteLine("Price: $" + price);

// Strings
string name = "CodePad";
string message = $"Welcome to {name}!";
Console.WriteLine(message);

// Dates
DateTime now = DateTime.Now;
Console.WriteLine($"Current time: {now:yyyy-MM-dd HH:mm:ss}");`,
  },
  {
    id: 'sample-linq-basics',
    name: 'LINQ Basics',
    category: 'Getting Started',
    description: 'Introduction to LINQ queries',
    language: 'csharp',
    code: `using System;
using System.Linq;

var numbers = new[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

// Filter with Where
var evenNumbers = numbers.Where(n => n % 2 == 0);
Console.WriteLine("Even numbers: " + string.Join(", ", evenNumbers));

// Transform with Select
var squared = numbers.Select(n => n * n);
Console.WriteLine("Squared: " + string.Join(", ", squared));

// Aggregate with Sum, Average, etc.
Console.WriteLine($"Sum: {numbers.Sum()}");
Console.WriteLine($"Average: {numbers.Average()}");
Console.WriteLine($"Max: {numbers.Max()}");`,
  },

  // .Dump() Extension
  {
    id: 'sample-dump-simple',
    name: 'Simple Objects with .Dump()',
    category: '.Dump() Extension',
    description: 'Visualize objects with labeled output',
    language: 'csharp',
    code: `using System;

// .Dump() displays objects with rich visualization
// Add a label to identify the output

var person = new {
    Name = "Alice Johnson",
    Age = 28,
    Email = "alice@example.com",
    Department = "Engineering"
};

person.Dump("Person Object");

// You can dump multiple objects
var address = new {
    Street = "123 Main St",
    City = "San Francisco",
    State = "CA",
    Zip = "94102"
};

address.Dump("Address");`,
  },
  {
    id: 'sample-dump-collections',
    name: 'Collections and Tables',
    category: '.Dump() Extension',
    description: 'Arrays of objects render as tables',
    language: 'csharp',
    code: `using System;

// Arrays of objects automatically render as tables
var users = new[] {
    new { Id = 1, Name = "Alice", Role = "Admin", Active = true },
    new { Id = 2, Name = "Bob", Role = "Developer", Active = true },
    new { Id = 3, Name = "Carol", Role = "Designer", Active = false },
    new { Id = 4, Name = "David", Role = "Developer", Active = true },
    new { Id = 5, Name = "Eve", Role = "Manager", Active = true }
};

users.Dump("User List");

// Single objects show as JSON trees
users[0].Dump("First User Details");`,
  },
  {
    id: 'sample-dump-nested',
    name: 'Nested Objects',
    category: '.Dump() Extension',
    description: 'Explore complex nested structures',
    language: 'csharp',
    code: `using System;

var company = new {
    Name = "Tech Corp",
    Founded = 2010,
    Headquarters = new {
        City = "San Francisco",
        State = "CA",
        Address = new {
            Street = "100 Market St",
            Floor = 15
        }
    },
    Employees = new[] {
        new { Name = "Alice", Title = "CEO" },
        new { Name = "Bob", Title = "CTO" },
        new { Name = "Carol", Title = "CFO" }
    },
    Revenue = new {
        Year2023 = 5000000,
        Year2024 = 7500000,
        GrowthRate = 0.50
    }
};

// Nested objects are displayed as expandable trees
company.Dump("Company Structure");`,
  },
  {
    id: 'sample-dump-chaining',
    name: 'LINQ Pipeline Chaining',
    category: '.Dump() Extension',
    description: 'Use .Dump() in LINQ chains to see intermediate results',
    language: 'csharp',
    code: `using System;
using System.Linq;

var products = new[] {
    new { Id = 1, Name = "Laptop", Price = 999.99, Category = "Electronics", InStock = true },
    new { Id = 2, Name = "Mouse", Price = 29.99, Category = "Electronics", InStock = true },
    new { Id = 3, Name = "Desk", Price = 299.99, Category = "Furniture", InStock = false },
    new { Id = 4, Name = "Chair", Price = 199.99, Category = "Furniture", InStock = true },
    new { Id = 5, Name = "Monitor", Price = 349.99, Category = "Electronics", InStock = true }
};

// .Dump() returns the object, so you can chain it in LINQ
var expensiveElectronics = products
    .Dump("All Products")
    .Where(p => p.Category == "Electronics")
    .Dump("Electronics Only")
    .Where(p => p.Price > 100)
    .Dump("Expensive Electronics")
    .OrderByDescending(p => p.Price)
    .Dump("Sorted by Price")
    .ToArray();

Console.WriteLine($"\\nFound {expensiveElectronics.Length} products");`,
  },

  // Long-Running Tasks
  {
    id: 'sample-long-running',
    name: 'Progress with Thread.Sleep',
    category: 'Long-Running Tasks',
    description: 'Real-time output during execution',
    language: 'csharp',
    code: `using System;
using System.Threading;

Console.WriteLine("Starting long-running task...");
Console.WriteLine("Watch the output appear in real-time!");
Console.WriteLine();

for (int i = 1; i <= 10; i++)
{
    Console.WriteLine($"Step {i}/10: Processing...");
    Thread.Sleep(500); // Sleep for 500ms

    if (i % 3 == 0)
    {
        Console.WriteLine($"  ✓ Milestone reached at step {i}");
    }
}

Console.WriteLine();
Console.WriteLine("Task completed successfully!");
Console.WriteLine("Notice how output streamed in real-time.");`,
  },
  {
    id: 'sample-progress-report',
    name: 'Progress Reporting',
    category: 'Long-Running Tasks',
    description: 'Show progress updates during operations',
    language: 'csharp',
    code: `using System;
using System.Threading;

Console.WriteLine("Processing 100 items...");
Console.WriteLine();

int total = 100;
for (int i = 0; i < total; i++)
{
    // Report progress every 10 items
    if (i % 10 == 0)
    {
        double percent = (i / (double)total) * 100;
        Console.WriteLine($"Progress: {percent:F0}% ({i}/{total} items)");
    }

    // Simulate work
    Thread.Sleep(50);
}

Console.WriteLine($"Progress: 100% ({total}/{total} items)");
Console.WriteLine();
Console.WriteLine("✓ All items processed successfully!");`,
  },

  // Output Formats
  {
    id: 'sample-markdown',
    name: 'Markdown Output',
    category: 'Output Formats',
    description: 'Render markdown-formatted text',
    language: 'csharp',
    code: `using System;

// CodePad can display various output formats
// This example shows markdown-style output

Console.WriteLine("# CodePad Features");
Console.WriteLine();
Console.WriteLine("## Core Capabilities");
Console.WriteLine();
Console.WriteLine("- **C# Execution**: Run code instantly");
Console.WriteLine("- **Rich Output**: Visualize objects beautifully");
Console.WriteLine("- **LINQ Support**: Full LINQ query capabilities");
Console.WriteLine("- **Real-time Output**: See results as they happen");
Console.WriteLine();
Console.WriteLine("## .Dump() Extension");
Console.WriteLine();
Console.WriteLine("The \`.Dump()\` extension method provides:");
Console.WriteLine();
Console.WriteLine("1. Labeled output sections");
Console.WriteLine("2. Automatic table rendering for collections");
Console.WriteLine("3. JSON tree views for objects");
Console.WriteLine("4. Chaining support for LINQ");
Console.WriteLine();
Console.WriteLine("Try it out: \`obj.Dump(\\"My Label\\")\`");`,
  },
  {
    id: 'sample-json-output',
    name: 'JSON Output',
    category: 'Output Formats',
    description: 'Work with JSON data',
    language: 'csharp',
    code: `using System;
using System.Text.Json;

// Create a complex object
var apiResponse = new {
    status = "success",
    timestamp = DateTime.Now,
    data = new {
        users = new[] {
            new { id = 1, username = "alice", active = true },
            new { id = 2, username = "bob", active = true },
            new { id = 3, username = "carol", active = false }
        },
        metadata = new {
            total = 3,
            page = 1,
            pageSize = 10
        }
    }
};

// Use .Dump() to visualize the structure
apiResponse.Dump("API Response");

// Or serialize to JSON string
var json = JsonSerializer.Serialize(apiResponse, new JsonSerializerOptions {
    WriteIndented = true
});

Console.WriteLine("\\nJSON String:");
Console.WriteLine(json);`,
  },
  {
    id: 'sample-table-output',
    name: 'Table Output',
    category: 'Output Formats',
    description: 'Display data in table format',
    language: 'csharp',
    code: `using System;
using System.Linq;

// Create sample data
var salesData = new[] {
    new { Month = "Jan", Revenue = 45000, Expenses = 32000, Profit = 13000 },
    new { Month = "Feb", Revenue = 52000, Expenses = 31000, Profit = 21000 },
    new { Month = "Mar", Revenue = 61000, Expenses = 35000, Profit = 26000 },
    new { Month = "Apr", Revenue = 58000, Expenses = 33000, Profit = 25000 },
    new { Month = "May", Revenue = 67000, Expenses = 36000, Profit = 31000 },
    new { Month = "Jun", Revenue = 73000, Expenses = 38000, Profit = 35000 }
};

// Arrays of objects automatically render as sortable tables
salesData.Dump("Sales Data - First Half 2024");

// Calculate totals
var totals = new {
    TotalRevenue = salesData.Sum(s => s.Revenue),
    TotalExpenses = salesData.Sum(s => s.Expenses),
    TotalProfit = salesData.Sum(s => s.Profit),
    AvgMonthlyProfit = salesData.Average(s => s.Profit)
};

totals.Dump("Summary Statistics");`,
  },
];

export function getSamplesByCategory(category: string): SampleSnippet[] {
  return SAMPLES.filter((s) => s.category === category);
}

export function getSampleById(id: string): SampleSnippet | undefined {
  return SAMPLES.find((s) => s.id === id);
}
