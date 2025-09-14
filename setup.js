#!/usr/bin/env node

/**
 * SAAS Template Setup Script
 * 
 * This script helps you quickly set up a new SaaS project from this template.
 * It will prompt you for project details and update configuration files.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupProject() {
  console.log('🚀 Welcome to the SaaS Template Setup!');
  console.log('This will help you configure your new project.\n');

  try {
    // Get project details
    const projectName = await question('📝 Project name (e.g., my-awesome-saas): ');
    const projectDescription = await question('📝 Project description: ');
    const authorName = await question('👤 Your name: ');
    const authorEmail = await question('📧 Your email: ');
    const githubUsername = await question('🐙 GitHub username: ');
    const domain = await question('🌐 Domain (e.g., myapp.com): ');

    // Update package.json
    console.log('\n📦 Updating package.json...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.name = projectName;
    packageJson.description = projectDescription;
    packageJson.author = `${authorName} <${authorEmail}>`;
    packageJson.repository = `https://github.com/${githubUsername}/${projectName}`;
    packageJson.homepage = `https://${domain}`;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

    // Update README.md
    console.log('📚 Updating README.md...');
    let readme = fs.readFileSync('README.md', 'utf8');
    readme = readme.replace(/Google Auth \+ Stripe Subscription Demo/g, projectName);
    readme = readme.replace(/google-auth-demo/g, projectName);
    readme = readme.replace(/yourusername/g, githubUsername);
    readme = readme.replace(/your-frontend-url.vercel.app/g, `${projectName}.vercel.app`);
    readme = readme.replace(/your-app-name/g, projectName);
    fs.writeFileSync('README.md', readme);

    // Update vercel.json
    console.log('⚡ Updating vercel.json...');
    const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    // Vercel will automatically use the project name from package.json

    // Update railway.json
    console.log('🚂 Updating railway.json...');
    const railwayJson = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
    // Railway will use the project name from the repository

    // Create .env from template
    console.log('🔧 Creating .env from template...');
    if (!fs.existsSync('.env')) {
      fs.copyFileSync('env.template', '.env');
      console.log('✅ Created .env file from template');
      console.log('⚠️  Remember to update the .env file with your actual values!');
    } else {
      console.log('⚠️  .env file already exists, skipping...');
    }

    // Update Firebase config in app.js
    console.log('🔥 Updating Firebase config...');
    let appJs = fs.readFileSync('app.js', 'utf8');
    appJs = appJs.replace(/auth-subscription-demo/g, projectName);
    fs.writeFileSync('app.js', appJs);

    // Create setup instructions
    console.log('📋 Creating setup instructions...');
    const setupInstructions = `# ${projectName} Setup Instructions

## 🚀 Quick Setup

1. **Clone and setup:**
   \`\`\`bash
   git clone https://github.com/${githubUsername}/${projectName}.git
   cd ${projectName}
   npm install
   \`\`\`

2. **Configure environment variables:**
   - Copy \`env.template\` to \`.env\`
   - Update all values in \`.env\` with your actual credentials

3. **Set up services:**
   - **Firebase**: Create project and get credentials
   - **Stripe**: Create account and get API keys
   - **Vercel**: Connect repository for frontend
   - **Railway**: Connect repository for backend

4. **Deploy:**
   - Push to GitHub
   - Vercel will auto-deploy frontend
   - Railway will auto-deploy backend

## 🔧 Configuration Files Updated

- ✅ package.json
- ✅ README.md
- ✅ app.js (Firebase config)
- ✅ .env (created from template)

## 📝 Next Steps

1. Update the \`.env\` file with your actual credentials
2. Set up Firebase project and add your domain
3. Set up Stripe account and create products
4. Deploy to Vercel and Railway
5. Configure webhooks in Stripe

Happy coding! 🎉
`;

    fs.writeFileSync('SETUP.md', setupInstructions);

    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env file with your actual credentials');
    console.log('2. Set up Firebase project');
    console.log('3. Set up Stripe account');
    console.log('4. Deploy to Vercel and Railway');
    console.log('\n📚 See SETUP.md for detailed instructions');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setupProject();
