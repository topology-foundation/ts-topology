import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testCompilation() {
  try {
    const { stdout, stderr } = await execAsync('npm run test:compile');
    
    if (stderr && !stderr.includes('WARNING AS235:')) {
      console.error('Compilation failed:', stderr);
      process.exit(1);
    }

    if (stderr && !stderr.includes('WARNING AS235:')) {
      console.warn('Unexpected warnings:', stderr);
    }

    console.log('Compilation successful!');
    process.exit(0);
  } catch (error) {
    console.error('Compilation failed:', error);
    process.exit(1);
  }
}

testCompilation();