import { test, expect } from '@playwright/test';
import {
  launchApp,
  closeApp,
  typeInEditor,
  clickRun,
  clickStop,
  waitForExecutionComplete,
  getOutput,
} from './helpers/electron';

test.describe('Code Execution', () => {
  test('should execute simple Console.WriteLine and display output', async () => {
    const { app, window } = await launchApp();

    try {
      // Type simple code
      await typeInEditor(window, 'Console.WriteLine("Hello from CodePad!");');

      // Run the code
      await clickRun(window);

      // Wait for execution to complete
      await waitForExecutionComplete(window);

      // Check output
      const output = await getOutput(window);
      expect(output).toContain('Hello from CodePad!');
    } finally {
      await closeApp(app);
    }
  });

  test('should execute code using .Dump() extension method', async () => {
    const { app, window } = await launchApp();

    try {
      // Type code using .Dump()
      const code = `var person = new { Name = "Alice", Age = 30 };
person.Dump("Person Details");`;

      await typeInEditor(window, code);

      // Run the code
      await clickRun(window);

      // Wait for execution to complete
      await waitForExecutionComplete(window);

      // Check output contains JSON and label
      const output = await getOutput(window);
      expect(output).toContain('Person Details');
      expect(output).toContain('Alice');
      expect(output).toContain('30');
    } finally {
      await closeApp(app);
    }
  });

  test('should display compilation errors', async () => {
    const { app, window } = await launchApp();

    try {
      // Type invalid code
      await typeInEditor(window, 'This is not valid C# code;');

      // Run the code
      await clickRun(window);

      // Wait for execution to complete
      await waitForExecutionComplete(window);

      // Check for error in output
      const output = await getOutput(window);
      expect(output).toContain('Error');
    } finally {
      await closeApp(app);
    }
  });

  test('should display execution time', async () => {
    const { app, window } = await launchApp();

    try {
      // Type simple code
      await typeInEditor(window, 'Console.WriteLine("Test");');

      // Run the code
      await clickRun(window);

      // Wait for execution to complete
      await waitForExecutionComplete(window);

      // Check that execution time is displayed (look for "ms" in the UI)
      const timeDisplay = window.locator('text=/\\d+ms/');
      await expect(timeDisplay).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should be able to stop long-running execution', async () => {
    const { app, window } = await launchApp();

    try {
      // Type long-running code
      const code = `using System.Threading;
for (int i = 0; i < 100; i++)
{
    Console.WriteLine($"Iteration {i}");
    Thread.Sleep(100);
}`;

      await typeInEditor(window, code);

      // Run the code
      await clickRun(window);

      // Wait a bit for execution to start
      await window.waitForTimeout(500);

      // Click Stop button
      await clickStop(window);

      // Wait for execution to stop
      await waitForExecutionComplete(window, 5000);

      // Verify execution was stopped (output shouldn't have all 100 iterations)
      const output = await getOutput(window);
      const iterationCount = (output.match(/Iteration/g) || []).length;
      expect(iterationCount).toBeLessThan(100);
    } finally {
      await closeApp(app);
    }
  });

  test('should execute code with using statements', async () => {
    const { app, window } = await launchApp();

    try {
      // Type code with using statement
      const code = `using System;
using System.Linq;

var numbers = new[] { 1, 2, 3, 4, 5 };
var sum = numbers.Sum();
Console.WriteLine($"Sum: {sum}");`;

      await typeInEditor(window, code);

      // Run the code
      await clickRun(window);

      // Wait for execution to complete
      await waitForExecutionComplete(window);

      // Check output
      const output = await getOutput(window);
      expect(output).toContain('Sum: 15');
    } finally {
      await closeApp(app);
    }
  });

  test('should handle runtime exceptions gracefully', async () => {
    const { app, window } = await launchApp();

    try {
      // Type code that throws exception
      const code = `var numbers = new int[] { 1, 2, 3 };
Console.WriteLine(numbers[10]); // Index out of range`;

      await typeInEditor(window, code);

      // Run the code
      await clickRun(window);

      // Wait for execution to complete
      await waitForExecutionComplete(window);

      // Check for error in output
      const output = await getOutput(window);
      expect(output.toLowerCase()).toMatch(/error|exception/);
    } finally {
      await closeApp(app);
    }
  });
});
