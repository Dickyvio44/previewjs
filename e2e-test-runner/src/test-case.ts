import type { FrameworkPluginFactory } from "@previewjs/core";
import callerCallsite from "caller-callsite";
import chalk from "chalk";
import path from "path";
import type { AppController } from "./helpers/app-controller";
import type { AppDir } from "./test-runner";

export interface TestSuite {
  frameworkPluginFactories: FrameworkPluginFactory[];
  absoluteFilePath: string;
  cloneTestDir: boolean;
  description: string;
  testCases: TestCase[];
}

export interface TestCase {
  description: string;
  testDir: string;
  run: (options: {
    appDir: AppDir;
    controller: AppController;
  }) => Promise<void>;
}

export async function testSuite(
  frameworkPluginFactories: FrameworkPluginFactory[],
  description: string,
  testFactory: (test: TestCreator) => void | Promise<void>,
  absoluteFilePath?: string | null,
  cloneTestDir = true
): Promise<TestSuite> {
  if (!absoluteFilePath) {
    absoluteFilePath = callerCallsite()?.getFileName();
  }
  if (!absoluteFilePath) {
    throw new Error(`Unable to detect caller file path`);
  }
  const testCases: TestCase[] = [];
  const test: TestCreator = ((
    description: string,
    testAppName: string,
    run: RunTest
  ) => {
    const testDir = path.join(__dirname, "..", "..", "test-apps", testAppName);
    testCases.push({
      description,
      testDir,
      run,
    });
  }) as any;
  test.skip = (description) => {
    console.warn(chalk.yellow(`Skipping test: ${description}`));
  };
  await testFactory(test);
  return {
    frameworkPluginFactories,
    absoluteFilePath,
    cloneTestDir,
    description,
    testCases,
  };
}

export type TestCreator = {
  (description: string, testAppName: string, run: RunTest): void;
  skip(description: string, testAppName: string, run: RunTest): void;
};

type RunTest = (options: {
  appDir: AppDir;
  controller: AppController;
}) => Promise<void>;
