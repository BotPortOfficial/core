#!/usr/bin/env node

import { exec } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Commit message: ', (commitMessage) => {
  if (!commitMessage.trim()) {
    console.log('Commit message cannot be empty!');
    rl.close();
    process.exit(1);
  }

  const commands = [
    'git add --all && git reset HEAD -- release.js',
    `git commit -m "${commitMessage}"`,
    'npm run release:patch',
    'npm publish --access public'
  ];

  console.log('Running release process...\n');

  // Execute commands sequentially
  executeSequentially(commands, 0);
  rl.close();
});

function executeSequentially(commands, index) {
  if (index >= commands.length) {
    console.log('\n✅ Release completed successfully!');
    return;
  }

  const command = commands[index];
  console.log(`📦 Executing: ${command}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error executing "${command}":`, error.message);
      process.exit(1);
    }

    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);

    // Execute next command
    executeSequentially(commands, index + 1);
  });
}