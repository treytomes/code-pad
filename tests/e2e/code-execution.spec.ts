import { test, expect } from '@playwright/test';
import {
  launchApp,
  closeApp,
  typeInEditor,
  clickRun,
  clickStop,
  waitForExecutionComplete,
  getOutput,
  dismissWelcomeModal,
} from './helpers/electron';

test.describe('Code Execution', () => {
  test('should execute simple Console.WriteLine and display output', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("Hello from CodePad!");');
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output).toContain('Hello from CodePad!');
    } finally {
      await closeApp(app);
    }
  });

  test('should display compilation errors', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'This is not valid C# code;');
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output).toContain('Error');
    } finally {
      await closeApp(app);
    }
  });

  test('should display execution time after run', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("Test");');
      await clickRun(window);
      await waitForExecutionComplete(window);
      await expect(window.locator('text=/\\d+ms/')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should be able to stop long-running execution', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      const code = `using System.Threading;
for (int i = 0; i < 100; i++)
{
    Console.WriteLine($"Iteration {i}");
    Thread.Sleep(100);
}`;
      await typeInEditor(window, code);
      await clickRun(window);
      await window.waitForTimeout(600);
      await clickStop(window);
      await waitForExecutionComplete(window, 5000);
      const output = await getOutput(window);
      const count = (output.match(/Iteration/g) || []).length;
      expect(count).toBeLessThan(100);
    } finally {
      await closeApp(app);
    }
  });

  test('should execute code with using statements and LINQ', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      const code = `using System.Linq;
var numbers = new[] { 1, 2, 3, 4, 5 };
Console.WriteLine($"Sum: {numbers.Sum()}");`;
      await typeInEditor(window, code);
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output).toContain('Sum: 15');
    } finally {
      await closeApp(app);
    }
  });

  test('should handle runtime exceptions gracefully', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      const code = `var numbers = new int[] { 1, 2, 3 };
Console.WriteLine(numbers[10]);`;
      await typeInEditor(window, code);
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output.toLowerCase()).toMatch(/error|exception/);
    } finally {
      await closeApp(app);
    }
  });

  test('.Dump() should render label and object properties', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      const code = `var person = new { Name = "Alice", Age = 30 };
person.Dump("Person Details");`;
      await typeInEditor(window, code);
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output).toContain('Person Details');
      expect(output).toContain('Alice');
      expect(output).toContain('30');
    } finally {
      await closeApp(app);
    }
  });

  test('.Dump() on a string should render label and string value', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, '"Hello".Dump("Greeting");');
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output).toContain('Greeting');
      expect(output).toContain('Hello');
    } finally {
      await closeApp(app);
    }
  });

  test('.Dump() on array of objects should render as table', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      const code = `var users = new[] {
    new { Id = 1, Name = "Alice" },
    new { Id = 2, Name = "Bob" },
};
users.Dump("Users");`;
      await typeInEditor(window, code);
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output).toContain('Users');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
    } finally {
      await closeApp(app);
    }
  });

  test('ProgressReporter should render a progress bar', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      const code = `using System.Threading;
var p = new ProgressReporter(max: 3, label: "Loading");
p.Report(1);
Thread.Sleep(50);
p.Report(2);
Thread.Sleep(50);
p.Complete("Done");`;
      await typeInEditor(window, code);
      await clickRun(window);
      await waitForExecutionComplete(window);
      // Progress bar component should be visible in the output panel
      const bar = window.locator('[data-testid="output-panel"] [data-testid="progress-bar"]');
      await expect(bar).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('DumpContainer should update slot in place', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      const code = `using System.Threading;
var c = new DumpContainer("Counter", 0);
for (int i = 1; i <= 5; i++)
{
    Thread.Sleep(100);
    c.Content = i;
    c.Refresh();
}
Console.WriteLine("done");`;
      await typeInEditor(window, code);
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      // The raw slot placeholder must not leak into rendered output
      expect(output).not.toContain('##CODEPAD:SLOT:');
      expect(output).not.toContain('##CODEPAD:CONTAINER:');
      expect(output).toContain('done');
    } finally {
      await closeApp(app);
    }
  });

  test('Expression mode should auto-dump the result', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      // Switch to Expression mode
      await window.locator('.ant-select').first().click();
      await window.locator('.ant-select-item-option:has-text("Expression")').click();
      await typeInEditor(window, '1 + 1');
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output).toContain('2');
    } finally {
      await closeApp(app);
    }
  });
});
