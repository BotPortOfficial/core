#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Commit message: ', async (commitMessage) => {
  if (!commitMessage.trim()) {
    console.log('Commit message cannot be empty!');
    rl.close();
    process.exit(1);
  }

  try {
    console.log('Running release process...\n');

    // Check if we're in a git repository
    await execCommand('git status', 'Checking git repository...');

    // Check if there are changes to commit
    const { stdout: statusOutput } = await execAsync('git status --porcelain');
    
    if (statusOutput.trim()) {
      // Add all files (release.js is now ignored by git)
      await execCommand('git add --all', 'Staging all changes...');
      
      // Commit changes
      await execCommand(`git commit -m "${commitMessage}"`, 'Committing changes...');
    } else {
      console.log('⚠️  No changes to commit. Proceeding with version bump...');
    }

    // Run version bump and push (this will create its own commit)
    await execCommand('npm run release:patch', 'Bumping version...');

    // Publish to npm
    await execCommand('npm publish --access public', 'Publishing to npm...');

    console.log('\n✅ Release completed successfully!');
  } catch (error) {
    console.error(`❌ Release failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
});

async function execCommand(command, description) {
  console.log(`📦 ${description}`);
  console.log(`   Command: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) {
      console.log(stdout.trim());
    }
    if (stderr) {
      console.log(stderr.trim());
    }
    
    console.log('✓ Success\n');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.stdout) console.log('stdout:', error.stdout);
    if (error.stderr) console.log('stderr:', error.stderr);
    throw error;
  }
}