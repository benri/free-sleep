import logger from '../logger.js';
import { spawn } from 'child_process';
import fs from 'fs';
const { promises: fsPromises } = fs;

type ExecutePythonScriptArgs = {
  script: string;
  cwd?: string;
  args?: string[];
};
export const executePythonScript = async ({ script, args = [] }: ExecutePythonScriptArgs) => {
  const pythonExecutable = '/home/dac/venv/bin/python';

  try {
    await fsPromises.access(pythonExecutable, fs.constants.X_OK);
  } catch {
    logger.debug(`Not executing python script, ${pythonExecutable} does not exist!`);
    return;
  }

  logger.info(`Executing: ${pythonExecutable} -B ${script} ${args.join(' ')}`);

  const child = spawn(pythonExecutable, ['-B', script, ...args], {
    env: { ...process.env },
  });

  child.stdout.on('data', (data) => {
    logger.info(`Python stdout: ${data}`);
  });
  child.stderr.on('data', (data) => {
    logger.error(`Python stderr: ${data}`);
  });
  child.on('error', (error) => {
    logger.error(`Execution error: ${error.message}`);
  });
};
